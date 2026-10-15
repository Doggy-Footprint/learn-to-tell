(function (root) {
  "use strict";

  var LESSON_PATH = /^\/lessons\/([a-z0-9][a-z0-9-]*)\//;
  var TERM = /\{\{([^{}|]+?)(?:\|([^{}]+?))?\}\}/g;

  var TOKENS_LIGHT = "--ltt-bg:#f2f1ec;--ltt-card:#fff;--ltt-card-2:#f7f6f2;--ltt-line:#e6e3dc;--ltt-line-2:#d6d2c8;" +
    "--ltt-ink:#16171b;--ltt-ink-2:#3b3c43;--ltt-muted:#6c6c72;--ltt-accent:#2e59fa;--ltt-accent-soft:#e9eeff;" +
    "--ltt-good:#0b7c4e;--ltt-good-soft:#e2f5ec;--ltt-bad:#c03b3f;--ltt-bad-soft:#fdebeb;--ltt-warn:#996000;--ltt-warn-soft:#fcf1dc;" +
    "--ltt-dark:#18191d;--ltt-on-dark:#f4f3ef;--ltt-on-accent:#fff;--ltt-accent-on-dark:#9fb3ff;--ltt-shadow:0 1px 2px rgba(22,23,27,.05),0 10px 30px rgba(22,23,27,.06);" +
    "--ltt-c1:#2b5fb0;--ltt-c2:#d0492b;--ltt-c3:#008a8f;--ltt-c4:#7b2b54;--ltt-c5:#8a5ad8;--ltt-c6:#5f5200;";
  var TOKENS_DARK = "--ltt-bg:#121316;--ltt-card:#1c1d21;--ltt-card-2:#232429;--ltt-line:#2d2e35;--ltt-line-2:#3a3b43;" +
    "--ltt-ink:#efeee9;--ltt-ink-2:#cfcec8;--ltt-muted:#9a9aa3;--ltt-accent:#7e98ff;--ltt-accent-soft:#222a47;" +
    "--ltt-good:#3fcf93;--ltt-good-soft:#16302a;--ltt-bad:#ff6b70;--ltt-bad-soft:#3a1d20;--ltt-warn:#f0b13c;--ltt-warn-soft:#352914;" +
    "--ltt-dark:#050608;--ltt-on-dark:#f4f3ef;--ltt-on-accent:#fff;--ltt-accent-on-dark:#9fb3ff;--ltt-shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35);" +
    "--ltt-c1:#6aa1f0;--ltt-c2:#f57a52;--ltt-c3:#f2c14e;--ltt-c4:#3fd6d0;--ltt-c5:#d48ab4;--ltt-c6:#9cd59b;";

  var SERIF = "'LTT Serif','Noto Serif KR','Nanum Myeongjo','AppleMyungjo','Batang',Georgia,serif";
  // Each theme imitates the medium practitioners of a field already read (paper figures, drawings, terminals, financial press, plot paper).
  // `shape` holds non-colour tokens shared by both schemes; `css` is extra surface styling scoped to the theme.
  var THEMES = {
    studio: { label: "Studio", medium: "제품 화면·디자인 툴", light: "", dark: "", shape: "", css: "" },
    paper: {
      label: "Paper", medium: "논문 figure·교과서",
      light: "--ltt-bg:#f4efe4;--ltt-card:#fbf8f1;--ltt-card-2:#f1ebdf;--ltt-line:#e0d6c3;--ltt-line-2:#cdbfa6;--ltt-ink:#1f1b16;--ltt-ink-2:#433c33;" +
        "--ltt-muted:#71685b;--ltt-accent:#23508e;--ltt-accent-soft:#e0e7f1;--ltt-good:#3b7449;--ltt-good-soft:#e3eddc;--ltt-bad:#b1322a;--ltt-bad-soft:#f5dfda;" +
        "--ltt-warn:#925b0c;--ltt-warn-soft:#f4e7cf;--ltt-dark:#2b2620;--ltt-on-dark:#f4efe4;--ltt-accent-on-dark:#a9c2ee;--ltt-shadow:none;",
      dark: "--ltt-bg:#1a1814;--ltt-card:#221f1a;--ltt-card-2:#2a2620;--ltt-line:#38322a;--ltt-line-2:#4a4237;--ltt-ink:#ece4d4;--ltt-ink-2:#d2c8b6;" +
        "--ltt-muted:#a0968a;--ltt-accent:#8fb0e6;--ltt-accent-soft:#1f2a3c;--ltt-good:#8cc49a;--ltt-good-soft:#21301f;--ltt-bad:#f08a7e;--ltt-bad-soft:#3b2220;" +
        "--ltt-warn:#e5b45e;--ltt-warn-soft:#382c17;--ltt-dark:#0e0d0b;--ltt-on-dark:#ece4d4;--ltt-on-accent:#1a1814;--ltt-accent-on-dark:#a9c2ee;--ltt-shadow:none;",
      shape: "--ltt-radius:4px;--ltt-r-lg:4px;--ltt-r-md:4px;--ltt-font-display:" + SERIF + ";--ltt-display-weight:700;--ltt-display-track:-.015em;",
      css: "[data-ltt-theme=paper] .dk-no{font-family:" + SERIF + ";font-style:italic;font-weight:400}" +
        "[data-ltt-theme=paper] .dk-kicker,[data-ltt-theme=paper] .dk-top h1{box-shadow:none;background:none;padding-left:0;border-radius:0;letter-spacing:.06em;text-transform:uppercase;font-size:12px}" +
        "[data-ltt-theme=paper] .dk-top{border-bottom:1.5px solid var(--ltt-ink);margin-bottom:8px}" +
        "[data-ltt-theme=paper] .ltt-dg rect.box,[data-ltt-theme=paper] .ltt-dg .z rect{rx:3px}[data-ltt-theme=paper] .ltt-dg .n .l{font-family:" + SERIF + "}"
    },
    blueprint: {
      label: "Blueprint", medium: "회로·블록 도면",
      light: "--ltt-bg:#eef3f8;--ltt-card:#f7fafd;--ltt-card-2:#e6edf5;--ltt-line:#c9d7e6;--ltt-line-2:#a9bfd6;--ltt-ink:#0f2740;--ltt-ink-2:#2a4562;" +
        "--ltt-muted:#546b84;--ltt-accent:#1c61d2;--ltt-accent-soft:#dde9fb;--ltt-good:#0b7759;--ltt-good-soft:#d9f0e8;--ltt-bad:#bd3137;--ltt-bad-soft:#fae1e1;" +
        "--ltt-warn:#985a00;--ltt-warn-soft:#f8ead2;--ltt-dark:#0b1d33;--ltt-on-dark:#dce8f5;--ltt-accent-on-dark:#7cc2ff;--ltt-shadow:none;" +
        "--ltt-pattern:linear-gradient(#d9e4ef 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,#d9e4ef 1px,transparent 1px) 0 0/24px 24px;",
      dark: "--ltt-bg:#0b1d33;--ltt-card:#0f2440;--ltt-card-2:#132b4b;--ltt-line:#1f3d63;--ltt-line-2:#2c5180;--ltt-ink:#dce8f5;--ltt-ink-2:#b7cbe2;" +
        "--ltt-muted:#7f9bbd;--ltt-accent:#5fb3ff;--ltt-accent-soft:#16365c;--ltt-good:#4fd1a5;--ltt-good-soft:#123a3a;--ltt-bad:#ff7a80;--ltt-bad-soft:#3d1f2c;" +
        "--ltt-warn:#ffb454;--ltt-warn-soft:#3a3020;--ltt-dark:#06111f;--ltt-on-dark:#dce8f5;--ltt-on-accent:#04121f;--ltt-accent-on-dark:#7cc2ff;--ltt-shadow:none;" +
        "--ltt-pattern:linear-gradient(#12294a 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,#12294a 1px,transparent 1px) 0 0/24px 24px;",
      shape: "--ltt-radius:3px;--ltt-r-lg:3px;--ltt-r-md:3px;--ltt-r-sm:2px;--ltt-display-weight:750;--ltt-display-track:-.025em;--ltt-border-w:1.5px;",
      css: "[data-ltt-theme=blueprint] .dk-no,[data-ltt-theme=blueprint] .dk-kicker,[data-ltt-theme=blueprint] .dk-step .no,[data-ltt-theme=blueprint] .dk-count{font-family:var(--ltt-mono);letter-spacing:0}" +
        "[data-ltt-theme=blueprint] .dk-kicker,[data-ltt-theme=blueprint] .dk-top h1{border-radius:2px;text-transform:uppercase;font-size:12px;letter-spacing:.08em}" +
        "[data-ltt-theme=blueprint] .dk-no{font-weight:500;font-size:clamp(40px,min(6vw,10vh),84px)}" +
        "[data-ltt-theme=blueprint] .ltt-dg rect.box,[data-ltt-theme=blueprint] .ltt-dg .z rect{rx:2px}" +
        "[data-ltt-theme=blueprint] .ltt-dg .n .s,[data-ltt-theme=blueprint] .ltt-dg .el,[data-ltt-theme=blueprint] .ltt-dg .z text{font-family:var(--ltt-mono);letter-spacing:.02em}"
    },
    terminal: {
      label: "Terminal", medium: "터미널·로그·대시보드",
      light: "--ltt-bg:#f3f3ee;--ltt-card:#fbfbf8;--ltt-card-2:#ecece5;--ltt-line:#dcdcd2;--ltt-line-2:#c4c4b8;--ltt-ink:#121512;--ltt-ink-2:#30352f;" +
        "--ltt-muted:#656b62;--ltt-accent:#07793b;--ltt-accent-soft:#dcf1e3;--ltt-good:#07793b;--ltt-good-soft:#dcf1e3;--ltt-bad:#bd2d29;--ltt-bad-soft:#f8dedd;" +
        "--ltt-warn:#925c00;--ltt-warn-soft:#f5e8cc;--ltt-dark:#0d0f0e;--ltt-on-dark:#d6e5dc;--ltt-accent-on-dark:#3ddc84;--ltt-shadow:none;",
      dark: "--ltt-bg:#0c0e0d;--ltt-card:#121614;--ltt-card-2:#18201c;--ltt-line:#222c27;--ltt-line-2:#304038;--ltt-ink:#d6e5dc;--ltt-ink-2:#b2c4b9;" +
        "--ltt-muted:#7d9086;--ltt-accent:#3ddc84;--ltt-accent-soft:#143223;--ltt-good:#3ddc84;--ltt-good-soft:#143223;--ltt-bad:#ff6b6b;--ltt-bad-soft:#3a1c1c;" +
        "--ltt-warn:#ffb000;--ltt-warn-soft:#382b10;--ltt-dark:#050605;--ltt-on-dark:#d6e5dc;--ltt-on-accent:#06120b;--ltt-accent-on-dark:#3ddc84;--ltt-shadow:none;",
      shape: "--ltt-radius:6px;--ltt-r-lg:6px;--ltt-r-md:5px;--ltt-r-sm:4px;--ltt-display-weight:750;--ltt-display-track:-.03em;",
      css: "[data-ltt-theme=terminal] .dk-no,[data-ltt-theme=terminal] .dk-kicker,[data-ltt-theme=terminal] .dk-step .no,[data-ltt-theme=terminal] .dk-count,[data-ltt-theme=terminal] .dk-top h1{font-family:var(--ltt-mono);letter-spacing:0}" +
        "[data-ltt-theme=terminal] .dk-no::before{content:'#';opacity:.45}[data-ltt-theme=terminal] .dk-no{font-weight:600;font-size:clamp(36px,min(5vw,9vh),72px)}" +
        "[data-ltt-theme=terminal] .dk-top h1::before{border-radius:0;width:8px;height:14px;animation:none}" +
        "[data-ltt-theme=terminal] .dk-kicker::before{content:'$';width:auto;height:auto;background:none;color:var(--ltt-accent)}" +
        "[data-ltt-theme=terminal] .ltt-dg rect.box,[data-ltt-theme=terminal] .ltt-dg .z rect{rx:4px}[data-ltt-theme=terminal] .ltt-dg .n .l,[data-ltt-theme=terminal] .ltt-dg .el{font-family:var(--ltt-mono)}"
    },
    ledger: {
      label: "Ledger", medium: "경제 신문 차트",
      light: "--ltt-bg:#fff1e5;--ltt-card:#fff8f2;--ltt-card-2:#f8e6d6;--ltt-line:#ead5c2;--ltt-line-2:#d9bca3;--ltt-ink:#33302e;--ltt-ink-2:#4d4845;" +
        "--ltt-muted:#6f665f;--ltt-accent:#0c727c;--ltt-accent-soft:#d9ecea;--ltt-good:#09753f;--ltt-good-soft:#dcefdf;--ltt-bad:#cc0000;--ltt-bad-soft:#f9dcd6;" +
        "--ltt-warn:#9c5300;--ltt-warn-soft:#f8e3c8;--ltt-dark:#262a33;--ltt-on-dark:#fff1e5;--ltt-accent-on-dark:#7fd0d6;--ltt-shadow:none;",
      dark: "--ltt-bg:#1d1a18;--ltt-card:#262220;--ltt-card-2:#2e2926;--ltt-line:#3b3431;--ltt-line-2:#4d4440;--ltt-ink:#f2e6db;--ltt-ink-2:#d6cac0;" +
        "--ltt-muted:#a3968c;--ltt-accent:#4fb5bd;--ltt-accent-soft:#1c3536;--ltt-good:#56c08a;--ltt-good-soft:#1c3226;--ltt-bad:#ff6a5c;--ltt-bad-soft:#3d201d;" +
        "--ltt-warn:#f0a447;--ltt-warn-soft:#3a2b1a;--ltt-dark:#0f0d0c;--ltt-on-dark:#f2e6db;--ltt-on-accent:#0f1d1e;--ltt-accent-on-dark:#7fd0d6;--ltt-shadow:none;",
      shape: "--ltt-radius:0px;--ltt-r-lg:0px;--ltt-r-md:0px;--ltt-r-sm:0px;--ltt-font-display:" + SERIF + ";--ltt-display-weight:700;--ltt-display-track:-.02em;",
      css: "[data-ltt-theme=ledger] .dk-top{border-bottom:3px solid var(--ltt-ink);margin-bottom:6px}" +
        "[data-ltt-theme=ledger] .dk-top h1,[data-ltt-theme=ledger] .dk-kicker{box-shadow:none;background:none;padding-left:0;border-radius:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase}" +
        "[data-ltt-theme=ledger] .dk-top h1::before,[data-ltt-theme=ledger] .dk-kicker::before{border-radius:0;width:14px;height:4px}" +
        "[data-ltt-theme=ledger] .dk-no{font-family:" + SERIF + ";font-weight:400;color:var(--ltt-ink-2)}" +
        "[data-ltt-theme=ledger] .ltt-dg rect.box,[data-ltt-theme=ledger] .ltt-dg .z rect{rx:0}"
    },
    lab: {
      label: "Lab", medium: "실험 노트·모눈 플롯",
      light: "--ltt-bg:#f8f9f4;--ltt-card:#fdfdfa;--ltt-card-2:#eff2ea;--ltt-line:#dbe2d6;--ltt-line-2:#bfcab9;--ltt-ink:#1b2620;--ltt-ink-2:#34423a;" +
        "--ltt-muted:#627067;--ltt-accent:#b93e0b;--ltt-accent-soft:#fbe5d8;--ltt-good:#137750;--ltt-good-soft:#dbefe4;--ltt-bad:#be2e3a;--ltt-bad-soft:#f7dfe0;" +
        "--ltt-warn:#8a5e00;--ltt-warn-soft:#f2e8c9;--ltt-dark:#18231d;--ltt-on-dark:#eef3ec;--ltt-accent-on-dark:#ffa877;" +
        "--ltt-shadow:0 1px 0 rgba(27,38,32,.06);" +
        "--ltt-pattern:linear-gradient(#e7ece3 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,#e7ece3 1px,transparent 1px) 0 0/16px 16px;",
      dark: "--ltt-bg:#111613;--ltt-card:#161c18;--ltt-card-2:#1c241f;--ltt-line:#26312a;--ltt-line-2:#344238;--ltt-ink:#e4ece5;--ltt-ink-2:#c3cfc6;" +
        "--ltt-muted:#8b9a90;--ltt-accent:#ff8a50;--ltt-accent-soft:#3a2418;--ltt-good:#4fcf95;--ltt-good-soft:#163024;--ltt-bad:#ff6f7b;--ltt-bad-soft:#3b1d22;" +
        "--ltt-warn:#e8b740;--ltt-warn-soft:#352c14;--ltt-dark:#070a08;--ltt-on-dark:#e4ece5;--ltt-on-accent:#1a0d05;--ltt-accent-on-dark:#ffa877;--ltt-shadow:none;" +
        "--ltt-pattern:linear-gradient(#18201b 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,#18201b 1px,transparent 1px) 0 0/16px 16px;",
      shape: "--ltt-radius:10px;--ltt-r-lg:10px;--ltt-r-md:8px;--ltt-display-weight:800;--ltt-display-track:-.035em;",
      css: "[data-ltt-theme=lab] .dk-no{font-family:var(--ltt-mono);font-weight:500;letter-spacing:-.04em}" +
        "[data-ltt-theme=lab] .dk-kicker{font-family:var(--ltt-mono);border-radius:4px;font-size:12px}"
    },
    // Diagrams switch to hand-drawn strokes under this theme when rough.js is loaded (see ltt-parts.js diagram).
    sketch: {
      label: "Sketch", medium: "화이트보드·손그림 설명",
      light: "--ltt-bg:#fbfaf6;--ltt-card:#fff;--ltt-card-2:#f4f2ec;--ltt-line:#e4e0d6;--ltt-line-2:#b9b3a6;--ltt-ink:#1e1d1b;--ltt-ink-2:#3a3833;" +
        "--ltt-muted:#716d65;--ltt-accent:#1f5fc4;--ltt-accent-soft:#e4ecfa;--ltt-good:#1a7942;--ltt-good-soft:#e0f1e6;--ltt-bad:#bf322a;--ltt-bad-soft:#fbe2df;" +
        "--ltt-warn:#9e5b00;--ltt-warn-soft:#fbedd6;--ltt-dark:#22211f;--ltt-on-dark:#f6f4ee;--ltt-accent-on-dark:#9dbbf2;--ltt-shadow:none;",
      dark: "--ltt-bg:#1f2a24;--ltt-card:#24312a;--ltt-card-2:#2a3830;--ltt-line:#35463c;--ltt-line-2:#5a7062;--ltt-ink:#eef2ea;--ltt-ink-2:#d2dacd;" +
        "--ltt-muted:#a3b1a3;--ltt-accent:#8fc0ff;--ltt-accent-soft:#24384a;--ltt-good:#8ee3a8;--ltt-good-soft:#213d2c;--ltt-bad:#ff8d84;--ltt-bad-soft:#45282a;" +
        "--ltt-warn:#ffd06a;--ltt-warn-soft:#433a22;--ltt-dark:#121a16;--ltt-on-dark:#eef2ea;--ltt-on-accent:#102030;--ltt-accent-on-dark:#8fc0ff;--ltt-shadow:none;",
      shape: "--ltt-radius:12px;--ltt-r-lg:14px;--ltt-r-md:10px;--ltt-display-weight:800;--ltt-display-track:-.03em;--ltt-border-w:2px;",
      css: "[data-ltt-theme=sketch] .ltt-card{border-width:2px;border-color:var(--ltt-line-2)}" +
        "[data-ltt-theme=sketch] .dk-kicker,[data-ltt-theme=sketch] .dk-top h1{box-shadow:none;background:none;padding-left:0;border-bottom:2.5px solid var(--ltt-accent);border-radius:0}" +
        "[data-ltt-theme=sketch] .ltt-dg .e{stroke-width:2.2}[data-ltt-theme=sketch] .ltt-dg .n rect.box{stroke:var(--ltt-ink-2)}"
    },
    atlas: {
      label: "Atlas", medium: "지도·지리·물류",
      light: "--ltt-bg:#eef2f1;--ltt-card:#fbfcfa;--ltt-card-2:#e6ecea;--ltt-line:#d3dcd9;--ltt-line-2:#b3c1bd;--ltt-ink:#17262b;--ltt-ink-2:#2f4248;" +
        "--ltt-muted:#5a6c70;--ltt-accent:#0f6e8c;--ltt-accent-soft:#dcecf0;--ltt-good:#2a763d;--ltt-good-soft:#e0eedf;--ltt-bad:#b73629;--ltt-bad-soft:#f6dfdb;" +
        "--ltt-warn:#965900;--ltt-warn-soft:#f6e8cf;--ltt-dark:#13232a;--ltt-on-dark:#e8f0ef;--ltt-accent-on-dark:#7fcbe0;--ltt-shadow:none;" +
        "--ltt-sea:#d9e7ec;--ltt-land:#f7f5ee;--ltt-border:#b4ae9c;",
      dark: "--ltt-bg:#0f1a1f;--ltt-card:#14232a;--ltt-card-2:#1a2c34;--ltt-line:#24393f;--ltt-line-2:#3a5960;--ltt-ink:#e3eeee;--ltt-ink-2:#c2d3d4;" +
        "--ltt-muted:#8aa1a5;--ltt-accent:#5cc2df;--ltt-accent-soft:#163843;--ltt-good:#6fd08c;--ltt-good-soft:#173323;--ltt-bad:#ff7d70;--ltt-bad-soft:#3d201d;" +
        "--ltt-warn:#f0b45a;--ltt-warn-soft:#3a2c17;--ltt-dark:#071014;--ltt-on-dark:#e3eeee;--ltt-on-accent:#062028;--ltt-accent-on-dark:#7fcbe0;--ltt-shadow:none;" +
        "--ltt-sea:#0f2730;--ltt-land:#1d2f35;--ltt-border:#3d575e;",
      shape: "--ltt-radius:8px;--ltt-r-lg:10px;--ltt-r-md:6px;--ltt-r-sm:4px;--ltt-display-weight:780;--ltt-display-track:-.025em;",
      css: "[data-ltt-theme=atlas] .dk-kicker,[data-ltt-theme=atlas] .dk-top h1{text-transform:uppercase;font-size:12px;letter-spacing:.1em;border-radius:3px}" +
        "[data-ltt-theme=atlas] .dk-no{font-family:var(--ltt-mono);font-weight:500;letter-spacing:0}"
    }
  };

  function themeCss() {
    return Object.keys(THEMES).filter(function (k) { return k !== "studio"; }).map(function (k) {
      var t = THEMES[k], sel = ":root[data-ltt-theme=" + k + "]";
      return sel + "{" + t.shape + t.light + "}" +
        "@media (prefers-color-scheme:dark){" + sel + ":not([data-theme=light]){" + t.dark + "}}" +
        sel + "[data-theme=dark]{" + t.dark + "}" + t.css;
    }).join("");
  }

  var STYLE = [
    "@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;",
    "src:url('/kit/vendor/pretendard/PretendardVariable.woff2') format('woff2-variations')}",
    // Serif and mono faces are subsets (KS X 1001 Hangul + Latin); syllables outside fall through to the next family in the stack.
    "@font-face{font-family:'LTT Serif';font-weight:200 900;font-style:normal;font-display:swap;",
    "src:url('/kit/vendor/noto-serif-kr/NotoSerifKR-ksx.woff2') format('woff2-variations')}",
    "@font-face{font-family:'LTT Mono';font-weight:400;font-style:normal;font-display:swap;src:url('/kit/vendor/d2coding/D2Coding-ksx.woff2') format('woff2')}",
    "@font-face{font-family:'LTT Mono';font-weight:700;font-style:normal;font-display:swap;src:url('/kit/vendor/d2coding/D2CodingBold-ksx.woff2') format('woff2')}",
    ":root{" + TOKENS_LIGHT + "--ltt-radius:20px;--ltt-r-lg:24px;--ltt-r-md:14px;--ltt-r-sm:8px;--ltt-border-w:1px;--ltt-pattern:none;",
    "--ltt-display-weight:850;--ltt-display-track:-.04em;--ltt-font-display:var(--ltt-font);",
    "--ltt-font:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',sans-serif;",
    "--ltt-mono:'LTT Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;",
    "--ltt-sea:color-mix(in srgb,var(--ltt-accent) 9%,var(--ltt-card-2));--ltt-land:var(--ltt-card);--ltt-border:var(--ltt-line-2);color-scheme:light}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]){" + TOKENS_DARK + "color-scheme:dark}}",
    ":root[data-theme=dark]{" + TOKENS_DARK + "color-scheme:dark}",
    "body{margin:0;background:var(--ltt-pattern),var(--ltt-bg);background-color:var(--ltt-bg);color:var(--ltt-ink);font:16px/1.6 var(--ltt-font);",
    "-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word}",
    "main{max-width:1080px;margin:0 auto;padding:40px 20px 96px}",
    "h1{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-.035em;line-height:1.15;margin:0 0 8px}",
    "h2{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 12px}",
    "code,kbd,.ltt-mono{font-family:var(--ltt-mono);font-size:.92em}",
    "a{color:var(--ltt-accent)}",
    ".ltt-lead{color:var(--ltt-muted);font-size:17px;margin:0 0 28px}",
    ".ltt-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}",
    ".ltt-card{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-radius);",
    "padding:22px;margin:0 0 16px;box-shadow:var(--ltt-shadow)}",
    ".ltt-stat{font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}",
    ".ltt-stat small{font-size:15px;font-weight:600;color:var(--ltt-muted);margin-left:6px;letter-spacing:0}",
    ".ltt-tag{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;",
    "background:var(--ltt-accent-soft);color:var(--ltt-accent);margin-right:6px;vertical-align:middle;line-height:1.6;white-space:nowrap}",
    ".ltt-tag.warn{background:var(--ltt-warn-soft);color:var(--ltt-warn)}.ltt-tag.bad{background:var(--ltt-bad-soft);color:var(--ltt-bad)}",
    ".ltt-tag.good{background:var(--ltt-good-soft);color:var(--ltt-good)}.ltt-tag.muted{background:var(--ltt-card-2);color:var(--ltt-muted)}",
    ".ltt-param{display:block;margin:0 0 14px;font-weight:600;font-size:15px}",
    ".ltt-param>b{float:right;font-variant-numeric:tabular-nums;font-family:var(--ltt-mono)}",
    "input[type=range]{width:100%;accent-color:var(--ltt-accent);margin:8px 0 2px}",
    ".ltt-basis{font-size:13px;color:var(--ltt-muted);line-height:1.5}",
    "button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:10px 18px;background:var(--ltt-ink);",
    "color:var(--ltt-bg);cursor:pointer;transition:transform .12s,background-color .2s,opacity .2s}",
    "button:active:not(:disabled){transform:scale(.97)}button:disabled,button.ghost:disabled,button.accent:disabled{background:var(--ltt-card-2);color:var(--ltt-muted);box-shadow:inset 0 0 0 1.5px var(--ltt-line-2);cursor:default}",
    "button.ghost{background:transparent;color:var(--ltt-ink);box-shadow:inset 0 0 0 1.5px var(--ltt-line-2)}",
    "button.accent{background:var(--ltt-accent);color:var(--ltt-on-accent)}",
    ":focus-visible{outline:2.5px solid var(--ltt-accent);outline-offset:2px}",
    "input[type=number],input[type=text]{font:inherit;padding:8px 12px;border:1.5px solid var(--ltt-line-2);border-radius:12px;background:var(--ltt-card);color:var(--ltt-ink)}",
    "input[type=number]{width:6em}",
    ".ltt-hidden{display:none!important}",
    ".ltt-hero{font-size:76px;font-weight:850;letter-spacing:-.05em;line-height:1;font-variant-numeric:tabular-nums}",
    ".ltt-hero small{font-size:20px;font-weight:700;color:var(--ltt-muted);margin-left:8px;letter-spacing:0}",
    ".ltt-units{display:grid;grid-template-columns:repeat(var(--ltt-cols,10),1fr);gap:4px;max-width:360px}",
    ".ltt-unit{aspect-ratio:1;border-radius:4px;background:var(--ltt-line);",
    "transition:background-color .35s ease;transition-delay:calc(var(--i,0)*8ms)}",
    ".ltt-bar{display:flex;height:34px;border-radius:10px;overflow:hidden;background:var(--ltt-line)}",
    ".ltt-bar>span{display:flex;align-items:center;padding:0 8px;min-width:4px;color:#fff;font-size:13px;",
    "font-weight:700;white-space:nowrap;overflow:hidden;transition:flex-grow .6s cubic-bezier(.2,.7,.2,1)}",
    ".ltt-key{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ltt-muted);margin-right:14px}",
    ".ltt-key i{width:12px;height:12px;border-radius:4px;display:inline-block}",
    ".ltt-ic{width:1em;height:1em;display:inline-block;vertical-align:-.14em;flex:none}",
    "@keyframes ltt-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    ".ltt-rise{animation:ltt-rise .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*90ms)}",
    "@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:1ms!important;",
    "animation-delay:0s!important;transition-duration:1ms!important;transition-delay:0s!important}}",
    ".ltt-term{border-bottom:1.5px dotted var(--ltt-muted);cursor:help;font-weight:inherit}",
    ".ltt-term.first{border-bottom:2px solid color-mix(in srgb,var(--ltt-accent) 55%,transparent);background:color-mix(in srgb,var(--ltt-accent) 7%,transparent);border-radius:3px 3px 0 0;padding:0 2px}",
    "#ltt-pop{position:fixed;z-index:50;max-width:min(320px,calc(100vw - 24px));padding:12px 14px;border-radius:14px;",
    "background:var(--ltt-dark);color:var(--ltt-on-dark);font-size:14px;line-height:1.5;box-shadow:0 12px 32px rgba(0,0,0,.25);",
    "opacity:0;transform:translateY(4px);transition:opacity .15s,transform .15s;pointer-events:none}",
    "#ltt-pop.on{opacity:1;transform:none}#ltt-pop b{display:block;font-size:13px;color:var(--ltt-accent-on-dark);margin-bottom:2px}",
    "#ltt-expect{position:fixed;right:16px;bottom:88px;z-index:40;max-width:380px;max-height:40vh;overflow:auto;font-size:13px;",
    "background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:14px;padding:8px 12px;",
    "box-shadow:var(--ltt-shadow)}#ltt-expect summary{cursor:pointer;font-weight:700;color:var(--ltt-good)}",
    "#ltt-expect[data-fails] summary{color:var(--ltt-bad)}#ltt-expect[data-warns]:not([data-fails]) summary{color:var(--ltt-warn)}",
    "#ltt-expect:not([data-fails]):not([data-warns]){display:none}",
    "#ltt-expect div{margin:2px 0}#ltt-expect .ok{color:var(--ltt-good)}#ltt-expect .fail{color:var(--ltt-bad);font-weight:600}",
    "#ltt-expect .warn{color:var(--ltt-warn)}"
  ].join("") + themeCss();

  // 24×24 stroke icons; each value is SVG inner markup drawn with currentColor.
  var ICONS = {
    check: "<path d='M5 12.5l4.5 4.5L19 7.5'/>",
    x: "<path d='M6.5 6.5l11 11M17.5 6.5l-11 11'/>",
    arrow: "<path d='M4.5 12h15M13.5 6l6 6-6 6'/>",
    "arrow-down": "<path d='M12 4.5v15M6 13.5l6 6 6-6'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    minus: "<path d='M5 12h14'/>",
    clock: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
    hourglass: "<path d='M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5'/>",
    db: "<ellipse cx='12' cy='6' rx='7' ry='2.8'/><path d='M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8'/>",
    server: "<rect x='4' y='4' width='16' height='7' rx='2'/><rect x='4' y='13' width='16' height='7' rx='2'/><path d='M8 7.5h.01M8 16.5h.01'/>",
    cache: "<rect x='4' y='5' width='16' height='14' rx='3'/><path d='M8 9.5h8M8 14.5h5'/><path d='M17.5 13.5l1.5 1.5-1.5 1.5'/>",
    cpu: "<rect x='6.5' y='6.5' width='11' height='11' rx='2'/><rect x='9.5' y='9.5' width='5' height='5' rx='1'/><path d='M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3'/>",
    memory: "<rect x='3.5' y='7' width='17' height='9' rx='1.5'/><path d='M7 16v3M11 16v3M15 16v3M7 10.5h2M11 10.5h2M15 10.5h2'/>",
    user: "<circle cx='12' cy='8.5' r='3.8'/><path d='M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6'/>",
    users: "<circle cx='9' cy='9' r='3.3'/><path d='M3 19.5c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2'/><path d='M15.5 5.8a3.3 3.3 0 010 6.4M17.5 14.6c1.8.7 3 2.3 3.5 4.9'/>",
    doc: "<path d='M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10A.5.5 0 017 20V3.5z'/><path d='M14 3.5V8h4M9.5 12h6M9.5 15.5h6'/>",
    search: "<circle cx='10.5' cy='10.5' r='6'/><path d='M15 15l5 5'/>",
    eye: "<path d='M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z'/><circle cx='12' cy='12' r='2.8'/>",
    alert: "<path d='M12 4l9 15.5H3L12 4z'/><path d='M12 10v4M12 16.8v.2'/>",
    bolt: "<path d='M13 3L5.5 13.5H12L11 21l7.5-10.5H12L13 3z'/>",
    refresh: "<path d='M19.5 11a7.5 7.5 0 00-13.4-4.2M4.5 13a7.5 7.5 0 0013.4 4.2'/><path d='M6 3.5v3.5h3.5M18 20.5V17h-3.5'/>",
    target: "<circle cx='12' cy='12' r='8.5'/><circle cx='12' cy='12' r='4.8'/><circle cx='12' cy='12' r='1.2'/>",
    chart: "<path d='M4 20V4M4 20h16'/><path d='M8 16v-4M12 16V8M16 16v-6'/>",
    trend: "<path d='M4 17l5-5 4 3 7-8'/><path d='M15 7h5v5'/>",
    phone: "<rect x='7' y='3' width='10' height='18' rx='2.5'/><path d='M11 18h2'/>",
    monitor: "<rect x='3.5' y='4.5' width='17' height='11.5' rx='2'/><path d='M9 20h6M12 16v4'/>",
    cursor: "<path d='M6 4l12 7-5.2 1.3L10.5 18 6 4z'/>",
    lock: "<rect x='5.5' y='10.5' width='13' height='10' rx='2'/><path d='M8.5 10.5V8a3.5 3.5 0 017 0v2.5'/>",
    send: "<path d='M20 4L3.5 11l6.5 2.5L12.5 20 20 4z'/><path d='M10 13.5L20 4'/>",
    layers: "<path d='M12 4l8.5 4.5L12 13 3.5 8.5 12 4z'/><path d='M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5'/>",
    wind: "<path d='M3.5 9h11a3 3 0 10-3-3M3.5 13h15a3 3 0 11-3 3M3.5 17h6'/>",
    ruler: "<rect x='3' y='8' width='18' height='8' rx='1.5'/><path d='M7 8v3M11 8v4M15 8v3M19 8v2'/>",
    scale: "<path d='M12 4v16M7 20h10M5 7h14'/><path d='M5 7l-2.5 6a2.5 2.5 0 005 0L5 7zM19 7l-2.5 6a2.5 2.5 0 005 0L19 7z'/>",
    dice: "<rect x='4' y='4' width='16' height='16' rx='3.5'/><circle cx='9' cy='9' r='.9'/><circle cx='15' cy='15' r='.9'/><circle cx='15' cy='9' r='.9'/><circle cx='9' cy='15' r='.9'/>",
    home: "<path d='M4 11l8-6.5 8 6.5V20H4v-9z'/><path d='M10 20v-5.5h4V20'/>",
    anchor: "<circle cx='12' cy='5.5' r='2'/><path d='M12 7.5V20M8 11h8M4.5 13.5a7.5 7.5 0 0015 0'/>",
    pencil: "<path d='M15.5 4.5l4 4L9 19H5v-4L15.5 4.5z'/>",
    palette: "<path d='M12 3.5a8.5 8.5 0 100 17c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.2-1.7-1.2-2.8 0-1 .8-1.6 1.8-1.6h2.4a3.7 3.7 0 003.7-3.7C20.5 6.6 16.7 3.5 12 3.5z'/><circle cx='8' cy='11' r='1'/><circle cx='11' cy='7.5' r='1'/><circle cx='15.5' cy='8' r='1'/>",
    sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'/>",
    ball: "<circle cx='12' cy='12' r='8.5'/><path d='M6 6c2.5 2 2.5 10 0 12M18 6c-2.5 2-2.5 10 0 12'/>",
    question: "<circle cx='12' cy='12' r='8.5'/><path d='M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.3M12 16.8v.2'/>",
    bulb: "<path d='M9 17.5h6M10 20.5h4M12 3.5a5.5 5.5 0 00-3.2 10c.6.5 1.2 1.3 1.2 2.2v1.8h4v-1.8c0-.9.6-1.7 1.2-2.2A5.5 5.5 0 0012 3.5z'/>",
    link: "<path d='M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'/>",
    inbox: "<path d='M3.5 13l2.5-7.5h12l2.5 7.5V19H3.5v-6z'/><path d='M3.5 13H8l1.5 2.5h5L16 13h4.5'/>",
    // From Lucide 1.48.0 (ISC, kit/vendor/LICENSE-lucide), copied per icon; drawn on the same 24 grid, so icon() applies the kit stroke width.
    globe: "<circle cx='12' cy='12' r='10'/><path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'/><path d='M2 12h20'/>",
    "map-pin": "<path d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'/><circle cx='12' cy='10' r='3'/>",
    route: "<circle cx='6' cy='19' r='3'/><path d='M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15'/><circle cx='18' cy='5' r='3'/>",
    "git-branch": "<path d='M15 6a9 9 0 0 0-9 9V3'/><circle cx='18' cy='6' r='3'/><circle cx='6' cy='18' r='3'/>",
    timer: "<line x1='10' x2='14' y1='2' y2='2'/><line x1='12' x2='15' y1='14' y2='11'/><circle cx='12' cy='14' r='8'/>",
    "database-zap": "<ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/>",
    network: "<rect x='16' y='16' width='6' height='6' rx='1'/><rect x='2' y='16' width='6' height='6' rx='1'/><rect x='9' y='2' width='6' height='6' rx='1'/><path d='M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3'/><path d='M12 12V8'/>",
    "shield-check": "<path d='M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'/><path d='m9 12 2 2 4-4'/>",
    "key-round": "<path d='M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z'/><circle cx='16.5' cy='7.5' r='.5' fill='currentColor'/>",
    mail: "<path d='m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7'/><rect x='2' y='4' width='20' height='16' rx='2'/>",
    package: "<path d='M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z'/><path d='M12 22V12'/><polyline points='3.29 7 12 12 20.71 7'/><path d='m7.5 4.27 9 5.15'/>",
    truck: "<path d='M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2'/><path d='M15 18H9'/><path d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14'/><circle cx='17' cy='18' r='2'/><circle cx='7' cy='18' r='2'/>",
    wifi: "<path d='M12 20h.01'/><path d='M2 8.82a15 15 0 0 1 20 0'/><path d='M5 12.859a10 10 0 0 1 14 0'/><path d='M8.5 16.429a5 5 0 0 1 7 0'/>",
    cloud: "<path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/>",
    gauge: "<path d='m12 14 4-4'/><path d='M3.34 19a10 10 0 1 1 17.32 0'/>",
    workflow: "<rect width='8' height='8' x='3' y='3' rx='2'/><path d='M7 11v4a2 2 0 0 0 2 2h4'/><rect width='8' height='8' x='13' y='13' rx='2'/>"
  };

  function icon(name, opts) {
    var body = ICONS[name];
    if (!body) return "";
    var o = opts || {};
    return "<svg class='ltt-ic" + (o.cls ? " " + o.cls : "") + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='" +
      (o.weight || 1.8) + "' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + body + "</svg>";
  }

  function parseTokens(str, into) {
    String(str || "").split(";").forEach(function (decl) {
      var i = decl.indexOf(":");
      if (i > 0 && decl.slice(0, i).trim().indexOf("--ltt-") === 0) into[decl.slice(6, i).trim()] = decl.slice(i + 1).trim();
    });
    return into;
  }

  // Effective colour tokens of a theme without a document: defaults overlaid by the theme's scheme ("light" | "dark").
  function themeTokens(name, scheme) {
    var t = THEMES[name] || THEMES.studio, dark = scheme === "dark";
    return parseTokens(dark ? t.dark : t.light, parseTokens(t.shape, parseTokens(dark ? TOKENS_DARK : TOKENS_LIGHT, {})));
  }

  // Categorical series colours c1..c6. Without arguments it reads the live page (so it follows theme and colour scheme).
  function palette(name, scheme) {
    if (name == null && typeof document !== "undefined" && root.getComputedStyle) {
      var cs = root.getComputedStyle(document.documentElement), live = [];
      for (var i = 1; i <= 6; i++) live.push(cs.getPropertyValue("--ltt-c" + i).trim());
      if (live[0]) return live;
    }
    var tk = themeTokens(name || "studio", scheme);
    return [1, 2, 3, 4, 5, 6].map(function (i) { return tk["c" + i]; });
  }

  // WCAG 2.x contrast ratio of two #rgb/#rrggbb colours.
  function contrast(a, b) {
    function lum(hex) {
      var x = hex.replace("#", "");
      if (x.length === 3) x = x.replace(/./g, "$&$&");
      var c = [0, 2, 4].map(function (i) { var v = parseInt(x.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    var la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  var MARKS = { square: 1, ring: 1, dot: 1, diamond: 1, cross: 1 };

  // Shape markers centred on (0,0) so series stay distinguishable without hue; `inline` wraps one in a 1em <svg> for legends and prose.
  function mark(kind, opts) {
    var o = opts || {}, s = o.size || 18, h = s / 2, c = o.color || "currentColor", sw = o.weight || 2.5, body;
    if (!MARKS[kind]) throw new Error("unknown mark '" + kind + "' (" + Object.keys(MARKS).join(", ") + ")");
    if (kind === "square") body = "<rect x='" + -h + "' y='" + -h + "' width='" + s + "' height='" + s + "' rx='2' style='fill:" + c + "'/>";
    else if (kind === "dot") body = "<circle r='" + h + "' style='fill:" + c + "'/>";
    else if (kind === "ring") body = "<circle r='" + (h - sw / 2) + "' style='fill:" + (o.fill || "var(--ltt-bg)") + ";stroke:" + c + ";stroke-width:" + sw + "'/>";
    else if (kind === "diamond") body = "<path d='M0 " + -h * 1.15 + "L" + h * 1.15 + " 0L0 " + h * 1.15 + "L" + -h * 1.15 + " 0Z' style='fill:" + c + "'/>";
    else body = "<path d='M" + -h * 0.8 + " " + -h * 0.8 + "L" + h * 0.8 + " " + h * 0.8 + "M" + h * 0.8 + " " + -h * 0.8 + "L" + -h * 0.8 + " " + h * 0.8 +
      "' style='fill:none;stroke:" + c + ";stroke-width:" + sw + ";stroke-linecap:round'/>";
    var g = "<g class='ltt-mark m-" + kind + "'>" + body + "</g>";
    if (!o.inline) return g;
    var v = h * 1.15 + sw;
    return "<svg class='ltt-ic ltt-mark-ic' viewBox='" + [-v, -v, 2 * v, 2 * v].join(" ") + "' aria-hidden='true'>" + g + "</svg>";
  }

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
    var total = panel.querySelectorAll("div.ok,div.fail").length;
    var fails = panel.querySelectorAll("div.fail").length;
    var warns = panel.querySelectorAll("div.warn").length;
    var parts = [];
    if (total) parts.push(fails ? "기대값 대조 ✗ " + fails + "건 불일치 / " + total + "건" : "기대값 대조 ✓ " + total + "건 일치");
    if (warns) parts.push("수업 점검 경고 " + warns + "건");
    panel.firstChild.textContent = parts.join(" · ");
    if (fails) panel.dataset.fails = fails;
    if (warns) panel.dataset.warns = warns;
    if (fails || warns) panel.open = true;
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

  function warn(msg) {
    if (typeof document === "undefined") return;
    var row = document.createElement("div");
    row.className = "warn";
    row.textContent = "⚠ " + msg;
    var panel = expectPanel();
    panel.insertBefore(row, panel.firstChild.nextSibling);
    summarize(panel);
  }

  /* ---------- glossary ---------- */

  // `{{key}}` or `{{shown text|key}}`; returns [{key, shown}] in order of appearance.
  function termsIn(text) {
    var out = [], m;
    if (typeof text !== "string") return out;
    TERM.lastIndex = 0;
    while ((m = TERM.exec(text))) out.push(m[2] ? { key: m[2].trim(), shown: m[1] } : { key: m[1].trim(), shown: m[1] });
    return out;
  }

  // Fields an author fills with prose; everything else (ids, tones, answers) is not reader-facing text.
  var NON_TEXT = { type: 1, form: 1, tone: 1, answer: 1, id: 1, icon: 1, art: 1, tex: 1, at: 1, pointsOn: 1, layout: 1, cols: 1, k: 1, c: 1, r: 1, f: 1, t: 1, color: 1, mountIn: 1 };

  function sceneText(scene) {
    var out = [];
    (function walk(v, key) {
      if (key && NON_TEXT[key]) return;
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) v.forEach(function (x) { walk(x); });
      else if (v && typeof v === "object" && !(typeof Node !== "undefined" && v instanceof Node)) {
        Object.keys(v).forEach(function (k) { walk(v[k], k); });
      }
    })(scene);
    return out.join("\n");
  }

  function stripMarks(text) { return text.replace(TERM, ""); }

  // First scene that marks each glossary term; a `terms` scene defines every term it lists.
  function termIndex(spec) {
    var first = {};
    (spec.scenes || []).forEach(function (s, i) {
      if (s.type === "terms") (s.terms || []).forEach(function (t) { if (!(t.key in first)) first[t.key] = i; });
      termsIn(sceneText(s)).forEach(function (t) { if (!(t.key in first)) first[t.key] = i; });
    });
    return first;
  }

  function sentences(html) {
    var plain = String(html || "").replace(/<[^>]+>/g, "").replace(TERM, "$1").trim();
    if (!plain) return 0;
    return (plain.match(/[.?!…](?=\s|$)/g) || []).length || 1;
  }

  var VISUAL_TYPES = { compare: 1, contrast: 1, figure: 1, overview: 1 };

  // Equal-width card grids; a deck built mostly from these reads as the same slideshow whatever the topic.
  function isCardGrid(s, scenes) {
    if (s.type === "explain") return !s.form || s.form === "cards";
    if (s.type === "compare") return s.form !== "table";
    if (s.type === "summary") return !summaryCards(s, scenes || []).some(function (c) { return c.recall; });
    return s.type === "terms";
  }
  // What a summary scene shows: its own `cards`, or every earlier scene that has a takeaway.
  function summaryCards(s, scenes) {
    return (s.cards || scenes.map(function (x, i) { return { n: i + 1, title: x.title, text: x.takeaway, ask: x.ask, recall: x.recall }; }))
      .filter(function (c) { return c.text; });
  }
  function isSignature(s) {
    return s.type === "figure" || s.type === "contrast" || s.layout === "full" || (!s.type && !!s.mount);
  }

  // Filler that signals unreal content; "placeholder" itself is a legitimate UI term, so it is not listed.
  var FILLER = /lorem|ipsum|\bTODO\b|\bTBD\b|xxx|더미 ?(텍스트|데이터)|샘플 ?텍스트|임시 ?텍스트|\bItem [A-D]\b|항목 ?[0-9]\b/i;

  // Static checks for self-study readiness; returns [{scene, rule, msg}] (scene is 1-based, 0 for the deck).
  function lintDeck(spec) {
    var out = [], glossary = {}, scenes = spec.scenes || [];
    Object.keys(spec.glossary || {}).forEach(function (k) { glossary[k] = spec.glossary[k]; });
    scenes.forEach(function (s) { if (s.type === "terms") (s.terms || []).forEach(function (t) { glossary[t.key] = t.plain; }); });
    var first = termIndex(spec), predicts = 0, explained = false;
    function add(i, rule, msg) { out.push({ scene: i + 1, rule: rule, msg: msg }); }
    scenes.forEach(function (s, i) {
      var text = sceneText(s), marks = termsIn(text), seen = {};
      marks.forEach(function (t) {
        if (!(t.key in glossary) && s.type !== "terms") add(i, "unknown-term", "풀이가 없는 용어 {{" + t.key + "}}");
      });
      (s.type === "terms" ? s.terms || [] : []).forEach(function (t) {
        if (!t.plain) add(i, "unknown-term", "terms 장면의 '" + t.key + "'에 plain 풀이가 없다");
        if (t.visual === undefined) add(i, "term-no-visual", "'" + t.key + "'에 그 뜻을 보이는 visual이 없다 (그림으로 보일 수 없는 말이면 visual: false)");
      });
      if (s.type === "summary") summaryCards(s, scenes).forEach(function (c) {
        if (!c.recall) add(i, "summary-no-recall", "정리할 takeaway '" + stripMarks(c.text).slice(0, 24) + "…'에 떠올릴 질문(recall)이 없다");
      });
      if (s.type === "overview" && !s.figure) add(i, "overview-no-visual", "overview에 한 장으로 정리한 그림(figure)이 없다");
      var plain = stripMarks(text);
      Object.keys(glossary).forEach(function (key) {
        var at = first[key];
        if (plain.indexOf(key) >= 0 && (at == null || at > i)) add(i, "used-before-defined", "'" + key + "'가 풀이(첫 {{" + key + "}})보다 먼저 쓰였다");
      });
      Object.keys(first).forEach(function (k) { if (first[k] === i) seen[k] = 1; });
      var fresh = Object.keys(seen).length;
      if (fresh > (s.type === "terms" ? 4 : 2)) add(i, "too-many-terms", "새 용어 " + fresh + "개 (장면당 " + (s.type === "terms" ? 4 : 2) + "개 이하)");
      if (s.type === "predict") {
        predicts++;
        if (!explained) add(i, "predict-before-explain", "설명 장면보다 predict가 먼저 나온다");
        var asked = sceneText({ title: s.title, sub: s.sub, question: s.question, hint: s.hint, choices: s.choices });
        termsIn(asked).forEach(function (t) {
          if (seen[t.key]) { add(i, "predict-new-term", "predict 질문에서 처음 나온 용어 '" + t.key + "' (앞 장면에서 풀이할 것)"); seen[t.key] = 0; }
        });
      } else if (s.type !== "hook" && s.type !== "keywords" && s.type !== "summary" && s.type !== "overview") explained = true;
      var hasVisual = VISUAL_TYPES[s.type] || (!s.type && s.mount);
      if (hasVisual && !s.narration && !s.points && !s.sub && !s.caption && !(s.before && s.before.points))
        add(i, "no-reading-guide", "그림을 읽는 법(narration, points, sub)이 없다");
      if (s.type !== "hook" && s.type !== "keywords" && s.type !== "summary" && !s.title) add(i, "no-title", "제목이 없다");
      if (s.narration && sentences(s.narration) > 4) add(i, "long-narration", "해설이 4문장을 넘는다 (장면을 나눌 것)");
      if (s.points && s.points.length > 3) add(i, "many-points", "번호 주석이 " + s.points.length + "개 (3개 이하)");
      var filler = FILLER.exec(stripMarks(text));
      if (filler) add(i, "filler-content", "채움 글 '" + filler[0] + "' (실제 사례·값으로 바꿀 것)");
    });
    var run = 0, cards = 0, body = 0;
    scenes.forEach(function (s, i) {
      if (s.type === "hook" || s.type === "keywords") return;
      body++;
      if (isCardGrid(s, scenes)) { cards++; run++; if (run === 3) add(i, "card-monotony", "카드 격자 장면이 3장 연속이다 (figure·statement·explain form strip/stack·compare form table로 바꿀 것)"); }
      else run = 0;
    });
    if (body >= 4 && cards / body > 0.6) out.push({ scene: 0, rule: "card-monotony", msg: "카드 격자 장면이 " + cards + "/" + body + "장이다 (60% 이하)" });
    if (scenes.length && !scenes.some(isSignature)) out.push({ scene: 0, rule: "no-signature", msg: "그림이 주인공인 장면(figure, contrast, layout:\"full\", mount)이 없다" });
    if (!spec.theme) out.push({ scene: 0, rule: "no-theme", msg: "theme을 고르지 않았다 (" + Object.keys(THEMES).join(", ") + ")" });
    else if (!THEMES[spec.theme]) out.push({ scene: 0, rule: "unknown-theme", msg: "없는 theme '" + spec.theme + "'" });
    if (predicts > 1) out.push({ scene: 0, rule: "many-predicts", msg: "predict가 " + predicts + "개 (수업당 1개)" });
    var last = scenes[scenes.length - 1];
    if (!last || last.type !== "keywords") out.push({ scene: 0, rule: "keywords-last", msg: "마지막 장면이 keywords가 아니다" });
    var sum = scenes.map(function (s) { return s.type; }).lastIndexOf("summary");
    var ov = scenes.map(function (s) { return s.type; }).indexOf("overview");
    if (sum >= 0 && ov < 0) out.push({ scene: 0, rule: "overview-missing", msg: "summary 뒤에 한 장 정리(overview)가 없다" });
    if (ov >= 0 && (ov < sum || ov !== scenes.length - 2)) add(ov, "overview-order", "overview는 summary 뒤, keywords 바로 앞에 둔다");
    Object.keys(glossary).forEach(function (k) { if (!(k in first)) out.push({ scene: 0, rule: "unused-term", msg: "glossary의 '" + k + "'가 어디에도 표시되지 않았다" }); });
    return out;
  }

  var AUDIT_SKIP = { hook: 1, terms: 1, summary: 1, keywords: 1, statement: 1, predict: 1 };

  // Judges measurements of one rendered scene (see ltt-deck.js audit). Thresholds were calibrated on the gallery at 1440×900:
  // below them a figure read as a thumbnail or the scene needed the zoom floor; kit parts alone already use about 7 text sizes.
  // Narrow desktop windows (compact, 720–1000px) shrink by design, so zoom and visual-size ratios are not judged there.
  function auditScene(m) {
    var out = [], hero = m.type === "figure" || m.layout === "full";
    function add(rule, msg) { out.push({ rule: rule, msg: msg }); }
    if (m.hscroll) add("hscroll", "가로로 넘친다 (폭 " + m.hscroll + "px 초과). 고정 폭을 max-width:100%로 바꿀 것");
    (m.goals || []).forEach(function (g) {
      if (!g.hits) add("goal-unreachable", "목표를 맞추는 손잡이 위치가 없다 (표본 " + g.samples + "개 중 0개). 기준이나 손잡이 범위를 고칠 것");
      else if (g.hits < 2) add("goal-narrow", "목표가 손잡이 한 자리에서만 맞는다. 기준에 여유를 두어 두 자리 이상에서 맞게 할 것");
      if (g.start) add("goal-at-start", "시작 위치에서 이미 목표가 맞는다. 시작값을 목표 밖으로 옮길 것");
    });
    if (m.overflow) add("overflow", "한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것");
    else if (!m.compact && m.zoom < 0.88) add("shrunk", "화면에 맞추느라 " + Math.round(m.zoom * 100) + "%로 줄었다. 글을 줄이거나 장면을 나눌 것");
    if (!m.compact && !AUDIT_SKIP[m.type] && m.visualRatio != null && m.visualRatio < (hero ? 0.22 : 0.1))
      add("small-visual", "가장 큰 그림이 화면의 " + Math.round(m.visualRatio * 100) + "%뿐이다. 그림을 키우거나 layout: \"full\"");
    if (!m.compact && m.type === "figure" && m.figRatio != null && m.figRatio < 0.35)
      add("loose-figure", "그림이 figure 무대의 " + Math.round(m.figRatio * 100) + "%만 채운다. 그림 폭·높이를 키우거나 가로로 배치할 것");
    if (hero && m.fill != null && m.fill < 0.6) add("empty-stage", "장면이 화면 높이의 " + Math.round(m.fill * 100) + "%만 쓴다. 그림을 키울 것");
    if (m.fontSizes > 7) add("many-sizes", "본문 글자 크기가 " + m.fontSizes + "단계다 (kit 부품 포함 7단계 이하). 페이지 CSS의 font-size를 kit 크기에 맞출 것");
    return out;
  }

  // Positions a control can take, for checking a goal offline; long ranges keep `cap` evenly spaced positions including both ends.
  function stepValues(min, max, step, cap) {
    cap = cap || 201;
    var n = Math.floor((max - min) / step + 1e-9) + 1, digits = Math.max(0, -Math.floor(Math.log10(step)) + 2);
    var at = function (i) { return +(min + i * step).toFixed(digits); };
    if (n <= cap) return Array.from({ length: n }, function (_, i) { return at(i); });
    return Array.from({ length: cap }, function (_, i) { return at(Math.round(i * (n - 1) / (cap - 1))); });
  }

  // Counts control positions where a sweep goal holds. Past `limit` combinations it samples with a fixed seed so audits repeat.
  function goalReach(lists, check, start, limit) {
    limit = limit || 20000;
    var ids = Object.keys(lists), total = ids.reduce(function (n, id) { return n * lists[id].length; }, 1);
    var ok = function (v) { try { return !!check(v); } catch (e) { return false; } };
    var seed = 1, rand = function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var n = Math.min(total, limit), hits = 0;
    for (var k = 0; k < n; k++) {
      var v = {}, r = k;
      ids.forEach(function (id) {
        var list = lists[id], i;
        if (total <= limit) { i = r % list.length; r = Math.floor(r / list.length); } else i = Math.floor(rand() * list.length);
        v[id] = list[i];
      });
      if (ok(v)) hits++;
    }
    return { samples: n, hits: hits, start: start ? ok(start) : false };
  }

  function theme(name) {
    if (!THEMES[name] || typeof document === "undefined") return false;
    document.documentElement.setAttribute("data-ltt-theme", name);
    return true;
  }

  var glossaryState = { defs: {}, first: {} };

  function setGlossary(defs, first) {
    glossaryState.defs = defs || {};
    glossaryState.first = first || {};
  }

  // Replaces {{term}} marks in text nodes under `scope` with hover/tap definitions.
  function linkTerms(scope, sceneIndex) {
    if (!scope || typeof document === "undefined") return;
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null), hits = [], n;
    while ((n = walker.nextNode())) if (n.nodeValue.indexOf("{{") >= 0) hits.push(n);
    hits.forEach(function (node) {
      var frag = document.createDocumentFragment(), text = node.nodeValue, last = 0, m;
      TERM.lastIndex = 0;
      while ((m = TERM.exec(text))) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var key = (m[2] || m[1]).trim(), span = document.createElement("span");
        span.className = "ltt-term" + (glossaryState.first[key] === sceneIndex ? " first" : "");
        span.tabIndex = 0;
        span.dataset.term = key;
        span.textContent = m[1];
        frag.appendChild(span);
        last = TERM.lastIndex;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function initPopover() {
    var pop = document.createElement("div");
    pop.id = "ltt-pop";
    pop.setAttribute("role", "tooltip");
    document.body.appendChild(pop);
    var pinned = null;
    function show(t) {
      var key = t.dataset.term, def = glossaryState.defs[key];
      pop.innerHTML = "<b></b><span></span>";
      pop.firstChild.textContent = key;
      pop.lastChild.innerHTML = def || "(풀이 없음)";
      var r = t.getBoundingClientRect();
      pop.style.left = "0px"; pop.style.top = "0px";
      pop.classList.add("on");
      var w = pop.offsetWidth, hgt = pop.offsetHeight;
      var x = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
      var y = r.bottom + 8 + hgt > innerHeight - 8 ? r.top - hgt - 8 : r.bottom + 8;
      pop.style.left = x + "px"; pop.style.top = y + "px";
    }
    function hide() { pop.classList.remove("on"); pinned = null; }
    document.addEventListener("mouseover", function (e) { var t = e.target.closest && e.target.closest(".ltt-term"); if (t) show(t); });
    document.addEventListener("mouseout", function (e) { var t = e.target.closest && e.target.closest(".ltt-term"); if (t && !pinned) pop.classList.remove("on"); });
    document.addEventListener("focusin", function (e) { if (e.target.classList && e.target.classList.contains("ltt-term")) show(e.target); });
    document.addEventListener("focusout", function (e) { if (e.target.classList && e.target.classList.contains("ltt-term") && !pinned) pop.classList.remove("on"); });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".ltt-term");
      if (t) { pinned = t; show(t); LTT.record("term", { term: t.dataset.term }); } else if (pinned) hide();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  }

  if (typeof document !== "undefined") {
    var style = document.createElement("style");
    style.id = "ltt-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
    if (document.body) initPopover(); else document.addEventListener("DOMContentLoaded", initPopover);
  }

  var LTT = root.LTT = {
    lessonId: lessonId, compare: compare, record: record, expect: expect, warn: warn,
    icon: icon, icons: Object.keys(ICONS), theme: theme, themeTokens: themeTokens, palette: palette, contrast: contrast, mark: mark, marks: Object.keys(MARKS),
    themes: Object.keys(THEMES).map(function (k) { return { name: k, label: THEMES[k].label, medium: THEMES[k].medium }; }),
    termsIn: termsIn, sceneText: sceneText, summaryCards: summaryCards, termIndex: termIndex, lintDeck: lintDeck, auditScene: auditScene,
    stepValues: stepValues, goalReach: goalReach,
    setGlossary: setGlossary, linkTerms: linkTerms
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
