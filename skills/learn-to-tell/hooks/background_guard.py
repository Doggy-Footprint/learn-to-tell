#!/usr/bin/env python3
"""PostToolUse hook: when <home>/background.md exceeds MAX_LINES entries, snapshot it and ask Claude to summarize.

Summarizing needs judgment, so the hook only detects and instructs; the snapshot keeps the
pre-summary lines recoverable in case the summary drops something.
"""
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

MAX_LINES = 100
TARGET_LINES = 50


def home() -> Path:
    return Path(os.environ.get("LTT_HOME") or Path.home() / ".learn-to-tell")


def touched_background(event: dict) -> bool:
    tool_input = event.get("tool_input") or {}
    text = " ".join(str(v) for v in tool_input.values())
    return "background.md" in text


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError:
        return
    if not touched_background(event):
        return
    path = home() / "background.md"
    if not path.is_file():
        return
    entries = [l for l in path.read_text(encoding="utf-8").splitlines() if l.startswith("- ")]
    if len(entries) <= MAX_LINES:
        return
    archive = home() / "background-archive"
    archive.mkdir(parents=True, exist_ok=True)
    snapshot = archive / f"{datetime.now():%Y%m%d-%H%M%S}.md"
    shutil.copyfile(path, snapshot)
    message = (
        f"{path} has {len(entries)} entries (limit {MAX_LINES}). The original is saved at {snapshot}. "
        f"Rewrite {path} to {TARGET_LINES} or fewer entries in the same '- YYYY-MM-DD <fact> (출처: ...)' format: "
        "merge duplicates, keep the newer one when facts conflict, keep the latest date and sources of the merged entries, "
        "and do not add facts that are not in the original. Tell the user in one line that you summarized it."
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": message}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
