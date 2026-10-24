#!/bin/bash
# Runs outside the repo so that the repo's CLAUDE.md/AGENTS.md is not loaded.
d=$1; p=$2; mkdir -p "$d"; cd "$d"
start=$(date +%s)
env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_PID -u CLAUDE_EFFORT -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_BRIDGE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_SESSION_ATTENDED \
  claude -p --model claude-opus-5-5 --effort low --setting-sources project --strict-mcp-config --mcp-config "$(dirname "$0")/empty-mcp.json" \
  --allowedTools "Read Write Edit Glob Grep Bash" --disallowedTools "Agent Skill WebSearch WebFetch" --permission-mode acceptEdits \
  --output-format stream-json --verbose < "$p" > out.jsonl 2> err.txt
rc=$?
echo "{\"start\":$start,\"end\":$(date +%s),\"exit\":$rc}" > wall.json
