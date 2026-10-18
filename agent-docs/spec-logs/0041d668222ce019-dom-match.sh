#!/usr/bin/env bash
# Usage: dom-match.sh "<base dump dirs>" "<after dump dirs>"
# R-1 rule (spec v2): a file matches when at least one after dump equals at least one base dump after the
# dom-diff.sh normalisation; base dumps of the same tree already differ in 0-2 files from mid-transition values.
here="$(cd "$(dirname "$0")" && pwd)"
norm() { perl -pe 's/127\.0\.0\.1:[0-9]+/HOST/g; s/\b(dg|sq|mp)[a-z0-9]{6}(?=[-"\)])/ID/g; s/<circle class="pk"[^>]*>(<\/circle>)?//g; s/opacity: ?[0-9.]+/opacity:N/g; s/></>\n</g' "$1" | shasum | cut -c1-40; }
first=${1%% *}; bad=0; total=0
for f in "$first"/*; do n=$(basename "$f"); total=$((total+1))
  bs=$(for d in $1; do norm "$d/$n"; done | sort -u)
  hit=0; for d in $2; do h=$(norm "$d/$n"); if grep -qx "$h" <<<"$bs"; then hit=1; break; fi; done
  [ $hit = 1 ] || { bad=$((bad+1)); echo "NOMATCH $n"; }
done
echo "files=$total nomatch=$bad"
