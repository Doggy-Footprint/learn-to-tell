#!/usr/bin/env bash
# Usage: dom-diff.sh <dirA> <dirB>; prints differing files after removing known nondeterminism
# (server port, random svg marker id prefixes, in-flight send packets, mid-transition opacity values).
norm() { perl -pe 's/127\.0\.0\.1:[0-9]+/HOST/g; s/\b(dg|sq|mp)[a-z0-9]{6}(?=[-"\)])/ID/g; s/<circle class="pk"[^>]*>(<\/circle>)?//g; s/opacity: ?[0-9.]+/opacity:N/g; s/></>\n</g' "$1"; }
n=0
for f in "$1"/*; do b="$2/$(basename "$f")"
  if [ ! -f "$b" ]; then echo "MISSING $(basename "$f")"; n=$((n+1)); continue; fi
  if ! cmp -s <(norm "$f") <(norm "$b"); then n=$((n+1)); echo "DIFF $(basename "$f")"; diff <(norm "$f") <(norm "$b") | head -${LINES_SHOWN:-4} | cut -c1-240; fi
done
echo "files=$(ls "$1" | wc -l | tr -d ' ') diffs=$n"
