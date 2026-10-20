/* learn-to-tell kit v2 — one file, no dependencies. API: kit/API.md */
(function (root) {
  "use strict";

  var DOC = typeof document !== "undefined";
  // Vendor and font URLs follow wherever ltt.js was loaded from, so one file works under the local server (/kit/) and from a CDN.
  var KIT = (function () {
    var src = DOC && document.currentScript && document.currentScript.src;
    return src ? src.replace(/[^/]*$/, "") : "/kit/";
  })();
  var TERM = /\{\{([^{}|]+?)(?:\|([^{}]+?))?\}\}/g;
  var QS = DOC && root.location ? new URLSearchParams(root.location.search) : new URLSearchParams("");
  var CHECK = QS.has("check");
  var REDUCED = DOC && root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  // Desktop scenes are laid out once on this fixed canvas and scaled to the window, so a check at 1280×800 holds for every desktop size.
  var CANVAS = { w: 1280, h: 800 };
  var MOBILE_MAX = 700;

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
  // `shape` holds non-colour tokens shared by both schemes.
  var THEMES = {
    studio: { label: "Studio", medium: "제품 화면·디자인 툴", light: "", dark: "", shape: "" },
    paper: {
      label: "Paper", medium: "논문 figure·교과서",
      light: "--ltt-bg:#f4efe4;--ltt-card:#fbf8f1;--ltt-card-2:#f1ebdf;--ltt-line:#e0d6c3;--ltt-line-2:#cdbfa6;--ltt-ink:#1f1b16;--ltt-ink-2:#433c33;" +
        "--ltt-muted:#71685b;--ltt-accent:#23508e;--ltt-accent-soft:#e0e7f1;--ltt-good:#3b7449;--ltt-good-soft:#e3eddc;--ltt-bad:#b1322a;--ltt-bad-soft:#f5dfda;" +
        "--ltt-warn:#925b0c;--ltt-warn-soft:#f4e7cf;--ltt-dark:#2b2620;--ltt-on-dark:#f4efe4;--ltt-accent-on-dark:#a9c2ee;--ltt-shadow:none;",
      dark: "--ltt-bg:#1a1814;--ltt-card:#221f1a;--ltt-card-2:#2a2620;--ltt-line:#38322a;--ltt-line-2:#4a4237;--ltt-ink:#ece4d4;--ltt-ink-2:#d2c8b6;" +
        "--ltt-muted:#a0968a;--ltt-accent:#8fb0e6;--ltt-accent-soft:#1f2a3c;--ltt-good:#8cc49a;--ltt-good-soft:#21301f;--ltt-bad:#f08a7e;--ltt-bad-soft:#3b2220;" +
        "--ltt-warn:#e5b45e;--ltt-warn-soft:#382c17;--ltt-dark:#0e0d0b;--ltt-on-dark:#ece4d4;--ltt-on-accent:#1a1814;--ltt-accent-on-dark:#a9c2ee;--ltt-shadow:none;",
      shape: "--ltt-radius:4px;--ltt-r-lg:4px;--ltt-r-md:4px;--ltt-font-display:" + SERIF + ";--ltt-display-weight:700;--ltt-display-track:-.015em;"
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
      shape: "--ltt-radius:3px;--ltt-r-lg:3px;--ltt-r-md:3px;--ltt-r-sm:2px;--ltt-display-weight:750;--ltt-display-track:-.025em;--ltt-border-w:1.5px;"
    },
    terminal: {
      label: "Terminal", medium: "터미널·로그·대시보드",
      light: "--ltt-bg:#f3f3ee;--ltt-card:#fbfbf8;--ltt-card-2:#ecece5;--ltt-line:#dcdcd2;--ltt-line-2:#c4c4b8;--ltt-ink:#121512;--ltt-ink-2:#30352f;" +
        "--ltt-muted:#656b62;--ltt-accent:#07793b;--ltt-accent-soft:#dcf1e3;--ltt-good:#07793b;--ltt-good-soft:#dcf1e3;--ltt-bad:#bd2d29;--ltt-bad-soft:#f8dedd;" +
        "--ltt-warn:#925c00;--ltt-warn-soft:#f5e8cc;--ltt-dark:#0d0f0e;--ltt-on-dark:#d6e5dc;--ltt-accent-on-dark:#3ddc84;--ltt-shadow:none;",
      dark: "--ltt-bg:#0c0e0d;--ltt-card:#121614;--ltt-card-2:#18201c;--ltt-line:#222c27;--ltt-line-2:#304038;--ltt-ink:#d6e5dc;--ltt-ink-2:#b2c4b9;" +
        "--ltt-muted:#7d9086;--ltt-accent:#3ddc84;--ltt-accent-soft:#143223;--ltt-good:#3ddc84;--ltt-good-soft:#143223;--ltt-bad:#ff6b6b;--ltt-bad-soft:#3a1c1c;" +
        "--ltt-warn:#ffb000;--ltt-warn-soft:#382b10;--ltt-dark:#050605;--ltt-on-dark:#d6e5dc;--ltt-on-accent:#06120b;--ltt-accent-on-dark:#3ddc84;--ltt-shadow:none;",
      shape: "--ltt-radius:6px;--ltt-r-lg:6px;--ltt-r-md:5px;--ltt-r-sm:4px;--ltt-display-weight:750;--ltt-display-track:-.03em;"
    },
    ledger: {
      label: "Ledger", medium: "경제 신문 차트",
      light: "--ltt-bg:#fff1e5;--ltt-card:#fff8f2;--ltt-card-2:#f8e6d6;--ltt-line:#ead5c2;--ltt-line-2:#d9bca3;--ltt-ink:#33302e;--ltt-ink-2:#4d4845;" +
        "--ltt-muted:#6f665f;--ltt-accent:#0c727c;--ltt-accent-soft:#d9ecea;--ltt-good:#09753f;--ltt-good-soft:#dcefdf;--ltt-bad:#cc0000;--ltt-bad-soft:#f9dcd6;" +
        "--ltt-warn:#9c5300;--ltt-warn-soft:#f8e3c8;--ltt-dark:#262a33;--ltt-on-dark:#fff1e5;--ltt-accent-on-dark:#7fd0d6;--ltt-shadow:none;",
      dark: "--ltt-bg:#1d1a18;--ltt-card:#262220;--ltt-card-2:#2e2926;--ltt-line:#3b3431;--ltt-line-2:#4d4440;--ltt-ink:#f2e6db;--ltt-ink-2:#d6cac0;" +
        "--ltt-muted:#a3968c;--ltt-accent:#4fb5bd;--ltt-accent-soft:#1c3536;--ltt-good:#56c08a;--ltt-good-soft:#1c3226;--ltt-bad:#ff6a5c;--ltt-bad-soft:#3d201d;" +
        "--ltt-warn:#f0a447;--ltt-warn-soft:#3a2b1a;--ltt-dark:#0f0d0c;--ltt-on-dark:#f2e6db;--ltt-on-accent:#0f1d1e;--ltt-accent-on-dark:#7fd0d6;--ltt-shadow:none;",
      shape: "--ltt-radius:0px;--ltt-r-lg:0px;--ltt-r-md:0px;--ltt-r-sm:0px;--ltt-font-display:" + SERIF + ";--ltt-display-weight:700;--ltt-display-track:-.02em;"
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
      shape: "--ltt-radius:10px;--ltt-r-lg:10px;--ltt-r-md:8px;--ltt-display-weight:800;--ltt-display-track:-.035em;"
    },
    sketch: {
      label: "Sketch", medium: "화이트보드·손그림 설명",
      light: "--ltt-bg:#fbfaf6;--ltt-card:#fff;--ltt-card-2:#f4f2ec;--ltt-line:#e4e0d6;--ltt-line-2:#b9b3a6;--ltt-ink:#1e1d1b;--ltt-ink-2:#3a3833;" +
        "--ltt-muted:#716d65;--ltt-accent:#1f5fc4;--ltt-accent-soft:#e4ecfa;--ltt-good:#1a7942;--ltt-good-soft:#e0f1e6;--ltt-bad:#bf322a;--ltt-bad-soft:#fbe2df;" +
        "--ltt-warn:#9e5b00;--ltt-warn-soft:#fbedd6;--ltt-dark:#22211f;--ltt-on-dark:#f6f4ee;--ltt-accent-on-dark:#9dbbf2;--ltt-shadow:none;",
      dark: "--ltt-bg:#1f2a24;--ltt-card:#24312a;--ltt-card-2:#2a3830;--ltt-line:#35463c;--ltt-line-2:#5a7062;--ltt-ink:#eef2ea;--ltt-ink-2:#d2dacd;" +
        "--ltt-muted:#a3b1a3;--ltt-accent:#8fc0ff;--ltt-accent-soft:#24384a;--ltt-good:#8ee3a8;--ltt-good-soft:#213d2c;--ltt-bad:#ff8d84;--ltt-bad-soft:#45282a;" +
        "--ltt-warn:#ffd06a;--ltt-warn-soft:#433a22;--ltt-dark:#121a16;--ltt-on-dark:#eef2ea;--ltt-on-accent:#102030;--ltt-accent-on-dark:#8fc0ff;--ltt-shadow:none;",
      shape: "--ltt-radius:12px;--ltt-r-lg:14px;--ltt-r-md:10px;--ltt-display-weight:800;--ltt-display-track:-.03em;--ltt-border-w:2px;"
    }
  };
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


  var THEME_CSS = {
    paper: ".ltt-no{font-family:var(--ltt-font-display);font-style:italic;font-weight:400}.ltt-kicker{background:none;padding-left:0;letter-spacing:.06em;text-transform:uppercase}.ltt-head{border-bottom:1.5px solid var(--ltt-ink);padding-bottom:12px}",
    blueprint: ".ltt-no,.ltt-kicker,.ltt-count,.ltt-chip{font-family:var(--ltt-mono);letter-spacing:0}.ltt-kicker{text-transform:uppercase;letter-spacing:.08em}.ltt-node{border-width:1.5px}",
    terminal: ".ltt-no,.ltt-kicker,.ltt-count,.ltt-chip{font-family:var(--ltt-mono);letter-spacing:0}.ltt-no::before{content:'#';opacity:.45}.ltt-node .l,.ltt-elab{font-family:var(--ltt-mono)}",
    ledger: ".ltt-head{border-bottom:3px solid var(--ltt-ink);padding-bottom:12px}.ltt-kicker{background:none;padding-left:0;letter-spacing:.08em;text-transform:uppercase}.ltt-no{font-family:var(--ltt-font-display);font-weight:400;color:var(--ltt-ink-2)}",
    lab: ".ltt-no{font-family:var(--ltt-mono);font-weight:500;letter-spacing:-.04em}.ltt-kicker{font-family:var(--ltt-mono)}",
    sketch: ".ltt-node,.ltt-card,.ltt-cell{border-width:2px;border-color:var(--ltt-line-2)}.ltt-kicker{background:none;padding-left:0;border-bottom:2.5px solid var(--ltt-accent);border-radius:0}.ltt-fig .e{stroke-width:2.4}"
  };

  function themeCss() {
    return Object.keys(THEMES).filter(function (k) { return k !== "studio"; }).map(function (k) {
      var t = THEMES[k], sel = ":root[data-ltt-theme=" + k + "]";
      var extra = (THEME_CSS[k] || "").replace(/(^|\})([^{}]+)\{/g, function (m, b, sels) {
        return b + sels.split(",").map(function (s) { return sel + " " + s.trim(); }).join(",") + "{";
      });
      return sel + "{" + t.shape + t.light + "}" +
        "@media (prefers-color-scheme:dark){" + sel + ":not([data-theme=light]){" + t.dark + "}}" +
        sel + "[data-theme=dark]{" + t.dark + "}" + extra;
    }).join("");
  }

  var CSS = `
@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;src:url('${KIT}vendor/pretendard/PretendardVariable.woff2') format('woff2-variations')}
@font-face{font-family:'LTT Serif';font-weight:200 900;font-style:normal;font-display:swap;src:url('${KIT}vendor/noto-serif-kr/NotoSerifKR-ksx.woff2') format('woff2-variations')}
@font-face{font-family:'LTT Mono';font-weight:400;font-style:normal;font-display:swap;src:url('${KIT}vendor/d2coding/D2Coding-ksx.woff2') format('woff2')}
@font-face{font-family:'LTT Mono';font-weight:700;font-style:normal;font-display:swap;src:url('${KIT}vendor/d2coding/D2CodingBold-ksx.woff2') format('woff2')}
:root{${TOKENS_LIGHT}--ltt-radius:14px;--ltt-r-lg:18px;--ltt-r-md:12px;--ltt-r-sm:8px;--ltt-border-w:1px;--ltt-pattern:none;
--ltt-display-weight:820;--ltt-display-track:-.035em;--ltt-font-display:var(--ltt-font);
--ltt-font:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',sans-serif;
--ltt-mono:'LTT Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${TOKENS_DARK}color-scheme:dark}}
:root[data-theme=dark]{${TOKENS_DARK}color-scheme:dark}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0}
body{background:var(--ltt-pattern),var(--ltt-bg);background-color:var(--ltt-bg);color:var(--ltt-ink);font:17px/1.6 var(--ltt-font);-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word}
.ltt-ic{width:1.1em;height:1.1em;vertical-align:-.18em;flex:none}
.ltt-mono{font-family:var(--ltt-mono)}

/* deck frame: desktop = one fixed 1280x800 canvas scaled to the window */
body.ltt-deck{height:100vh;overflow:hidden}
.ltt-stage{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden}
.ltt-canvas{position:relative;width:${CANVAS.w}px;height:${CANVAS.h}px;flex:none;transform-origin:center center}
.ltt-top{position:absolute;left:40px;right:40px;top:14px;height:38px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.ltt-chip{display:inline-flex;align-items:center;gap:10px;height:32px;padding:0 16px;border:1px solid var(--ltt-line);border-radius:999px;font-size:14px;font-weight:700;color:var(--ltt-ink-2);background:var(--ltt-card);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:640px}
.ltt-chip::before{content:"";width:8px;height:14px;border-radius:2px;background:var(--ltt-accent);flex:none}
.ltt-progress{display:flex;align-items:center;gap:14px;font:600 14px var(--ltt-mono);color:var(--ltt-muted)}
.ltt-dots{display:flex;gap:6px}.ltt-dots i{width:22px;height:5px;border-radius:3px;background:var(--ltt-line-2);cursor:pointer}.ltt-dots i.on{background:var(--ltt-accent)}.ltt-dots i.seen{background:color-mix(in srgb,var(--ltt-accent) 45%,var(--ltt-line-2))}
.ltt-bottom{position:absolute;left:40px;right:40px;bottom:14px;height:48px;display:flex;align-items:center;justify-content:space-between}
.ltt-nav{height:46px;padding:0 22px;border-radius:999px;border:1px solid var(--ltt-line-2);background:var(--ltt-card);color:var(--ltt-ink);font:700 16px var(--ltt-font);cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.ltt-nav.next{background:var(--ltt-ink);color:var(--ltt-bg);border-color:var(--ltt-ink)}
.ltt-nav:disabled{opacity:.35;cursor:default}
.ltt-hint{font-size:13px;color:var(--ltt-muted)}
.ltt-hint kbd{font:600 11px var(--ltt-mono);border:1px solid var(--ltt-line-2);border-radius:4px;padding:1px 5px;margin:0 2px}

/* scene */
.ltt-scene{position:absolute;left:64px;right:64px;top:66px;bottom:80px;display:none;flex-direction:column;gap:18px;overflow-wrap:anywhere}
.ltt-scene.on{display:flex}
.ltt-head{display:flex;gap:22px;align-items:flex-start;flex:none}
.ltt-no{font:var(--ltt-display-weight) 64px/0.92 var(--ltt-font-display);letter-spacing:var(--ltt-display-track);color:var(--ltt-accent);font-variant-numeric:tabular-nums;flex:none;min-width:96px}
.ltt-htext{min-width:0;flex:1;display:flex;flex-direction:column;gap:6px}
.ltt-kicker{align-self:flex-start;font-size:13px;font-weight:700;color:var(--ltt-accent);background:var(--ltt-accent-soft);padding:3px 10px;border-radius:999px}
.ltt-title{margin:0;font:var(--ltt-display-weight) 34px/1.24 var(--ltt-font-display);letter-spacing:var(--ltt-display-track);max-width:1000px}
.ltt-sub{margin:0;font-size:17px;line-height:1.55;color:var(--ltt-ink-2);max-width:920px}
.ltt-body{flex:1;min-height:0;display:flex;gap:28px}
.ltt-body.l-stack{flex-direction:column}
.ltt-vis{flex:1;min-width:0;min-height:0;position:relative;container-type:size;display:grid;place-items:center}
.ltt-rail{width:340px;flex:none;display:flex;flex-direction:column;gap:14px;justify-content:safe center;min-height:0;overflow:hidden}
.ltt-narr{margin:0;font-size:16.5px;line-height:1.65;color:var(--ltt-ink-2)}
.ltt-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.ltt-points li{display:flex;gap:10px;font-size:15.5px;line-height:1.5;color:var(--ltt-ink-2)}
.ltt-pin{flex:none;width:24px;height:24px;border-radius:50%;background:var(--ltt-ink);color:var(--ltt-bg);font:700 13px/24px var(--ltt-mono);text-align:center}
.ltt-points li.on .ltt-pin{background:var(--ltt-accent)}
.ltt-points li.wait{opacity:.3}
.ltt-foot{flex:none;display:flex;flex-direction:column;gap:8px}
.ltt-take{display:flex;align-items:center;gap:14px;background:var(--ltt-dark);color:var(--ltt-on-dark);border-radius:var(--ltt-r-md);padding:11px 18px;font-size:17px;font-weight:700;line-height:1.45}
.ltt-take b{flex:none;font-size:13px;background:var(--ltt-accent-on-dark);color:var(--ltt-dark);padding:3px 12px;border-radius:999px}
.ltt-basis{margin:0;font-size:13px;color:var(--ltt-muted);line-height:1.5}
.ltt-caption{margin:0;font-size:15.5px;line-height:1.55;color:var(--ltt-ink-2);text-align:center;min-height:1.55em}
.ltt-caption b{color:var(--ltt-accent)}
.ltt-steps{display:flex;gap:8px;justify-content:center}
.ltt-steps button{border:0;background:var(--ltt-line-2);width:28px;height:6px;border-radius:3px;cursor:pointer;padding:0}
.ltt-steps button.on{background:var(--ltt-accent)}
.ltt-error{border:2px dashed var(--ltt-bad);border-radius:var(--ltt-r-md);padding:18px 22px;color:var(--ltt-bad);font:600 15px/1.55 var(--ltt-mono);white-space:pre-wrap;align-self:stretch}

/* hook / statement */
.t-hook .ltt-head{display:none}
.ltt-hook{flex:1;display:flex;gap:48px;align-items:stretch;min-height:0}
.ltt-hook .txt{flex:1.1;display:flex;flex-direction:column;gap:18px;min-width:0;max-height:100%;overflow:hidden;justify-content:safe center}
.ltt-hook .pre{font-size:15px;font-weight:700;color:var(--ltt-accent);letter-spacing:.02em}
.ltt-hook .big{margin:0;font:var(--ltt-display-weight) 52px/1.16 var(--ltt-font-display);letter-spacing:var(--ltt-display-track)}
.ltt-hook .sub{margin:0;font-size:18px;line-height:1.6;color:var(--ltt-ink-2)}
.ltt-hook .ltt-vis{flex:1;align-self:stretch}
.ltt-hook.l-stack,.ltt-hook.l-full{flex-direction:column;gap:20px}
.ltt-hook.l-stack .txt,.ltt-hook.l-full .txt{flex:none;max-height:none}
.ltt-hook.l-stack .big,.ltt-hook.l-full .big{font-size:40px}
.ltt-goal{border-left:3px solid var(--ltt-accent);padding:4px 0 4px 16px;display:flex;flex-direction:column;gap:4px}
.ltt-goal p{margin:0;font-size:13px;font-weight:700;color:var(--ltt-muted)}
.ltt-goal li{font-size:16px;line-height:1.5}
.ltt-goal ul{margin:0;padding-left:18px}
.ltt-statement{flex:1;display:flex;flex-direction:column;justify-content:safe center;gap:16px;max-width:980px}
.ltt-statement .big{margin:0;font:var(--ltt-display-weight) 44px/1.22 var(--ltt-font-display);letter-spacing:var(--ltt-display-track)}

/* terms */
.ltt-terms{width:360px;flex:none;display:flex;flex-direction:column;gap:10px;justify-content:safe center}
.ltt-terms.wide{width:auto;flex:1;display:grid;grid-template-columns:repeat(var(--cols,3),1fr);align-content:safe center}
html[data-ltt-mobile] .ltt-terms.wide{grid-template-columns:1fr}
.ltt-term-card{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-md);padding:12px 16px;background:var(--ltt-card)}
.ltt-term-card.on{border-color:var(--ltt-accent);background:var(--ltt-accent-soft)}
.ltt-term-card b{display:block;font-size:17px}
.ltt-term-card span{font-size:15px;line-height:1.5;color:var(--ltt-ink-2)}

/* predict */
.ltt-ask{display:flex;flex-direction:column;gap:12px}
.t-predict .ltt-rail{width:400px}
.ltt-q{margin:0;font-size:18px;font-weight:700;line-height:1.45}
.ltt-choices{display:flex;flex-direction:column;gap:8px}
.ltt-choice{display:flex;gap:10px;align-items:flex-start;text-align:left;border:1.5px solid var(--ltt-line-2);background:var(--ltt-card);color:var(--ltt-ink);border-radius:var(--ltt-r-md);padding:10px 14px;font:500 15.5px/1.45 var(--ltt-font);cursor:pointer}
.ltt-choice i{font-style:normal;font:700 13px/22px var(--ltt-mono);width:22px;height:22px;border-radius:50%;border:1.5px solid var(--ltt-line-2);text-align:center;flex:none}
.ltt-choice.unsure{border-style:dashed;color:var(--ltt-muted)}
.ltt-choice.picked{border-color:var(--ltt-ink)}
.ltt-choice.right{border-color:var(--ltt-good);background:var(--ltt-good-soft)}
.ltt-choice.wrong.picked{border-color:var(--ltt-bad);background:var(--ltt-bad-soft)}
.ltt-choice:disabled{cursor:default}
.ltt-choice.gone{display:none}
.ltt-why{display:none;font-size:15.5px;line-height:1.6;color:var(--ltt-ink-2);border-left:3px solid var(--ltt-good);padding-left:14px;margin:0}
.ltt-why.on{display:block}

/* play */
.ltt-knobs{display:flex;flex-direction:column;gap:14px}
.ltt-knob{display:flex;flex-direction:column;gap:4px}
.ltt-knob label{display:flex;justify-content:space-between;font-size:14.5px;font-weight:600;color:var(--ltt-ink-2)}
.ltt-knob output{font:700 15px var(--ltt-mono);color:var(--ltt-accent)}
.ltt-knob input[type=range]{width:100%;accent-color:var(--ltt-accent)}
.ltt-knob .rng{display:flex;justify-content:space-between;font:13px var(--ltt-mono);color:var(--ltt-muted)}
.ltt-toggle{display:flex;gap:6px;flex-wrap:wrap}
.ltt-toggle button{border:1.5px solid var(--ltt-line-2);background:var(--ltt-card);color:var(--ltt-ink-2);border-radius:999px;padding:4px 12px;font:600 14px var(--ltt-font);cursor:pointer}
.ltt-toggle button.on{border-color:var(--ltt-accent);color:var(--ltt-accent);background:var(--ltt-accent-soft)}
.ltt-viscol{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:12px}
.ltt-readout{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;flex:none}
html[data-ltt-mobile] .ltt-readout{grid-template-columns:1fr 1fr}
.ltt-stat{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-md);background:var(--ltt-card);padding:10px 14px}
.ltt-stat b{display:block;font:800 26px/1.2 var(--ltt-font);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.ltt-stat b small{font-size:14px;font-weight:600;color:var(--ltt-muted);margin-left:3px}
.ltt-stat span{font-size:13px;color:var(--ltt-muted)}
.ltt-stat.good b{color:var(--ltt-good)}.ltt-stat.bad b{color:var(--ltt-bad)}.ltt-stat.accent b{color:var(--ltt-accent)}
.ltt-goalbox{border:1.5px dashed var(--ltt-line-2);border-radius:var(--ltt-r-md);padding:10px 14px;font-size:15px;line-height:1.5}
.ltt-goalbox.done{border-style:solid;border-color:var(--ltt-good);background:var(--ltt-good-soft)}
.ltt-goalbox b{color:var(--ltt-accent)}.ltt-goalbox.done b{color:var(--ltt-good)}

/* compare */
.ltt-cmp{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:24px;min-height:0}
.ltt-side{display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}
.ltt-side>header{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800}
.ltt-side>header i{font-style:normal;font-size:13px;padding:2px 10px;border-radius:999px;background:var(--ltt-card-2);color:var(--ltt-ink-2)}
.ltt-side.bad>header i{background:var(--ltt-bad-soft);color:var(--ltt-bad)}.ltt-side.good>header i{background:var(--ltt-good-soft);color:var(--ltt-good)}
.ltt-side .ltt-vis{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-md);background:var(--ltt-card);padding:12px}
.ltt-side>p{margin:0;font-size:15.5px;line-height:1.55;color:var(--ltt-ink-2)}

/* summary / keywords */
.ltt-recall{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;flex:1;justify-content:safe center}
.ltt-recall{display:grid!important;grid-template-columns:1fr 1fr;align-content:safe center;max-width:none}
html[data-ltt-mobile] .ltt-recall{grid-template-columns:1fr}
.ltt-recall li{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-md);background:var(--ltt-card);padding:16px 22px;display:flex;flex-direction:column;gap:6px}
.ltt-recall li>b{font-size:20px;line-height:1.45}
.ltt-recall button{align-self:flex-start;border:0;background:none;color:var(--ltt-accent);font:700 14px var(--ltt-font);cursor:pointer;padding:0}
.ltt-recall .ans{display:none;font-size:17px;line-height:1.55;color:var(--ltt-ink-2)}
.ltt-recall li.open .ans{display:block}.ltt-recall li.open button{display:none}
.ltt-kw{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-content:safe center}
.ltt-kw section{border-top:3px solid var(--ltt-ink);padding-top:12px;display:flex;flex-direction:column;gap:8px}
.ltt-kw h3{margin:0;font-size:14px;font-weight:800;color:var(--ltt-muted);letter-spacing:.02em}
.ltt-kw ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.ltt-kw li{font-size:16px;line-height:1.5}
.ltt-kw li code{font:600 14.5px var(--ltt-mono);background:var(--ltt-card-2);border:1px solid var(--ltt-line);border-radius:6px;padding:1px 7px}

/* figure frame shared by every visual part */
.ltt-fig{position:relative;width:min(100cqw,calc(100cqh * var(--ar)));aspect-ratio:var(--ar);container-type:inline-size}
.ltt-fig>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ltt-cam{position:absolute;inset:0;transform-origin:0 0}
.ltt-fig.zoomed{overflow:hidden;border-radius:var(--ltt-r-sm)}
.ltt-lab{position:absolute;inset:0;pointer-events:none}
.ltt-lab>*{position:absolute;pointer-events:auto}
.ltt-label{font-size:clamp(14px,1.55cqw,19px);line-height:1.3;color:var(--ltt-ink-2);white-space:nowrap;transform:translate(-50%,-50%)}
.ltt-label.l{transform:translate(0,-50%)}.ltt-label.r{transform:translate(-100%,-50%)}.ltt-label.t{transform:translate(-50%,0)}.ltt-label.b{transform:translate(-50%,-100%)}
.ltt-label.big{font:800 clamp(24px,3.2cqw,40px)/1.2 var(--ltt-font);color:var(--ltt-ink);font-variant-numeric:tabular-nums}
.ltt-label.strong{font-weight:700;color:var(--ltt-ink)}
.ltt-label.muted{color:var(--ltt-muted);font-size:clamp(13px,1.35cqw,16px)}
.ltt-label.chip{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:6px;padding:1px 8px}
.ltt-label.tone-accent{color:var(--ltt-accent)}.ltt-label.tone-good{color:var(--ltt-good)}.ltt-label.tone-bad{color:var(--ltt-bad)}.ltt-label.tone-warn{color:var(--ltt-warn)}
.ltt-anno.corner{left:auto!important;top:-13px;right:-13px;margin:0}
.ltt-anno{width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:var(--ltt-ink);color:var(--ltt-bg);font:700 13px/24px var(--ltt-mono);text-align:center;box-shadow:0 0 0 3px var(--ltt-bg)}
.ltt-fig .e{fill:none;stroke:var(--ltt-line-2);stroke-width:2.5;vector-effect:non-scaling-stroke}
.ltt-fig .e.dash{stroke-dasharray:6 6}
.ltt-fig .e.hot{stroke:var(--ltt-accent);stroke-width:3}
.ltt-fig .e.bad{stroke:var(--ltt-bad)}.ltt-fig .e.good{stroke:var(--ltt-good)}
.ltt-fig .chev{fill:var(--ltt-line-2)}.ltt-fig .chev.hot{fill:var(--ltt-accent)}
.ltt-fig .dot{fill:var(--ltt-accent)}
.ltt-fig .dot.bad{fill:var(--ltt-bad)}.ltt-fig .dot.good{fill:var(--ltt-good)}.ltt-fig .dot.warn{fill:var(--ltt-warn)}.ltt-fig .dot.ink{fill:var(--ltt-ink)}
.ltt-fig .ring{fill:none;stroke:var(--ltt-accent);stroke-width:2.5}
.ltt-fig .grid{stroke:var(--ltt-line);stroke-width:1;vector-effect:non-scaling-stroke}
.ltt-fig .axis{stroke:var(--ltt-ink-2);stroke-width:1.5;vector-effect:non-scaling-stroke}
.ltt-fig .band{fill:var(--ltt-accent);opacity:.12}
.ltt-fig .ltt-ms{fill:var(--mf,var(--ltt-card));stroke:var(--ms,var(--ltt-line-2));stroke-width:var(--mw,2);stroke-dasharray:var(--md,none);vector-effect:non-scaling-stroke}
.ltt-fig .ltt-ms.open{fill:var(--mf,none);stroke-width:var(--mw,2.5)}
.ltt-fig .ltt-ms.hot{fill:var(--ltt-accent);stroke:var(--ltt-accent)}.ltt-fig .ltt-ms.bad{fill:var(--ltt-bad);stroke:var(--ltt-bad)}.ltt-fig .ltt-ms.good{fill:var(--ltt-good);stroke:var(--ltt-good)}.ltt-fig .ltt-ms.warn{fill:var(--ltt-warn);stroke:var(--ltt-warn)}
.ltt-fig .ltt-ms.open.hot,.ltt-fig .ltt-ms.open.bad,.ltt-fig .ltt-ms.open.good,.ltt-fig .ltt-ms.open.warn{fill:var(--mf,none);stroke-width:calc(var(--mw,2.5) + 1.5px)}
.ltt-fig .e.accent{stroke:var(--ltt-accent)}.ltt-fig .e.warn{stroke:var(--ltt-warn)}.ltt-fig .e.ink{stroke:var(--ltt-ink)}
.ltt-fig .fill-accent{fill:var(--ltt-accent)}.ltt-fig .fill-bad{fill:var(--ltt-bad)}.ltt-fig .fill-good{fill:var(--ltt-good)}.ltt-fig .fill-warn{fill:var(--ltt-warn)}.ltt-fig .fill-soft{fill:var(--ltt-accent-soft)}.ltt-fig .fill-card{fill:var(--ltt-card)}
.ltt-fig .ref{stroke:var(--ltt-ink-2);stroke-width:1.5;stroke-dasharray:5 5;vector-effect:non-scaling-stroke}

/* graph nodes are HTML so labels wrap and are measured */
.ltt-node{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;max-width:clamp(150px,22cqw,240px);min-width:86px;padding:clamp(9px,1.2cqw,15px) clamp(12px,1.8cqw,22px);border:var(--ltt-border-w) solid var(--ltt-line-2);border-radius:var(--ltt-r-sm);background:var(--ltt-card);text-align:center;transition:none}
.ltt-node{overflow-wrap:break-word;width:max-content}
.ltt-node .l{font-size:clamp(15px,2cqw,22px);font-weight:700;line-height:1.3;color:var(--ltt-ink)}
.ltt-node .s{font-size:clamp(13px,1.45cqw,16px);line-height:1.3;color:var(--ltt-muted);font-variant-numeric:tabular-nums}
.ltt-node .ltt-ic{width:clamp(24px,3cqw,36px);height:clamp(24px,3cqw,36px);color:var(--ltt-ink-2)}
.ltt-node.round{border-radius:999px}
.ltt-node.hot{border-color:var(--ltt-accent);box-shadow:0 0 0 3px var(--ltt-accent-soft)}
.ltt-node.bad{border-color:var(--ltt-bad);background:var(--ltt-bad-soft)}.ltt-node.good{border-color:var(--ltt-good);background:var(--ltt-good-soft)}.ltt-node.warn{border-color:var(--ltt-warn);background:var(--ltt-warn-soft)}
.ltt-node.ghost{border-style:dashed;background:transparent}
.ltt-elab{font-size:clamp(13px,1.4cqw,16px);line-height:1.25;color:var(--ltt-ink-2);background:var(--ltt-bg);padding:1px 6px;border-radius:4px;transform:translate(-50%,-50%);white-space:nowrap}

/* S parts */
.ltt-facts{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:18px;width:100%;align-self:center}
.ltt-fact{border-top:3px solid var(--ltt-ink);padding-top:12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.ltt-fact b{font:800 clamp(30px,min(calc((100cqw / var(--n) - 24px) / (var(--len) * 0.62)),22cqh),112px)/1.2 var(--ltt-font);white-space:nowrap;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ltt-fact b small{font-size:max(.38em,14px);font-weight:700;color:var(--ltt-muted);margin-left:4px;letter-spacing:0}
.ltt-fact span{font-size:clamp(15.5px,1.7cqw,19px);line-height:1.45;color:var(--ltt-ink-2)}
.ltt-fact.accent{border-color:var(--ltt-accent)}.ltt-fact.accent b{color:var(--ltt-accent)}
.ltt-fact.bad{border-color:var(--ltt-bad)}.ltt-fact.bad b{color:var(--ltt-bad)}.ltt-fact.good{border-color:var(--ltt-good)}.ltt-fact.good b{color:var(--ltt-good)}
.ltt-callout{border-radius:var(--ltt-r-md);padding:14px 18px;background:var(--ltt-card);border:1px solid var(--ltt-line);display:flex;gap:12px;align-self:center;width:100%}
.ltt-callout .ltt-ic{width:22px;height:22px;color:var(--ltt-accent)}
.ltt-callout b{display:block;font-size:16.5px;margin-bottom:2px}.ltt-callout p{margin:0;font-size:15.5px;line-height:1.55;color:var(--ltt-ink-2)}
.ltt-callout.bad{border-color:var(--ltt-bad);background:var(--ltt-bad-soft)}.ltt-callout.bad .ltt-ic{color:var(--ltt-bad)}
.ltt-callout.good{border-color:var(--ltt-good);background:var(--ltt-good-soft)}.ltt-callout.good .ltt-ic{color:var(--ltt-good)}
.ltt-callout.warn{border-color:var(--ltt-warn);background:var(--ltt-warn-soft)}.ltt-callout.warn .ltt-ic{color:var(--ltt-warn)}
.ltt-table{width:100%;border-collapse:separate;border-spacing:0;font-size:15.5px;align-self:center}
.ltt-table th{font-size:14px;font-weight:800;color:var(--ltt-muted);text-align:left;padding:8px 14px;border-bottom:2px solid var(--ltt-ink)}
.ltt-table td{padding:10px 14px;border-bottom:1px solid var(--ltt-line);line-height:1.4;position:relative}
.ltt-table td.num,.ltt-table th.num{text-align:right;font-variant-numeric:tabular-nums}
.ltt-table tr.hl td{background:var(--ltt-accent-soft)}
.ltt-table td.hl{background:var(--ltt-accent-soft);font-weight:700}
.ltt-table td.good{color:var(--ltt-good);font-weight:700}.ltt-table td.bad{color:var(--ltt-bad);font-weight:700}
.ltt-table tr.scan td{background:color-mix(in srgb,var(--ltt-accent) 16%,transparent)}
.ltt-cards{display:none}
.ltt-units{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:var(--gap);width:100%;height:100%}
.ltt-cell{border-radius:3px;background:var(--ltt-card-2);border:1px solid var(--ltt-line)}
.ltt-cell.k0{background:var(--ltt-accent);border-color:var(--ltt-accent)}.ltt-cell.k1{background:var(--ltt-bad);border-color:var(--ltt-bad)}.ltt-cell.k2{background:var(--ltt-good);border-color:var(--ltt-good)}.ltt-cell.k3{background:var(--ltt-warn);border-color:var(--ltt-warn)}.ltt-cell.k4{background:var(--ltt-ink-2);border-color:var(--ltt-ink-2)}
.ltt-cell.t-accent{background:var(--ltt-accent);border-color:var(--ltt-accent)}.ltt-cell.t-bad{background:var(--ltt-bad);border-color:var(--ltt-bad)}.ltt-cell.t-good{background:var(--ltt-good);border-color:var(--ltt-good)}.ltt-cell.t-warn{background:var(--ltt-warn);border-color:var(--ltt-warn)}.ltt-cell.t-ink{background:var(--ltt-ink);border-color:var(--ltt-ink)}.ltt-cell.t-muted{background:var(--ltt-line-2);border-color:var(--ltt-line-2)}
.ltt-cell.scan{outline:2px solid var(--ltt-ink);outline-offset:1px}
.ltt-wk{display:flex;flex-direction:column;gap:12px;width:100%;height:100%;align-items:center;min-height:0}
.ltt-wk>.ltt-vis{flex:1;width:100%;min-height:0}
.ltt-key{display:flex;gap:16px;flex-wrap:wrap;font-size:14px;color:var(--ltt-ink-2)}
.ltt-key span{display:inline-flex;align-items:center;gap:6px}.ltt-key i{width:12px;height:12px;border-radius:3px;display:inline-block}
.ltt-flowrow{display:flex;align-items:stretch;gap:0;width:100%;align-self:center}
.ltt-stagebox{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:16px 18px;border:var(--ltt-border-w) solid var(--ltt-line-2);border-radius:var(--ltt-r-md);background:var(--ltt-card)}
.ltt-stagebox .no{font:700 13px var(--ltt-mono);color:var(--ltt-muted)}
.ltt-stagebox b{font-size:17px;line-height:1.35}
.ltt-stagebox span{font-size:14.5px;line-height:1.5;color:var(--ltt-ink-2)}
.ltt-stagebox .ltt-ic{width:24px;height:24px;color:var(--ltt-ink-2)}
.ltt-stagebox.on{border-color:var(--ltt-accent);background:var(--ltt-accent-soft)}
.ltt-stagebox.off{opacity:.28}
.ltt-arrow{flex:none;width:34px;display:grid;place-items:center;color:var(--ltt-line-2)}
.ltt-arrow svg{width:22px;height:22px}
.ltt-tl{position:relative;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:12px;width:100%;align-self:center;padding-top:30px}
.ltt-tl::before{content:"";position:absolute;left:0;right:0;top:9px;height:2px;background:var(--ltt-line-2)}
.ltt-ev{position:relative;display:flex;flex-direction:column;gap:4px}
.ltt-ev::before{content:"";position:absolute;top:-27px;left:0;width:14px;height:14px;border-radius:50%;background:var(--ltt-bg);border:3px solid var(--ltt-accent)}
.ltt-ev .t{font:700 14px var(--ltt-mono);color:var(--ltt-accent)}
.ltt-ev b{font-size:16px;line-height:1.35}.ltt-ev span{font-size:14px;line-height:1.5;color:var(--ltt-ink-2)}
.ltt-ev.off{opacity:.2}
.ltt-term-win{width:100%;max-width:880px;align-self:center;border-radius:var(--ltt-r-md);background:#15171a;color:#d7dbd8;font:14.5px/1.65 var(--ltt-mono);overflow:hidden;box-shadow:var(--ltt-shadow)}
.ltt-term-win header{display:flex;gap:7px;align-items:center;padding:10px 14px;background:#202326;font-size:12.5px;color:#8b918d}
.ltt-term-win header i{width:11px;height:11px;border-radius:50%;background:#3a3e42}
.ltt-term-win header span{margin-left:8px}
.ltt-term-win pre{margin:0;padding:14px 18px;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;min-height:2em}
.ltt-term-win .ln{display:block}.ltt-term-win .ln.off{opacity:0}
.ltt-term-win .ok{color:#7fd99a}.ltt-term-win .warn{color:#f0c062}.ltt-term-win .err{color:#ff7b74}.ltt-term-win .dim{color:#7b817d}.ltt-term-win .hl{background:rgba(255,255,255,.09)}
.ltt-code .ln{display:grid;grid-template-columns:2.4em 1fr}
.ltt-code .ln::before{content:attr(data-n);color:#5d635f;text-align:right;padding-right:1em}
.ltt-code .ln.add{background:rgba(127,217,154,.12)}.ltt-code .ln.del{background:rgba(255,123,116,.12)}.ltt-code .ln.hl,.ltt-code .ln.scan{background:rgba(126,152,255,.18)}
.ltt-code .k{color:#c792ea}.ltt-code .s{color:#c3e88d}.ltt-code .c{color:#6e7670;font-style:italic}.ltt-code .n{color:#f78c6c}
.ltt-frame{width:100%;height:100%;border:1px solid var(--ltt-line-2);border-radius:var(--ltt-r-md);background:var(--ltt-card);overflow:hidden;display:flex;flex-direction:column}
.ltt-frame>header{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--ltt-line);font:13px var(--ltt-mono);color:var(--ltt-muted)}
.ltt-frame>header i{width:10px;height:10px;border-radius:50%;background:var(--ltt-line-2)}
.ltt-frame>header span{flex:1;margin-left:6px;background:var(--ltt-card-2);border-radius:999px;padding:2px 12px}
.ltt-frame>div{flex:1;min-height:0;padding:16px}
.ltt-math{font-size:26px;align-self:center;text-align:center}
.ltt-math .step.off{opacity:.12}
.ltt-multi{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:16px;width:100%;height:100%}
.ltt-panel{display:flex;flex-direction:column;gap:6px;min-width:0;min-height:0}
.ltt-panel>b{font-size:14.5px;font-weight:700;color:var(--ltt-ink-2)}
.ltt-panel>.ltt-vis{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-sm);background:var(--ltt-card)}
.ltt-ledger{display:flex;flex-direction:column;gap:2px;border-top:2px solid var(--ltt-ink)}
.ltt-ledger div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:7px 2px;border-bottom:1px solid var(--ltt-line);font-size:15px}
.ltt-ledger b{font:800 21px var(--ltt-font);font-variant-numeric:tabular-nums}
.ltt-ledger .bad b{color:var(--ltt-bad)}.ltt-ledger .good b{color:var(--ltt-good)}.ltt-ledger .accent b{color:var(--ltt-accent)}
.ltt-ledger div.total{border-bottom:0;border-top:2px solid var(--ltt-ink)}

/* glossary */
.ltt-term{border-bottom:1.5px dotted var(--ltt-accent);cursor:help}
.ltt-term.first{font-weight:700;color:var(--ltt-ink)}
#ltt-pop{position:fixed;z-index:50;max-width:340px;background:var(--ltt-dark);color:var(--ltt-on-dark);border-radius:10px;padding:10px 14px;font-size:14.5px;line-height:1.5;opacity:0;pointer-events:none;transition:opacity .15s}
#ltt-pop.on{opacity:1}#ltt-pop b{display:block;color:var(--ltt-accent-on-dark);margin-bottom:2px}
#ltt-expect{position:fixed;right:12px;bottom:70px;z-index:60;max-width:440px;background:var(--ltt-card);border:1px solid var(--ltt-line-2);border-radius:10px;padding:8px 12px;font:13px/1.5 var(--ltt-mono)}
#ltt-expect summary{cursor:pointer;font-weight:700}#ltt-expect .fail{color:var(--ltt-bad)}#ltt-expect .ok{color:var(--ltt-good)}#ltt-expect .warn{color:var(--ltt-warn)}
#ltt-expect:not([data-fails]):not([data-warns]){opacity:.6}

/* phone: same scenes stacked and scrolled */
html[data-ltt-mobile] body.ltt-deck{height:auto;overflow:auto}
html[data-ltt-mobile] .ltt-scene *{overflow-wrap:anywhere;min-width:0}
html[data-ltt-mobile] .ltt-rail,html[data-ltt-mobile] .ltt-hook .txt{overflow:visible;max-height:none}
html[data-ltt-mobile] .ltt-stage{position:static;display:block}
html[data-ltt-mobile] .ltt-canvas{width:auto;height:auto;transform:none!important}
html[data-ltt-mobile] .ltt-top{position:sticky;top:0;z-index:20;left:auto;right:auto;height:48px;padding:0 16px;background:var(--ltt-bg);border-bottom:1px solid var(--ltt-line)}
html[data-ltt-mobile] .ltt-chip{max-width:62vw;font-size:13px;height:30px}
html[data-ltt-mobile] .ltt-dots{display:none}
html[data-ltt-mobile] .ltt-bottom{display:none}
html[data-ltt-mobile] .ltt-scene{position:relative;inset:auto;display:flex;padding:30px 18px 34px;gap:16px;border-bottom:1px solid var(--ltt-line)}
html[data-ltt-mobile] .ltt-head{gap:12px}
html[data-ltt-mobile] .ltt-no{font-size:34px;min-width:0}
html[data-ltt-mobile] .ltt-title{font-size:24px}
html[data-ltt-mobile] .ltt-sub{font-size:15.5px}
html[data-ltt-mobile] .ltt-body{flex-direction:column;gap:16px}
html[data-ltt-mobile] .ltt-vis{container-type:inline-size;flex:none;width:100%}
html[data-ltt-mobile] .ltt-fig{width:100%}
html[data-ltt-mobile] .ltt-rail,html[data-ltt-mobile] .ltt-terms{width:auto}
html[data-ltt-mobile] .ltt-hook{flex-direction:column;gap:24px}
html[data-ltt-mobile] .ltt-hook .big{font-size:32px}
html[data-ltt-mobile] .ltt-statement .big{font-size:28px}
html[data-ltt-mobile] .ltt-cmp{grid-template-columns:1fr}
html[data-ltt-mobile] .ltt-kw{grid-template-columns:1fr}
html[data-ltt-mobile] .ltt-facts{grid-template-columns:repeat(2,1fr)}
html[data-ltt-mobile] .ltt-fact b{font-size:clamp(26px,calc((50cqw - 24px) / (var(--len) * 0.62)),56px)}
html[data-ltt-mobile] .ltt-flowrow{flex-direction:column}
html[data-ltt-mobile] .ltt-arrow{width:auto;height:26px;transform:rotate(90deg)}
html[data-ltt-mobile] .ltt-tl{grid-template-columns:1fr;padding:0 0 0 30px;gap:16px}
html[data-ltt-mobile] .ltt-tl::before{left:9px;right:auto;top:0;bottom:0;width:2px;height:auto}
html[data-ltt-mobile] .ltt-ev::before{top:2px;left:-28px}
html[data-ltt-mobile] .ltt-table.wide{display:none}
html[data-ltt-mobile] .ltt-table.wide+.ltt-cards{display:flex;flex-direction:column;gap:10px;width:100%}
html[data-ltt-mobile] .ltt-multi{grid-template-columns:1fr}
html[data-ltt-mobile] .ltt-take{font-size:15.5px}
.ltt-cards article{border:1px solid var(--ltt-line);border-radius:var(--ltt-r-md);background:var(--ltt-card);padding:10px 14px;display:flex;flex-direction:column;gap:4px}
.ltt-cards article.hl{border-color:var(--ltt-accent)}
.ltt-cards article b{font-size:16px}.ltt-cards article div{display:flex;justify-content:space-between;gap:12px;font-size:14.5px;color:var(--ltt-ink-2)}
.ltt-cards article div span:first-child{color:var(--ltt-muted)}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

  /* ---------- small helpers ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function clamp(x, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, x)); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  var ease = {
    linear: function (u) { return u; },
    inOut: function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
    out: function (u) { return 1 - Math.pow(1 - u, 3); },
    in: function (u) { return u * u * u; }
  };
  // Seeded so a frame at time t is identical on every load (capture and checks compare frames).
  function rng(seed) {
    var a = (seed == null ? 7 : seed) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function scale(d0, d1, r0, r1) {
    var f = function (v) { return d1 === d0 ? r0 : r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
    f.invert = function (p) { return d0 + (p - r0) / (r1 - r0) * (d1 - d0); };
    return f;
  }
  function niceTicks(a, b, n) {
    var span = Math.abs(b - a) || 1, step = Math.pow(10, Math.floor(Math.log10(span / (n || 5)))), err = span / (n || 5) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.ceil(Math.min(a, b) / step - 1e-9) * step, out = [];
    for (var v = lo; v <= Math.max(a, b) + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function fmt(v, digits) {
    if (typeof v !== "number") return String(v);
    var d = digits == null ? (Math.abs(v) >= 100 || Number.isInteger(v) ? 0 : Math.abs(v) >= 10 ? 1 : 2) : digits;
    return v.toLocaleString("ko-KR", { maximumFractionDigits: d, minimumFractionDigits: digits == null ? 0 : d });
  }
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "style" && typeof v === "object") for (var s in v) n.style.setProperty(s, v[s]);
      else if (k.slice(0, 2) === "on" && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k === "cls" ? "class" : k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k === "cls" ? "class" : k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* ---------- schema: limits fail loudly before anything is drawn ---------- */
  function SchemaError(msg) { this.name = "SchemaError"; this.message = msg; this.stack = "SchemaError: " + msg; }
  SchemaError.prototype = Object.create(Error.prototype);
  function need(cond, msg) { if (!cond) throw new SchemaError(msg); }
  function textLen(s) { return String(s == null ? "" : s).replace(TERM, function (m, a) { return a; }).length; }
  function cap(path, s, max) {
    if (s == null) return;
    need(typeof s === "string" || typeof s === "number", path + "는 문자열이어야 한다(받은 값: " + typeof s + ")");
    var n = textLen(s);
    need(n <= max, path + " ≤ " + max + "자, 지금 " + n + "자: 문장을 줄이거나 장면을 나눈다");
  }
  function capList(path, list, max, min) {
    need(Array.isArray(list), path + "는 배열이어야 한다");
    need(list.length <= max, path + " ≤ " + max + "개, 지금 " + list.length + "개");
    need(list.length >= (min || 0), path + " ≥ " + (min || 0) + "개, 지금 " + list.length + "개");
  }
  var TONES = { accent: 1, good: 1, bad: 1, warn: 1, muted: 1, ink: 1 };
  function tone(path, t) { need(t == null || TONES[t], path + ": tone은 " + Object.keys(TONES).join("·") + " 중 하나"); return t || ""; }

  function icon(name, opts) {
    var o = opts || {};
    need(ICONS[name], "아이콘 '" + name + "'은 없다. 쓸 수 있는 이름: " + Object.keys(ICONS).join(" "));
    return "<svg class='ltt-ic" + (o.cls ? " " + o.cls : "") + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='" +
      (o.weight || 1.8) + "' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + ICONS[name] + "</svg>";
  }

  /* ---------- glossary ---------- */
  var gloss = { defs: {}, first: {} };
  function termHtml(text, sceneIndex) {
    return esc(text).replace(TERM, function (m, shown, key) {
      var k = (key || shown).trim();
      return "<span class='ltt-term" + (gloss.first[k] === sceneIndex ? " first" : "") + "' tabindex='0' data-term='" + esc(k) + "'>" + shown + "</span>";
    });
  }
  function initPopover() {
    var pop = h("div", { id: "ltt-pop", role: "tooltip" });
    document.body.appendChild(pop);
    var pinned = null;
    function show(t) {
      var key = t.dataset.term;
      pop.innerHTML = "<b>" + esc(key) + "</b><span>" + esc(gloss.defs[key] || "(풀이 없음)") + "</span>";
      var r = t.getBoundingClientRect();
      pop.classList.add("on");
      var w = pop.offsetWidth, ht = pop.offsetHeight;
      pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + "px";
      pop.style.top = (r.bottom + 8 + ht > innerHeight - 8 ? r.top - ht - 8 : r.bottom + 8) + "px";
    }
    function hide() { pop.classList.remove("on"); pinned = null; }
    document.addEventListener("mouseover", function (e) { var t = e.target.closest && e.target.closest(".ltt-term"); if (t) show(t); });
    document.addEventListener("mouseout", function (e) { var t = e.target.closest && e.target.closest(".ltt-term"); if (t && !pinned) pop.classList.remove("on"); });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".ltt-term");
      if (t) { pinned = t; show(t); record("term", { term: t.dataset.term }); } else if (pinned) hide();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  }

  /* ---------- events and expected values ---------- */
  var lesson = { id: null };
  function lessonId() {
    if (lesson.id) return lesson.id;
    var m = DOC && /^\/lessons\/([a-z0-9][a-z0-9-]*)\//.exec(root.location.pathname);
    return m ? m[1] : null;
  }
  function record(type, data) {
    var id = lessonId();
    if (!id || CHECK || !root.fetch || root.location.protocol === "file:") return Promise.resolve(false);
    return fetch("/api/lessons/" + id + "/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type, data: data === undefined ? null : data })
    }).then(function (r) { return r.ok; }, function () { return false; });
  }
  var expects = [];
  function expectPanel() {
    var p = document.getElementById("ltt-expect");
    if (!p) { p = h("details", { id: "ltt-expect" }, [h("summary")]); document.body.appendChild(p); }
    var fails = expects.filter(function (e) { return !e.ok; }).length;
    p.firstChild.textContent = fails ? "기대값 대조 ✗ " + fails + "건 불일치 / " + expects.length + "건" : "기대값 대조 ✓ " + expects.length + "건 일치";
    if (fails) { p.dataset.fails = fails; p.open = true; }
    return p;
  }
  function expect(label, actual, expected, opts) {
    var tol = opts && opts.tol != null ? opts.tol : 1e-9 * Math.max(1, Math.abs(expected));
    var ok = typeof actual === "number" && isFinite(actual) && Math.abs(actual - expected) <= tol;
    expects.push({ label: label, actual: actual, expected: expected, tol: tol, ok: ok });
    if (DOC && document.body && !CHECK) {
      var p = expectPanel();
      p.appendChild(h("div", { cls: ok ? "ok" : "fail", text: (ok ? "✓ " : "✗ 검증 실패: ") + label + (ok ? "" : " (모델 " + actual + ", 기대 " + expected + ")") }));
    }
    if (!ok) record("expect-mismatch", { label: label, actual: actual, expected: expected, tol: tol });
    return ok;
  }

  /* ---------- time: motion is a list of verbs compiled to start/duration ---------- */
  var DUR = { show: 0.5, hide: 0.4, highlight: 0.5, dim: 0.5, pulse: 0.9, travel: 1.6, flow: 2.4, relayout: 1.2, set: 0.3,
    zoom: 1.2, reset: 1, grow: 1.2, draw: 1.4, fill: 1.4, scan: 2.2, type: 1.6, count: 1.2, drop: 3.5, curve: 1, to: 1.2, send: 1.1, step: 0.7, note: 0.4, point: 1.6 };
  function seq(steps) {
    need(steps == null || Array.isArray(steps), "motion은 배열이다: [[\"verb\", {…}], …]");
    var items = [], marks = {}, beats = [], t = 0;
    function add(step, at, path, inh) {
      if (Array.isArray(step)) {
        var v = step[0], a = step[1];
        need(typeof v === "string", path + ": 첫 칸은 동사 이름이다");
        if (v === "wait") { need(typeof a === "number" && a >= 0, path + ": [\"wait\", 초]"); return a; }
        if (v === "mark") { need(typeof a === "string", path + ": [\"mark\", 이름]"); marks[a] = at; return 0; }
        need(DUR[v] != null, path + ": 동사 '" + v + "'는 없다. 쓸 수 있는 동사: " + Object.keys(DUR).join(" ") + " wait mark");
        a = inh ? Object.assign({}, inh, a) : a || {};
        var d = a.dur != null ? a.dur : DUR[v];
        items.push({ verb: v, args: a, start: at, dur: d, path: path });
        return d;
      }
      if (step && Array.isArray(step.par)) {
        var m = 0, sub = inh;
        ["side", "panel", "on"].forEach(function (k) { if (step[k] != null) { sub = Object.assign({}, sub); sub[k] = step[k]; } });
        step.par.forEach(function (s, i) { m = Math.max(m, add(s, at, path + ".par[" + i + "]", sub)); });
        return m;
      }
      throw new SchemaError(path + ": 단계는 [\"verb\", {…}] 또는 {par: [...]}다");
    }
    // Sheet frames sit 65% into each step, where travelling dots and growing bars are still visible, plus the last frame.
    (steps || []).forEach(function (s, i) { var d = add(s, t, "motion[" + i + "]"); if (d >= 0.3) beats.push(+(t + d * 0.65).toFixed(3)); t += d; });
    if (t > 0) beats.push(+t.toFixed(3));
    return { items: items, marks: marks, dur: +t.toFixed(3), beats: beats };
  }
  function progress(item, t) { return item.dur <= 0 ? (t >= item.start ? 1 : 0) : t <= item.start ? 0 : clamp((t - item.start) / item.dur); }
  // Every frame is computed from scratch for its time, so seeking backwards or capturing any instant gives the same picture.
  function paintPart(part, timeline, t) {
    if (!part) return;
    part.reset && part.reset();
    timeline.items.forEach(function (it) {
      var fn = part.verbs && part.verbs[it.verb];
      if (fn) fn(progress(it, t), it.args, t - it.start, it);
    });
    part.frame && part.frame(t);
  }
  /* ---------- figure frame: svg drawing + html label layer under one camera ---------- */
  function Fig(W, H) {
    var el = h("div", { cls: "ltt-fig", style: { "--ar": (W / H).toFixed(4) } });
    var cam = h("div", { cls: "ltt-cam" });
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var lab = h("div", { cls: "ltt-lab" });
    cam.appendChild(s); cam.appendChild(lab); el.appendChild(cam);
    var f = {
      el: el, cam: cam, svg: s, lab: lab, W: W, H: H, camRect: null,
      pos: function (n, x, y) { n.style.left = (x / W * 100) + "%"; n.style.top = (y / H * 100) + "%"; return n; },
      label: function (x, y, text, o) {
        o = o || {};
        var n = h("div", { cls: "ltt-label " + (o.anchor || "") + " " + (o.cls || "") + (o.tone ? " tone-" + o.tone : ""), "data-solid": o.solid === false ? null : "" });
        n.innerHTML = o.html ? text : termHtml(text, -1);
        lab.appendChild(n);
        return f.pos(n, x, y);
      },
      setCam: function (r) {
        f.camRect = r;
        el.classList.toggle("zoomed", !!r);
        if (!r) { cam.style.transform = ""; return; }
        var k = Math.min(W / r[2], H / r[3]);
        var tx = W / 2 - (r[0] + r[2] / 2) * k, ty = H / 2 - (r[1] + r[3] / 2) * k;
        cam.style.transform = "translate(" + (tx / W * 100) + "%," + (ty / H * 100) + "%) scale(" + k + ")";
      }
    };
    return f;
  }
  function rectOf(fig, part, to, path, k0) {
    if (Array.isArray(to)) { need(to.length === 4, path + ": zoom to는 id 또는 [x%, y%, w%, h%]"); return [to[0] / 100 * fig.W, to[1] / 100 * fig.H, to[2] / 100 * fig.W, to[3] / 100 * fig.H]; }
    var a = part.anchor(to, path), k = k0 || 2.6;
    var w = fig.W / k, hh = fig.H / k;
    return [a[0] / 100 * fig.W - w / 2, a[1] / 100 * fig.H - hh / 2, w, hh];
  }
  // Camera verbs shared by every part drawn in a Fig.
  function camVerbs(part) {
    return {
      zoom: function (u, a) {
        var fig = part.fig, from = fig.camRect || [0, 0, fig.W, fig.H], to = rectOf(fig, part, a.to, "zoom", a.k);
        if (u <= 0) return;
        var e = ease.inOut(u);
        fig.setCam([0, 1, 2, 3].map(function (i) { return lerp(from[i], to[i], e); }));
      },
      reset: function (u) {
        var fig = part.fig, from = fig.camRect;
        if (u <= 0 || !from) return;
        var e = ease.inOut(u), full = [0, 0, fig.W, fig.H];
        fig.setCam(u >= 1 ? null : [0, 1, 2, 3].map(function (i) { return lerp(from[i], full[i], e); }));
      }
    };
  }
  function fade(nodes, o) { nodes.forEach(function (n) { if (n) n.style.opacity = o >= 0.999 ? "" : String(o); }); }
  function cls(nodes, c, on) { nodes.forEach(function (n) { if (n) n.classList.toggle(c, !!on); }); }
  function idsOf(a, key) { var v = a[key] != null ? a[key] : a.id != null ? a.id : a.ids; return v == null ? [] : Array.isArray(v) ? v : [v]; }
  // show/hide/highlight/dim over a part's id → elements map.
  function itemVerbs(part) {
    function els(ids, path) {
      return ids.reduce(function (acc, id) {
        need(part.items[id], path + ": id '" + id + "'가 없다. 있는 id: " + Object.keys(part.items).join(", "));
        return acc.concat(part.items[id]);
      }, []);
    }
    part.checkIds = function (verb, a, path) {
      if (verb === "show" || verb === "hide" || verb === "highlight" || verb === "dim") els(idsOf(a), path);
    };
    return {
      show: function (u, a) { fade(els(idsOf(a), "show"), ease.out(u)); },
      hide: function (u, a) { fade(els(idsOf(a), "hide"), 1 - ease.out(u)); },
      // highlight and dim last for their own duration unless keep: true; show and hide change state for good.
      highlight: function (u, a) { cls(els(idsOf(a), "highlight"), a.tone || "hot", u > 0 && (u < 1 || a.keep)); },
      dim: function (u, a) {
        if (u >= 1 && !a.keep) return;
        var keep = els(idsOf(a, "except"), "dim");
        Object.keys(part.items).forEach(function (id) {
          part.items[id].forEach(function (n) { if (keep.indexOf(n) < 0) n.style.opacity = String(lerp(1, 0.22, ease.out(u))); });
        });
      }
    };
  }
  function resetItems(part) {
    Object.keys(part.items || {}).forEach(function (id) {
      part.items[id].forEach(function (n) { n.style.opacity = ""; ["hot", "bad", "good", "warn", "accent"].forEach(function (c) { if (!n.dataset.tone || n.dataset.tone !== c) n.classList.remove(c); }); });
    });
  }
  function fitVis(child) { var v = h("div", { cls: "ltt-vis" }); v.appendChild(child); return v; }
  // Each scene builds its own instance, so one signature picture can appear in many scenes at once.
  function makePart(kind, tier, spec, impl) {
    var part = { kind: kind, tier: tier, spec: spec, items: {}, fig: null };
    part.instance = function () { return makePart(kind, tier, spec, impl); };
    impl(part);
    var own = part.verbs || {};
    part.verbs = Object.assign({}, part.usesFig ? camVerbs(part) : {}, itemVerbs(part), own);
    var baseCheck = part.checkArgs;
    part.checkArgs = part.container ? baseCheck : function (verb, a, path) { part.checkIds(verb, a, path); if (baseCheck) baseCheck(verb, a, path); };
    var build = part.build, baseReset = part.reset;
    part.build = function (mode) {
      part.items = {};
      part.mode = mode;
      part.el = build(mode);
      return part.el;
    };
    part.reset = function () { resetItems(part); if (part.fig) part.fig.setCam(null); if (baseReset) baseReset(); };
    part.__ltt = true;
    return part;
  }
  function isPart(p) { return p && p.__ltt; }
  // A verb belongs to the first part whose ids and arguments it fits, so authors name ids, not parts.
  function accepts(part, it, where) {
    if (!part || !part.verbs || !part.verbs[it.verb]) return false;
    try { if (part.checkArgs) part.checkArgs(it.verb, it.args, where + " " + it.path); return true; }
    catch (e) { if (e instanceof SchemaError) return e; throw e; }
  }
  function owner(parts, it, where) {
    var err = null;
    for (var k = 0; k < parts.length; k++) { var r = accepts(parts[k], it, where); if (r === true) return k; if (r && !err) err = r; }
    if (err) throw err;
    throw new SchemaError(where + " " + it.path + ": '" + it.verb + "'를 아는 그림이 없다. " + parts.filter(Boolean).map(function (q) { return q.kind + ": " + Object.keys(q.verbs).join(" "); }).join(" / "));
  }

  /* ---------- S parts: content-sized, safe without looking ---------- */
  function numOf(v) { var x = parseFloat(String(v).replace(/,/g, "")); return isNaN(x) ? 0 : x; }
  function places(x) { return (String(x).split(".")[1] || "").length; }
  // Counts on one number chain: each starts from where the previous one left it unless it gives from.
  function countVerb(part, getEl) {
    return function (u, a) {
      var n = getEl(a);
      if (!n || u <= 0) return;
      var from = a.from != null ? a.from : n._v != null ? n._v : n._v0 != null ? n._v0 : numOf(n.dataset.v);
      var v = u >= 1 ? a.to : lerp(from, a.to, ease.out(u));
      n._v = v;
      n.textContent = fmt(v, a.digits != null ? a.digits : Math.max(places(from), places(a.to)));
    };
  }

  function facts(list) {
    capList("facts", list, 4, 1);
    list.forEach(function (f, i) {
      need(f && f.value != null, "facts[" + i + "].value가 필요하다");
      cap("facts[" + i + "].value", String(f.value), 9); cap("facts[" + i + "].unit", f.unit, 6); cap("facts[" + i + "].label", f.label, 36); tone("facts[" + i + "]", f.tone);
    });
    return makePart("facts", "S", list, function (p) {
      p.build = function () {
        var nums = [];
        var len = Math.max.apply(null, list.map(function (f) { return String(f.value).length + (f.unit ? String(f.unit).length * 0.8 : 0); }));
        var el = h("div", { cls: "ltt-facts", "data-fit": "", style: { "--n": list.length, "--len": len.toFixed(1) } }, list.map(function (f, i) {
          var b = h("b", { html: "<i style='font-style:normal'>" + esc(f.value) + "</i>" + (f.unit ? "<small>" + esc(f.unit) + "</small>" : "") });
          nums[i] = b.firstChild; nums[i].dataset.v = f.value;
          var item = h("div", { cls: "ltt-fact " + (f.tone || ""), "data-solid": "" }, [b, f.label ? h("span", { html: termHtml(f.label, -1) }) : null]);
          p.items[f.id || "f" + i] = [item];
          return item;
        }));
        p.nums = nums;
        return el;
      };
      p.reset = function () { (p.nums || []).forEach(function (n) { n.textContent = n.dataset.v; n._v = null; }); };
      p.anchor = function (id) { var k = Object.keys(p.items).indexOf(id); need(k >= 0, "facts에 id '" + id + "'가 없다"); return [(k + 0.5) / list.length * 100, 30]; };
      function slot(a) { return a.i != null ? a.i : a.id != null ? Object.keys(p.items).indexOf(a.id) : list.length === 1 ? 0 : -1; }
      p.checkArgs = function (verb, a, path) { if (verb === "count") { need(typeof a.to === "number", path + ": count는 {i 또는 id, to}"); need(p.nums[slot(a)], path + ": facts에서 셀 칸이 없다. i는 0…" + (list.length - 1) + ", id는 " + Object.keys(p.items).join(", ")); } };
      p.verbs = { count: countVerb(p, function (a) { return p.nums[slot(a)]; }) };
    });
  }

  function callout(o) {
    need(o && (o.title || o.text), "callout에는 title이나 text가 필요하다");
    cap("callout.title", o.title, 36); cap("callout.text", o.text, 150); tone("callout", o.tone);
    return makePart("callout", "S", o, function (p) {
      p.build = function () {
        return h("div", { cls: "ltt-callout " + (o.tone || ""), "data-solid": "", "data-fit": "" }, [
          h("span", { html: icon(o.icon || (o.tone === "bad" || o.tone === "warn" ? "alert" : "bulb")) }),
          h("div", {}, [o.title ? h("b", { html: termHtml(o.title, -1) }) : null, o.text ? h("p", { html: termHtml(o.text, -1) }) : null])
        ]);
      };
      p.anchor = function () { return [4, 50]; };
    });
  }

  function cellOf(c) { return c && typeof c === "object" && !Array.isArray(c) ? c : { v: c }; }
  function table(o) {
    need(o && Array.isArray(o.cols) && Array.isArray(o.rows), "table은 {cols: [...], rows: [[...], ...]}");
    capList("table.cols", o.cols, 5, 2); capList("table.rows", o.rows, o.cols.length <= 3 ? 7 : 6, 1);
    var cols = o.cols.map(function (c) { return typeof c === "string" ? { label: c } : c; });
    var cellCap = Math.max(14, Math.floor(84 / cols.length));
    cols.forEach(function (c, i) { cap("table.cols[" + i + "]", c.label, 14); });
    o.rows.forEach(function (r, i) {
      need(Array.isArray(r) && r.length === cols.length, "table.rows[" + i + "]는 열 " + cols.length + "개짜리 배열이다");
      r.forEach(function (c, j) { var x = cellOf(c); cap("table.rows[" + i + "][" + j + "] (열 " + cols.length + "개일 때)", x.v == null ? "" : String(x.v), cellCap); tone("table.rows[" + i + "][" + j + "]", x.tone); });
    });
    return makePart("table", "S", o, function (p) {
      p.build = function () {
        var hl = o.highlight || {};
        var t = h("table", { cls: "ltt-table" + (cols.length >= 4 ? " wide" : ""), "data-solid": "" }, [
          h("thead", {}, [h("tr", {}, cols.map(function (c) { return h("th", { cls: c.num ? "num" : null, html: termHtml(c.label, -1) }); }))]),
          h("tbody", {}, o.rows.map(function (r, i) {
            var tr = h("tr", { cls: hl.row === i && hl.col == null ? "hl" : null }, r.map(function (c, j) {
              var x = cellOf(c);
              return h("td", { cls: [cols[j].num ? "num" : "", x.tone || "", hl.row === i && hl.col === j ? "hl" : ""].join(" ").trim() || null, html: termHtml(x.v == null ? "" : typeof x.v === "number" ? fmt(x.v) : String(x.v), -1) });
            }));
            p.items["r" + i] = [tr];
            return tr;
          }))
        ]);
        var cards = h("div", { cls: "ltt-cards" }, o.rows.map(function (r, i) {
          return h("article", { cls: hl.row === i ? "hl" : null }, [h("b", { html: termHtml(String(cellOf(r[0]).v), -1) })].concat(r.slice(1).map(function (c, j) {
            var x = cellOf(c);
            return h("div", {}, [h("span", { text: cols[j + 1].label }), h("span", { cls: x.tone ? "tone-" + x.tone : null, text: x.v == null ? "" : typeof x.v === "number" ? fmt(x.v) : String(x.v) })]);
          })));
        }));
        p.rowsEl = t.tBodies[0].rows;
        return h("div", { "data-fit": "", style: { width: "100%", "align-self": "center" } }, [t, cards]);
      };
      p.anchor = function (id, path) { var i = +String(id).replace(/^r/, ""); need(i >= 0 && i < o.rows.length, (path || "points") + ": table의 행 id는 r0…r" + (o.rows.length - 1)); return [50, (i + 1.5) / (o.rows.length + 1) * 100]; };
      p.reset = function () { [].forEach.call(p.rowsEl || [], function (r) { r.classList.remove("scan"); }); };
      p.verbs = {
        scan: function (u, a) {
          if (u <= 0 || u >= 1 && !a.keep) return;
          var from = a.from || 0, to = a.to != null ? a.to : o.rows.length - 1, k = Math.round(lerp(from, to, u));
          if (p.rowsEl[k]) p.rowsEl[k].classList.add("scan");
        }
      };
    });
  }

  function units(o) {
    need(o && o.n > 0, "units는 {n, groups: [{k, label}]}");
    need(o.n <= 200, "units.n ≤ 200, 지금 " + o.n);
    capList("units.groups", o.groups || [], 5);
    var sum = 0;
    (o.groups || []).forEach(function (g, i) { need(g.k >= 0, "units.groups[" + i + "].k가 필요하다"); cap("units.groups[" + i + "].label", g.label, 24); sum += g.k; });
    need(sum <= o.n, "units.groups의 k 합(" + sum + ")이 n(" + o.n + ")보다 크다");
    var cols = o.cols || (o.n <= 20 ? o.n : o.n <= 50 ? 10 : o.n === 100 ? 10 : Math.ceil(Math.sqrt(o.n * 2)));
    var order = [];
    for (var i = 0; i < o.n; i++) order.push(i);
    if (o.order === "random") { var r = rng(o.seed); for (var j = order.length - 1; j > 0; j--) { var x = Math.floor(r() * (j + 1)), tmp = order[j]; order[j] = order[x]; order[x] = tmp; } }
    (o.groups || []).forEach(function (g, i) { tone("units.groups[" + i + "]", g.tone); });
    function kcls(gi) { var g = o.groups[gi]; return g && g.tone ? "t-" + g.tone : "k" + gi; }
    var owner = [], gi = 0, left = o.groups && o.groups[0] ? o.groups[0].k : 0;
    order.forEach(function (cell) {
      while (o.groups && gi < o.groups.length && left <= 0) { gi++; left = o.groups[gi] ? o.groups[gi].k : 0; }
      owner[cell] = o.groups && gi < o.groups.length && left > 0 ? gi : -1;
      left--;
    });
    return makePart("units", "S", o, function (p) {
      p.build = function () {
        var rows = Math.ceil(o.n / cols);
        var grid = h("div", { cls: "ltt-units", style: { "--cols": cols, "--gap": cols > 12 ? "3px" : "5px" } });
        p.cells = [];
        for (var i = 0; i < o.n; i++) { var c = h("i", { cls: "ltt-cell" }); grid.appendChild(c); p.cells.push(c); }
        var fig = h("div", { cls: "ltt-fig", style: { "--ar": (cols / rows).toFixed(4) } }, [grid]);
        (o.groups || []).forEach(function (g, gi) { p.items["g" + gi] = p.cells.filter(function (c, i) { return owner[i] === gi; }); });
        var key = o.groups && o.groups.length ? h("div", { cls: "ltt-key", "data-solid": "" }, o.groups.map(function (g, gi) {
          return h("span", {}, [h("i", { cls: "ltt-cell " + kcls(gi) }), h("span", { text: (g.label || "") + " " + g.k })]);
        })) : null;
        return h("div", { cls: "ltt-wk" }, [h("div", { cls: "ltt-vis" }, [fig]), key]);
      };
      p.paintAll = function (k) { p.cells.forEach(function (c, i) { c.className = "ltt-cell" + (owner[i] >= 0 && (k == null || owner[i] < k) ? " " + kcls(owner[i]) : ""); }); };
      p.reset = function () { p.paintAll(p.filling ? 0 : null); };
      p.anchor = function (id) { var g = +String(id).replace(/^g/, ""), idx = owner.indexOf(g); need(idx >= 0, "units의 id는 g0…"); return [((idx % cols) + 0.5) / cols * 100, (Math.floor(idx / cols) + 0.5) / Math.ceil(o.n / cols) * 100]; };
      p.prepare = function (timeline) { p.filling = timeline.items.some(function (it) { return it.verb === "fill"; }); };
      p.verbs = {
        fill: function (u, a) {
          var g = a.group != null ? a.group : null;
          var targets = p.cells.map(function (c, i) { return i; }).filter(function (i) { return owner[i] >= 0 && (g == null || owner[i] === g); });
          targets.sort(function (x, y) { return order.indexOf(x) - order.indexOf(y); });
          var k = Math.round(targets.length * u);
          targets.slice(0, k).forEach(function (i) { p.cells[i].className = "ltt-cell " + kcls(owner[i]); });
        },
        scan: function (u, a) {
          if (u <= 0 || u >= 1) return;
          var from = a.from || 0, to = a.to != null ? a.to : o.n - 1, k = Math.round(lerp(from, to, u));
          if (p.cells[k]) p.cells[k].classList.add("scan");
        }
      };
    });
  }

  function steps(kind, o, max, titleCap) {
    var key = kind === "pipeline" ? "steps" : "events";
    need(o && Array.isArray(o[key]), kind + "는 {" + key + ": [...]}");
    capList(kind + "." + key, o[key], max, 2);
    o[key].forEach(function (s, i) { cap(kind + "." + key + "[" + i + "].title", s.title, titleCap); cap(kind + "." + key + "[" + i + "].text", s.text, 50); cap(kind + "." + key + "[" + i + "].t", s.t, 12); });
    return o[key];
  }
  function stepVerb(p, list) {
    return function (u, a) {
      if (u <= 0 && !p.stepping) return;
      var to = a.to != null ? a.to : list.length - 1;
      p.boxes.forEach(function (b, i) {
        b.classList.toggle("off", i > to && u > 0 || p.stepping && u <= 0 && i > (a.from != null ? a.from : -1));
        b.classList.toggle("on", u > 0 && i === to && !!a.hot);
      });
    };
  }
  function pipeline(o) {
    var list = steps("pipeline", o, 6, 16);
    list.forEach(function (s, i) { if (s.icon) icon(s.icon); });
    return makePart("pipeline", "S", o, function (p) {
      p.build = function () {
        p.boxes = [];
        var kids = [];
        list.forEach(function (s, i) {
          if (i) kids.push(h("div", { cls: "ltt-arrow", html: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M4.5 12h15M13.5 6l6 6-6 6'/></svg>" }));
          var b = h("div", { cls: "ltt-stagebox", "data-solid": "" }, [
            s.icon ? h("span", { html: icon(s.icon) }) : h("span", { cls: "no", text: String(i + 1).padStart(2, "0") }),
            h("b", { html: termHtml(s.title, -1) }), s.text ? h("span", { html: termHtml(s.text, -1) }) : null
          ]);
          p.boxes.push(b); p.items[s.id || "s" + i] = [b]; kids.push(b);
        });
        return h("div", { cls: "ltt-flowrow", "data-fit": "" }, kids);
      };
      p.prepare = function (tl) { p.stepping = tl.items.some(function (it) { return it.verb === "step"; }); };
      p.reset = function () { p.boxes.forEach(function (b) { b.classList.remove("on"); b.classList.toggle("off", !!p.stepping); }); };
      p.anchor = function (id) { var i = Object.keys(p.items).indexOf(id); need(i >= 0, "pipeline id는 s0…"); return [(i + 0.5) / list.length * 100, 20]; };
      p.verbs = { step: function (u, a) {
        if (u <= 0) return;
        var to = a.to != null ? a.to : list.length - 1;
        p.boxes.forEach(function (b, i) { b.classList.toggle("off", i > to); b.classList.toggle("on", i === to); });
      } };
    });
  }
  function timeline(o) {
    var list = steps("timeline", o, 7, 20);
    return makePart("timeline", "S", o, function (p) {
      p.build = function () {
        p.boxes = list.map(function (e, i) {
          var b = h("div", { cls: "ltt-ev", "data-solid": "" }, [e.t != null ? h("span", { cls: "t", text: String(e.t) }) : null, h("b", { html: termHtml(e.title, -1) }), e.text ? h("span", { html: termHtml(e.text, -1) }) : null]);
          p.items[e.id || "e" + i] = [b];
          return b;
        });
        return h("div", { cls: "ltt-tl", "data-fit": "", style: { "--n": list.length } }, p.boxes);
      };
      p.prepare = function (tl) { p.stepping = tl.items.some(function (it) { return it.verb === "step"; }); };
      p.reset = function () { p.boxes.forEach(function (b) { b.classList.toggle("off", !!p.stepping); }); };
      p.anchor = function (id) { var i = Object.keys(p.items).indexOf(id); need(i >= 0, "timeline id는 e0…"); return [(i + 0.2) / list.length * 100, 10]; };
      p.verbs = { step: function (u, a) { if (u <= 0) return; var to = a.to != null ? a.to : list.length - 1; p.boxes.forEach(function (b, i) { b.classList.toggle("off", i > to); }); } };
    });
  }

  var KW = /\b(const|let|var|function|return|if|else|for|while|class|def|import|from|async|await|new|SELECT|FROM|WHERE|JOIN|GROUP|BY|ORDER|INSERT|UPDATE|SET|fn|pub|struct|impl|match|true|false|null|None|self|this)\b/g;
  function highlightCode(line) {
    var out = "", rest = line, m;
    var re = /(\/\/.*$|#.*$|--.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)/;
    while ((m = re.exec(rest))) {
      out += esc(rest.slice(0, m.index)).replace(KW, "<span class='k'>$1</span>");
      out += "<span class='" + (m[1] ? "c" : m[2] ? "s" : "n") + "'>" + esc(m[0]) + "</span>";
      rest = rest.slice(m.index + m[0].length);
    }
    return out + esc(rest).replace(KW, "<span class='k'>$1</span>");
  }
  function termWin(kind, o) {
    var lines = kind === "code" ? String(o.code || "").replace(/\n$/, "").split("\n") : (o.lines || []).map(function (l) { return typeof l === "string" ? { text: l } : l; });
    capList(kind + (kind === "code" ? ".code 줄" : ".lines"), lines, 12, 1);
    lines.forEach(function (l, i) { var s = kind === "code" ? l : l.text; need(String(s).length <= 64, kind + " " + (i + 1) + "번 줄 ≤ 64자, 지금 " + String(s).length + "자"); });
    cap(kind + ".title", o.title, 48);
    return makePart(kind, "S", o, function (p) {
      p.build = function () {
        var marks = o.marks || {};
        p.lines = lines.map(function (l, i) {
          var span = h("span", { cls: "ln" + (kind === "code" ? (marks[i + 1] ? " " + marks[i + 1] : "") : (l.tone ? " " + l.tone : "")), "data-n": i + 1 });
          span.innerHTML = kind === "code" ? "<span>" + (highlightCode(l) || " ") + "</span>" : esc(l.text) || " ";
          p.items["l" + (i + 1)] = [span];
          return span;
        });
        return h("div", { cls: "ltt-term-win" + (kind === "code" ? " ltt-code" : ""), "data-solid": "", "data-fit": "" }, [
          h("header", {}, [h("i"), h("i"), h("i"), h("span", { text: o.title || (kind === "code" ? "code" : "terminal") })]),
          h("pre", {}, p.lines)
        ]);
      };
      p.prepare = function (tl) { p.typing = tl.items.some(function (it) { return it.verb === "type"; }); };
      p.reset = function () { p.lines.forEach(function (l) { l.classList.toggle("off", !!p.typing); l.classList.remove("scan"); }); };
      p.anchor = function (id) { var i = +String(id).replace(/^l/, ""); need(i >= 1 && i <= lines.length, "줄 id는 l1…l" + lines.length); return [6, 10 + (i - 0.5) / lines.length * 85]; };
      p.verbs = {
        type: function (u, a) {
          var from = a.from || 1, to = a.to || lines.length, k = Math.floor(lerp(from - 1, to, u) + 1e-9);
          p.lines.forEach(function (l, i) { if (i + 1 >= from && i + 1 <= k) l.classList.remove("off"); });
        },
        scan: function (u, a) {
          if (u <= 0 || u >= 1) return;
          var k = Math.round(lerp(a.from || 1, a.to || lines.length, u));
          if (p.lines[k - 1]) p.lines[k - 1].classList.add("scan");
        }
      };
    });
  }

  function math(o) {
    var list = typeof o === "string" ? [o] : o.steps;
    capList("math.steps", list, 4, 1);
    return makePart("math", "S", o, function (p) {
      p.build = function () {
        need(root.katex, "math는 KaTeX가 필요하다: <script src=\"/kit/vendor/katex/katex.min.js\"> 와 katex.min.css를 ltt.js 앞에 불러온다");
        p.boxes = list.map(function (tex, i) {
          var d = h("div", { cls: "step", "data-solid": "" });
          root.katex.render(tex, d, { displayMode: true, throwOnError: true });
          p.items["m" + i] = [d];
          return d;
        });
        return h("div", { cls: "ltt-math", "data-fit": "" }, p.boxes);
      };
      p.prepare = function (tl) { p.stepping = tl.items.some(function (it) { return it.verb === "step"; }); };
      p.reset = function () { p.boxes.forEach(function (b, i) { b.classList.toggle("off", !!p.stepping && i > 0); }); };
      p.anchor = function (id) { var i = Object.keys(p.items).indexOf(id); need(i >= 0, "math id는 m0…"); return [50, (i + 0.5) / list.length * 100]; };
      p.verbs = { step: function (u, a) { if (u <= 0) return; p.boxes.forEach(function (b, i) { b.classList.toggle("off", i > a.to); }); } };
    });
  }

  /* ---------- graph: html node boxes over svg edges; motion runs along edges ---------- */
  function layoutGraph(o, mobile) {
    var n = o.nodes.length, L = o.layout || "chain", pos = {}, W = 1000, H;
    var ids = o.nodes.map(function (x) { return x.id; });
    if (L === "manual") {
      var ar = mobile && o.mobileAspect ? o.mobileAspect : o.aspect || 16 / 9;
      H = W / ar;
      o.nodes.forEach(function (nd) { var at = mobile && nd.m ? nd.m : nd.at; pos[nd.id] = [at[0] / 100 * W, at[1] / 100 * H]; });
      return { W: W, H: H, pos: pos };
    }
    if (L === "chain") {
      if (mobile) { W = 600; H = n * 300; ids.forEach(function (id, i) { pos[id] = [W / 2, (i + 0.5) * 300]; }); }
      else { H = o.aspect ? W / o.aspect : Math.max(300, W / Math.max(2.4, n * 0.62)); ids.forEach(function (id, i) { pos[id] = [(i + 0.5) / n * W, H / 2]; }); }
      return { W: W, H: H, pos: pos };
    }
    if (L === "ring" && mobile && n > 4) {
      var half = Math.ceil(n / 2);
      W = 600; H = half * 210;
      ids.forEach(function (id, i) { var left = i < half; pos[id] = [left ? 150 : 450, ((left ? i : n - 1 - i) + 0.5) * 210]; });
      return { W: W, H: H, pos: pos };
    }
    if (L === "ring") {
      W = 1000; H = mobile ? 1000 : 760;
      var rx = mobile ? 330 : 400, ry = mobile ? 360 : 270;
      ids.forEach(function (id, i) { var a = -Math.PI / 2 + i / n * Math.PI * 2; pos[id] = [W / 2 + rx * Math.cos(a), H / 2 + ry * Math.sin(a)]; });
      return { W: W, H: H, pos: pos, center: [W / 2, H / 2], r: [rx, ry] };
    }
    if (L === "grid") {
      var cols = o.cols || [1, 1, 2, 3, 4, 3, 3, 4, 4, 3, 5][n];
      if (mobile) cols = Math.min(cols, 2);
      var rows = Math.ceil(n / cols);
      var cw = mobile ? 300 : 250, rh = mobile ? 170 : 150;
      W = cols * cw; H = rows * rh;
      ids.forEach(function (id, i) { pos[id] = [(i % cols + 0.5) * cw, (Math.floor(i / cols) + 0.5) * rh]; });
      return { W: W, H: H, pos: pos };
    }
    if (L === "tree") {
      var kids = {}, hasParent = {};
      o.edges.forEach(function (e) { (kids[e.from] = kids[e.from] || []).push(e.to); hasParent[e.to] = 1; });
      var roots = ids.filter(function (id) { return !hasParent[id]; });
      need(roots.length, "graph layout 'tree'에는 들어오는 간선이 없는 뿌리 노드가 필요하다");
      var depth = {}, order = [], seen = {};
      (function walk(list, d) { list.forEach(function (id) { if (seen[id]) return; seen[id] = 1; depth[id] = d; var c = kids[id] || []; if (!c.length) order.push(id); walk(c, d + 1); if (c.length) order.push(id); }); })(roots, 0);
      var maxD = Math.max.apply(null, ids.map(function (id) { return depth[id] || 0; }));
      var leaves = ids.filter(function (id) { return !(kids[id] && kids[id].length); });
      if (mobile && leaves.length > 2) {
        var row = 0, ys = {};
        (function walk2(list) { list.forEach(function (id) { if (ys[id] != null) return; ys[id] = row++; walk2(kids[id] || []); }); })(roots);
        W = 600; H = row * 170;
        ids.forEach(function (id) { pos[id] = [130 + (depth[id] || 0) * 110, (ys[id] + 0.5) * 170]; });
        return { W: W, H: H, pos: pos, outline: true };
      }
      var span = mobile ? 200 : 230, lh = mobile ? 170 : 150;
      W = Math.max(600, leaves.length * span); H = (maxD + 1) * lh;
      var xs = {};
      leaves.forEach(function (id, i) { xs[id] = (i + 0.5) * span + (W - leaves.length * span) / 2; });
      (function place(id) { if (xs[id] != null) return xs[id]; var c = kids[id].map(place); return (xs[id] = c.reduce(function (a, b) { return a + b; }, 0) / c.length); });
      ids.forEach(function (id) { if (xs[id] == null && kids[id]) (function place(x) { if (xs[x] != null) return xs[x]; var c = kids[x].map(place); return (xs[x] = c.reduce(function (a, b) { return a + b; }, 0) / c.length); })(id); });
      ids.forEach(function (id) { pos[id] = [xs[id], ((depth[id] || 0) + 0.5) * lh]; });
      return { W: W, H: H, pos: pos };
    }
    throw new SchemaError("graph.layout은 chain·ring·tree·grid·manual 중 하나");
  }

  function graph(o) {
    need(o && Array.isArray(o.nodes), "graph는 {nodes: [...], edges: [...], layout}");
    capList("graph.nodes", o.nodes, 10, 1); capList("graph.edges", o.edges || [], 16);
    var ids = {};
    o.nodes.forEach(function (nd, i) {
      var at = "graph.nodes[" + i + "]";
      need(nd && typeof nd.id === "string", at + ".id(문자열)가 필요하다");
      need(!ids[nd.id], at + ": id '" + nd.id + "'가 겹친다"); ids[nd.id] = 1;
      cap(at + ".label", nd.label, 16); cap(at + ".sub", nd.sub, 20); tone(at, nd.tone);
      if (nd.icon) icon(nd.icon);
      if (o.layout === "manual") need(Array.isArray(nd.at) && nd.at.length === 2, at + ".at = [x%, y%]가 manual 배치에 필요하다");
    });
    var edges = (o.edges || []).map(function (e, i) {
      var at = "graph.edges[" + i + "]";
      need(ids[e.from] && ids[e.to], at + ": from·to는 노드 id다 (" + e.from + " → " + e.to + ")");
      cap(at + ".label", e.label, 14); tone(at, e.tone);
      return Object.assign({ id: e.id || e.from + ">" + e.to }, e);
    });
    return makePart("graph", "M", o, function (p) {
      p.usesFig = true;
      p.build = function (mode) {
        var L = layoutGraph(o, mode.mobile);
        var fig = p.fig = Fig(L.W, L.H);
        p.layout = L; p.pos = {}; p.nodes = {}; p.paths = {};
        Object.keys(L.pos).forEach(function (id) { p.pos[id] = L.pos[id].slice(); });
        p.edgeLayer = svg("g", {}, fig.svg);
        if (o.layout === "ring" && o.track && L.center && !edges.length) svg("ellipse", { cx: L.center[0], cy: L.center[1], rx: L.r[0], ry: L.r[1], cls: "e" }, p.edgeLayer);
        p.dotLayer = svg("g", {}, fig.svg);
        edges.forEach(function (e) {
          var path = svg("path", { cls: "e" + (e.dash ? " dash" : "") + (e.tone ? " " + e.tone : "") }, p.edgeLayer);
          var chev = svg("path", { cls: "chev", d: "M-7,-6 L5,0 L-7,6 Z" }, p.edgeLayer);
          if (e.both || o.directed === false) chev.style.display = "none";
          var lab = e.label ? fig.label(0, 0, e.label, { cls: "ltt-elab" }) : null;
          if (lab) lab.className = "ltt-elab";
          p.paths[e.id] = { e: e, path: path, chev: chev, lab: lab };
          p.items[e.id] = [path, chev].concat(lab ? [lab] : []);
        });
        o.nodes.forEach(function (nd) {
          var box = h("div", { cls: "ltt-node" + (nd.shape === "round" ? " round" : "") + (nd.tone ? " " + nd.tone : "") + (nd.ghost ? " ghost" : ""), "data-solid": "", "data-tone": nd.tone || null });
          if (nd.icon) box.appendChild(h("span", { html: icon(nd.icon) }));
          if (nd.label) box.appendChild(h("span", { cls: "l", html: termHtml(nd.label, -1) }));
          var sub = h("span", { cls: "s", text: nd.sub || "" });
          if (nd.sub) box.appendChild(sub);
          box._sub = sub; box._subText = nd.sub || "";
          fig.lab.appendChild(box);
          p.nodes[nd.id] = box; p.items[nd.id] = [box];
        });
        p.place();
        return fitVis(fig.el);
      };
      p.edgeGeom = function (e) {
        var a = p.pos[e.from], b = p.pos[e.to], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        var L = p.layout;
        if (L.center && o.track && e.curve == null) {
          var ang = function (q) { return Math.atan2((q[1] - L.center[1]) / L.r[1], (q[0] - L.center[0]) / L.r[0]); };
          var a0 = ang(a), a1 = ang(b);
          while (a1 <= a0) a1 += Math.PI * 2;
          if (a1 - a0 > Math.PI * 1.5) a1 -= Math.PI * 2;
          var at = function (u) { var th = lerp(a0, a1, u); return [L.center[0] + L.r[0] * Math.cos(th), L.center[1] + L.r[1] * Math.sin(th)]; };
          return { a: a, b: b, c: at(0.5), len: Math.abs(a1 - a0) * (L.r[0] + L.r[1]) / 2, at: at, arc: true };
        }
        var bend = e.curve != null ? e.curve : edges.some(function (f) { return f.from === e.to && f.to === e.from; }) ? 0.18 : 0;
        if (o.layout === "ring" && e.curve == null && o.track) bend = 0;
        var cx = (a[0] + b[0]) / 2 - dy * bend, cy = (a[1] + b[1]) / 2 + dx * bend;
        return { a: a, b: b, c: [cx, cy], len: len, at: function (u) {
          var v = 1 - u;
          return [v * v * a[0] + 2 * v * u * cx + u * u * b[0], v * v * a[1] + 2 * v * u * cy + u * u * b[1]];
        } };
      };
      p.place = function () {
        o.nodes.forEach(function (nd) { p.fig.pos(p.nodes[nd.id], p.pos[nd.id][0], p.pos[nd.id][1]); });
        edges.forEach(function (e) {
          var g = p.edgeGeom(e), r = p.paths[e.id];
          if (g.arc) { var d = ""; for (var k = 0; k <= 24; k++) { var q = g.at(k / 24); d += (k ? "L" : "M") + q[0].toFixed(1) + "," + q[1].toFixed(1); } r.path.setAttribute("d", d); }
          else r.path.setAttribute("d", "M" + g.a[0] + "," + g.a[1] + " Q" + g.c[0] + "," + g.c[1] + " " + g.b[0] + "," + g.b[1]);
          var m = g.at(0.5), m2 = g.at(0.52), ang = Math.atan2(m2[1] - m[1], m2[0] - m[0]) * 180 / Math.PI;
          r.chev.setAttribute("transform", "translate(" + m[0] + "," + m[1] + ") rotate(" + ang + ")");
          if (r.lab) {
            var nx = -(g.b[1] - g.a[1]) / g.len, ny = (g.b[0] - g.a[0]) / g.len, off = Math.abs(ny) > 0.9 ? 0 : 26;
            p.fig.pos(r.lab, m[0] + nx * off, m[1] + ny * off);
          }
        });
      };
      p.reset = function () {
        Object.keys(p.layout.pos).forEach(function (id) { p.pos[id] = p.layout.pos[id].slice(); });
        p.place();
        while (p.dotLayer.firstChild) p.dotLayer.removeChild(p.dotLayer.firstChild);
        Object.keys(p.nodes).forEach(function (id) { var b = p.nodes[id]; b.style.boxShadow = ""; b._sub.textContent = b._subText; });
        edges.forEach(function (e) { p.paths[e.id].chev.classList.remove("hot"); });
      };
      p.anchorEl = function (id) { return p.nodes && p.nodes[id] || null; };
      p.anchor = function (id, path) {
        need(p.pos && p.pos[id] || p.paths && p.paths[id], (path || "points") + ": graph에 id '" + id + "'가 없다. 노드: " + o.nodes.map(function (x) { return x.id; }).join(", "));
        var xy = p.pos[id] || p.edgeGeom(p.paths[id].e).at(0.5);
        return [xy[0] / p.fig.W * 100, xy[1] / p.fig.H * 100];
      };
      function route(a, path) {
        var list = Array.isArray(a.along) ? a.along : String(a.along || "").split(">");
        need(list.length >= 2, path + ": along은 'a>b' 또는 ['a','b','c']");
        var segs = [];
        for (var i = 0; i + 1 < list.length; i++) {
          var e = edges.filter(function (x) { return x.from === list[i] && x.to === list[i + 1]; })[0];
          var rev = !e && edges.filter(function (x) { return x.to === list[i] && x.from === list[i + 1]; })[0];
          need(e || rev || ids[list[i]] && ids[list[i + 1]], path + ": '" + list[i] + "' → '" + list[i + 1] + "' 사이에 간선이나 노드가 없다");
          segs.push({ e: e || rev, rev: !!rev, from: list[i], to: list[i + 1] });
        }
        return segs;
      }
      // Dots travel only the visible part of each edge, from the edge of one box to the edge of the next.
      p.settle = function () {
        p.reset();
        var fr = p.fig.el.getBoundingClientRect();
        if (!fr.width) return;
        var k = fr.width / p.fig.W;
        p.nodeR = {};
        var moved = false;
        Object.keys(p.nodes).forEach(function (id) {
          var r = p.nodes[id].getBoundingClientRect(), base = p.layout.pos[id];
          p.nodeR[id] = Math.min(r.width, r.height) / 2 / k + 4;
          var dx = r.left < fr.left ? fr.left - r.left : r.right > fr.right ? fr.right - r.right : 0;
          var dy = r.top < fr.top ? fr.top - r.top : r.bottom > fr.bottom ? fr.bottom - r.bottom : 0;
          if (dx || dy) { base[0] += dx / k; base[1] += dy / k; moved = true; }
        });
        if (moved) p.reset();
      };
      function trim(s, len) { var r = p.nodeR || {}, a = Math.min((r[s.from] || 0) / len, 0.45), b = Math.min((r[s.to] || 0) / len, 0.45); return [a, 1 - b]; }
      function segLen(s) { return s.e ? p.edgeGeom(s.e).len : Math.hypot(p.pos[s.to][0] - p.pos[s.from][0], p.pos[s.to][1] - p.pos[s.from][1]); }
      function pointOn(segs, u) {
        var info = segs.map(function (s) { var L = segLen(s) || 1, t = trim(s, L); return { s: s, t: t, vis: L * (t[1] - t[0]) }; });
        var d = u * info.reduce(function (x, y) { return x + y.vis; }, 0);
        for (var i = 0; i < info.length; i++) {
          var x = info[i];
          if (d <= x.vis || i === info.length - 1) {
            var v = lerp(x.t[0], x.t[1], clamp(d / (x.vis || 1))), s = x.s;
            if (s.e) return p.edgeGeom(s.e).at(s.rev ? 1 - v : v);
            var a = p.pos[s.from], b = p.pos[s.to];
            return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)];
          }
          d -= x.vis;
        }
      }
      function dot(xy, r, t, op) { var c = svg("circle", { cx: xy[0], cy: xy[1], r: r, cls: "dot " + (t || "") }, p.dotLayer); if (op != null) c.style.opacity = op; return c; }
      p.checkArgs = function (verb, a, path) {
        if (verb === "travel") route(a, path);
        if (verb === "pulse" || verb === "set") need(ids[a.node], path + ": node '" + a.node + "'가 없다");
        if (verb === "set") cap(path + ".sub", a.sub, 20);
        if (verb === "flow") (a.edges || []).forEach(function (id) { need(p.paths ? p.paths[id] : edges.some(function (e) { return e.id === id; }), path + ": 간선 id '" + id + "'가 없다. 간선 id는 'from>to'"); });
        if (verb === "relayout") { need(a.to && typeof a.to === "object", path + ": relayout은 {to: {id: [x%, y%]}, m: 폰 자리}"); [a.to, a.m || {}].forEach(function (t) { Object.keys(t).forEach(function (id) { need(ids[id], path + ": relayout의 node '" + id + "'가 없다"); }); }); }
        if (verb === "zoom") p.anchor && a.to && !Array.isArray(a.to) && need(ids[a.to] || edges.some(function (e) { return e.id === a.to; }), path + ": zoom to '" + a.to + "'가 없다");
      };
      p.verbs = {
        travel: function (u, a) {
          if (u <= 0 || u >= 1 && !a.stay) return;
          var segs = route(a, "travel"), n = a.dots || 1, r = a.r || p.fig.W * 0.014, gap = a.gap || 0.08;
          for (var k = 0; k < n; k++) {
            var v = clamp(ease.inOut(u) - k * gap);
            if (v <= 0) continue;
            if (a.trail !== false) for (var j = 1; j <= 5; j++) { var w = v - j * 0.012; if (w > 0) dot(pointOn(segs, w), r * (1 - j * 0.13), a.tone, 0.45 - j * 0.07); }
            dot(pointOn(segs, v), r, a.tone);
          }
        },
        flow: function (u, a, dt, it) {
          if (u <= 0 || u >= 1) return;
          var list = a.edges || edges.map(function (e) { return e.id; }), n = a.n || 3, speed = a.speed || 0.6;
          list.forEach(function (id) {
            var g = p.edgeGeom(p.paths[id].e), tt = trim(p.paths[id].e, g.len);
            for (var k = 0; k < n; k++) {
              var v = lerp(tt[0], tt[1], (dt * speed + k / n) % 1);
              var fadeIn = clamp(dt / 0.3) * clamp((it.dur - dt) / 0.3);
              dot(g.at(v), a.r || p.fig.W * 0.009, a.tone, Math.sin(clamp((v - tt[0]) / (tt[1] - tt[0])) * Math.PI) * fadeIn);
            }
            p.paths[id].chev.classList.add("hot");
          });
        },
        pulse: function (u, a) {
          if (u <= 0 || u >= 1) return;
          var c = a.tone === "bad" ? "--ltt-bad" : a.tone === "good" ? "--ltt-good" : "--ltt-accent";
          var w = Math.sin(u * Math.PI) * 10;
          p.nodes[a.node].style.boxShadow = "0 0 0 " + w.toFixed(1) + "px color-mix(in srgb,var(" + c + ") " + Math.round((1 - u) * 60 + 15) + "%,transparent)";
        },
        set: function (u, a) {
          if (u <= 0) return;
          var b = p.nodes[a.node];
          if (a.sub != null) { b._sub.textContent = a.sub; if (!b._sub.parentNode) b.appendChild(b._sub); }
          if (a.tone) b.classList.add(a.tone);
        },
        relayout: function (u, a) {
          if (u <= 0) return;
          var e = ease.inOut(u), dest = p.mode && p.mode.mobile && a.m ? a.m : a.to;
          Object.keys(dest).forEach(function (id) {
            var from = p.pos[id], to = [dest[id][0] / 100 * p.fig.W, dest[id][1] / 100 * p.fig.H];
            p.pos[id] = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)];
          });
          p.place();
        }
      };
    });
  }

  /* ---------- sequence diagram ---------- */
  function sequence(o) {
    need(o && Array.isArray(o.actors) && Array.isArray(o.messages), "sequence는 {actors: [...], messages: [...]}");
    capList("sequence.actors", o.actors, 5, 2); capList("sequence.messages", o.messages, 10, 1);
    var ids = {};
    o.actors.forEach(function (a, i) { var x = typeof a === "string" ? { id: a, label: a } : a; o.actors[i] = x; ids[x.id] = i; cap("sequence.actors[" + i + "].label", x.label, 14); });
    o.messages.forEach(function (m, i) { need(ids[m.from] != null && ids[m.to] != null, "sequence.messages[" + i + "]: from·to는 actor id"); cap("sequence.messages[" + i + "].label", m.label, 24); tone("sequence.messages[" + i + "]", m.tone); });
    return makePart("sequence", "M", o, function (p) {
      p.usesFig = true;
      p.build = function (mode) {
        var n = o.actors.length, W = mode.mobile ? 600 : 1000, top = 70, row = mode.mobile ? 70 : 54, H = top + 30 + o.messages.length * row;
        var fig = p.fig = Fig(W, H), col = W / n;
        p.x = function (id) { return (ids[id] + 0.5) * col; };
        p.y = function (i) { return top + 30 + (i + 0.5) * row; };
        o.actors.forEach(function (a) {
          svg("line", { x1: p.x(a.id), x2: p.x(a.id), y1: top, y2: H, cls: "e dash" }, fig.svg);
          var box = h("div", { cls: "ltt-node", "data-solid": "" }, [h("span", { cls: "l", html: termHtml(a.label, -1) })]);
          fig.lab.appendChild(box); fig.pos(box, p.x(a.id), top / 2 + 4);
          p.items[a.id] = [box];
        });
        p.dotLayer = svg("g", {}, fig.svg);
        p.msgs = o.messages.map(function (m, i) {
          var y = p.y(i), x1 = p.x(m.from), x2 = p.x(m.to), self = x1 === x2;
          var d = self ? "M" + x1 + "," + (y - 12) + " h40 v24 h-40" : "M" + x1 + "," + y + " L" + x2 + "," + y;
          var line = svg("path", { d: d, cls: "e" + (m.reply ? " dash" : "") + (m.tone ? " " + m.tone : "") }, fig.svg);
          line.style.stroke = m.tone ? "" : "var(--ltt-ink-2)";
          var dir = x2 >= x1 ? 1 : -1;
          var head = svg("path", { d: self ? "M" + (x1 + 2) + "," + (y + 12) + " l10,-6 v12 z" : "M" + x2 + "," + y + " l" + (-12 * dir) + ",-6 v12 z", cls: "chev" }, fig.svg);
          head.style.fill = m.tone ? "var(--ltt-" + m.tone + ")" : "var(--ltt-ink-2)";
          var last = ids[m.from] === n - 1;
          var lab = self ? fig.label(last ? x1 - 14 : x1 + 52, y, m.label, { anchor: last ? "r" : "l", cls: "chip", tone: m.tone }) : fig.label((x1 + x2) / 2, y - 16, m.label, { cls: "chip", tone: m.tone });
          p.items["m" + i] = [line, head, lab];
          return { line: line, head: head, lab: lab, m: m, y: y, x1: x1, x2: x2 };
        });
        return fitVis(fig.el);
      };
      p.prepare = function (tl) { p.sending = tl.items.some(function (it) { return it.verb === "send"; }); };
      p.reset = function () {
        while (p.dotLayer.firstChild) p.dotLayer.removeChild(p.dotLayer.firstChild);
        p.msgs.forEach(function (r) { fade([r.line, r.head, r.lab], p.sending ? 0 : 1); });
      };
      p.anchor = function (id) {
        if (ids[id] != null) return [p.x(id) / p.fig.W * 100, 6];
        var i = +String(id).replace(/^m/, "");
        need(p.msgs[i], "sequence id는 actor id 또는 m0…m" + (p.msgs.length - 1));
        return [(p.msgs[i].x1 + p.msgs[i].x2) / 2 / p.fig.W * 100, p.msgs[i].y / p.fig.H * 100];
      };
      p.checkArgs = function (verb, a, path) { if (verb === "send") need(a.i >= 0 && a.i < o.messages.length || a.to != null, path + ": send는 {i} 또는 {to}"); };
      p.verbs = {
        send: function (u, a) {
          var list = a.i != null ? [a.i] : []; if (a.to != null) for (var k = a.from || 0; k <= a.to; k++) list.push(k);
          var per = 1 / list.length;
          list.forEach(function (i, j) {
            var v = clamp((u - j * per) / per), r = p.msgs[i];
            if (v <= 0) return;
            fade([r.line], Math.min(1, v * 2.5)); fade([r.head, r.lab], v >= 0.85 ? 1 : 0);
            if (v < 1 && r.x1 !== r.x2) svg("circle", { cx: lerp(r.x1, r.x2, ease.inOut(v)), cy: r.y, r: 7, cls: "dot " + (r.m.tone || "") }, p.dotLayer);
          });
        }
      };
    });
  }

  /* ---------- chart: fixed axes, marks drawn in svg, every text in html ---------- */
  // A null point breaks the line: the next point starts a new run.
  function lineD(pts, type) {
    var out = "", gap = true;
    pts.forEach(function (q) {
      if (!q) { gap = true; return; }
      out += gap ? "M" + q[0].toFixed(1) + "," + q[1].toFixed(1) : type === "step" ? "H" + q[0].toFixed(1) + "V" + q[1].toFixed(1) : "L" + q[0].toFixed(1) + "," + q[1].toFixed(1);
      gap = false;
    });
    return out;
  }
  function areaD(pts, y0) {
    var runs = [[]];
    pts.forEach(function (q) { if (q) runs[runs.length - 1].push(q); else if (runs[runs.length - 1].length) runs.push([]); });
    return runs.filter(function (r) { return r.length; }).map(function (r) { return lineD(r) + "L" + r[r.length - 1][0].toFixed(1) + "," + y0 + "L" + r[0][0].toFixed(1) + "," + y0 + "Z"; }).join("");
  }
  function isNum(v) { return typeof v === "number" && !isNaN(v); }
  var SERIES_TYPES = { line: 1, area: 1, bar: 1, dot: 1, step: 1 };
  function chart(o) {
    need(o && o.x && o.y && Array.isArray(o.series), "chart는 {x: {...}, y: {domain: [a, b]}, series: [...]}");
    capList("chart.series", o.series, 6, 1);
    var cats = o.x.cats;
    if (cats) capList("chart.x.cats", cats, 12, 1); else need(Array.isArray(o.x.domain) && o.x.domain.length === 2, "chart.x.domain = [최소, 최대]가 필요하다(축은 움직이는 동안 고정된다). 범주 축이면 x.cats");
    need(Array.isArray(o.y.domain) && o.y.domain.length === 2, "chart.y.domain = [최소, 최대]가 필요하다");
    cap("chart.x.label", o.x.label, 28); cap("chart.y.label", o.y.label, 28);
    var sids = {};
    o.series.forEach(function (s, i) {
      var at = "chart.series[" + i + "]";
      need(SERIES_TYPES[s.type || "line"], at + ".type은 line·area·bar·dot·step");
      need(Array.isArray(s.points) || Array.isArray(s.values), at + "에 points [[x, y], …] 또는 values(범주 축)가 필요하다");
      if (s.points) { need(s.points.length <= 400, at + ".points ≤ 400"); s.points.forEach(function (pt, j) { need(Array.isArray(pt) && pt.length >= 2 && (isNum(pt[1]) || pt[1] == null), at + ".points[" + j + "]는 [x, y] (y가 null이면 선이 끊긴다)"); }); }
      if (s.values) { need(cats && s.values.length === cats.length, at + ".values 길이는 x.cats와 같아야 한다"); s.values.forEach(function (v, j) { need(isNum(v) || v == null, at + ".values[" + j + "]는 숫자나 null"); }); }
      cap(at + ".label", s.label, 18); tone(at, s.tone);
      s.id = s.id || "s" + i; sids[s.id] = 1;
    });
    (o.refs || []).forEach(function (r, i) { need(r.x != null || r.y != null, "chart.refs[" + i + "]에 x 또는 y가 필요하다"); cap("chart.refs[" + i + "].label", r.label, 20); r.id = r.id || "ref" + i; });
    return makePart("chart", "S", o, function (p) {
      p.usesFig = true;
      p.build = function (mode) {
        var ar = mode.mobile ? (o.mobileAspect || 1.15) : (o.aspect || 2);
        // Phone charts use a ~1 unit = 1px viewBox so margins hold the fixed-size tick labels; series names move to a key.
        var W = mode.mobile ? 380 : 1000, H = W / ar;
        var multi = o.series.length > 1;
        var hasEnd = !mode.mobile && multi && o.series.some(function (s) { return s.label && (s.type || "line") !== "bar" && s.type !== "dot"; });
        var m = mode.mobile ? { l: 46, r: 12, t: o.y.label ? 34 : 12, b: o.x.label ? 52 : 28 } : { l: 84, r: hasEnd ? 170 : 30, t: o.y.label ? 64 : 28, b: o.x.label ? 78 : 50 };
        var fig = p.fig = Fig(W, H);
        p.mobile = mode.mobile; p.hasEnd = hasEnd;
        // Margins hold html labels whose size is in px; settle() redraws once with margins measured in this chart's px per unit.
        p.draw = function (m) {
        while (fig.svg.firstChild) fig.svg.removeChild(fig.svg.firstChild);
        while (fig.lab.firstChild) fig.lab.removeChild(fig.lab.firstChild);
        Object.keys(p.items).forEach(function (k) { delete p.items[k]; });
        var X = cats ? function (v) { var i = typeof v === "number" ? v : cats.indexOf(v); return m.l + (i + 0.5) / cats.length * (W - m.l - m.r); }
          : scale(o.x.domain[0], o.x.domain[1], m.l, W - m.r);
        var Y = scale(o.y.domain[0], o.y.domain[1], H - m.b, m.t);
        p.X = X; p.Y = Y; p.m = m; p.W = W; p.H = H;
        var g = svg("g", {}, fig.svg);
        var yt = o.y.ticks || niceTicks(o.y.domain[0], o.y.domain[1], mode.mobile ? 4 : 5);
        yt.forEach(function (v) {
          svg("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), cls: "grid" }, g);
          fig.label(m.l - 12, Y(v), (o.y.fmt ? o.y.fmt(v) : fmt(v)) + (o.y.unit || ""), { anchor: "r", cls: "muted" });
        });
        if (cats) cats.forEach(function (c, i) { fig.label(X(i), H - m.b + 12, String(c), { anchor: "t", cls: "muted" }); });
        else (o.x.ticks || niceTicks(o.x.domain[0], o.x.domain[1], mode.mobile ? 4 : 6)).forEach(function (v) {
          fig.label(X(v), H - m.b + 12, (o.x.fmt ? o.x.fmt(v) : fmt(v)) + (o.x.unit || ""), { anchor: "t", cls: "muted" });
        });
        svg("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, cls: "axis" }, g);
        if (o.x.label) { var xl = fig.label((m.l + W - m.r) / 2, H - 4, o.x.label, { anchor: "b", cls: "muted" }); xl.style.whiteSpace = "normal"; xl.style.textAlign = "center"; xl.style.width = "max-content"; xl.style.maxWidth = "96cqw"; xl.setAttribute("data-xlabel", ""); }
        if (o.y.label) { var yl = fig.label(0, 4, o.y.label, { anchor: "", cls: "muted" }); yl.style.transform = "none"; yl.style.whiteSpace = "normal"; yl.style.width = "max-content"; yl.style.maxWidth = "96cqw"; yl.setAttribute("data-ylabel", ""); }
        p.bandEl = svg("rect", { cls: "band", y: m.t, height: H - m.b - m.t, width: 0, x: m.l }, g);
        (o.refs || []).forEach(function (r) {
          var ln = r.x != null ? svg("line", { x1: X(r.x), x2: X(r.x), y1: m.t, y2: H - m.b, cls: "ref" }, g) : svg("line", { x1: m.l, x2: W - m.r, y1: Y(r.y), y2: Y(r.y), cls: "ref" }, g);
          var right = r.x != null && (r.x - (cats ? 0 : o.x.domain[0])) / ((cats ? cats.length : o.x.domain[1] - o.x.domain[0]) || 1) > 0.6;
          var lb = r.label ? (r.x != null ? fig.label(X(r.x) + (right ? -1 : 1) * (mode.mobile ? 4 : 8), m.t + 4, r.label, { anchor: right ? "r" : "l", cls: "strong", tone: r.tone }) : fig.label(W - m.r - 6, Y(r.y) - (mode.mobile ? 10 : 14), r.label, { anchor: "r", cls: "strong", tone: r.tone })) : null;
          if (lb) {
            lb.setAttribute("data-dodge", "");
            var room = r.x == null ? W - m.r - m.l : right ? X(r.x) - m.l : W - X(r.x);
            lb.style.whiteSpace = "normal"; lb.style.width = "max-content"; lb.style.maxWidth = (Math.max(room - 8, 60) / W * 100) + "cqw";
            if (r.x != null) lb.style.transform = right ? "translate(-100%,0)" : "none";
          }
          p.items[r.id] = [ln].concat(lb ? [lb] : []);
        });
        var bars = o.series.filter(function (s) { return s.type === "bar"; }), stack = !!o.stack;
        var bw = cats ? (W - m.l - m.r) / cats.length * (stack ? 0.56 : 0.66 / Math.max(1, bars.length)) : 0;
        var cum = cats ? cats.map(function () { return 0; }) : [];
        p.marks = {};
        o.series.forEach(function (s, si) {
          var color = s.tone ? "var(--ltt-" + (s.tone === "ink" ? "ink" : s.tone) + ")" : "var(--ltt-c" + (si % 6 + 1) + ")";
          var pts = s.points ? s.points.map(function (pt) { return isNum(pt[1]) ? [X(pt[0]), Y(pt[1])] : null; }) : s.values.map(function (v, i) { return isNum(v) ? [X(i), Y(v)] : null; });
          var els = [], type = s.type || "line";
          if (type === "line" || type === "area" || type === "step") {
            var d = lineD(pts, type);
            if (type === "area") { var area = svg("path", { d: areaD(pts, Y(Math.max(o.y.domain[0], 0))) }, g); area.style.fill = color; area.style.opacity = 0.16; els.push(area); }
            var path = svg("path", { d: d }, g);
            path.style.fill = "none"; path.style.stroke = color; path.style.strokeWidth = s.width || 3; path.style.strokeLinejoin = "round"; path.style.strokeLinecap = "round";
            path.setAttribute("vector-effect", "non-scaling-stroke");
            if (s.dash) path.style.strokeDasharray = "7 6";
            els.push(path);
            p.marks[s.id] = { kind: "line", type: type, path: path, pts: pts, area: els[0] !== path ? els[0] : null, dash: s.dash ? "7 6" : "" };
            if (s.label && hasEnd) {
              var last = pts.filter(Boolean).pop();
              var lb = fig.label((cats ? W - m.r : last[0]) + 10, last[1], s.label, { anchor: "l", cls: "strong" });
              lb.style.color = color; lb.setAttribute("data-dodge", "");
              lb.style.whiteSpace = "normal"; lb.style.width = "max-content"; lb.style.maxWidth = ((W - last[0] - 16) / W * 100) + "cqw"; els.push(lb); p.marks[s.id].lab = lb;
            }
          } else if (type === "dot") {
            var ds = pts.map(function (q) { var c = svg("circle", { cx: q ? q[0] : 0, cy: q ? q[1] : 0, r: s.r || 6 }, g); c.style.fill = color; c.style.opacity = s.opacity || 0.85; return c; });
            els = els.concat(ds);
            p.marks[s.id] = { kind: "dot", dots: ds, pts: pts };
          } else {
            var bi = bars.indexOf(s);
            var vals = s.values || s.points.map(function (pt) { return pt[1]; });
            var xs = s.values ? vals.map(function (v, i) { return X(i); }) : s.points.map(function (pt) { return X(pt[0]); });
            var bx = function (x) { return stack ? x - bw / 2 : x - bw * bars.length / 2 + bi * bw; };
            var rects = xs.map(function (x) { var r = svg("rect", { x: bx(x) + 2, width: Math.max(2, bw - 4), y: 0, height: 0, rx: stack ? 1 : 3 }, g); r.style.fill = color; return r; });
            var top = !stack || bi === bars.length - 1;
            var labs = s.showValues === false || o.showValues === false || !top ? [] : xs.map(function (x) { return fig.label(bx(x) + bw / 2, 0, "", { anchor: "b", cls: "strong" }); });
            els = els.concat(rects, labs);
            p.marks[s.id] = { kind: "bar", rects: rects, labs: labs, vals: vals, xs: xs, unit: s.unit || "", pts: xs.map(function (x, i) { return isNum(vals[i]) ? [x, Y(vals[i])] : null; }) };
          }
          p.items[s.id] = els;
        });
        p.cursor = svg("g", {}, fig.svg);
        p.barIds = bars.map(function (s) { return s.id; });
        };
        p.draw(m);
        var key = null;
        var named = o.series.filter(function (s) { return s.label; });
        // Phones have no line-end names, so a labelled series is named in the key even with legend: false.
        if (named.length && (mode.mobile ? multi || o.legend === false : multi && !hasEnd && o.legend !== false)) {
          key = h("div", { cls: "ltt-key", "data-solid": "" }, named.map(function (s) {
            var si = o.series.indexOf(s), i = h("i"); i.style.background = s.tone ? "var(--ltt-" + s.tone + ")" : "var(--ltt-c" + (si % 6 + 1) + ")";
            return h("span", {}, [i, h("span", { html: termHtml(s.label, -1) })]);
          }));
        }
        return key ? h("div", { cls: "ltt-wk" }, [key, h("div", { cls: "ltt-vis" }, [fig.el])]) : fitVis(fig.el);
      };
      // End labels of lines that finish close together are pushed apart once the chart has a size.
      p.settle = function () {
        var fr = p.fig.el.getBoundingClientRect();
        if (!fr.height) return;
        var k0 = fr.width / p.W, lab = [].slice.call(p.fig.lab.children), m = p.m;
        var size = function (sel) { return lab.filter(function (e) { return e.matches(sel); }).map(function (e) { return e.getBoundingClientRect(); }); };
        var yt = size(".ltt-label.r:not([data-dodge])"), xt = size(".ltt-label.t"), xl = size("[data-xlabel]"), yl = size("[data-ylabel]");
        var wmax = function (rs) { return rs.reduce(function (a, r) { return Math.max(a, r.width); }, 0); }, hmax = function (rs) { return rs.reduce(function (a, r) { return Math.max(a, r.height); }, 0); };
        var need = {
          l: (wmax(yt) + 16) / k0,
          b: (hmax(xt) + 14 + (xl.length ? hmax(xl) + 8 : 0)) / k0,
          t: (yl.length ? hmax(yl) + 18 : 12) / k0,
          r: Math.max(p.hasEnd ? Math.min(p.W * 0.3, (wmax(Object.keys(p.marks).map(function (id) { return p.marks[id].lab; }).filter(Boolean).map(function (e) { return e.getBoundingClientRect(); })) + 18) / k0) : 14 / k0,
            (xt.reduce(function (a, r) { return Math.max(a, r.right); }, -1e9) - fr.left - (p.W - m.r) * k0 + 6) / k0)
        };
        if (["l", "b", "t", "r"].some(function (s) { return Math.abs(need[s] - m[s]) > 3; })) {
          p.m = { l: need.l, b: need.b, t: need.t, r: Math.max(need.r, 8 / k0) };
          p.draw(p.m);
          p.reset();
        }
        // Line-end names: stack in y order with a gap, then lift the stack if it would run past the x axis.
        var ends = Object.keys(p.marks).map(function (id) { return p.marks[id].lab; }).filter(Boolean);
        if (ends.length) {
          var k = fr.height / p.H, lo = fr.top + (p.H - p.m.b) * k, hi = fr.top + p.m.t * k - 6;
          var it = ends.map(function (l) { var r = l.getBoundingClientRect(); return { l: l, c: r.top + r.height / 2, h: r.height }; }).sort(function (a, b) { return a.c - b.c; });
          for (var i = 1; i < it.length; i++) it[i].c = Math.max(it[i].c, it[i - 1].c + (it[i - 1].h + it[i].h) / 2 + 3);
          var over = it[it.length - 1].c + it[it.length - 1].h / 2 - lo;
          if (over > 0) it.forEach(function (x) { x.c -= over; });
          var under = hi - (it[0].c - it[0].h / 2);
          if (under > 0) it.forEach(function (x) { x.c += under; });
          it.forEach(function (x) { x.l.style.top = ((x.c - fr.top) / fr.height * 100) + "%"; x.l.removeAttribute("data-dodge"); });
        }
        var labs = [].slice.call(p.fig.lab.querySelectorAll("[data-dodge]")).concat(ends);
        if (!labs.length) return;
        var placed = [].slice.call(p.fig.lab.querySelectorAll("[data-ylabel]")).map(function (e) { return e.getBoundingClientRect(); });
        labs.map(function (l) { return { l: l, r: l.getBoundingClientRect() }; }).sort(function (a, b) { return a.r.top - b.r.top; }).forEach(function (x) {
          var dy = 0, moved = true;
          while (moved) {
            moved = false;
            placed.forEach(function (q) {
              if (x.r.left < q.right && x.r.right > q.left && x.r.top + dy < q.bottom + 2 && x.r.bottom + dy > q.top - 2) { dy = q.bottom + 3 - x.r.top; moved = true; }
            });
          }
          if (dy) x.l.style.top = ((parseFloat(x.l.style.top) / 100 * fr.height + dy) / fr.height * 100) + "%";
          placed.push({ left: x.r.left, right: x.r.right, top: x.r.top + dy, bottom: x.r.bottom + dy });
        });
        Object.keys(p.marks).forEach(function (id) { var mk = p.marks[id], last = mk.lab && mk.pts.filter(Boolean).pop(); if (last) mk.labOff = parseFloat(mk.lab.style.top) - last[1] / p.H * 100; });
      };
      p.prepare = function (tl) { p.hidden = {}; tl.items.forEach(function (it) { if (it.verb === "draw" || it.verb === "grow") (it.args.id ? [it.args.id] : Object.keys(p.marks)).forEach(function (id) { p.hidden[id] = it.verb; }); }); };
      p.reset = function () {
        p.bandEl.setAttribute("width", 0);
        while (p.cursor.firstChild) p.cursor.removeChild(p.cursor.firstChild);
        Object.keys(p.marks).forEach(function (id) {
          var mk = p.marks[id], hid = p.hidden && p.hidden[id];
          if (mk.kind === "line") {
            mk.cur = mk.pts; lineGeom(mk);
            mk.len = mk.len || mk.path.getTotalLength();
            mk.path.style.strokeDasharray = hid ? mk.len + " " + mk.len : mk.dash; mk.path.style.strokeDashoffset = hid ? mk.len : "";
            if (mk.area) mk.area.style.opacity = hid ? 0 : 0.16; if (mk.lab) mk.lab.style.opacity = hid ? 0 : "";
          }
          if (mk.kind === "dot") { mk.cur = mk.pts; dotGeom(mk); mk.shown = hid ? 0 : mk.dots.length; mk.dots.forEach(function (c, i) { c.style.display = hid || !mk.pts[i] ? "none" : ""; }); }
          if (mk.kind === "bar") { mk.cur = mk.vals.slice(); mk.g = mk.vals.map(function () { return hid ? 0 : 1; }); }
        });
        renderBars();
      };
      function lineGeom(mk) {
        mk.path.setAttribute("d", lineD(mk.cur, mk.type));
        if (mk.area) mk.area.setAttribute("d", areaD(mk.cur, p.Y(Math.max(o.y.domain[0], 0))));
        var last = mk.cur.filter(Boolean).pop();
        if (mk.lab && last) mk.lab.style.top = last[1] / p.H * 100 + (mk.labOff || 0) + "%";
      }
      function dotGeom(mk) { mk.dots.forEach(function (c, i) { var q = mk.cur[i]; if (q) { c.setAttribute("cx", q[0]); c.setAttribute("cy", q[1]); } }); }
      function renderBars() {
        var cum = [], base0 = Math.max(o.y.domain[0], 0);
        (p.barIds || []).forEach(function (id) {
          var mk = p.marks[id];
          mk.rects.forEach(function (r, i) {
            var v = mk.cur[i], gv = mk.g[i];
            if (!isNum(v)) { r.setAttribute("height", 0); if (mk.labs[i]) mk.labs[i].style.opacity = 0; return; }
            var lo = o.stack ? cum[i] || 0 : base0, hi = lo + (o.stack ? v : v - base0) * gv;
            if (o.stack) cum[i] = hi;
            var y0 = p.Y(lo), y1 = p.Y(hi);
            r.setAttribute("y", Math.min(y0, y1)); r.setAttribute("height", Math.abs(y0 - y1));
            var lab = mk.labs[i];
            if (lab) {
              var shown = o.stack ? p.barIds.reduce(function (a, k) { var c = p.marks[k].cur[i]; return a + (isNum(c) ? c : 0); }, 0) : v;
              lab.textContent = (o.y.fmt ? o.y.fmt(shown) : fmt(shown)) + mk.unit;
              lab.style.opacity = gv >= 1 ? "" : 0;
              lab.style.top = (Math.min(y0, y1) - 6) / p.H * 100 + "%";
            }
          });
        });
      }
      p.anchor = function (id, path) {
        var mk = p.marks && p.marks[id];
        if (mk) { var q = mk.pts.filter(Boolean).pop() || [p.W / 2, p.H / 2]; return [q[0] / p.W * 100, q[1] / p.H * 100]; }
        var r = (o.refs || []).filter(function (x) { return x.id === id; })[0];
        need(r, (path || "points") + ": chart에 id '" + id + "'가 없다. series: " + o.series.map(function (s) { return s.id; }).join(", "));
        return r.x != null ? [p.X(r.x) / p.W * 100, 12] : [90, p.Y(r.y) / p.H * 100];
      };
      p.checkArgs = function (verb, a, path) {
        if ((verb === "draw" || verb === "grow" || verb === "point" || verb === "to") && a.id) need(sids[a.id], path + ": chart에 series id '" + a.id + "'가 없다. 있는 id: " + Object.keys(sids).join(", "));
        if (verb === "to") {
          need(a.id && (Array.isArray(a.points) || Array.isArray(a.values)), path + ": to는 {id, points: [[x, y], …]} 또는 {id, values: [...]}");
          (a.points || a.values.map(function (v) { return [0, v]; })).forEach(function (pt) { need(pt[1] == null || pt[1] >= Math.min(o.y.domain[0], o.y.domain[1]) && pt[1] <= Math.max(o.y.domain[0], o.y.domain[1]), path + ": to의 y값 " + pt[1] + "이 y.domain 밖이다(축은 고정된다)"); });
        }
        if (verb === "point") need(a.id && !cats, path + ": point는 {id, from, to}로 x축을 따라 움직인다(범주 축 불가)");
      };
      function yAt(mk, xv) {
        var pts = (mk.cur || mk.pts).filter(Boolean), x = p.X(xv), best = pts[0];
        for (var i = 1; i < pts.length; i++) {
          var a = pts[i - 1], b = pts[i];
          if ((x - a[0]) * (x - b[0]) <= 0) return [x, lerp(a[1], b[1], (x - a[0]) / ((b[0] - a[0]) || 1))];
          if (Math.abs(b[0] - x) < Math.abs(best[0] - x)) best = b;
        }
        return best;
      }
      p.verbs = {
        draw: function (u, a) {
          (a.id ? [a.id] : Object.keys(p.marks)).forEach(function (id) {
            var mk = p.marks[id];
            if (mk.kind === "line") {
              if (u >= 1) { mk.path.style.strokeDasharray = mk.dash; mk.path.style.strokeDashoffset = ""; }
              else { mk.path.style.strokeDasharray = mk.len + " " + mk.len; mk.path.style.strokeDashoffset = mk.len * (1 - ease.inOut(u)); }
              if (mk.area) mk.area.style.opacity = 0.16 * u; if (mk.lab) mk.lab.style.opacity = u >= 1 ? "" : 0;
            }
            if (mk.kind === "dot") { var k = Math.round(mk.dots.length * u); mk.dots.forEach(function (c, i) { c.style.display = i < k && mk.cur[i] ? "" : "none"; }); }
            if (mk.kind === "bar") p.verbs.grow(u, { id: id });
          });
        },
        grow: function (u, a) {
          (a.id ? [a.id] : Object.keys(p.marks)).forEach(function (id) {
            var mk = p.marks[id];
            if (mk.kind !== "bar") return p.verbs.draw(u, { id: id });
            var n = mk.rects.length;
            mk.g = mk.rects.map(function (r, i) { return ease.out(clamp(u * (1 + (n - 1) * 0.25) - i * 0.25)); });
          });
          renderBars();
        },
        scan: function (u, a) {
          if (u <= 0) return;
          var x0 = p.X(a.from != null ? a.from : cats ? 0 : o.x.domain[0]), x1 = p.X(a.to != null ? a.to : cats ? cats.length - 1 : o.x.domain[1]);
          var w = a.width != null ? Math.abs(p.X(a.width) - p.X(0)) : 26, x = lerp(x0, x1, ease.inOut(u)) - w / 2;
          if (u >= 1 && !a.keep) return;
          p.bandEl.setAttribute("x", x); p.bandEl.setAttribute("width", w);
        },
        to: function (u, a) {
          if (u <= 0) return;
          var mk = p.marks[a.id], e = ease.inOut(u);
          if (mk.kind === "bar") {
            var tv = a.values || a.points.map(function (pt) { return pt[1]; });
            mk.cur = mk.cur.map(function (v, i) { var t = tv[Math.min(i, tv.length - 1)]; return isNum(v) && isNum(t) ? lerp(v, t, e) : e < 0.5 ? v : t; });
            renderBars();
            return;
          }
          var target = a.points ? a.points.map(function (pt) { return isNum(pt[1]) ? [p.X(pt[0]), p.Y(pt[1])] : null; }) : a.values.map(function (v, i) { return isNum(v) && mk.pts[i] !== undefined ? [cats ? p.X(i) : (mk.pts[i] || [0])[0], p.Y(v)] : null; });
          mk.cur = mk.cur.map(function (q, i) { var t = target[Math.min(i, target.length - 1)]; return q && t ? [lerp(q[0], t[0], e), lerp(q[1], t[1], e)] : e < 0.5 ? q : t; });
          if (mk.kind === "line") { lineGeom(mk); if (!(p.hidden && p.hidden[a.id])) mk.path.style.strokeDasharray = mk.dash; }
          if (mk.kind === "dot") { dotGeom(mk); mk.dots.forEach(function (c, i) { if (!mk.cur[i]) c.style.display = "none"; else if (c.style.display === "none" && i < (mk.shown || 0)) c.style.display = ""; }); }
        },
        point: function (u, a) {
          if (u <= 0 || u >= 1 && !a.keep) return;
          var mk = p.marks[a.id], xv = lerp(a.from != null ? a.from : o.x.domain[0], a.to != null ? a.to : o.x.domain[1], ease.inOut(u)), q = yAt(mk, xv);
          if (!q) return;
          svg("line", { x1: q[0], x2: q[0], y1: q[1], y2: p.H - p.m.b, cls: "ref" }, p.cursor);
          var c = svg("circle", { cx: q[0], cy: q[1], r: 9, cls: "dot ink" }, p.cursor);
          c.style.stroke = "var(--ltt-bg)"; c.style.strokeWidth = 3;
        }
      };
    });
  }

  /* ---------- dist: seeded particles fall into bins ---------- */
  function dist(o) {
    need(o && o.bins && o.bins.n > 1, "dist는 {bins: {min, max, n}, sample: 'normal' | {mean, sd} | [값...], n}");
    need(o.bins.n <= 24, "dist.bins.n ≤ 24");
    var n = o.n || 160;
    need(n <= 400, "dist.n ≤ 400");
    cap("dist.label", o.label, 28);
    var r = rng(o.seed), vals = [];
    function normal() { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var s = o.sample || "normal", mean = s.mean != null ? s.mean : (o.bins.min + o.bins.max) / 2, sd = s.sd != null ? s.sd : (o.bins.max - o.bins.min) / 6;
    for (var i = 0; i < n; i++) vals.push(Array.isArray(s) ? s[i % s.length] : typeof s === "function" ? s(r) : mean + sd * normal());
    var bw = (o.bins.max - o.bins.min) / o.bins.n;
    var binOf = vals.map(function (v) { return Math.max(0, Math.min(o.bins.n - 1, Math.floor((v - o.bins.min) / bw))); });
    var counts = new Array(o.bins.n).fill(0), slot = binOf.map(function (b) { return counts[b]++; });
    var maxC = Math.max.apply(null, counts);
    return makePart("dist", "M", o, function (p) {
      p.usesFig = true;
      p.build = function (mode) {
        var W = 1000, H = mode.mobile ? 900 : 560, m = { l: 40, r: 40, t: 40, b: 60 };
        var fig = p.fig = Fig(W, H), X = scale(o.bins.min, o.bins.max, m.l, W - m.r), cw = (W - m.l - m.r) / o.bins.n;
        var rad = Math.min(cw / 2.6, (H - m.t - m.b - 120) / (maxC * 2.1));
        p.geom = { X: X, cw: cw, rad: rad, m: m, W: W, H: H };
        svg("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, cls: "axis" }, fig.svg);
        niceTicks(o.bins.min, o.bins.max, mode.mobile ? 4 : 6).forEach(function (v) { fig.label(X(v), H - m.b + 12, fmt(v) + (o.unit || ""), { anchor: "t", cls: "muted" }); });

        var jit = rng((o.seed || 7) + 101);
        p.balls = vals.map(function (v, i) {
          var c = svg("circle", { r: rad, cls: "dot" }, fig.svg);
          return { c: c, tx: m.l + (binOf[i] + 0.5) * cw, ty: H - m.b - rad - slot[i] * rad * 2.05, x0: W / 2 + (jit() - 0.5) * 40 };
        });
        var cpts = [];
        for (var k = 0; k <= 80; k++) { var x = lerp(o.bins.min, o.bins.max, k / 80), z = (x - mean) / sd; cpts.push([X(x), H - m.b - Math.exp(-z * z / 2) / (sd * Math.sqrt(2 * Math.PI)) * n * bw * rad * 2.05]); }
        p.curve = svg("path", { d: cpts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + "," + q[1].toFixed(1); }).join("") }, fig.svg);
        p.curve.style.fill = "none"; p.curve.style.stroke = "var(--ltt-ink)"; p.curve.style.strokeWidth = 3; p.curve.setAttribute("vector-effect", "non-scaling-stroke");
        p.items.curve = [p.curve];
        return o.label ? h("div", { cls: "ltt-wk" }, [h("div", { cls: "ltt-vis" }, [fig.el]), h("div", { cls: "ltt-key", html: termHtml(o.label, -1) })]) : fitVis(fig.el);
      };
      p.prepare = function (tl) { p.dropping = tl.items.some(function (it) { return it.verb === "drop"; }); p.curving = tl.items.some(function (it) { return it.verb === "curve"; }); };
      p.reset = function () {
        p.balls.forEach(function (b) { b.c.setAttribute("cx", b.tx); b.c.setAttribute("cy", b.ty); b.c.style.opacity = p.dropping ? 0 : 1; });
        p.curveLen = p.curveLen || p.curve.getTotalLength();
        p.curve.style.strokeDasharray = p.curveLen; p.curve.style.strokeDashoffset = p.curving ? p.curveLen : 0;
      };
      p.anchor = function (id) { return id === "curve" ? [50, 20] : [50, 80]; };
      p.verbs = {
        drop: function (u) {
          var N = p.balls.length, g = p.geom;
          p.balls.forEach(function (b, i) {
            var v = clamp(u * 1.6 - i / N * 0.6);
            if (v <= 0) return;
            b.c.style.opacity = 1;
            var e = ease.in(clamp(v * 1.4)), x = lerp(b.x0, b.tx, ease.inOut(clamp(v * 1.2))), y = lerp(g.m.t, b.ty, e);
            b.c.setAttribute("cx", x); b.c.setAttribute("cy", Math.min(y, b.ty));
          });
        },
        curve: function (u) { p.curve.style.strokeDashoffset = p.curveLen * (1 - ease.inOut(u)); }
      };
    });
  }

  /* ---------- morph: named shapes tween between named states; every coordinate is % of the figure ---------- */
  var SHAPES = { rect: 1, circle: 1, ellipse: 1, line: 1, path: 1, polygon: 1, label: 1 };
  var MX = { x: 1, x1: 1, x2: 1, cx: 1, width: 1, rx: 1, r: 1 }, MY = { y: 1, y1: 1, y2: 1, cy: 1, height: 1, ry: 1 };
  var MSTYLE = { fill: "--mf", stroke: "--ms", strokeWidth: "--mw", dash: "--md" };
  function pctPath(d, W, H) {
    var out = "", re = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g, m;
    while ((m = re.exec(d))) {
      var U = m[1].toUpperCase(), nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
      out += m[1] + nums.map(function (v, i) {
        var k = U === "A" ? i % 7 : i;
        var sx = U === "H" || (U === "A" ? k === 0 || k === 5 : U !== "V" && i % 2 === 0), sy = U === "V" || (U === "A" ? k === 1 || k === 6 : U !== "H" && i % 2 === 1);
        return +(sx ? v * W / 100 : sy ? v * H / 100 : v).toFixed(2);
      }).join(" ");
    }
    return out;
  }
  function pctPoints(pts, W, H) { return (String(pts).match(/-?\d*\.?\d+/g) || []).map(Number).map(function (v, i) { return +(i % 2 ? v * H / 100 : v * W / 100).toFixed(2); }).join(" "); }
  function morph(o) {
    need(o && o.shapes, "morph는 {aspect, shapes: {id: {kind, ...}}, states: {이름: {id: {...}}}}. 좌표는 모두 그림의 %");
    var ids = Object.keys(o.shapes), states = o.states || {};
    need(ids.length <= 40, "morph.shapes ≤ 40");
    function norm(kind, a) {
      var b = {};
      Object.keys(a).forEach(function (k) { var kk = (kind === "circle" || kind === "ellipse") && (k === "x" || k === "y") ? "c" + k : kind === "rect" && (k === "w" || k === "h") ? (k === "w" ? "width" : "height") : k; b[kk] = a[k]; });
      return b;
    }
    var shapes = {};
    ids.forEach(function (id) {
      var sh = o.shapes[id];
      need(sh && SHAPES[sh.kind], "morph.shapes." + id + ".kind는 " + Object.keys(SHAPES).join("·"));
      if (sh.kind === "label") cap("morph.shapes." + id + ".text", sh.text, 24);
      tone("morph.shapes." + id, sh.tone);
      shapes[id] = norm(sh.kind, sh);
    });
    var st2 = {};
    Object.keys(states).forEach(function (st) {
      st2[st] = {};
      Object.keys(states[st]).forEach(function (id) { need(shapes[id], "morph.states." + st + ": shape '" + id + "'가 없다. 있는 shape: " + ids.join(", ")); st2[st][id] = norm(shapes[id].kind, states[st][id]); if (st2[st][id].text != null) cap("morph.states." + st + "." + id + ".text", st2[st][id].text, 24); });
    });
    return makePart("morph", "M", o, function (p) {
      p.usesFig = true;
      p.build = function (mode) {
        var ar = mode.mobile && o.mobileAspect ? o.mobileAspect : o.aspect || 16 / 9, W = 1000, H = W / ar;
        var fig = p.fig = Fig(W, H);
        p.els = {};
        ids.forEach(function (id) {
          var sh = shapes[id], el;
          if (sh.kind === "label") el = fig.label(0, 0, sh.text, { anchor: sh.anchor, cls: sh.cls, tone: sh.tone });
          else {
            el = svg(sh.kind, {}, fig.svg);
            var open = sh.kind === "line" || sh.kind === "path" && !sh.fill;
            el.setAttribute("class", "ltt-ms" + (open ? " open" : "") + (sh.cls ? " " + sh.cls : ""));
            if (sh.tone) el.style.setProperty(open ? "--ms" : "--mf", "var(--ltt-" + sh.tone + ")");
          }
          p.els[id] = el; p.items[id] = [el];
        });
        return fitVis(fig.el);
      };
      function color(v) { return String(v).indexOf("--") === 0 ? "var(" + v + ")" : v; }
      function apply(id, attrs) {
        var sh = shapes[id], el = p.els[id], W = p.fig.W, H = p.fig.H;
        Object.keys(attrs).forEach(function (k) {
          var v = attrs[k];
          if (k === "opacity") { el.style.opacity = v; return; }
          if (sh.kind === "label") { if (k === "x") el.style.left = v + "%"; else if (k === "y") el.style.top = v + "%"; else if (k === "text") el.innerHTML = termHtml(String(v), -1); return; }
          if (MSTYLE[k]) { el.style.setProperty(MSTYLE[k], k === "dash" ? (v === true ? "6 6" : v || "none") : k === "strokeWidth" ? v : color(v)); return; }
          if (k === "d") { el.setAttribute("d", pctPath(String(v), W, H)); return; }
          if (k === "points") { el.setAttribute("points", pctPoints(v, W, H)); return; }
          if (MX[k] || MY[k]) el.setAttribute(k, v * (MX[k] ? W : H) / 100);
        });
      }
      function mix(a, b, u) {
        if (typeof a === "number" && typeof b === "number") return lerp(a, b, u);
        if (typeof a === "string" && typeof b === "string") {
          var na = a.match(/-?\d*\.?\d+/g) || [], nb = b.match(/-?\d*\.?\d+/g) || [];
          if (na.length && na.length === nb.length && a.replace(/-?\d*\.?\d+/g, "#") === b.replace(/-?\d*\.?\d+/g, "#")) { var i = 0; return a.replace(/-?\d*\.?\d+/g, function () { var v = lerp(+na[i], +nb[i], u); i++; return +v.toFixed(3); }); }
        }
        return u < 0.5 ? a : b;
      }
      var SKIP = { kind: 1, cls: 1, anchor: 1, tone: 1 };
      p.reset = function () {
        p.cur = {};
        ids.forEach(function (id) { var sh = shapes[id], base = {}; Object.keys(sh).forEach(function (k) { if (!SKIP[k]) base[k] = sh[k]; }); p.cur[id] = base; apply(id, base); });
      };
      p.anchor = function (id) {
        need(shapes[id], "morph에 shape '" + id + "'가 없다. 있는 shape: " + ids.join(", "));
        var c = p.cur && p.cur[id] || shapes[id];
        if (c.width != null) return [c.x + c.width / 2, c.y + c.height / 2];
        return [c.cx != null ? c.cx : c.x != null ? c.x : c.x1 != null ? (c.x1 + c.x2) / 2 : 50, c.cy != null ? c.cy : c.y != null ? c.y : c.y1 != null ? (c.y1 + c.y2) / 2 : 50];
      };
      p.checkArgs = function (verb, a, path) { if (verb === "to") need(st2[a.state], path + ": state '" + a.state + "'가 없다. 있는 state: " + (Object.keys(st2).join(", ") || "없음(morph.states에 정의한다)")); };
      p.verbs = {
        to: function (u, a) {
          if (u <= 0) return;
          var e = ease.inOut(u), st = st2[a.state];
          Object.keys(st).forEach(function (id) {
            var from = p.cur[id], next = {};
            Object.keys(st[id]).forEach(function (k) { next[k] = k === "text" ? (e < 0.5 ? from[k] : st[id][k]) : mix(from[k] != null ? from[k] : k === "opacity" ? 1 : st[id][k], st[id][k], e); });
            Object.assign(p.cur[id], next);
            apply(id, next);
          });
        }
      };
    });
  }

  /* ---------- multiples: same part in small panels; a verb goes to every panel that has its id, or panel:i ---------- */
  function multiples(o) {
    need(o && Array.isArray(o.panels), "multiples는 {panels: [{title, part}], cols}");
    capList("multiples.panels", o.panels, 6, 2);
    o.panels.forEach(function (pn, i) { need(isPart(pn.part), "multiples.panels[" + i + "].part는 LTT 부품이다"); cap("multiples.panels[" + i + "].title", pn.title, 24); });
    var tier = o.panels.some(function (pn) { return pn.part.tier === "B"; }) ? "B" : o.panels.some(function (pn) { return pn.part.tier === "M"; }) ? "M" : "S";
    return makePart("multiples", tier, o, function (p) {
      p.container = true;
      p.dur = Math.max.apply(null, o.panels.map(function (pn) { return pn.part.tier === "B" ? pn.part.dur : 0; }));
      p.build = function (mode) {
        var cols = mode.mobile ? (mode.width >= 600 ? 2 : 1) : o.cols || Math.min(o.panels.length, 3);
        p.panels = o.panels.map(function (pn) { return { part: pn.part.instance(), title: pn.title, tl: { items: [] } }; });
        return h("div", { cls: "ltt-multi", style: { "--cols": cols } }, p.panels.map(function (pn, i) {
          var el = pn.part.build(mode);
          var box = h("div", { cls: "ltt-panel" }, [pn.title ? h("b", { html: termHtml(pn.title, -1) }) : null, el.classList && el.classList.contains("ltt-vis") ? el : fitVis(el)]);
          p.items["p" + i] = [box];
          return box;
        }));
      };
      var iv = itemVerbs(p);
      function mine(it) { var ids = idsOf(it.args); return iv[it.verb] && it.args.panel == null && ids.length && ids.every(function (id) { return p.items[id]; }); }
      function panelsFor(it, path) {
        var idx = it.args.panel != null ? [it.args.panel] : p.panels.map(function (x, i) { return i; });
        need(p.panels[idx[0]], path + ": panel " + it.args.panel + "이 없다. panel은 0…" + (p.panels.length - 1));
        var ok = [], err = null;
        idx.forEach(function (i) { var r = accepts(p.panels[i].part, { verb: it.verb, args: it.args, path: "(panel " + i + ")" }, path); if (r === true) ok.push(i); else if (r && !err) err = r; });
        if (!ok.length) throw err || new SchemaError(path + ": 칸 부품 " + p.panels[0].part.kind + "은 '" + it.verb + "'를 모른다");
        return ok;
      }
      p.checkArgs = function (verb, a, path) { var it = { verb: verb, args: a }; if (!mine(it)) panelsFor(it, path); };
      p.prepare = function (tl) {
        p.own = [];
        p.panels.forEach(function (pn) { pn.tl = { items: [] }; });
        tl.items.forEach(function (it) { if (mine(it)) p.own.push(it); else panelsFor(it, it.path).forEach(function (i) { p.panels[i].tl.items.push(it); }); });
        p.panels.forEach(function (pn) { if (pn.part.prepare) pn.part.prepare(pn.tl); });
      };
      p.settle = function () { p.panels.forEach(function (pn) { if (pn.part.settle) pn.part.settle(); }); };
      p.frame = function (t) { p.panels.forEach(function (pn) { paintPart(pn.part, pn.tl, t); }); };
      p.anchor = function (id) { var i = +String(id).replace(/^p/, ""), cols = o.cols || Math.min(o.panels.length, 3); return [((i % cols) + 0.5) / cols * 100, (Math.floor(i / cols) + 0.15) / Math.ceil(o.panels.length / cols) * 100]; };
      p.verbs = {};
      Object.keys(DUR).forEach(function (v) { p.verbs[v] = function (u, a, dt, it) { if (iv[v] && p.own && p.own.indexOf(it) >= 0) iv[v](u, a, dt, it); }; });
    });
  }

  /* ---------- ledger: a side counter tied to the picture ---------- */
  function ledger(rows) {
    capList("ledger", rows, 6, 1);
    rows.forEach(function (r, i) { need(r.id, "ledger[" + i + "].id가 필요하다"); cap("ledger[" + i + "].label", r.label, 18); tone("ledger[" + i + "]", r.tone); });
    return makePart("ledger", "S", rows, function (p) {
      p.build = function () {
        p.vals = {};
        return h("div", { cls: "ltt-ledger", "data-solid": "" }, rows.map(function (r) {
          var b = h("b", { text: r.value != null ? fmt(r.value) : "0" });
          p.vals[r.id] = b; b.dataset.v = r.value != null ? fmt(r.value) : "0"; b._v0 = r.value != null ? r.value : 0;
          var row = h("div", { cls: (r.tone || "") + (r.total ? " total" : "") }, [h("span", { html: termHtml(r.label, -1) }), h("span", {}, [b, r.unit ? h("small", { text: " " + r.unit }) : null])]);
          p.items[r.id] = [row];
          return row;
        }));
      };
      p.reset = function () { Object.keys(p.vals).forEach(function (k) { p.vals[k].textContent = p.vals[k].dataset.v; p.vals[k]._v = null; }); };
      p.anchor = function () { return [50, 50]; };
      p.checkArgs = function (verb, a, path) { if (verb === "count") need(rows.some(function (r) { return r.id === a.id; }), path + ": ledger에 id '" + a.id + "'가 없다"); };
      p.verbs = { count: countVerb(p, function (a) { return p.vals[a.id]; }) };
    });
  }

  /* ---------- draw (tier B): hand drawing driven by t; always eye-checked ---------- */
  function drawPart(o) {
    need(o && typeof o.draw === "function", "draw는 {aspect, dur, setup(h), draw(t, h, state)}");
    need(o.dur > 0, "draw.dur(초)가 필요하다: 한 바퀴 길이");
    return makePart("draw", "B", o, function (p) {
      p.usesFig = true;
      p.dur = o.dur; p.beats = o.beats;
      p.build = function (mode) {
        var ar = mode.mobile && o.mobileAspect ? o.mobileAspect : o.aspect || 16 / 9, W = 1000, H = W / ar;
        var fig = p.fig = Fig(W, H);
        p.anchors = {};
        p.h = {
          W: W, H: H, mobile: !!mode.mobile, svg: fig.svg, layer: fig.lab,
          el: function (tag, attrs, parent) { return svg(tag, attrs, parent || fig.svg); },
          g: function (parent) { return svg("g", {}, parent || fig.svg); },
          label: function (x, y, text, opt) { return fig.label(x, y, text, opt); },
          pos: function (n, x, y) { return fig.pos(n, x, y); },
          anchor: function (id, x, y) { p.anchors[id] = [x / W * 100, y / H * 100]; },
          item: function (id, els) { p.items[id] = Array.isArray(els) ? els : [els]; },
          ease: ease, clamp: clamp, lerp: lerp, scale: scale, rng: rng, fmt: fmt, ticks: niceTicks,
          seg: function (t, a, b) { return clamp((t - a) / (b - a)); },
          along: function (path, u) { var L = path.getTotalLength(), q = path.getPointAtLength(clamp(u) * L); return [q.x, q.y]; },
          color: function (name) { return "var(--ltt-" + name + ")"; }
        };
        p.state = o.setup ? o.setup(p.h) : null;
        return fitVis(fig.el);
      };
      p.anchor = function (id, path) { need(p.anchors[id], (path || "points") + ": draw에서 h.anchor('" + id + "', x, y)로 자리를 등록한다"); return p.anchors[id]; };
      p.frame = function (t) { o.draw(t, p.h, p.state); };
    });
  }

  function frame(o) {
    need(o && (o.html != null), "frame은 {kind: 'browser'|'phone', url, html}");
    return makePart("frame", "B", o, function (p) {
      p.build = function () {
        var body = h("div", { html: o.html });
        var el = h("div", { cls: "ltt-frame" }, [h("header", {}, [h("i"), h("i"), h("i"), h("span", { text: o.url || "" })]), body]);
        if (o.kind === "phone") { el.style.maxWidth = "340px"; el.style.borderRadius = "28px"; }
        return el;
      };
      p.anchor = function () { return [50, 50]; };
    });
  }

  /* ---------- deck ---------- */
  var TYPES = { hook: 1, terms: 1, figure: 1, predict: 1, play: 1, compare: 1, summary: 1, overview: 1, keywords: 1 };
  var COMMON = { type: 1, title: 1, kicker: 1, sub: 1, narration: 1, points: 1, takeaway: 1, basis: 1, recall: 1, visual: 1, side: 1, motion: 1, loop: 1, layout: 1, steps: 1, number: 1, hold: 1 };
  var EXTRA = {
    hook: { pre: 1, text: 1 }, terms: { terms: 1 }, figure: { statement: 1 }, predict: { q: 1, choices: 1, answer: 1, why: 1 },
    play: { knobs: 1, readout: 1, goal: 1 }, compare: { left: 1, right: 1 }, summary: { items: 1 }, overview: {}, keywords: { remember: 1, signals: 1, queries: 1 }
  };
  var HOLD = 1.6;

  function checkScene(s, i, deck) {
    var at = "scenes[" + i + "]";
    need(s && TYPES[s.type], at + ".type은 " + Object.keys(TYPES).join("·") + " 중 하나");
    Object.keys(s).forEach(function (k) { need(COMMON[k] || EXTRA[s.type][k], at + " (" + s.type + "): '" + k + "'는 이 장면이 쓰지 않는 필드다. 쓸 수 있는 필드: " + Object.keys(COMMON).concat(Object.keys(EXTRA[s.type])).join(" ")); });
    cap(at + ".title", s.title, 44); cap(at + ".kicker", s.kicker, 20); cap(at + ".sub", s.sub, 100); cap(at + ".narration", s.narration, 180);
    cap(at + ".takeaway", s.takeaway, 60); cap(at + ".basis", s.basis, 90);
    need(!(s.narration && (s.type === "play" || s.type === "predict")), at + ": " + s.type + "의 오른쪽 칸은 조작·선택지가 쓴다. narration 대신 sub에 쓴다");
    if (s.points) { capList(at + ".points", s.points, 5, 1); s.points.forEach(function (pt, j) { cap(at + ".points[" + j + "].text", pt.text, 70); need(pt.on == null || s.visual && typeof s.visual !== "function", at + ".points[" + j + "].on은 visual의 id를 가리킨다"); }); }
    if (s.recall) { need(s.recall.q && s.recall.a, at + ".recall = {q, a}"); cap(at + ".recall.q", s.recall.q, 50); cap(at + ".recall.a", s.recall.a, 90); }
    if (s.visual != null) need(isPart(s.visual) || s.type === "play" && typeof s.visual === "function", at + ".visual은 LTT 부품이다(예: LTT.graph({...})). play에서는 p => 부품 함수도 된다");
    if (s.side != null) { need(isPart(s.side), at + ".side는 LTT 부품이다(ledger·facts·callout 등)"); need(s.type === "figure" || s.type === "overview", at + ": side는 figure·overview에서만 쓴다(" + s.type + "에는 놓을 칸이 없다)"); }
    if (typeof s.motion === "function") need(s.type === "play", at + ": motion을 p => [...] 함수로 쓰는 것은 play뿐이다");
    if (s.layout) need({ full: 1, split: 1, stack: 1 }[s.layout], at + ".layout은 full·split·stack");
    if (s.steps) { capList(at + ".steps", s.steps, 6, 2); s.steps.forEach(function (st, j) { cap(at + ".steps[" + j + "].caption", st.caption, 90); need(Array.isArray(st.motion), at + ".steps[" + j + "].motion이 필요하다"); }); need(!s.motion, at + ": steps와 motion은 함께 쓰지 않는다"); }
    var t = s.type;
    if (t === "hook") { need(s.text, at + ".text(큰 문장)가 필요하다"); cap(at + ".text", s.text, 56); cap(at + ".pre", s.pre, 24); }
    if (t === "terms") {
      capList(at + ".terms", s.terms || [], s.visual ? 4 : 6, 1);
      s.terms.forEach(function (x, j) { need(x.term && x.plain, at + ".terms[" + j + "] = {term, plain}"); cap(at + ".terms[" + j + "].plain", x.plain, s.visual ? 60 : 80); cap(at + ".terms[" + j + "].term", x.term, 20); });
    }
    if (t === "figure") need(s.visual || s.statement, at + ": figure에는 visual이나 statement가 필요하다");
    if (t === "figure") cap(at + ".statement", s.statement, 90);
    if (t === "overview") need(s.visual, at + ": overview에는 visual(주 그림)이 필요하다");
    if (t === "predict") {
      need(s.q, at + ".q(질문)가 필요하다"); cap(at + ".q", s.q, 60);
      capList(at + ".choices", s.choices || [], 4, 2); s.choices.forEach(function (c, j) { cap(at + ".choices[" + j + "]", c, 40); });
      need(s.answer >= 0 && s.answer < s.choices.length, at + ".answer는 choices의 번호(0부터)");
      need(s.why, at + ".why(정답 이유)가 필요하다"); cap(at + ".why", s.why, 130);
    }
    if (t === "play") {
      capList(at + ".knobs", s.knobs || [], 3, 1);
      s.knobs.forEach(function (k, j) {
        var kp = at + ".knobs[" + j + "]";
        need(k.id && k.label, kp + " = {id, label, min, max, value} 또는 {id, label, options, value}");
        cap(kp + ".label", k.label, 18); cap(kp + ".unit", k.unit, 4);
        if (k.options) capList(kp + ".options", k.options, 5, 2);
        else need(typeof k.min === "number" && typeof k.max === "number" && k.min < k.max && k.value >= k.min && k.value <= k.max, kp + ": min < max, min ≤ value ≤ max");
      });
      need(typeof s.visual === "function" || isPart(s.visual), at + ".visual = p => 부품");
      if (s.goal) { need(s.goal.text && typeof s.goal.check === "function", at + ".goal = {text, check: p => bool}"); cap(at + ".goal.text", s.goal.text, 50); }
    }
    if (t === "compare") ["left", "right"].forEach(function (k) {
      need(s[k] && s[k].label, at + "." + k + " = {label, tag, tone, visual, text}");
      cap(at + "." + k + ".label", s[k].label, 20); cap(at + "." + k + ".tag", s[k].tag, 12); cap(at + "." + k + ".text", s[k].text, 110); tone(at + "." + k, s[k].tone);
      if (s[k].visual) need(isPart(s[k].visual), at + "." + k + ".visual은 LTT 부품");
    });
    if (t === "summary" && s.items) { capList(at + ".items", s.items, 4, 1); s.items.forEach(function (x, j) { cap(at + ".items[" + j + "].q", x.q, 50); cap(at + ".items[" + j + "].a", x.a, 90); }); }
    if (t === "keywords") ["remember", "signals", "queries"].forEach(function (k) { capList(at + "." + k, s[k] || [], 4, 1); s[k].forEach(function (x, j) { cap(at + "." + k + "[" + j + "]", x, 50); }); });
  }

  var FILLER = /lorem|ipsum|\bTODO\b|\bTBD\b|xxx|더미 ?(텍스트|데이터)|샘플 ?텍스트|임시 ?텍스트|\bItem [A-D]\b|항목 ?[0-9]\b/i;
  function sceneStrings(s) {
    var out = [];
    (function walk(v, k) {
      if (typeof v === "string") { if (!/^(type|layout|tone|icon|on|id|kind|anchor|answer)$/.test(k)) out.push(v); }
      else if (Array.isArray(v)) v.forEach(function (x) { walk(x, k); });
      else if (v && typeof v === "object" && !isPart(v)) Object.keys(v).forEach(function (kk) { walk(v[kk], kk); });
      else if (isPart(v)) walk(v.spec, k);
    })(s, "");
    return out;
  }
  function lintDeck(spec) {
    var out = [], sc = spec.scenes, n = sc.length;
    // Gallery exemplars are single scenes, so lesson-order rules do not apply to them.
    var ORDER = { "hook-first": 1, "keywords-last": 1, "overview-missing": 1, "overview-order": 1, "summary-missing": 1, "summary-order": 1, "few-recall": 1, "no-predict": 1 };
    function add(i, level, rule, msg) { if (spec.exemplar && ORDER[rule]) return; out.push({ scene: i, level: level, rule: rule, msg: msg }); }
    if (sc[0] && sc[0].type !== "hook") add(0, "fix", "hook-first", "첫 장면은 hook이다");
    if (sc[n - 1] && sc[n - 1].type !== "keywords") add(n - 1, "fix", "keywords-last", "마지막 장면은 keywords다");
    var iSum = sc.findIndex(function (s) { return s.type === "summary"; }), iOv = sc.findIndex(function (s) { return s.type === "overview"; });
    if (iOv < 0) add(n - 1, "fix", "overview-missing", "summary 다음, keywords 앞에 overview(주 그림 한 장 정리)를 둔다. 수업 목록의 대표 이미지가 된다");
    else if (iOv !== n - 2) add(iOv, "fix", "overview-order", "overview는 keywords 바로 앞이다");
    if (iSum < 0) add(n - 1, "fix", "summary-missing", "recall 질문을 모으는 summary를 둔다");
    else if (iOv >= 0 && iSum > iOv) add(iSum, "fix", "summary-order", "summary는 overview 앞이다");
    var recalls = sc.filter(function (s) { return s.recall; }).length + (sc[iSum] && sc[iSum].items ? sc[iSum].items.length : 0);
    if (iSum >= 0 && recalls < 2) add(iSum, "fix", "few-recall", "recall {q, a}를 2개 이상 둔다(장면마다 recall 필드)");
    var limit = spec.budget && spec.budget.scenes || 12;
    if (n > limit) add(n - 1, "fix", "scene-budget", "장면 " + n + "개 > " + limit + "개. 줄이거나 deck.budget = {scenes, why}로 이유를 적는다");
    if (!sc.some(function (s) { return s.type === "predict"; })) add(0, "advice", "no-predict", "결정 변수마다 예측(predict)을 하나씩 둔다");
    var moving = function (q) { return isPart(q) && q.tier === "B"; };
    if (!sc.some(function (s) { return s.motion || s.steps || s.type === "play" || moving(s.visual) || moving(s.side) || s.left && moving(s.left.visual) || s.right && moving(s.right.visual); })) add(0, "advice", "no-motion", "움직이는 장면이 하나도 없다. 메커니즘을 motion으로 보인다");
    var gl = spec.glossary || {}, first = {};
    sc.forEach(function (s, i) {
      if (s.type === "terms") (s.terms || []).forEach(function (x) { if (own(gl, x.term) && first[x.term] == null) first[x.term] = i; });
      if (s.type !== "hook" && s.type !== "keywords" && !s.title) add(i, "fix", "no-title", "주장 문장으로 쓴 title이 필요하다");
      if ((s.type === "figure" || s.type === "overview") && s.visual && !s.sub && !s.narration && !s.points && !s.steps) add(i, "advice", "no-reading-guide", "그림을 읽는 법(sub·narration·points·steps 중 하나)을 둔다");
      sceneStrings(s).forEach(function (str) {
        if (FILLER.test(str)) add(i, "fix", "filler", "채움 글: " + str.slice(0, 30));
        str.replace(TERM, function (m, a, b) { var k = (b || a).trim(); if (!own(gl, k)) add(i, "fix", "unknown-term", "{{" + k + "}}의 풀이가 glossary에 없다"); else if (first[k] == null) first[k] = i; return m; });
      });
    });
    Object.keys(gl).forEach(function (k) {
      cap("glossary." + k, gl[k], 140);
      if (first[k] == null) { add(0, "advice", "unused-term", "glossary '" + k + "'를 본문에서 {{" + k + "}}로 쓰지 않았다"); return; }
      for (var i = 0; i < first[k]; i++) if (sceneStrings(sc[i]).some(function (str) { return str.replace(TERM, "").indexOf(k) >= 0; })) { add(i, "fix", "used-before-defined", "'" + k + "'가 {{" + k + "}}(풀이)나 terms 장면보다 먼저 나온다"); break; }
    });
    return { issues: out, first: first };
  }

  // Text boxes shrink (css zoom) until they fit their slot on the fixed desktop canvas; the floor keeps every glyph ≥ 12.5px.
  function minFont(el) {
    var m = 99;
    textLeaves(el).forEach(function (e) { m = Math.min(m, parseFloat(getComputedStyle(e).fontSize)); });
    return m;
  }
  function overflowing(el) {
    var box = el.closest(".ltt-vis") || el.parentElement, er = el.getBoundingClientRect(), br = box.getBoundingClientRect();
    if (el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflow !== "visible") return true;
    if (el.classList.contains("ltt-rail") || el.classList.contains("txt")) return el.scrollHeight > el.clientHeight + 1;
    return er.height > br.height + 1 || er.width > br.width + 1 || er.bottom > br.bottom + 1;
  }
  function settleParts(R) {
    [R.part, R.side].concat(R.sides ? R.sides.map(function (x) { return x.part; }) : []).forEach(function (p) { if (p && p.settle) p.settle(); });
    if (R.paintAt) R.paintAt(R.lastT || 0);
  }
  function fitScene(R) {
    settleParts(R);
    [].forEach.call(R.el.querySelectorAll("[data-fit]"), function (el) {
      el.style.zoom = "";
      if (!overflowing(el)) return;
      var floor = Math.min(1, 12.6 / minFont(el)), z = 1;
      while (z > floor && overflowing(el)) { z = Math.max(floor, z - 0.03); el.style.zoom = z.toFixed(3); }
    });
  }

  function Deck(spec) {
    need(spec && Array.isArray(spec.scenes) && spec.scenes.length, "LTT.deck({title, theme, goal, glossary, scenes: [...]})");
    var D = { spec: spec, scenes: [], cur: 0, errors: [], frozen: null };
    lesson.id = spec.lesson || null;
    need(!spec.theme || THEMES[spec.theme], "theme은 " + Object.keys(THEMES).join("·") + " 중 하나");
    document.documentElement.setAttribute("data-ltt-theme", spec.theme || "studio");
    var scheme = QS.get("scheme") || spec.scheme;
    if (scheme) document.documentElement.setAttribute("data-theme", scheme);
    if (spec.goal) { var gl = Array.isArray(spec.goal) ? spec.goal : [spec.goal]; capList("goal", gl, 3, 1); gl.forEach(function (g, i) { cap("goal[" + i + "]", g, 50); }); }
    var L = lintDeck(spec);
    D.lint = L.issues;
    gloss.defs = spec.glossary || {}; gloss.first = L.first;
    document.title = spec.title || document.title;
    document.body.classList.add("ltt-deck");
    var stage = h("div", { cls: "ltt-stage" }), canvas = h("div", { cls: "ltt-canvas" });
    stage.appendChild(canvas); document.body.appendChild(stage);
    D.canvas = canvas;

    var mq = root.matchMedia ? root.matchMedia("(max-width: " + MOBILE_MAX + "px)") : { matches: false };
    function mode() { return { mobile: !!mq.matches, width: root.innerWidth }; }

    function header(s, i) {
      var no = s.number === false ? null : h("div", { cls: "ltt-no", text: String(i + 1).padStart(2, "0") });
      return h("header", { cls: "ltt-head" }, [no, h("div", { cls: "ltt-htext" }, [
        s.kicker ? h("p", { cls: "ltt-kicker", html: termHtml(s.kicker, i) }) : null,
        s.title ? h("h2", { cls: "ltt-title", html: termHtml(s.title, i) }) : null,
        s.sub ? h("p", { cls: "ltt-sub", html: termHtml(s.sub, i) }) : null
      ])]);
    }
    function footer(s, i) {
      if (!s.takeaway && !s.basis) return null;
      return h("footer", { cls: "ltt-foot" }, [
        s.takeaway ? h("div", { cls: "ltt-take" }, [h("b", { text: "핵심" }), h("span", { html: termHtml(s.takeaway, i) })]) : null,
        s.basis ? h("p", { cls: "ltt-basis", html: "근거 · " + termHtml(s.basis, i) }) : null
      ]);
    }
    function visBox(part, m) {
      var built = part.build(m);
      return built.classList && built.classList.contains("ltt-vis") ? built : fitVis(built);
    }
    function pins(R, m) {
      var s = R.spec;
      if (!s.points || !R.part || !R.part.usesFig) return;
      R.pins = s.points.map(function (pt, j) {
        if (pt.on == null) return null;
        var a = R.part.anchor(pt.on, "scenes[" + R.i + "].points[" + j + "]");
        var host = R.part.anchorEl && R.part.anchorEl(pt.on);
        var pin = h("div", { cls: "ltt-anno" + (host ? " corner" : ""), text: String(j + 1) });
        if (host) host.appendChild(pin);
        else { pin.style.left = a[0] + "%"; pin.style.top = a[1] + "%"; pin.setAttribute("data-solid", ""); R.part.fig.lab.appendChild(pin); }
        return pin;
      });
    }

    function buildScene(s, i, m) {
      var R = { i: i, spec: s, notes: [] };
      var sec = h("section", { cls: "ltt-scene t-" + s.type, id: "s" + (i + 1), "data-i": i });
      R.el = sec;
      try {
        checkScene(s, i, spec);
        var t = s.type, body, rail;
        if (t === "hook") {
          var goal = spec.goal ? h("div", { cls: "ltt-goal" }, [h("p", { text: "이 수업을 마치면" }), h("ul", {}, (Array.isArray(spec.goal) ? spec.goal : [spec.goal]).map(function (g) { return h("li", { html: termHtml(g, i) }); }))]) : null;
          R.part = s.visual ? s.visual.instance() : null;
          if (s.points) R.pointEls = s.points.map(function (pt, j) { return h("li", {}, [h("span", { cls: "ltt-pin", text: String(j + 1) }), h("span", { html: termHtml(pt.text, i) })]); });
          body = h("div", { cls: "ltt-hook l-" + (R.part ? s.layout || "split" : "split") }, [h("div", { cls: "txt", "data-fit": "" }, [
            s.pre ? h("div", { cls: "pre", html: termHtml(s.pre, i) }) : null,
            h("h1", { cls: "big", html: termHtml(s.text, i) }),
            s.sub ? h("p", { cls: "sub", html: termHtml(s.sub, i) }) : null,
            R.pointEls ? h("ol", { cls: "ltt-points" }, R.pointEls) : null, goal
          ]), R.part ? visBox(R.part, m) : null]);
          sec.appendChild(header(s, i)); sec.appendChild(body);
        } else {
          sec.appendChild(header(s, i));
          body = h("div", { cls: "ltt-body" });
          R.part = typeof s.visual === "function" || !s.visual ? null : s.visual.instance();
          R.side = s.side ? s.side.instance() : null;
          if (t === "figure" && s.statement && !s.visual) body.appendChild(h("div", { cls: "ltt-statement" }, [h("p", { cls: "big", html: termHtml(s.statement, i) })]));
          if (t === "terms") {
            if (R.part) body.appendChild(visBox(R.part, m));
            R.termCards = s.terms.map(function (x) { return h("div", { cls: "ltt-term-card", "data-solid": "" }, [h("b", { text: x.term }), h("span", { html: termHtml(x.plain, i) })]); });
            body.appendChild(h("div", { cls: "ltt-terms" + (R.part ? "" : " wide"), "data-fit": "", style: { "--cols": s.terms.length <= 3 ? s.terms.length : s.terms.length === 4 ? 2 : 3 } }, R.termCards));
          } else if (t === "compare") {
            R.sides = ["left", "right"].map(function (k) {
              var c = s[k], inst = c.visual ? c.visual.instance() : null, v = inst ? visBox(inst, m) : null;
              return { c: c, part: inst, el: h("div", { cls: "ltt-side " + (c.tone || "") }, [h("header", {}, [h("span", { html: termHtml(c.label, i) }), c.tag ? h("i", { text: c.tag }) : null]), v, c.text ? h("p", { html: termHtml(c.text, i) }) : null]) };
            });
            body.appendChild(h("div", { cls: "ltt-cmp" }, R.sides.map(function (x) { return x.el; })));
            R.sides.forEach(function (x) { var p = x.el.querySelector(":scope > p"); if (p) p.setAttribute("data-fit", ""); });
          } else if (t === "summary") {
            var items = (s.items || []).concat(spec.scenes.filter(function (x) { return x.recall; }).map(function (x) { return x.recall; })).slice(0, 4);
            body.appendChild(h("ol", { cls: "ltt-recall", "data-fit": "" }, items.map(function (x, j) {
              var li = h("li", {}, [h("b", { html: termHtml(x.q, i) }), h("button", { type: "button", text: "떠올려 본 뒤 답 보기", onclick: function () { li.classList.add("open"); record("recall", { scene: i, item: j }); } }), h("div", { cls: "ans", html: termHtml(x.a, i) })]);
              return li;
            })));
          } else if (t === "keywords") {
            var col = function (title, list, code) { return h("section", {}, [h("h3", { text: title }), h("ul", {}, list.map(function (x) { return h("li", { html: code ? "<code>" + esc(x) + "</code>" : termHtml(x, i) }); }))]); };
            body.appendChild(h("div", { cls: "ltt-kw", "data-fit": "" }, [col("기억할 것", s.remember), col("다시 볼 신호", s.signals), col("찾아볼 검색어", s.queries, true)]));
          } else if (t === "play") {
            R.params = {};
            s.knobs.forEach(function (k) { R.params[k.id] = k.value != null ? k.value : k.options ? k.options[0] : k.min; });
            R.visHost = h("div", { cls: "ltt-vis" });
            if (s.readout) R.readout = h("div", { cls: "ltt-readout" });
            body.appendChild(h("div", { cls: "ltt-viscol" }, [R.visHost, R.readout]));
            rail = h("aside", { cls: "ltt-rail", "data-fit": "" });
            rail.appendChild(h("div", { cls: "ltt-knobs" }, s.knobs.map(function (k) { return knob(R, k, i); })));
            if (s.goal) { R.goalEl = h("div", { cls: "ltt-goalbox", html: "<b>목표</b> " + termHtml(s.goal.text, i) }); rail.appendChild(R.goalEl); }
            body.appendChild(rail);
          } else if (R.part) {
            body.appendChild(visBox(R.part, m));
          }
          if (t === "predict") {
            rail = h("aside", { cls: "ltt-rail", "data-fit": "" });
            R.choiceEls = s.choices.concat(["잘 모르겠다"]).map(function (c, j) {
              var unsure = j === s.choices.length;
              return h("button", { type: "button", cls: "ltt-choice" + (unsure ? " unsure" : ""), onclick: function () { answer(R, j); } }, [h("i", { text: unsure ? "?" : String.fromCharCode(65 + j) }), h("span", { html: termHtml(c, i) })]);
            });
            R.whyEl = h("p", { cls: "ltt-why", html: termHtml(s.why, i) });
            rail.appendChild(h("div", { cls: "ltt-ask" }, [h("p", { cls: "ltt-q", html: termHtml(s.q, i) }), h("div", { cls: "ltt-choices" }, R.choiceEls), R.whyEl]));
            body.appendChild(rail);
            if (!R.part) body.firstChild && body.firstChild.classList && body.firstChild.classList.add("hidden");
          }
          var wantsRail = t !== "play" && t !== "predict" && t !== "compare" && t !== "summary" && t !== "keywords" && t !== "terms" && (s.narration || s.points || R.side);
          if (wantsRail) {
            rail = h("aside", { cls: "ltt-rail", "data-fit": "" });
            if (s.narration) rail.appendChild(h("p", { cls: "ltt-narr", html: termHtml(s.narration, i) }));
            if (s.points) { R.pointEls = s.points.map(function (pt, j) { return h("li", {}, [h("span", { cls: "ltt-pin", text: String(j + 1) }), h("span", { html: termHtml(pt.text, i) })]); }); rail.appendChild(h("ol", { cls: "ltt-points" }, R.pointEls)); }
            if (R.side) rail.appendChild(R.side.build(m));
            body.appendChild(rail);
          }
          var lay = s.layout || (wantsRail || t === "predict" || t === "play" ? "split" : "full");
          body.classList.add("l-" + lay);
          if (lay === "stack" && rail) rail.style.width = "auto";
          sec.appendChild(body);
          if (s.steps) {
            R.capEl = h("p", { cls: "ltt-caption" });
            R.stepBtns = s.steps.map(function (st, j) { return h("button", { type: "button", "aria-label": "단계 " + (j + 1), onclick: function () { R.jump = j; R.t0 = now(); } }); });
            sec.appendChild(h("div", { style: { display: "flex", "flex-direction": "column", gap: "8px" } }, [R.capEl, h("div", { cls: "ltt-steps" }, R.stepBtns)]));
          }
        }
        var f = footer(s, i);
        if (f) sec.appendChild(f);
        if (t === "play") rebuildPlay(R, m);
        compile(R);
        pins(R, m);
      } catch (e) {
        if (!(e instanceof SchemaError)) throw e;
        D.errors.push({ scene: i, msg: e.message });
        console.error("[ltt] 장면 " + (i + 1) + ": " + e.message);
        while (sec.firstChild) sec.removeChild(sec.firstChild);
        sec.appendChild(header(Object.assign({}, s, { sub: null }), i));
        sec.appendChild(h("div", { cls: "ltt-error", text: "장면 " + (i + 1) + " 오류\n" + e.message }));
        R.part = null; R.tl = { items: [], marks: {}, dur: 0, beats: [] };
      }
      return R;
    }

    function knob(R, k, i) {
      var out = h("output");
      function show(v) { out.textContent = (k.fmt ? k.fmt(v) : k.options ? String(v) : fmt(v)) + (k.unit || ""); }
      function set(v) { R.params[k.id] = v; show(v); rebuildPlay(R, mode()); }
      if (k.options) {
        var btns = k.options.map(function (o) { return h("button", { type: "button", cls: R.params[k.id] === o ? "on" : null, text: String(o), onclick: function () { btns.forEach(function (b) { b.classList.remove("on"); }); this.classList.add("on"); set(o); } }); });
        show(R.params[k.id]);
        return h("div", { cls: "ltt-knob" }, [h("label", {}, [h("span", { html: termHtml(k.label, i) }), out]), h("div", { cls: "ltt-toggle" }, btns)]);
      }
      var log = !!k.log, toPos = function (v) { return log ? Math.log(v) : v; }, fromPos = function (x) { var v = log ? Math.exp(x) : x; return k.step ? Math.round(v / k.step) * k.step : v; };
      var input = h("input", { type: "range", min: toPos(k.min), max: toPos(k.max), step: log ? "any" : k.step || "any", value: toPos(R.params[k.id]) });
      input.addEventListener("input", function () { set(+fromPos(+input.value).toFixed(6)); });
      show(R.params[k.id]);
      return h("div", { cls: "ltt-knob" }, [h("label", {}, [h("span", { html: termHtml(k.label, i) }), out]), input, h("div", { cls: "rng" }, [h("span", { text: fmt(k.min) + (k.unit || "") }), h("span", { text: fmt(k.max) + (k.unit || "") })])]);
    }
    function rebuildPlay(R, m) {
      var s = R.spec, part = typeof s.visual === "function" ? s.visual(Object.assign({}, R.params)) : s.visual;
      need(isPart(part), "scenes[" + R.i + "].visual(p)은 LTT 부품을 돌려줘야 한다");
      part = part.instance();
      R.part = part;
      R.visHost.innerHTML = "";
      var built = part.build(m);
      if (built.classList && built.classList.contains("ltt-vis")) { while (built.firstChild) R.visHost.appendChild(built.firstChild); } else R.visHost.appendChild(built);
      if (s.readout) {
        var rows = s.readout(Object.assign({}, R.params));
        capList("scenes[" + R.i + "].readout", rows, 4, 1);
        rows.forEach(function (r, j) { cap("scenes[" + R.i + "].readout[" + j + "].label", r.label, 16); });
        R.readout.innerHTML = "";
        rows.forEach(function (r) { R.readout.appendChild(h("div", { cls: "ltt-stat " + (r.tone || "") }, [h("b", { html: esc(typeof r.value === "number" ? fmt(r.value, r.digits) : r.value) + (r.unit ? "<small>" + esc(r.unit) + "</small>" : "") }), h("span", { html: termHtml(r.label, R.i) })])); });
      }
      if (s.goal) {
        var ok = !!s.goal.check(Object.assign({}, R.params));
        R.goalEl.classList.toggle("done", ok);
        if (ok && !R.goalHit) { R.goalHit = true; record("goal", { scene: R.i, params: R.params }); }
      }
      if (R.tl) { if (typeof s.motion === "function") compile(R); else if (part.prepare) part.prepare(R.tlv); R.paintAt(R.lastT || 0); }
    }

    function compile(R) {
      var s = R.spec, steps = s.steps;
      R.stepStarts = [];
      var list = typeof s.motion === "function" ? s.motion(Object.assign({}, R.params)) : s.motion || [];
      if (steps) { list = []; steps.forEach(function (st) { R.stepStarts.push(list.length); list.push(["mark", "step"]); list = list.concat(st.motion); list.push(["wait", st.hold != null ? st.hold : 1.4]); }); }
      if (!s.motion && !steps && s.type === "terms" && R.part && s.terms.some(function (x) { return x.on; })) {
        s.terms.forEach(function (x, j) { list.push({ par: [["highlight", { id: x.on, dur: 1.8 }], ["note", { term: j, dur: 1.8 }]] }); });
      }
      var tl = seq(list);
      if (steps) { R.stepTimes = []; var tt = 0; steps.forEach(function (st) { R.stepTimes.push(tt); tt += seq(st.motion).dur + (st.hold != null ? st.hold : 1.4); }); }
      // Compare motion goes to the side that owns each id ({side} picks one when both have it); elsewhere the visual comes before the side panel.
      R.slots = R.sides ? R.sides.map(function (x, j) { return { get: function () { return R.sides[j].part; }, side: j ? "right" : "left", tl: { items: [] } }; })
        : [{ get: function () { return R.part; }, tl: { items: [] } }, { get: function () { return R.side; }, on: "side", tl: { items: [] } }];
      var tn = [], where = "scenes[" + R.i + "]";
      tl.items.forEach(function (it) {
        if (it.verb === "note") { tn.push(it); return; }
        var slots = R.slots.filter(function (x) { return x.get() && (it.args.side == null || x.side === it.args.side) && (it.args.on !== "side" || x.on === "side"); });
        need(slots.length || s.type === "play", where + " " + it.path + ": motion이 있는데 움직일 그림이 없다" + (it.args.side ? " (side: '" + it.args.side + "')" : ""));
        if (slots.length) slots[owner(slots.map(function (x) { return x.get(); }), it, where)].tl.items.push(it);
      });
      R.tl = tl; R.tln = tn; R.tlv = R.slots[0].tl;
      R.slots.forEach(function (x) { var q = x.get(); if (q && q.prepare) q.prepare(x.tl); });
      var all = R.slots.map(function (x) { return x.get(); }).filter(Boolean);
      var bParts = all.filter(function (q) { return q.tier === "B" && q.dur > 0; });
      var bDur = Math.max.apply(null, [0].concat(bParts.map(function (q) { return q.dur; })));
      R.dur = Math.max(tl.dur, bDur);
      R.loop = s.loop != null ? !!s.loop : R.dur > 0;
      R.tier = bParts.length || all.some(function (q) { return q.tier === "B"; }) ? "B" : tl.items.length || R.dur > 0 || all.some(function (q) { return q.tier === "M"; }) ? "M" : "S";
      R.ask = s.type === "predict" ? (tl.marks.ask != null ? tl.marks.ask : 0) : null;
      R.beats = bDur > tl.dur ? (bParts[0].beats || [0.2, 0.45, 0.7, 1].map(function (x) { return +(x * R.dur).toFixed(2); })) : tl.beats.slice();
      if (R.beats.length > 4) { var bb = R.beats; R.beats = [0, 1, 2, 3].map(function (k) { return bb[Math.round(k * (bb.length - 1) / 3)]; }); }
      if (!R.beats.length && R.dur > 0) R.beats = [R.dur];
      // Terms cards light up with the highlight of the id they point at, whether the motion is written or generated.
      R.termHl = s.type === "terms" ? R.tlv.items.filter(function (it) { return it.verb === "highlight"; }).map(function (it) { var ids = idsOf(it.args); return { it: it, j: s.terms.findIndex(function (x) { return x.on != null && ids.indexOf(x.on) >= 0; }) }; }).filter(function (x) { return x.j >= 0; }) : [];
      R.paintAt = function (t) {
        R.lastT = t;
        R.slots.forEach(function (x) { paintPart(x.get(), x.tl, t); });
        var noteOn = -1, termOn = -1;
        R.tln.forEach(function (it) { if (t >= it.start && (t < it.start + it.dur || it.args.keep)) { if (it.args.n != null) noteOn = it.args.n - 1; if (it.args.term != null) termOn = it.args.term; } });
        R.termHl.forEach(function (x) { if (t >= x.it.start && (t < x.it.start + x.it.dur || x.it.args.keep)) termOn = x.j; });
        var noting = R.tln.some(function (it) { return it.args.n != null; });
        function noted(j) { return !noting || R.tln.some(function (it) { return it.args.n === j + 1 && t >= it.start; }); }
        (R.pins || []).forEach(function (pin, j) { if (pin) pin.style.opacity = noted(j) ? "" : "0"; });
        (R.pointEls || []).forEach(function (li, j) { li.classList.toggle("on", j === noteOn); li.classList.toggle("wait", !noted(j)); });
        (R.termCards || []).forEach(function (c, j) { c.classList.toggle("on", j === termOn); });
        if (R.stepTimes) {
          var k = 0; R.stepTimes.forEach(function (st, j) { if (t + 1e-6 >= st) k = j; });
          R.capEl.innerHTML = "<b>" + (k + 1) + ".</b> " + termHtml(s.steps[k].caption, R.i);
          R.stepBtns.forEach(function (b, j) { b.classList.toggle("on", j === k); });
        }
      };
    }

    function answer(R, j) {
      if (R.answered != null) return;
      R.answered = j; R.answeredAt = now();
      var s = R.spec;
      R.choiceEls.forEach(function (b, k) { b.disabled = true; b.classList.toggle("picked", k === j); b.classList.add(k === s.answer ? "right" : "wrong"); b.classList.toggle("gone", k !== j && k !== s.answer); });
      R.whyEl.classList.add("on");
      R.fitted = false; if (!mode().mobile) { R.fitted = true; fitScene(R); }
      record("predict", { scene: R.i, choice: j === s.choices.length ? "unsure" : j, correct: j === s.answer });
    }

    function now() { return (root.performance ? performance.now() : Date.now()) / 1000; }
    function timeOf(R, t) {
      if (R.dur <= 0) return 0;
      if (REDUCED) return R.spec.type === "predict" && R.answered == null ? R.ask : R.dur;
      if (R.spec.type === "predict") {
        if (R.answered == null) { if (R.ask <= 0) return 0; var per = R.ask + 1.2; return Math.min(t % per, R.ask); }
        return Math.min(R.ask + (now() - R.answeredAt), R.dur);
      }
      if (R.jump != null && R.stepTimes) t += R.stepTimes[R.jump];
      if (!R.loop) return Math.min(t, R.dur);
      var hold = R.spec.hold != null ? R.spec.hold : HOLD, period = R.dur + hold;
      return Math.min(t % period, R.dur);
    }

    /* layout & navigation */
    function fit() {
      if (mode().mobile) { canvas.style.transform = ""; return; }
      var k = Math.min(root.innerWidth / CANVAS.w, root.innerHeight / CANVAS.h);
      canvas.style.transform = "scale(" + k + ")";
      D.scale = k;
    }
    function render() {
      var m = mode();
      D.mode = m;
      document.documentElement.toggleAttribute("data-ltt-mobile", m.mobile);
      canvas.innerHTML = "";
      D.errors = [];
      var top = h("div", { cls: "ltt-top" }, [h("div", { cls: "ltt-chip", text: spec.title || "" }), h("div", { cls: "ltt-progress" }, [D.countEl = h("span", { cls: "ltt-count" }), D.dotsEl = h("div", { cls: "ltt-dots" })])]);
      canvas.appendChild(top);
      D.scenes = spec.scenes.map(function (s, i) { var R = buildScene(s, i, m); canvas.appendChild(R.el); return R; });
      D.scenes.forEach(function (R, i) { D.dotsEl.appendChild(h("i", { title: String(i + 1), onclick: function () { go(i); } })); });
      if (!m.mobile) {
        D.prev = h("button", { cls: "ltt-nav", type: "button", html: icon("arrow", { cls: "flip" }).replace("<svg", "<svg style='transform:scaleX(-1)'") + "이전", onclick: function () { go(D.cur - 1); } });
        D.next = h("button", { cls: "ltt-nav next", type: "button", html: "다음" + icon("arrow"), onclick: next });
        canvas.appendChild(h("div", { cls: "ltt-bottom" }, [D.prev, h("span", { cls: "ltt-hint", html: "<kbd>←</kbd><kbd>→</kbd> 이동 · 밑줄 친 용어에 마우스를 올리면 풀이" }), D.next]));
      }
      D.scenes.forEach(function (R) { R.t0 = now(); if (R.paintAt) R.paintAt(timeOf(R, 0)); });
      fit();
      go(Math.min(D.cur, D.scenes.length - 1), true);
      if (m.mobile && root.IntersectionObserver) {
        D.io && D.io.disconnect();
        D.visible = {};
        D.io = new IntersectionObserver(function (es) { es.forEach(function (e) { var i = +e.target.dataset.i; D.visible[i] = e.isIntersecting; if (e.isIntersecting && !D.scenes[i].playing) { D.scenes[i].t0 = now(); D.scenes[i].playing = true; } if (!e.isIntersecting) D.scenes[i].playing = false; }); }, { threshold: 0.25 });
        D.scenes.forEach(function (R) { D.io.observe(R.el); });
      }
      if (m.mobile) D.scenes.forEach(settleParts);
    }
    function next() {
      var R = D.scenes[D.cur];
      if (R && R.spec.type === "predict" && R.answered == null && !R.nudged) { R.nudged = true; R.choiceEls.forEach(function (b) { b.animate && b.animate([{ transform: "translateX(0)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 }); }); return; }
      go(D.cur + 1);
    }
    function go(i, quiet) {
      if (i < 0 || i >= D.scenes.length) return;
      D.cur = i;
      D.scenes.forEach(function (R, k) { R.el.classList.toggle("on", k === i); });
      [].forEach.call(D.dotsEl.children, function (d, k) { d.classList.toggle("on", k === i); d.classList.toggle("seen", k < i); });
      D.countEl.textContent = String(i + 1).padStart(2, "0") + " / " + String(D.scenes.length).padStart(2, "0");
      if (D.prev) { D.prev.disabled = i === 0; D.next.disabled = i === D.scenes.length - 1; }
      D.scenes[i].t0 = now(); D.scenes[i].jump = null;
      if (!mode().mobile && !D.scenes[i].fitted) { D.scenes[i].fitted = true; fitScene(D.scenes[i]); }
      if (!mode().mobile && root.history && !quiet) history.replaceState(null, "", "#" + (i + 1));
      if (mode().mobile && !quiet) D.scenes[i].el.scrollIntoView({ block: "start" });
    }
    function tick() {
      if (D.frozen == null) {
        var t = now();
        D.scenes.forEach(function (R, i) {
          if (!R.paintAt || R.dur <= 0) return;
          var active = mode().mobile ? D.visible && D.visible[i] : i === D.cur;
          if (active) R.paintAt(timeOf(R, t - R.t0));
        });
      }
      root.requestAnimationFrame ? requestAnimationFrame(tick) : setTimeout(tick, 16);
    }

    root.addEventListener("resize", fit);
    if (mq.addEventListener) mq.addEventListener("change", function () { render(); });
    document.addEventListener("keydown", function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(D.cur - 1); }
    });
    var start = +(root.location.hash || "").replace("#", "");
    D.cur = start >= 1 ? start - 1 : 0;
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { D.scenes.forEach(function (R) { if (mode().mobile) settleParts(R); else if (R.fitted) fitScene(R); }); });
    initPopover();
    if (expects.length && !CHECK) expectPanel();
    if (CHECK) {
      D.frozen = 0;
      D.scenes.forEach(function (R) { reveal(R); if (R.paintAt) R.paintAt(R.dur); });
    } else if (QS.has("t")) {
      D.frozen = +QS.get("t");
    }
    if (!CHECK && (D.lint.some(function (x) { return x.level === "fix"; }) || D.errors.length)) {
      var p = expectPanel();
      D.errors.forEach(function (e) { p.appendChild(h("div", { cls: "fail", text: "✗ 장면 " + (e.scene + 1) + ": " + e.msg })); });
      D.lint.filter(function (x) { return x.level === "fix"; }).forEach(function (x) { p.appendChild(h("div", { cls: "warn", text: "⚠ 장면 " + (x.scene + 1) + " " + x.rule + ": " + x.msg })); });
      p.dataset.warns = 1; p.open = true;
    }
    tick();

    function reveal(R) {
      var s = R.spec;
      if (s.type === "predict" && R.answered == null && R.choiceEls) { R.answered = s.answer; R.answeredAt = -1e9; R.choiceEls.forEach(function (b, k) { b.disabled = true; b.classList.toggle("picked", k === s.answer); b.classList.add(k === s.answer ? "right" : "wrong"); b.classList.toggle("gone", k !== s.answer); }); R.whyEl.classList.add("on"); if (!mode().mobile) fitScene(R); }
      [].forEach.call(R.el.querySelectorAll(".ltt-recall li"), function (li) { li.classList.add("open"); });
    }
    function unreveal(R) {
      if (R.spec.type !== "predict" || !R.choiceEls) return;
      R.answered = null;
      R.choiceEls.forEach(function (b) { b.disabled = false; b.classList.remove("picked", "right", "wrong", "gone"); });
      R.whyEl.classList.remove("on");
      if (!mode().mobile) fitScene(R);
    }
    D.seek = function (i, t, opts) {
      D.frozen = t;
      var R = D.scenes[i];
      if (!mode().mobile) go(i, true);
      if (opts && opts.reveal) reveal(R); else if (opts && opts.reveal === false) unreveal(R);
      if (R.paintAt) R.paintAt(Math.max(0, Math.min(t, R.dur)));
      return true;
    };
    D.reveal = function (i) { reveal(D.scenes[i]); };
    D.info = function () {
      return D.scenes.map(function (R) { return { i: R.i, type: R.spec.type, title: R.spec.title || R.spec.text || "", tier: R.tier || "S", dur: R.dur || 0, beats: R.beats || [], ask: R.ask }; });
    };
    D.check = function () { return checkLayout(D); };
    return D;
  }

  /* ---------- layout check: what the eye would catch on static parts ---------- */
  function textLeaves(scope) {
    var out = [];
    var all = scope.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest("svg") && e.tagName !== "svg") continue;
      if (e.closest(".ltt-bottom,.ltt-top")) continue;
      var direct = false;
      for (var c = e.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) { direct = true; break; }
      if (direct) out.push(e);
    }
    return out;
  }
  function visible(e, stop) {
    for (var n = e; n && n !== stop; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) return false;
    }
    return true;
  }
  function inter(a, b) { return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); }
  function checkLayout(D) {
    var mobile = D.mode.mobile, k = mobile ? 1 : D.scale || 1, minPx = mobile ? 12 : 12.5;
    var report = { mode: mobile ? "mobile" : "desktop", viewport: [root.innerWidth, root.innerHeight], scenes: [], lint: D.lint, errors: D.errors, expect: expects.filter(function (e) { return !e.ok; }) };
    D.scenes.forEach(function (R, i) {
      var issues = [];
      if (!mobile) D.seek(i, R.dur || 0, { reveal: true });
      else { D.reveal(i); if (R.paintAt) R.paintAt(R.dur || 0); }
      var box = R.el.getBoundingClientRect();
      var leaves = textLeaves(R.el).filter(function (e) { return visible(e, R.el); });
      var rects = leaves.map(function (e) { return e.getBoundingClientRect(); });
      var lines = leaves.map(function (e) { return getComputedStyle(e).display === "inline" ? [].slice.call(e.getClientRects()) : [e.getBoundingClientRect()]; });
      var solids = [].filter.call(R.el.querySelectorAll("[data-solid]"), function (e) { return visible(e, R.el); });
      function name(e) { return (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24); }
      leaves.forEach(function (e, j) {
        var r = rects[j];
        if (r.width === 0 && r.height === 0) return;
        var tol = 2;
        if (!mobile && (r.left < box.left - tol || r.right > box.right + tol || r.top < box.top - tol || r.bottom > box.bottom + tol)) issues.push({ rule: "overflow", msg: "장면 밖으로 넘친 글: '" + name(e) + "'" });
        if (mobile && r.right > root.innerWidth + tol) issues.push({ rule: "overflow", msg: "화면 오른쪽 밖으로 넘친 글: '" + name(e) + "'" });
        var fs = parseFloat(getComputedStyle(e).fontSize) * k * camScale(e) * (e.currentCSSZoom || 1);
        if (fs < minPx - 0.01) issues.push({ rule: "small-text", msg: "글자 " + fs.toFixed(1) + "px < " + minPx + "px: '" + name(e) + "'" });
        if ((e.textContent || "").trim().length >= 4 && r.height > fs * 3.2 && r.width < fs * 2.6) issues.push({ rule: "broken-text", msg: "좁은 칸에서 글이 세로로 꺾였다: '" + name(e) + "'" });
      });
      var seen = {};
      function overlapPairs(list, rl) {
        for (var a = 0; a < list.length; a++) for (var b = a + 1; b < list.length; b++) {
          var A = list[a], B = list[b];
          if (A.contains(B) || B.contains(A)) continue;
          var area = 0;
          (Array.isArray(rl[a]) ? rl[a] : [rl[a]]).forEach(function (ra) { (Array.isArray(rl[b]) ? rl[b] : [rl[b]]).forEach(function (rb) { area = Math.max(area, inter(ra, rb)); }); });
          if (area > 6) {
            var key = name(A) + "|" + name(B);
            if (seen[key]) continue; seen[key] = 1;
            issues.push({ rule: "overlap", msg: "겹침: '" + name(A) + "' ↔ '" + name(B) + "'" });
          }
        }
      }
      overlapPairs(leaves, lines);
      // Boxes and figure labels side by side with no gap read as one phrase, so solids count as overlapping within 2px across.
      overlapPairs(solids, solids.map(function (e) { var r = e.getBoundingClientRect(); return { left: r.left - 1.5, right: r.right + 1.5, top: r.top + 1, bottom: r.bottom - 1 }; }));
      [].forEach.call(R.el.querySelectorAll(".ltt-fig"), function (f) {
        if (!visible(f, R.el)) return;
        var fr = f.getBoundingClientRect();
        if (fr.height < 120 || fr.width < 160) issues.push({ rule: "small-visual", msg: "그림이 " + Math.round(fr.width) + "×" + Math.round(fr.height) + "px로 작다. 글을 줄이거나 layout을 바꾼다" });
      });
      [].forEach.call(R.el.querySelectorAll(".ltt-vis"), function (v) {
        if (!visible(v, R.el)) return;
        var vr = v.getBoundingClientRect(), t = 4;
        leaves.forEach(function (e, j) {
          if (!v.contains(e) || !e.closest(".ltt-fig") || e.closest(".ltt-fig.zoomed")) return;
          var r = rects[j];
          if (r.width && (r.left < vr.left - t || r.right > vr.right + t || r.top < vr.top - t || r.bottom > vr.bottom + t)) issues.push({ rule: "fig-overflow", msg: "그림 글이 그림 칸 밖으로 나갔다: '" + name(e) + "'" });
        });
      });
      var errs = D.errors.filter(function (e) { return e.scene === i; });
      errs.forEach(function (e) { issues.unshift({ rule: "schema", msg: e.msg }); });
      report.scenes.push({ i: i, type: R.spec.type, title: R.spec.title || R.spec.text || "", tier: R.tier || "S", dur: R.dur || 0, beats: R.beats || [], ask: R.ask, issues: issues });
    });
    root.__lttCheck = report;
    return report;
  }
  function camScale(e) {
    var cam = e.closest && e.closest(".ltt-cam");
    if (!cam || !cam.style.transform) return 1;
    var m = /scale\(([\d.]+)\)/.exec(cam.style.transform);
    return m ? +m[1] : 1;
  }

  /* ---------- export ---------- */
  // A part built outside LTT.deck throws before any scene exists; the message must still reach the console that check reads.
  if (DOC) root.addEventListener("error", function (e) { if (e.error instanceof SchemaError) console.error("[ltt] " + e.error.message); });
  if (DOC) {
    var style = h("style", { id: "ltt-style" });
    style.textContent = CSS + themeCss();
    document.head.appendChild(style);
  }
  var current = null;
  var LTT = root.LTT = {
    version: "2.0.0",
    deck: function (spec) {
      function run() { current = Deck(spec); LTT.current = current; }
      if (document.body) run(); else document.addEventListener("DOMContentLoaded", run);
    },
    graph: graph, sequence: sequence, chart: chart, units: units, facts: facts, callout: callout, table: table,
    pipeline: pipeline, timeline: timeline, terminal: function (o) { return termWin("terminal", o); }, code: function (o) { return termWin("code", o); },
    math: math, dist: dist, morph: morph, multiples: multiples, ledger: ledger, draw: drawPart, frame: frame,
    expect: expect, record: record, icon: icon, icons: Object.keys(ICONS), themes: Object.keys(THEMES),
    seq: seq, lint: lintDeck, SchemaError: SchemaError,
    rng: rng, ease: ease, scale: scale, ticks: niceTicks, fmt: fmt,
    // used by server/check.mjs through CDP
    info: function () { return current ? current.info() : null; },
    seek: function (i, t, o) { return current ? current.seek(i, t, o) : false; },
    reveal: function (i) { return current && current.reveal(i); },
    check: function () { return current ? current.check() : null; },
    sceneRect: function (i) { var r = current.scenes[i].el.getBoundingClientRect(); return { x: r.left + root.scrollX, y: r.top + root.scrollY, w: r.width, h: r.height }; },
    canvasRect: function () { var r = current.canvas.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
