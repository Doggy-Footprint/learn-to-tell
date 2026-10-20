#!/bin/bash
# usage: scripts/measure/run.sh <set-dir> <commit> <topic> <variant> <rep>
# One non-interactive lesson generation with the skill at <commit>, the same way as the 20261020-audit5-check baseline.
# Output: <set-dir>/runs/<topic>-<variant>-<rep>/ (out.jsonl, home/, start, end, exit, final-audit.json)
#         <set-dir>/transcripts/<topic>-<variant>-<rep>/ (session transcript + subagents, for transcript-cost.mjs)
set -u
[ $# -eq 5 ] || { sed -n 2p "$0"; exit 2; }
SET=$(mkdir -p "$1" && cd "$1" && pwd); COMMIT=$2; T=$3; V=$4; N=$5
HERE=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$HERE/../.." && pwd)
[ -f "$HERE/prompts/$T.md" ] || { echo "unknown topic: $T" >&2; exit 2; }
SNAP=$SET/snap-$V
if [ ! -d "$SNAP" ]; then
  mkdir -p "$SNAP" && git -C "$REPO" archive "$COMMIT" | tar -x -C "$SNAP" || exit 2
  git -C "$REPO" rev-parse "$COMMIT" > "$SNAP/.commit"
fi
[ "$(cat "$SNAP/.commit")" = "$(git -C "$REPO" rev-parse "$COMMIT")" ] || { echo "$SNAP holds another commit" >&2; exit 2; }
R=$SET/runs/$T-$V-$N
rm -rf "$R"; mkdir -p "$R/work" "$R/home"
cp "$HERE/backgrounds/$T.md" "$R/home/background.md"
cat "$HERE/prompts/common.md" "$HERE/prompts/$T.md" > "$R/prompt.md"
cd "$R/work" || exit 2
date +%s > "$R/start"
# CLAUDE_CONFIG_DIR isolation logs out on macOS, so the real config is used with project-only settings and no MCP.
env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_BRIDGE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_SESSION_ATTENDED -u CLAUDE_PID -u CLAUDE_EFFORT \
  LTT_HOME="$R/home" claude -p --model claude-sonnet-5-5 --effort medium --setting-sources project --strict-mcp-config --mcp-config "$HERE/empty-mcp.json" \
  --plugin-dir "$SNAP" --allowedTools "Read Write Edit Glob Grep Bash Agent Skill TaskOutput" \
  --output-format stream-json --verbose < "$R/prompt.md" > "$R/out.jsonl" 2> "$R/err.txt"
echo $? > "$R/exit"
date +%s > "$R/end"
SID=$(head -1 "$R/out.jsonl" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')
SRC=$(find "$HOME/.claude/projects" -maxdepth 2 -name "$SID.jsonl" 2>/dev/null | head -1)
if [ -n "$SRC" ]; then
  mkdir -p "$SET/transcripts/$T-$V-$N"
  cp "$SRC" "$SET/transcripts/$T-$V-$N/"
  [ -d "${SRC%.jsonl}" ] && cp -R "${SRC%.jsonl}" "$SET/transcripts/$T-$V-$N/"
fi
LESSON=$(ls -d "$R"/home/lessons/*/ 2>/dev/null | head -1)
[ -n "$LESSON" ] && node "$SNAP/skills/learn-to-tell/server/audit.mjs" --home "$R/home" --json "$LESSON" > "$R/final-audit.json" 2>/dev/null
cat "$R/exit"
