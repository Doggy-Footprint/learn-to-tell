#!/bin/bash
# This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
# R-2 review for run fd310baab4363801: rendered catalog anchors, the demo each anchor precedes, demo count, page errors.
# Usage (repo root): bash agent-docs/spec-logs/fd310baab4363801-r2-review.sh [port]
set -u
PORT=${1:-47911}
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=$(mktemp -d)
LTT_PORT=$PORT node skills/learn-to-tell/server/server.mjs > "$OUT/server.log" 2>&1 &
SRV=$!
for i in $(seq 1 50); do curl -s -o /dev/null "http://127.0.0.1:$PORT/gallery/catalog.html" && break; sleep 0.1; done
"$CH" --headless=new --disable-gpu --no-first-run --enable-logging=stderr --v=0 --virtual-time-budget=8000 --window-size=1440,900 \
  --dump-dom "http://127.0.0.1:$PORT/gallery/catalog.html" > "$OUT/dom.html" 2> "$OUT/chrome.log"
kill $SRV
echo "base demo() calls: $(git show b514c52:site/gallery/catalog.html | grep -c '^  demo("')"
echo "source demo() calls: $(grep -c '^  demo("' site/gallery/catalog.html)"
echo "rendered .demo: $(grep -o 'class="demo"' "$OUT/dom.html" | wc -l | tr -d ' ')"
echo "anchor -> next demo id:"
python3 - "$OUT/dom.html" <<'PY'
import re, sys
dom = open(sys.argv[1], encoding="utf-8").read()
for m in re.finditer(r'id="(api-[a-z]+)"', dom):
    nxt = re.search(r'class="demo" id="([^"]+)"|id="([^"]+)" class="demo"', dom[m.end():])
    print(" ", m.group(1), "->", (nxt.group(1) or nxt.group(2)) if nxt else None)
PY
echo "console errors / uncaught (chrome stderr):"
grep -E 'CONSOLE|Uncaught|ERROR:.*(console|script)' "$OUT/chrome.log" | grep -iv 'gpu\|dbus\|fontconfig' || echo "  none"
rm -rf "$OUT"
