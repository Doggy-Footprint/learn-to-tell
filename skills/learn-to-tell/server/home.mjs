import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;

// Top-level `key: value` lines of the YAML frontmatter only; the list page needs no nested data, so no YAML dependency.
export function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].replace(/\s+#.*$/, "").trim();
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    if (v) out[kv[1]] = v;
  }
  return out;
}

export function listLessons(home) {
  const dir = join(home, "lessons");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && LESSON_ID.test(d.name) && existsSync(join(dir, d.name, "lesson.html")))
    .map((d) => {
      const res = join(dir, d.name, "result.md");
      const fm = existsSync(res) ? frontmatter(readFileSync(res, "utf8")) : {};
      const html = readFileSync(join(dir, d.name, "lesson.html"), "utf8");
      const title = fm.title || (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || d.name;
      return { id: d.name, title, date: fm.date || (/^(\d{4})(\d{2})(\d{2})-/.exec(d.name) || []).slice(1).join("-") || "", decision: fm.decision || "", goal: fm.goal || "", cover: existsSync(join(dir, d.name, "cover.jpg")), done: !!fm.lesson };
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id));
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function homePage(home) {
  const lessons = listLessons(home);
  const cards = lessons.map((l) => `<article class="card">
  <a class="frame" href="/lessons/${l.id}/lesson.html">${l.cover ? `<img loading="lazy" src="/lessons/${l.id}/cover.jpg" alt="">` : `<span class="none">대표 이미지 없음</span>`}</a>
  <header><b>${esc(l.title)}</b><time>${esc(l.date)}</time></header>
  ${l.goal ? `<p class="note"><i>목표</i>${esc(l.goal)}</p>` : ""}${l.decision ? `<p class="note"><i>결정</i>${esc(l.decision)}</p>` : ""}${l.done ? "" : `<p class="note gap"><i>진행 중</i>result.md가 아직 없다</p>`}
</article>`).join("\n");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>배운 것들</title><script src="/kit/ltt.js"></script>
<style>
body{margin:0;background:var(--ltt-bg);color:var(--ltt-ink);font:14px/1.5 var(--ltt-font)}
.top{position:sticky;top:0;z-index:5;display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:var(--ltt-bg);border-bottom:1px solid var(--ltt-line)}
.top h1{font-size:16px;margin:0 8px 0 0}.top output{color:var(--ltt-muted);font-variant-numeric:tabular-nums}
.top a{color:var(--ltt-accent);text-decoration:none;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:16px}
.card{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
.frame{display:block;aspect-ratio:16/10;background:var(--ltt-line);position:relative}
.frame img{width:100%;height:100%;object-fit:cover;display:block}
.none{position:absolute;inset:0;display:grid;place-items:center;color:var(--ltt-muted)}
header{display:flex;gap:8px;align-items:baseline;justify-content:space-between;padding:10px 12px 0}header b{font-size:15px}
time{color:var(--ltt-muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.note{margin:6px 12px 0;font-size:13px;color:var(--ltt-muted)}.note i{font-style:normal;color:var(--ltt-ink);margin-right:6px}.note.gap i{color:var(--ltt-warn)}
.card>:last-child{margin-bottom:12px}
.empty{margin:48px 16px;color:var(--ltt-muted);max-width:60ch}
</style></head><body>
<div class="top"><h1>배운 것들</h1><output>${lessons.length}개 수업</output><a href="/gallery/index.html">gallery</a><a href="/legacy/gallery/index.html">이전 버전</a></div>
${lessons.length ? `<main class="grid">${cards}</main>` : `<p class="empty">아직 수업이 없다. 작업 중에 <code>/learn-to-tell &lt;주제&gt;</code>로 시작한다.</p>`}
</body></html>`;
}
