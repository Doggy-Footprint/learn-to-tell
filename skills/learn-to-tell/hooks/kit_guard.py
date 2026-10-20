#!/usr/bin/env python3
"""Generating agents that read ltt.js or server/*.mjs spend tens of thousands of tokens and
then write against internals instead of the documented API; the guard sends them to API.md.
Only paths under this plugin's own root are blocked, so a development checkout stays readable.
"""
import json
import os
import re
import sys

ROOT = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
SOURCE = re.compile(r"skills/learn-to-tell/(kit/[^\s'\"]*\.js|server/[^\s'\"]*\.mjs)")
DOC = "skills/learn-to-tell/kit/API.md"


def targets(tool: str, data: dict) -> str:
    if tool == "Read":
        return str(data.get("file_path", ""))
    if tool == "Grep":
        return " ".join(str(data.get(k, "")) for k in ("path", "glob"))
    if tool == "Bash":
        return str(data.get("command", ""))
    return ""


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except Exception:
        return
    if not ROOT:
        return
    text = targets(event.get("tool_name", ""), event.get("tool_input") or {})
    if ROOT not in text and not text.startswith("skills/"):
        return
    text = text.replace(ROOT + "/", "")
    hits = list(SOURCE.finditer(text))
    # Running a script (node <path> ... | tail) is allowed; only a source path that is not node's script argument is a read.
    if event.get("tool_name") == "Bash":
        hits = [m for m in hits if not re.search(r"\bnode\s+(?:--?[\w-]+(?:=\S+)?\s+)*$", text[:m.start()])]
    if not hits:
        return
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": f"kit·server 소스는 읽지 않는다. 쓰는 법은 {os.path.join(ROOT, DOC)}에 있고, 없는 것은 있는 부품으로 대신해 result.md의 'kit 후보'에 적는다."
    }}, ensure_ascii=False))


if __name__ == "__main__":
    main()
