#!/bin/bash
# usage: run_one.sh <k> <arm> <rep>
E=$(cd "$(dirname "$0")" && pwd); k=$1; arm=$2; rep=$3; id="s$k-$arm-$rep"
W=$E/gallery/runs/$id; rm -rf "$W"; mkdir -p "$W"; ln -s "$E/refs/s$k-$arm" "$W/refs"
python3 "$E/mkprompt.py" "$k" "$arm" > "$W/prompt.md"
cd "$W"; start=$(date +%s)
env -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_REMOTE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION \
  timeout 1800 claude -p "$(cat prompt.md)" --model "${LTT_MODEL:-claude-sonnet-5-5}" --effort high \
  --session-id "$(cat /proc/sys/kernel/random/uuid)" --strict-mcp-config \
  --output-format stream-json --verbose --max-turns 60 \
  --allowedTools "Read" "Write" "Edit" "Bash(node:*)" \
  --disallowedTools "WebSearch" "WebFetch" "Agent" "Task" "Skill" "Glob" "Grep" \
  > "$W/stream.jsonl" 2> "$W/stderr.log"
echo "$id exit=$? wall=$(( $(date +%s) - start ))s" | tee -a "$E/runs.log"
