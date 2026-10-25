(function (root) {
  "use strict";
  var LTT = root.LTT;
  if (!LTT || !LTT.h) throw new Error("ltt-mock.js needs ltt.js and ltt-ui.js loaded first");
  var h = LTT.h;

  var STYLE = /* css:start ltt-mock.css */[
    ".ltt-mock{position:relative;box-sizing:border-box;font-family:var(--ltt-font);color:#16171b;text-align:left}",
    ".ltt-mock *{box-sizing:border-box}",
    ".ltt-phone{width:var(--w,280px);max-width:100%;aspect-ratio:var(--ar,9/17.5);border-radius:40px;background:#fff;padding:10px;box-shadow:0 0 0 2px #d9d6cf,0 18px 40px rgba(22,23,27,.14)}",
    ".ltt-phone .scr{position:relative;height:100%;border-radius:31px;overflow:hidden;background:var(--bg,#fff);display:flex;flex-direction:column}",
    ".ltt-phone .bar{display:flex;justify-content:space-between;align-items:center;padding:10px 20px 4px;font-size:12px;font-weight:700;flex:none}",
    ".ltt-phone .bar i{display:inline-block;width:20px;height:9px;border-radius:3px;border:1.5px solid currentColor;margin-left:4px;vertical-align:-1px}",
    ".ltt-phone .screen{flex:1;min-height:0;overflow:hidden;padding:6px 16px 14px;display:flex;flex-direction:column;gap:10px}",
    ".ltt-phone.dark{background:#0d0e11}",
    ".ltt-phone.dark .scr{background:var(--bg,#111215);color:#f1f0eb}",
    ".ltt-browser{width:var(--w,100%);max-width:100%;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 0 0 1.5px #dcd8cf,0 16px 36px rgba(22,23,27,.12)}",
    ".ltt-browser .chrome{display:flex;align-items:center;gap:7px;padding:10px 14px;background:#efede7;border-bottom:1px solid #e1ddd4}",
    ".ltt-browser .chrome i{width:11px;height:11px;border-radius:50%;background:#ff5f57}",
    ".ltt-browser .chrome i:nth-child(2){background:#febc2e}",
    ".ltt-browser .chrome i:nth-child(3){background:#28c840}",
    ".ltt-browser .url{flex:1;margin-left:10px;max-width:60%;font-size:11.5px;color:#77777e;background:#fff;border-radius:7px;padding:3px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".ltt-browser .screen{position:relative;background:var(--bg,#fff);padding:16px;min-height:var(--h,auto)}",
    ":root{--ltt-term-bg:#15161a;--ltt-term-ink:#e8e7e2;--ltt-term-out:#b4b3ad;--ltt-term-ok:#5fd6a0;--ltt-term-err:#ff8a8d;--ltt-term-warn:#ffb000;--ltt-term-dim:#6c6c74;--ltt-term-cmd:var(--ltt-accent-on-dark)}",
    ".ltt-term-mock{width:var(--w,100%);max-width:100%;border-radius:14px;overflow:hidden;background:var(--ltt-term-bg);color:var(--ltt-term-ink);box-shadow:0 16px 36px rgba(0,0,0,.18);font:13px/1.65 var(--ltt-mono)}",
    ".ltt-term-mock .chrome{display:flex;align-items:center;gap:7px;padding:9px 12px;background:#202126}",
    ".ltt-term-mock .chrome i{width:10px;height:10px;border-radius:50%;background:#55565e}",
    ".ltt-term-mock .chrome span{margin-left:8px;font-size:11.5px;color:#8b8b94}",
    ".ltt-term-mock .screen{padding:12px 16px;white-space:pre-wrap;word-break:break-all}",
    ".ltt-term-mock .cmd::before{content:'$ ';color:var(--ltt-term-cmd)}",
    ".ltt-term-mock .out{color:var(--ltt-term-out)}",
    ".ltt-term-mock .err{color:var(--ltt-term-err)}",
    ".ltt-term-mock .ok{color:var(--ltt-term-ok)}",
    ".ltt-term-mock .warn{color:var(--ltt-term-warn)}",
    ".ltt-term-mock .dim{color:var(--ltt-term-dim)}",
    ".ltt-code{width:var(--w,100%);max-width:100%;border-radius:14px;overflow:hidden;background:var(--ltt-card);box-shadow:0 0 0 1.5px var(--ltt-line),var(--ltt-shadow);font:13px/1.7 var(--ltt-mono);color:var(--ltt-ink)}",
    ".ltt-code .title{font:700 12px var(--ltt-font);color:var(--ltt-muted);padding:8px 14px;border-bottom:1px solid var(--ltt-line);background:var(--ltt-card-2)}",
    ".ltt-code .screen{padding:10px 0;overflow-x:auto}",
    ".ltt-code .ln{display:grid;grid-template-columns:3em 1fr;white-space:pre;padding-right:14px;border-left:3px solid transparent}",
    ".ltt-code .ln::before{content:attr(data-n);text-align:right;padding-right:14px;color:var(--ltt-muted);opacity:.6}",
    ".ltt-code.nonum .ln{grid-template-columns:14px 1fr}",
    ".ltt-code.nonum .ln::before{content:''}",
    ".ltt-code .ln.good{background:var(--ltt-good-soft);border-left-color:var(--ltt-good)}",
    ".ltt-code .ln.bad{background:var(--ltt-bad-soft);border-left-color:var(--ltt-bad)}",
    ".ltt-code .ln.accent{background:var(--ltt-accent-soft);border-left-color:var(--ltt-accent)}",
    ".ltt-code .ln.warn{background:var(--ltt-warn-soft);border-left-color:var(--ltt-warn)}",
    ".ltt-code .c{color:var(--ltt-muted)}",
    ".ltt-code .k{color:var(--ltt-accent);font-weight:600}",
    ".ltt-code .s{color:var(--ltt-good)}",
    ".ltt-code .token.comment,.ltt-code .token.prolog{color:var(--ltt-muted)}",
    ".ltt-code .token.keyword,.ltt-code .token.builtin{color:var(--ltt-accent);font-weight:600}",
    ".ltt-code .token.string,.ltt-code .token.char,.ltt-code .token.attr-value{color:var(--ltt-good)}",
    ".ltt-code .token.number,.ltt-code .token.boolean,.ltt-code .token.constant{color:var(--ltt-warn)}",
    ".ltt-code .token.function,.ltt-code .token.class-name{color:var(--ltt-ink);font-weight:650}",
    ".ltt-code .token.operator,.ltt-code .token.punctuation{color:var(--ltt-ink-2)}",
    ".ltt-code .token.property,.ltt-code .token.variable{color:var(--ltt-ink-2);font-style:italic}"
  ].join("")/* css:end */;

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function frame(cls, opts) {
    var el = h("div", "ltt-mock " + cls + (opts.cls ? " " + opts.cls : ""));
    if (opts.width) el.style.setProperty("--w", typeof opts.width === "number" ? opts.width + "px" : opts.width);
    if (opts.bg) el.style.setProperty("--bg", opts.bg);
    return el;
  }

  // Each mock returns {el, screen}: put content in `screen`, annotate `el` (markers are placed relative to the frame).
  function phone(opts) {
    opts = opts || {};
    var el = frame("ltt-phone" + (opts.dark ? " dark" : ""), opts);
    if (opts.ratio) el.style.setProperty("--ar", opts.ratio);
    el.innerHTML = "<div class='scr'><div class='bar'><span>" + (opts.time || "9:41") + "</span><span>•• <i></i></span></div><div class='screen'></div></div>";
    var screen = el.querySelector(".screen");
    LTT.fill(screen, opts.content);
    return { el: el, screen: screen };
  }

  function browser(opts) {
    opts = opts || {};
    var el = frame("ltt-browser", opts);
    el.innerHTML = "<div class='chrome'><i></i><i></i><i></i><span class='url'></span></div><div class='screen'></div>";
    el.querySelector(".url").textContent = opts.url || opts.title || "";
    if (!opts.url && !opts.title) el.querySelector(".url").remove();
    var screen = el.querySelector(".screen");
    if (opts.height) screen.style.setProperty("--h", typeof opts.height === "number" ? opts.height + "px" : opts.height);
    LTT.fill(screen, opts.content);
    return { el: el, screen: screen };
  }

  // lines: ["$ cmd", "plain output"] or [{t: cmd|out|err|ok|warn|dim, text}]; strings starting with "$ " are commands.
  function terminal(opts) {
    opts = opts || {};
    var el = frame("ltt-term-mock", opts);
    el.innerHTML = "<div class='chrome'><i></i><i></i><i></i><span></span></div><div class='screen'></div>";
    el.querySelector(".chrome span").textContent = opts.title || "terminal";
    var screen = el.querySelector(".screen");
    function add(line) {
      var o = typeof line === "string" ? (line.indexOf("$ ") === 0 ? { t: "cmd", text: line.slice(2) } : { t: "out", text: line }) : line;
      var d = h("div", o.t || "out");
      d.textContent = o.text;
      screen.appendChild(d);
      return d;
    }
    (opts.lines || []).forEach(add);
    return { el: el, screen: screen, add: add };
  }

  // marks: {lineNumber: tone}. With `lang` and Prism loaded, each line is highlighted on its own (a token spanning lines, like a
  // block comment, loses its colour after the first line); otherwise only `//` and `#` comments are dimmed. Pass code raw.
  function code(opts) {
    opts = opts || {};
    var el = frame("ltt-code" + (opts.numbers === false ? " nonum" : ""), opts);
    if (opts.title) el.appendChild(h("div", "title")).textContent = opts.title;
    var screen = el.appendChild(h("div", "screen"));
    var start = opts.start || 1, marks = opts.marks || {};
    var grammar = opts.lang && root.Prism && root.Prism.languages[opts.lang];
    String(opts.code || "").replace(/\n$/, "").split("\n").forEach(function (line, i) {
      var n = start + i, d = h("div", "ln" + (marks[n] ? " " + marks[n] : ""));
      d.dataset.n = n;
      if (grammar) d.innerHTML = "<span>" + root.Prism.highlight(line, grammar, opts.lang) + "</span>";
      else {
        var m = /(\/\/.*|#.*)$/.exec(line), body = m ? line.slice(0, m.index) : line;
        d.innerHTML = "<span>" + esc(body) + (m ? "<span class='c'>" + esc(m[0]) + "</span>" : "") + "</span>";
      }
      screen.appendChild(d);
    });
    return { el: el, screen: screen, line: function (n) { return screen.children[n - start]; } };
  }

  if (typeof document !== "undefined") {
    var style = document.createElement("style");
    style.id = "ltt-mock-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  LTT.mock = { phone: phone, browser: browser, terminal: terminal, code: code };
})(typeof globalThis !== "undefined" ? globalThis : this);
