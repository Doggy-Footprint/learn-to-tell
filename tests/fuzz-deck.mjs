// Builds a deck whose every text field sits at its cap, so a clean check proves the caps fit the layout.
const SYL = "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후";
const WORDS = ["stale-while-revalidate", "TTL", "p99", "hit", "API", "GPU", "SM", "L2", "HBM", "Kubernetes"];

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function fuzzDeck(seed) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const text = (n) => {
    let s = "";
    while (s.length < n) {
      if (s && r() < 0.22) s += " ";
      else if (r() < 0.06) { const w = pick(WORDS); s += (s && !s.endsWith(" ") ? " " : "") + w + " "; }
      else s += SYL[Math.floor(r() * SYL.length)];
    }
    return s.slice(0, n).trim().padEnd(n, "다");
  };
  const num = () => String(Math.round(r() * 1e6) / 100).slice(0, 9);
  const graph = (n) => `LTT.graph({ layout: ${JSON.stringify(pick(["chain", "ring", "grid", "tree"]))}, nodes: [${Array.from({ length: n }, (_, i) => `{ id: "n${i}", label: ${JSON.stringify(text(r() < 0.5 ? 16 : 8))}, sub: ${JSON.stringify(text(r() < 0.5 ? 20 : 6))} }`).join(", ")}], edges: [${Array.from({ length: n - 1 }, (_, i) => `{ from: "n${i}", to: "n${i + 1}", label: ${JSON.stringify(text(r() < 0.5 ? 14 : 5))} }`).join(", ")}] })`;
  const head = () => `title: ${JSON.stringify(text(44))}, kicker: ${JSON.stringify(text(20))}, sub: ${JSON.stringify(text(100))}`;
  const foot = () => `takeaway: ${JSON.stringify(text(60))}, basis: ${JSON.stringify(text(90))}`;
  const series = `[{ id: "a", label: ${JSON.stringify(text(18))}, points: Array.from({ length: 40 }, (_, i) => [i * 2.5, 50 + 40 * Math.sin(i / 5)]) }, { id: "b", label: ${JSON.stringify(text(18))}, points: Array.from({ length: 40 }, (_, i) => [i * 2.5, 30 + i]) }]`;
  const chart = `LTT.chart({ x: { label: ${JSON.stringify(text(28))}, domain: [0, 100] }, y: { label: ${JSON.stringify(text(28))}, domain: [0, 100] }, series: ${series}, refs: [{ x: 40, label: ${JSON.stringify(text(20))} }] })`;
  const scenes = [
    `{ type: "hook", pre: ${JSON.stringify(text(24))}, text: ${JSON.stringify(text(56))}, sub: ${JSON.stringify(text(100))}, visual: LTT.units({ n: 100, groups: [{ k: 30, label: ${JSON.stringify(text(24))} }, { k: 50, label: ${JSON.stringify(text(24))} }] }) }`,
    `{ type: "figure", ${head()}, narration: ${JSON.stringify(text(180))}, ${foot()}, visual: ${graph(5)} }`,
    `{ type: "figure", ${head()}, points: [${[1, 2, 3, 4, 5].map((i) => `{ on: "n${i - 1}", text: ${JSON.stringify(text(70))} }`).join(", ")}], ${foot()}, visual: ${graph(6)} }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.facts([${[1, 2, 3, 4].map(() => `{ value: ${JSON.stringify(num())}, unit: ${JSON.stringify(text(6))}, label: ${JSON.stringify(text(36))} }`).join(", ")}]) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.table({ cols: [${[14, 14, 14, 14, 14].map((n) => JSON.stringify(text(n))).join(", ")}], rows: [${Array.from({ length: 6 }, () => `[${[16, 16, 16, 16, 16].map((n) => JSON.stringify(text(n))).join(", ")}]`).join(", ")}] }) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.pipeline({ steps: [${Array.from({ length: 6 }, () => `{ title: ${JSON.stringify(text(16))}, text: ${JSON.stringify(text(50))} }`).join(", ")}] }) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.timeline({ events: [${Array.from({ length: 7 }, () => `{ t: ${JSON.stringify(text(12))}, title: ${JSON.stringify(text(20))}, text: ${JSON.stringify(text(50))} }`).join(", ")}] }) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.terminal({ title: ${JSON.stringify(text(48))}, lines: [${Array.from({ length: 12 }, () => JSON.stringify("x".repeat(64))).join(", ")}] }) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.code({ title: ${JSON.stringify(text(48))}, code: ${JSON.stringify(Array.from({ length: 12 }, () => "const value = compute(x, y); // " + "y".repeat(32)).join("\n"))} }) }`,
    `{ type: "figure", ${head()}, ${foot()}, visual: LTT.callout({ title: ${JSON.stringify(text(36))}, text: ${JSON.stringify(text(150))} }) }`,
    `{ type: "figure", ${head()}, narration: ${JSON.stringify(text(180))}, ${foot()}, visual: ${chart} }`,
    `{ type: "predict", ${head()}, q: ${JSON.stringify(text(60))}, choices: [${[40, 40, 40, 40].map((n) => JSON.stringify(text(n))).join(", ")}], answer: 1, why: ${JSON.stringify(text(130))}, ${foot()}, visual: ${chart} }`,
    `{ type: "play", ${head()}, ${foot()}, knobs: [${[0, 1, 2].map((i) => `{ id: "k${i}", label: ${JSON.stringify(text(18))}, min: 0, max: 100000, value: 50000, unit: ${JSON.stringify(text(4))} }`).join(", ")}], readout: () => [${[0, 1, 2, 3].map(() => `{ label: ${JSON.stringify(text(16))}, value: 123456, unit: "ms" }`).join(", ")}], goal: { text: ${JSON.stringify(text(50))}, check: () => false }, visual: () => ${chart} }`,
    `{ type: "compare", ${head()}, ${foot()}, left: { label: ${JSON.stringify(text(20))}, tag: ${JSON.stringify(text(12))}, tone: "bad", text: ${JSON.stringify(text(110))}, visual: LTT.units({ n: 100, groups: [{ k: 60, label: ${JSON.stringify(text(24))} }] }) }, right: { label: ${JSON.stringify(text(20))}, tag: ${JSON.stringify(text(12))}, tone: "good", text: ${JSON.stringify(text(110))}, visual: ${graph(4)} } }`,
    `{ type: "terms", ${head()}, ${foot()}, terms: [${Array.from({ length: 4 }, (_, i) => `{ term: ${JSON.stringify(text(20))}, plain: ${JSON.stringify(text(60))}, on: "n${i % 4}" }`).join(", ")}], visual: ${graph(4)} }`,
    `{ type: "terms", ${head()}, ${foot()}, terms: [${Array.from({ length: 6 }, () => `{ term: ${JSON.stringify(text(20))}, plain: ${JSON.stringify(text(80))} }`).join(", ")}] }`,
    `{ type: "figure", ${head()}, ${foot()}, statement: ${JSON.stringify(text(90))} }`,
    `{ type: "summary", ${head()}, ${foot()}, items: [${Array.from({ length: 4 }, () => `{ q: ${JSON.stringify(text(50))}, a: ${JSON.stringify(text(90))} }`).join(", ")}] }`,
    `{ type: "overview", ${head()}, ${foot()}, visual: ${graph(6)}, points: [${[1, 2, 3, 4, 5].map((i) => `{ on: "n${i}", text: ${JSON.stringify(text(70))} }`).join(", ")}] }`,
    `{ type: "keywords", ${["remember", "signals", "queries"].map((k) => `${k}: [${Array.from({ length: 4 }, () => JSON.stringify(text(50))).join(", ")}]`).join(", ")} }`
  ];
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/kit/ltt.js"></script></head><body><script>
LTT.deck({ title: ${JSON.stringify(text(40))}, theme: ${JSON.stringify(pick(["studio", "paper", "terminal", "ledger", "lab", "blueprint", "sketch"]))}, goal: [${[50, 50, 50].map((n) => JSON.stringify(text(n))).join(", ")}], budget: { scenes: 30, why: "fuzz" }, scenes: [${scenes.join(",\n")}] });
</script></body></html>`;
}
