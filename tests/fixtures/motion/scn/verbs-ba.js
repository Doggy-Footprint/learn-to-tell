// Spec 2d467cf453771b95 VO-6: LTT.beforeAfter().ms built off-deck for four marker layouts (every point has `at`, so list items are markers).
const SVG = '<svg viewBox="0 0 400 200" style="width:100%;height:auto"><rect x="10" y="10" width="380" height="180" fill="currentColor" opacity=".2"/></svg>';
const pts = (n) => Array.from({ length: n }, (_, i) => ({ at: [10 + 10 * i, 20 + 10 * i], title: "t" + i, text: "x" + i }));
const mk = (nb, na) => LTT.beforeAfter({ before: { visual: SVG, points: nb ? pts(nb) : undefined }, after: { visual: SVG, points: na ? pts(na) : undefined } }).ms;
H.samples.ms = { none: mk(0, 0), one: mk(1, 0), threeTwo: mk(3, 2), afterMore: mk(1, 4), afterMore2: mk(2, 5) };
H.done(300);
