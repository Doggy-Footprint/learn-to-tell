(function (root) {
  "use strict";

  var LESSON_PATH = /^\/lessons\/([a-z0-9][a-z0-9-]*)\//;

  var STYLE = [
    ":root{--ltt-bg:#f6f7fb;--ltt-card:#fff;--ltt-ink:#1f2433;--ltt-muted:#6b7285;--ltt-accent:#4f6bed;",
    "--ltt-good:#1f9d6b;--ltt-bad:#d6455d;--ltt-warn:#c98a12;--ltt-line:#e3e6ef;--ltt-radius:14px}",
    "body{margin:0;background:var(--ltt-bg);color:var(--ltt-ink);",
    "font:16px/1.55 -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard','Segoe UI',sans-serif}",
    "main{max-width:960px;margin:0 auto;padding:32px 20px 96px}",
    "h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin:0 0 12px}",
    ".ltt-lead{color:var(--ltt-muted);margin:0 0 24px}",
    ".ltt-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}",
    ".ltt-card{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-radius);",
    "padding:20px;margin:0 0 16px;box-shadow:0 1px 2px rgba(20,30,60,.04)}",
    ".ltt-stat{font-size:40px;font-weight:700;letter-spacing:-.02em;line-height:1.1}",
    ".ltt-stat small{font-size:15px;font-weight:500;color:var(--ltt-muted);margin-left:6px}",
    ".ltt-tag{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;",
    "background:#eef1fd;color:var(--ltt-accent);margin-right:6px;vertical-align:middle}",
    ".ltt-tag.warn{background:#fdf4e3;color:var(--ltt-warn)}.ltt-tag.bad{background:#fdecef;color:var(--ltt-bad)}",
    ".ltt-tag.good{background:#e6f6ef;color:var(--ltt-good)}",
    "label.ltt-param{display:block;margin:0 0 14px}label.ltt-param b{float:right;font-variant-numeric:tabular-nums}",
    "input[type=range]{width:100%;accent-color:var(--ltt-accent);margin:6px 0 2px}",
    ".ltt-basis{font-size:12px;color:var(--ltt-muted)}",
    "button{font:inherit;font-weight:600;border:0;border-radius:10px;padding:9px 16px;",
    "background:var(--ltt-accent);color:#fff;cursor:pointer}button:disabled{opacity:.45;cursor:default}",
    "input[type=number],input[type=text]{font:inherit;padding:7px 10px;border:1px solid var(--ltt-line);border-radius:10px}",
    "input[type=number]{width:6em}",
    ".ltt-hidden{display:none!important}",
    ".ltt-hero{font-size:72px;font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}",
    ".ltt-hero small{font-size:20px;font-weight:600;color:var(--ltt-muted);margin-left:8px;letter-spacing:0}",
    ".ltt-units{display:grid;grid-template-columns:repeat(var(--ltt-cols,10),1fr);gap:4px;max-width:360px}",
    ".ltt-unit{aspect-ratio:1;border-radius:4px;background:var(--ltt-line);",
    "transition:background-color .35s ease;transition-delay:calc(var(--i,0)*8ms)}",
    ".ltt-bar{display:flex;height:34px;border-radius:8px;overflow:hidden;background:var(--ltt-line)}",
    ".ltt-bar>span{display:flex;align-items:center;padding:0 8px;min-width:4px;color:#fff;font-size:13px;",
    "font-weight:700;white-space:nowrap;overflow:hidden;transition:flex-grow .6s cubic-bezier(.2,.7,.2,1)}",
    ".ltt-key{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ltt-muted);margin-right:14px}",
    ".ltt-key i{width:12px;height:12px;border-radius:3px;display:inline-block}",
    "@keyframes ltt-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    ".ltt-rise{animation:ltt-rise .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*120ms)}",
    "@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:1ms!important;",
    "animation-delay:0s!important;transition-duration:1ms!important;transition-delay:0s!important}}",
    "[data-tip]{position:relative;cursor:help;border-bottom:1px dotted var(--ltt-muted)}",
    "[data-tip]:hover::after{content:attr(data-tip);position:absolute;left:0;top:calc(100% + 6px);z-index:10;",
    "width:max-content;max-width:280px;padding:8px 10px;border-radius:8px;background:var(--ltt-ink);color:#fff;",
    "font-size:13px;font-weight:400;line-height:1.45;white-space:normal}",
    "#ltt-expect{position:fixed;right:16px;bottom:16px;max-width:360px;max-height:40vh;overflow:auto;font-size:13px;",
    "background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:12px;padding:8px 12px;",
    "box-shadow:0 4px 16px rgba(20,30,60,.12)}#ltt-expect summary{cursor:pointer;font-weight:700;color:var(--ltt-good)}",
    "#ltt-expect[data-fails] summary{color:var(--ltt-bad)}#ltt-expect:not([data-fails]){display:none}",
    "#ltt-expect div{margin:2px 0}#ltt-expect .ok{color:var(--ltt-good)}#ltt-expect .fail{color:var(--ltt-bad);font-weight:600}"
  ].join("");

  function lessonId(pathname) {
    var m = LESSON_PATH.exec(pathname || "");
    return m ? m[1] : null;
  }

  function compare(actual, expected, tol) {
    var t = tol == null ? 1e-9 * Math.max(1, Math.abs(expected)) : tol;
    var ok = typeof actual === "number" && isFinite(actual) && Math.abs(actual - expected) <= t;
    return { ok: ok, diff: actual - expected, tol: t };
  }

  function record(type, data) {
    var id = typeof location !== "undefined" ? lessonId(location.pathname) : null;
    if (!id) {
      console.info("[ltt] not a lesson page, event not sent:", type, data);
      return Promise.resolve(false);
    }
    return fetch("/api/lessons/" + id + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type, data: data === undefined ? null : data })
    }).then(function (res) { return res.ok; }, function (err) {
      console.warn("[ltt] event not sent:", err);
      return false;
    });
  }

  function expectPanel() {
    var panel = document.getElementById("ltt-expect");
    if (!panel) {
      panel = document.createElement("details");
      panel.id = "ltt-expect";
      panel.appendChild(document.createElement("summary"));
      document.body.appendChild(panel);
    }
    return panel;
  }

  function summarize(panel) {
    var total = panel.querySelectorAll("div").length;
    var fails = panel.querySelectorAll("div.fail").length;
    panel.firstChild.textContent = fails
      ? "기대값 대조 ✗ " + fails + "건 불일치 / " + total + "건"
      : "기대값 대조 ✓ " + total + "건 일치";
    if (fails) {
      panel.dataset.fails = fails;
      panel.open = true;
    }
  }

  function expect(label, actual, expected, opts) {
    var r = compare(actual, expected, opts && opts.tol);
    if (typeof document !== "undefined") {
      var row = document.createElement("div");
      row.className = r.ok ? "ok" : "fail";
      row.textContent = (r.ok ? "✓ " : "✗ 검증 실패: ") + label +
        (r.ok ? "" : " (모델 " + actual + ", 기대 " + expected + ")");
      var panel = expectPanel();
      panel.insertBefore(row, r.ok ? null : panel.firstChild.nextSibling);
      summarize(panel);
    }
    if (!r.ok) record("expect-mismatch", { label: label, actual: actual, expected: expected, tol: r.tol });
    return r.ok;
  }

  if (typeof document !== "undefined") {
    var style = document.createElement("style");
    style.id = "ltt-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  root.LTT = { lessonId: lessonId, compare: compare, record: record, expect: expect };
})(typeof globalThis !== "undefined" ? globalThis : this);
