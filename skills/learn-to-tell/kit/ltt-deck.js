(function (root) {
  "use strict";
  var LTT = root.LTT;
  if (!LTT || !LTT.predict || !LTT.annotate) throw new Error("ltt-deck.js needs ltt.js, ltt-parts.js and ltt-ui.js loaded first");
  var h = LTT.h, fill = LTT.fill;

  var STYLE = [
    "html,body{height:100%}body{overflow:hidden}",
    ".dk{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr auto;height:100vh;height:100dvh;max-width:1440px;margin:0 auto;",
    "padding:0 clamp(16px,3.2vw,56px);box-sizing:border-box;overflow-x:clip}",
    /* top bar */
    ".dk-top{display:flex;align-items:center;gap:16px;padding:clamp(12px,2.2vh,26px) 0 clamp(4px,1vh,10px)}",
    ".dk-top h1{display:inline-flex;align-items:center;gap:10px;margin:0;min-width:0;max-width:60%;font-size:14px;font-weight:700;letter-spacing:-.01em;",
    "background:var(--ltt-card);padding:8px 16px 8px 14px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ltt-line)}",
    ".dk-top h1 span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dk-top h1::before{content:'';flex:none;width:9px;height:9px;border-radius:50%;background:var(--ltt-accent)}",
    ".dk-prog{margin-left:auto;display:flex;align-items:center;gap:14px;min-width:0}",
    ".dk-count{font-size:15px;font-weight:700;color:var(--ltt-muted);font-variant-numeric:tabular-nums;white-space:nowrap}",
    ".dk-dots{display:flex;gap:6px;min-width:0}.dk-dots i{width:28px;flex:0 1 28px;min-width:6px;height:6px;border-radius:3px;background:var(--ltt-line-2);",
    "cursor:pointer;transition:background-color .3s,width .3s}",
    ".dk-dots i.seen{background:color-mix(in srgb,var(--ltt-accent) 35%,var(--ltt-line-2))}.dk-dots i.on{background:var(--ltt-accent)}",
    /* stage + scene */
    ".dk-stage{position:relative;min-height:0}",
    ".dk-scene{position:absolute;inset:0;display:flex;flex-direction:column;overflow:auto;padding:4px 2px;",
    "opacity:0;visibility:hidden;transform:translateX(24px);transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1),visibility 0s .45s}",
    ".dk-scene.prev{transform:translateX(-24px)}",
    ".dk-scene.cur{opacity:1;visibility:visible;transform:none;transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1)}",
    ".dk-in{margin:auto;display:flex;flex-direction:column;gap:clamp(10px,2.2vh,26px);width:100%}",
    /* heading */
    ".dk-head{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:clamp(16px,2.4vw,36px);align-items:center}",
    ".dk-no{font-size:clamp(50px,min(7.6vw,12vh),108px);font-weight:850;letter-spacing:-.06em;line-height:.86;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-ht{display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);min-width:0}",
    ".dk-kicker{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:750;color:var(--ltt-ink-2);",
    "background:var(--ltt-card);padding:5px 14px 5px 12px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ltt-line)}",
    ".dk-kicker::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--kc,var(--ltt-accent))}",
    ".dk-scene h2{font-family:var(--ltt-font-display);font-size:clamp(26px,min(3.5vw,5.8vh),50px);font-weight:var(--ltt-display-weight);line-height:1.14;letter-spacing:var(--ltt-display-track);margin:0}",
    ".dk-scene h2 .en{font-size:.52em;font-weight:400;letter-spacing:-.01em;color:var(--ltt-muted);margin-left:.5em;white-space:nowrap}",
    ".dk-sub{font-size:clamp(16px,1.5vw,20px);color:var(--ltt-muted);margin:0;max-width:72ch;line-height:1.55}",
    /* body + rail */
    ".dk-main{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(14px,2vw,28px);align-items:stretch}",
    ".dk-main.split{grid-template-columns:minmax(0,1.45fr) minmax(280px,1fr)}",
    ".dk-body{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:14px}",
    ".dk-main.split>.dk-body{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,2vw,30px);box-shadow:var(--ltt-shadow)}",
    ".dk-main.split>.dk-body.bare{background:none;border:0;box-shadow:none;padding:0}",
    ".dk-rail{display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,2vh,20px);min-width:0;padding:4px 4px}",
    ".dk-rail .ltt-basis,.dk-in>.ltt-basis{margin:0}",
    ".dk-rail hr{border:0;border-top:1px solid var(--ltt-line-2);margin:2px 0;width:100%}",
    ".dk-lead{display:flex;flex-direction:column;gap:6px;max-width:80ch}",
    /* hook */
    ".dk-hook{display:grid;grid-template-columns:auto minmax(0,1fr);gap:clamp(20px,5vw,72px);align-items:center;padding:clamp(8px,3vh,40px) 0}",
    ".dk-hook .art{width:clamp(120px,18vw,240px);aspect-ratio:1;border-radius:max(var(--ltt-r-lg),min(36%,calc(var(--ltt-r-lg) * 4)));display:flex;align-items:center;justify-content:center;",
    "background:var(--ltt-card);box-shadow:var(--ltt-shadow),inset 0 0 0 1.5px var(--ltt-line);font-size:clamp(60px,9vw,120px);color:var(--ltt-accent)}",
    ".dk-hook .art .ltt-ic{width:52%;height:52%}",
    ".dk-hook .tx{display:flex;flex-direction:column;gap:clamp(12px,2.4vh,22px)}",
    ".dk-hook .pre{font-size:clamp(18px,2.4vw,32px);font-weight:400;color:var(--ltt-muted);letter-spacing:-.03em;margin:0;line-height:1.25}",
    ".dk-hook .big{font-family:var(--ltt-font-display);font-size:clamp(32px,5.6vw,78px);font-weight:var(--ltt-display-weight);line-height:1.1;letter-spacing:calc(var(--ltt-display-track) - .015em);margin:0}",
    ".dk-hook .big u{text-decoration:none;background:linear-gradient(transparent 62%,color-mix(in srgb,var(--ltt-accent) 22%,transparent) 0)}",
    ".dk-hook .dk-sub{font-size:clamp(15px,1.6vw,20px)}",
    /* explain */
    ".dk-steps{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(12px,2.4vw,36px);align-items:stretch}",
    ".dk-step{position:relative;display:flex;flex-direction:column;gap:8px;background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);",
    "padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-step .no{font-size:15px;font-weight:800;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-step .ic{width:clamp(44px,4.6vw,60px);height:clamp(44px,4.6vw,60px);border-radius:var(--ltt-r-md);background:var(--ltt-accent-soft);color:var(--ltt-accent);",
    "display:flex;align-items:center;justify-content:center;font-size:clamp(24px,2.6vw,32px);margin:4px 0 6px}",
    ".dk-step .ic .ltt-ic{width:56%;height:56%}",
    ".dk-step b{display:block;font-family:var(--ltt-font-display);font-size:clamp(19px,1.9vw,27px);font-weight:var(--ltt-display-weight);letter-spacing:-.03em;line-height:1.3}",
    ".dk-step p{margin:0;color:var(--ltt-muted);font-size:clamp(15px,1.3vw,18px);line-height:1.6}",
    ".dk-step .vis{margin-top:auto;padding-top:8px}",
    ".dk-step>.ar{position:absolute;z-index:2;right:calc(-1 * clamp(12px,2.4vw,36px) / 2 - 15px);top:50%;width:30px;height:30px;margin-top:-15px;border-radius:50%;",
    "background:var(--ltt-ink);color:var(--ltt-bg);display:flex;align-items:center;justify-content:center}.dk-step>.ar .ltt-ic{width:16px;height:16px}",
    /* explain: strip (one connected row) and stack (vertical timeline) */
    ".dk-steps.strip{position:relative;gap:clamp(12px,2vw,32px)}",
    ".dk-steps.strip::before{content:'';position:absolute;left:0;right:0;top:27px;border-top:2px solid var(--ltt-line-2)}",
    ".dk-steps.strip .dk-step,.dk-steps.stack .dk-step{background:none;border:0;box-shadow:none;border-radius:0;padding:0}",
    ".dk-node{position:relative;z-index:1;width:54px;height:54px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;",
    "background:var(--ltt-bg);color:var(--ltt-accent);box-shadow:inset 0 0 0 2px var(--ltt-accent);font:700 16px var(--ltt-mono)}",
    ".dk-node .ltt-ic{width:24px;height:24px}",
    ".dk-steps.strip .dk-step .no{margin-top:4px}",
    ".dk-steps.strip .dk-step:last-child .dk-node{background:var(--ltt-accent);color:var(--ltt-on-accent)}",
    ".dk-steps.stack{grid-template-columns:1fr!important;gap:0;max-width:1100px}",
    ".dk-steps.stack .dk-step{display:grid;grid-template-columns:54px minmax(0,1fr) minmax(0,1.15fr);column-gap:clamp(14px,2vw,32px);align-items:start;",
    "padding-bottom:clamp(6px,1.4vh,18px)}",
    ".dk-steps.stack .dk-step:not(:last-child)::before{content:'';position:absolute;left:26px;top:54px;bottom:0;border-left:2px solid var(--ltt-line-2)}",
    ".dk-steps.stack .dk-step .tx{display:flex;flex-direction:column;gap:4px;padding-top:8px}",
    ".dk-steps.stack .dk-step .vis{margin:0;padding:0}",
    ".dk-steps.stack .dk-step:not(:has(.vis)){grid-template-columns:54px minmax(0,1fr)}",
    /* terms */
    ".dk-terms{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(12px,2vw,28px)}",
    ".dk-tm{display:flex;flex-direction:column;gap:12px;min-height:min(34vh,320px);background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-tm .top{display:flex;align-items:center;gap:12px}",
    ".dk-tm .ic{flex:none;width:52px;height:52px;border-radius:16px;background:var(--ltt-dark);color:var(--ltt-on-dark);display:flex;align-items:center;justify-content:center;font-size:22px}",
    ".dk-tm .ic .ltt-ic{width:24px;height:24px}",
    ".dk-tm .w{font-family:var(--ltt-font-display);font-size:clamp(24px,2.5vw,34px);font-weight:var(--ltt-display-weight);letter-spacing:-.04em;line-height:1.15}.dk-tm .w small{display:block;font-size:13px;font-weight:600;color:var(--ltt-muted);letter-spacing:0}",
    ".dk-tm .vis{display:flex;align-items:center;justify-content:center;min-height:clamp(56px,11vh,120px)}",
    ".dk-tm .p{margin:4px 0 0;font-size:clamp(16px,1.45vw,19.5px);line-height:1.6}",
    ".dk-tm .ex{margin-top:auto;font-size:clamp(14px,1.2vw,16px);color:var(--ltt-muted);background:var(--ltt-card-2);border-radius:12px;padding:10px 12px;line-height:1.5}",
    ".dk-tm .ex::before{content:'예) ';font-weight:800;color:var(--ltt-ink-2)}",
    /* compare */
    ".dk-cmp{display:grid;grid-template-columns:repeat(var(--m,var(--n)),minmax(0,1fr));gap:clamp(10px,1.6vw,22px)}",
    ".dk-item{display:flex;flex-direction:column;gap:10px;background:var(--ltt-card);border-radius:var(--ltt-r-lg);box-shadow:var(--ltt-shadow),inset 0 0 0 1.5px var(--ltt-line);",
    "padding:clamp(14px,1.6vw,22px);transition:box-shadow .3s}",
    ".dk-item .lab{font-size:clamp(14px,1.2vw,16px);font-weight:750;color:var(--ltt-ink-2);line-height:1.35}",
    ".dk-item .vis{flex:1;display:flex;align-items:center;justify-content:center;min-height:90px}",
    ".dk-item .vd{display:flex;align-items:center;gap:8px;font-weight:800;font-size:clamp(15px,1.3vw,17px);opacity:0;transform:translateY(6px);transition:opacity .4s,transform .4s}",
    ".dk-item .vd .ltt-ic{flex:none;width:22px;height:22px;padding:4px;border-radius:50%;color:#fff;background:var(--ltt-muted);box-sizing:border-box}",
    ".dk-cmp.shown .dk-item .vd{opacity:1;transform:none}",
    ".dk-cmp.shown .dk-item.good{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-good)}.dk-cmp.shown .dk-item.bad{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-bad)}",
    ".dk-cmp.shown .dk-item.warn{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-warn)}",
    ".dk-item.good .vd{color:var(--ltt-good)}.dk-item.good .vd .ltt-ic{background:var(--ltt-good)}",
    ".dk-item.bad .vd{color:var(--ltt-bad)}.dk-item.bad .vd .ltt-ic{background:var(--ltt-bad)}",
    ".dk-item.warn .vd{color:var(--ltt-warn)}.dk-item.warn .vd .ltt-ic{background:var(--ltt-warn)}",
    ".dk-item .note{font-size:clamp(14px,1.15vw,15.5px);color:var(--ltt-muted);margin:0;line-height:1.5;transition:opacity .4s}.dk-cmp:not(.shown) .dk-item .note.after{opacity:0}",
    /* figure: one visual owns the stage */
    ".dk-fig{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}",
    ".dk-fig-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:min(30vh,320px);min-width:0}",
    ".dk-fig-stage>*{max-width:100%}",
    ".dk-figsteps{display:grid;grid-template-columns:auto minmax(0,420px);gap:clamp(24px,4vw,60px);align-items:center}",
    ".dk-figsteps>*{min-width:0}.dk-figsteps .ltt-caption{font-size:clamp(15px,1.3vw,18px);line-height:1.6}",
    ".dk-fig figcaption{font-size:clamp(14px,1.2vw,16px);color:var(--ltt-ink-2);line-height:1.55;max-width:90ch;border-top:1px solid var(--ltt-line-2);padding-top:10px}",
    ".dk-fig figcaption b{font-family:var(--ltt-font-display);margin-right:6px;color:var(--ltt-ink)}",
    ".dk-main.full{grid-template-columns:minmax(0,1fr)}",
    ".dk-capbar{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:clamp(12px,2vw,28px);align-items:start}",
    ".dk-capbar .ltt-pts{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));grid-column:1/-1}",
    ".dk-capbar .ltt-pts b{font-size:clamp(15px,1.3vw,18px)}",
    /* statement: a single claim, no cards */
    ".dk-st{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(20px,5vw,80px);align-items:center;padding:clamp(8px,3vh,36px) 0}",
    ".dk-st.solo{grid-template-columns:minmax(0,1fr);max-width:22em}",
    ".dk-st .tx{display:flex;flex-direction:column;gap:clamp(12px,2.4vh,22px)}",
    ".dk-st .no{font:600 14px var(--ltt-mono);color:var(--ltt-accent);letter-spacing:.04em}",
    ".dk-st .claim{font-family:var(--ltt-font-display);font-size:clamp(30px,4.6vw,66px);font-weight:var(--ltt-display-weight);line-height:1.15;",
    "letter-spacing:calc(var(--ltt-display-track) - .01em);margin:0}",
    ".dk-st .claim em{font-style:normal;color:var(--ltt-accent)}",
    ".dk-st .vis{min-width:0;display:flex;justify-content:center}",
    /* compare as a table: same question asked of each row */
    ".dk-cmp.table{grid-template-columns:1fr!important;gap:0;border-top:2px solid var(--ltt-ink)}",
    ".dk-cmp.table .dk-item{display:grid;grid-template-columns:minmax(120px,.7fr) minmax(0,2fr) minmax(150px,.9fr);grid-template-areas:'lab vis vd' 'lab vis note';",
    "column-gap:clamp(12px,2vw,28px);row-gap:4px;align-items:center;background:none;border-radius:0;box-shadow:none;padding:clamp(8px,1.4vh,14px) 4px;border-bottom:1px solid var(--ltt-line-2)}",
    ".dk-cmp.table .dk-item .lab{grid-area:lab;font-size:clamp(15px,1.3vw,18px);color:var(--ltt-ink)}.dk-cmp.table .dk-item .vis{grid-area:vis;min-height:0;justify-content:flex-start}",
    ".dk-cmp.table .dk-item .vd{grid-area:vd;align-self:end}.dk-cmp.table .dk-item .note{grid-area:note;align-self:start}",
    ".dk-cmp.table.shown .dk-item.good,.dk-cmp.table.shown .dk-item.bad,.dk-cmp.table.shown .dk-item.warn{box-shadow:inset 4px 0 0 var(--tc)}",
    ".dk-cmp.table .dk-head{display:grid;grid-template-columns:minmax(120px,.7fr) minmax(0,2fr) minmax(150px,.9fr);column-gap:clamp(12px,2vw,28px);padding:8px 4px;border-bottom:1px solid var(--ltt-line-2);font:700 12px var(--ltt-mono);color:var(--ltt-muted);letter-spacing:.02em}",
    ".dk-cmp.table .dk-item.good{--tc:var(--ltt-good)}.dk-cmp.table .dk-item.bad{--tc:var(--ltt-bad)}.dk-cmp.table .dk-item.warn{--tc:var(--ltt-warn)}",
    /* predict */
    ".dk-pred{display:flex;flex-direction:column;gap:12px}",
    ".dk-pred .ltt-choices button{padding:clamp(16px,2.4vh,24px) 20px;font-size:clamp(16px,1.6vw,21px)}",
    ".dk-pred .ltt-choices button.unsure{color:var(--ltt-muted);font-weight:500;box-shadow:inset 0 0 0 1.5px var(--ltt-line-2);border:0;background:transparent}",
    ".dk-pred .ltt-choices button.unsure.wrong{background:transparent;box-shadow:inset 0 0 0 1.5px var(--ltt-line-2)}",
    ".dk-hint2{display:flex;align-items:center;gap:8px;font-size:15px;color:var(--ltt-muted);margin:0}",
    ".dk-pred.done .dk-hint2,.dk-pred.done .dk-actions{display:none}",
    ".dk-pred.done .ltt-choices button:not(.right):not([aria-pressed=true]){display:none}",
    ".dk-ans{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(12px,2vw,24px);align-items:center}",
    ".dk-ans.solo{grid-template-columns:1fr}",
    ".dk-avis{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,1.8vw,24px);box-shadow:var(--ltt-shadow)}",
    ".dk-avis:empty{display:none}",
    ".dk-why{display:flex;flex-direction:column;gap:8px}",
    ".dk-why .ltt-badge{align-self:flex-start}",
    ".dk-why p{margin:0;font-size:clamp(16px,1.5vw,20px);line-height:1.65}",
    /* keywords */
    ".dk-kw{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:clamp(12px,1.8vw,22px)}",
    ".dk-kw section{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,1.8vw,24px);box-shadow:var(--ltt-shadow)}",
    ".dk-kw section.dark{background:var(--ltt-dark);color:var(--ltt-on-dark);border-color:var(--ltt-dark)}",
    ".dk-kw h3{font-size:13px;font-weight:800;color:var(--ltt-accent);margin:0 0 12px;letter-spacing:.02em}",
    ".dk-kw section.dark h3{color:var(--ltt-accent-on-dark)}",
    ".dk-term{font-family:var(--ltt-font-display);font-size:clamp(22px,2.4vw,32px);font-weight:var(--ltt-display-weight);line-height:1.2;letter-spacing:-.035em;margin:0 0 12px}",
    ".dk-term small{display:block;font-size:14px;font-weight:500;color:color-mix(in srgb,var(--ltt-on-dark) 60%,transparent);letter-spacing:0;margin-top:2px}",
    ".dk-kw ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}.dk-kw li{position:relative;padding-left:18px;line-height:1.5;font-size:clamp(15px,1.3vw,17px)}",
    ".dk-kw li::before{content:'';position:absolute;left:2px;top:.62em;width:7px;height:7px;border-radius:50%;background:var(--ltt-accent)}",
    ".dk-q{display:flex;width:fit-content;max-width:100%;box-sizing:border-box;align-items:flex-start;gap:8px;font:13.5px/1.45 var(--ltt-mono);background:var(--ltt-card-2);border-radius:10px;padding:6px 10px;",
    "margin:0 0 8px;cursor:copy;transition:background-color .2s}.dk-q:hover{background:var(--ltt-accent-soft)}",
    ".dk-q.copied{background:var(--ltt-good-soft)}",
    ".dk-nb{display:grid;gap:12px;font-size:clamp(14px,1.2vw,16px);margin-top:6px}.dk-nb b{display:block;font-size:clamp(15px,1.3vw,17px)}.dk-nb span{color:var(--ltt-muted);line-height:1.5}",
    /* summary */
    ".dk-rc{list-style:none;margin:0;padding:0;counter-reset:rc;display:grid;grid-template-columns:repeat(var(--c,1),minmax(0,1fr));gap:clamp(10px,2vh,22px) clamp(20px,3vw,44px);align-items:start}",
    ".dk-rc .row{display:flex;gap:8px;align-items:stretch}.dk-rc .row textarea{flex:1;min-width:0}.dk-rc .row .dk-actions{flex:none}",
    ".dk-rc li{counter-increment:rc;position:relative;padding-left:clamp(40px,4vw,56px);display:grid;gap:8px}",
    ".dk-rc li::before{content:counter(rc,decimal-leading-zero);position:absolute;left:0;top:.1em;font:700 clamp(15px,1.4vw,18px) var(--ltt-mono);color:var(--ltt-accent)}",
    ".dk-rc li.extra::before{content:'+'}",
    ".dk-rc .q{margin:0;font-family:var(--ltt-font-display);font-size:clamp(17px,1.5vw,21px);font-weight:var(--ltt-display-weight);letter-spacing:-.02em;line-height:1.35}",
    ".dk-rc textarea{font:inherit;font-size:15px;line-height:1.4;padding:7px 12px;border:1.5px solid var(--ltt-line-2);border-radius:12px;background:var(--ltt-card);color:var(--ltt-ink);resize:vertical}",
    ".dk-rc .a{border-left:3px solid var(--ltt-accent);padding:2px 0 2px 14px}.dk-rc .a p{margin:0;font-size:clamp(15px,1.4vw,19px);line-height:1.55;color:var(--ltt-ink-2)}",
    ".dk-rc .a .ask{margin-top:6px;font-size:clamp(13.5px,1.15vw,15.5px);color:var(--ltt-ink-2)}.dk-rc .a .ask b{color:var(--ltt-accent);font-size:12px;margin-right:6px}",
    ".dk-sum{display:grid;grid-template-columns:repeat(var(--c,4),minmax(0,1fr));gap:clamp(10px,1.4vw,20px)}",
    ".dk-sc{display:flex;flex-direction:column;gap:12px;min-height:min(22vh,200px);background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-sc .t{display:flex;align-items:baseline;gap:10px;font-family:var(--ltt-font-display);font-size:clamp(18px,1.75vw,24px);font-weight:var(--ltt-display-weight);letter-spacing:-.03em;line-height:1.3}",
    ".dk-sc .t i{font-style:normal;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-sc p{margin:0;font-size:clamp(15px,1.4vw,19px);color:var(--ltt-ink-2);line-height:1.55}",
    ".dk-sc .ask{margin-top:auto;font-size:clamp(13.5px,1.15vw,15.5px);background:var(--ltt-card-2);border-radius:12px;padding:9px 12px}",
    ".dk-sc .ask b{color:var(--ltt-accent);font-size:12px;margin-right:6px}",
    ".dk-sc.dark{background:var(--ltt-dark);color:var(--ltt-on-dark);border-color:var(--ltt-dark)}.dk-sc.dark p{color:color-mix(in srgb,var(--ltt-on-dark) 78%,transparent)}",
    /* shared */
    ".dk-math summary{cursor:pointer;font-size:13px;font-weight:650;color:var(--ltt-muted)}.dk-math{font-size:15px}",
    ".dk-actions{display:flex;gap:8px;flex-wrap:wrap}",
    ".dk-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:clamp(8px,1.6vh,18px) 0 clamp(12px,2.4vh,26px)}",
    ".dk-nav button{display:inline-flex;align-items:center;gap:8px;padding:11px 22px}",
    ".dk-nav .ltt-ic{width:18px;height:18px}",
    ".dk-hint{font-size:12.5px;color:var(--ltt-muted)}.dk-hint kbd{font:11px var(--ltt-mono);padding:2px 6px;border-radius:5px;background:var(--ltt-card);box-shadow:inset 0 -1px 0 var(--ltt-line-2),0 0 0 1px var(--ltt-line)}",
    "@media (max-height:920px){.dk-top{padding:12px 0 4px}.dk-nav{padding:6px 0 12px}.dk-in{gap:12px}",
    ".dk-no{font-size:clamp(48px,10vh,84px)}.dk-scene h2{font-size:clamp(24px,min(3.2vw,5.2vh),44px)}.dk-sub{font-size:16px}",
    ".ltt-take{padding:10px 18px;border-radius:18px}.ltt-take .t{font-size:clamp(15px,1.4vw,18px)}}",
    "@media (max-width:1000px){.dk-main.split{grid-template-columns:minmax(0,1fr)}.dk-kw{grid-template-columns:1fr 1fr}.dk-kw section:first-child{grid-column:1/-1}",
    ".dk-sum{--c:2!important}.dk-ans{grid-template-columns:1fr}}"
  ].join("");

  function iconOr(v) {
    if (v && LTT.icons.indexOf(v) >= 0) return LTT.icon(v);
    return v || "";
  }

  function rise(nodes) {
    [].forEach.call(nodes, function (n, i) {
      n.classList.remove("ltt-rise");
      void n.offsetWidth;
      n.style.setProperty("--i", i);
      n.classList.add("ltt-rise");
    });
  }

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  var TYPES = {
    hook: function (s, body) {
      var w = h("div", "dk-hook");
      var art = h("div", "art", iconOr(s.art));
      if (!s.art) art.style.display = "none";
      var tx = h("div", "tx");
      if (s.kicker) tx.appendChild(h("span", "dk-kicker", s.kicker));
      if (s.pre) tx.appendChild(h("p", "pre", s.pre));
      tx.appendChild(h("p", "big", s.text));
      if (s.sub) tx.appendChild(h("p", "dk-sub", s.sub));
      if (s.chips) tx.appendChild(LTT.chips(s.chips));
      w.append(art, tx);
      body.appendChild(w);
      return { enter: function () { rise([art].concat([].slice.call(tx.children))); } };
    },
    // form: "cards" (independent parts), "strip" (one connected sequence), "stack" (vertical timeline with a visual per step).
    explain: function (s, body, ctx) {
      var form = s.form || "cards";
      var w = h("div", "dk-steps " + form);
      w.style.setProperty("--n", s.steps.length);
      s.steps.forEach(function (st, i) {
        var c = h("div", "dk-step");
        if (form === "cards") {
          c.append(h("span", "no", pad2(i + 1)));
          if (st.icon) c.append(h("div", "ic", iconOr(st.icon)));
          c.append(h("b", null, st.title), h("p", null, st.text || ""));
          if (s.arrows !== false && i < s.steps.length - 1) c.append(h("span", "ar", LTT.icon("arrow", { weight: 2.6 })));
        } else {
          c.append(h("div", "dk-node", st.icon ? iconOr(st.icon) : pad2(i + 1)));
          var tx = form === "stack" ? c.appendChild(h("div", "tx")) : c;
          if (form === "strip" && st.icon) tx.append(h("span", "no", pad2(i + 1)));
          tx.append(h("b", null, st.title), h("p", null, st.text || ""));
        }
        if (st.visual) fill(c.appendChild(h("div", "vis")), st.visual, ctx);
        w.appendChild(c);
      });
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    // Introduces glossary terms in plain words before they are used; each card = one term.
    terms: function (s, body, ctx) {
      var w = h("div", "dk-terms");
      w.style.setProperty("--n", s.terms.length);
      s.terms.forEach(function (t) {
        var c = h("div", "dk-tm");
        c.innerHTML = "<div class='top'>" + (t.icon ? "<span class='ic'>" + iconOr(t.icon) + "</span>" : "") + "<span class='w'></span></div><p class='p'></p>";
        c.querySelector(".w").innerHTML = (t.word || t.key) + (t.en ? "<small>" + t.en + "</small>" : "");
        c.querySelector(".p").innerHTML = t.plain || "";
        if (t.visual) c.insertBefore(h("div", "vis"), c.querySelector(".p"));
        if (t.visual) fill(c.querySelector(".vis"), t.visual, ctx);
        if (t.example) c.appendChild(h("div", "ex", t.example));
        w.appendChild(c);
      });
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    // Verdicts stay hidden until the viewer asks, so side-by-side cases are judged before being labelled.
    compare: function (s, body, ctx) {
      var w = h("div", "dk-cmp" + (s.form === "table" ? " table" : ""));
      w.style.setProperty("--n", s.items.length);
      if (s.cols) w.style.setProperty("--m", s.cols);
      if (s.form === "table" && s.head) {
        var hd = w.appendChild(h("div", "dk-head"));
        s.head.forEach(function (t) { hd.appendChild(h("span", null, t)); });
      }
      var cells = [];
      s.items.forEach(function (it) {
        var c = h("div", "dk-item " + (it.tone || ""));
        cells.push(c);
        var vis = h("div", "vis");
        var ic = { good: "check", bad: "x", warn: "alert" }[it.tone];
        c.append(h("div", "lab", it.label), vis, h("div", "vd", (ic ? LTT.icon(ic, { weight: 3 }) : "") + "<span>" + (it.verdict || "") + "</span>"),
          it.note ? h("p", "note" + (it.noteAfter ? " after" : ""), it.note) : "");
        fill(vis, it.visual, ctx);
        w.appendChild(c);
      });
      body.appendChild(w);
      if (s.reveal === false) w.classList.add("shown");
      else {
        var b = h("button", null, s.revealLabel || "판정 보기");
        b.onclick = function () {
          w.classList.add("shown"); b.disabled = true;
          s.items.forEach(function (it, k) { if (it.onReveal) it.onReveal(cells[k].querySelector(".vis")); });
          LTT.linkTerms(w, ctx.index);
          ctx.fit();
          LTT.record("compare-reveal", { scene: s.title });
        };
        body.appendChild(h("div", "dk-actions")).appendChild(b);
      }
      return { enter: function () { rise(cells); s.items.forEach(function (it, k) { if (it.enter) it.enter(cells[k].querySelector(".vis")); }); } };
    },
    // With `steps`, the figure sits left and a stepper caption column right; figure() may return {el, ...api} and each step's
    // enter(k, api) receives that object, so one drawing can be walked through several states.
    figure: function (s, body, ctx) {
      var f = h("figure", "dk-fig");
      var st = f.appendChild(h("div", "dk-fig-stage"));
      st.setAttribute("data-annotate", "");
      if (s.steps) {
        var row = st.appendChild(h("div", "dk-figsteps")), pic = row.appendChild(h("div", "pic")), ret = null;
        if (typeof s.figure === "function") {
          ret = s.figure(pic, ctx);
          if (ret && ret.el instanceof Node) pic.appendChild(ret.el);
          else if (ret != null && !(ret && ret.el)) fill(pic, ret, ctx);
        } else fill(pic, s.figure, ctx);
        var api = ret && ret.el ? ret : pic;
        LTT.stepper(row.appendChild(h("div", "ctl")), s.steps.map(function (x) {
          return { caption: x.caption, enter: function (k, dir) { if (x.enter) x.enter(k, api, dir); } };
        }), { interval: s.interval || 2600 });
      } else fill(st, s.figure, ctx);
      if (s.caption) {
        var n = ctx.scenes.slice(0, ctx.index + 1).filter(function (x) { return x.type === "figure"; }).length;
        var cap = f.appendChild(h("figcaption", null, "<b></b><span></span>"));
        cap.firstChild.textContent = s.label || "그림 " + n + ".";
        cap.lastChild.innerHTML = s.caption;
      }
      body.appendChild(f);
      return {};
    },
    statement: function (s, body, ctx) {
      var w = h("div", "dk-st" + (s.visual ? "" : " solo"));
      var tx = w.appendChild(h("div", "tx"));
      if (s.number !== false) tx.appendChild(h("span", "no", pad2(ctx.index + 1) + " —"));
      if (s.kicker) tx.appendChild(h("span", "dk-kicker", s.kicker));
      tx.appendChild(h("p", "claim", s.title));
      if (s.sub) tx.appendChild(h("p", "dk-sub", s.sub));
      if (s.chips) tx.appendChild(LTT.chips(s.chips));
      if (s.visual) fill(w.appendChild(h("div", "vis")), s.visual, ctx);
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    contrast: function (s, body, ctx) {
      var ba = LTT.beforeAfter({ before: s.before, after: s.after }, ctx);
      body.appendChild(ba.el);
      return { enter: function () { rise(ba.el.children); ba.replay(); } };
    },
    // A low-stakes guess, not a quiz: "모르겠다" is always offered and the answer arrives as an infographic.
    predict: function (s, body, ctx) {
      var w = h("div", "dk-pred");
      var box = h("div");
      var choices = s.choices.concat(s.unsure === false ? [] : [{ id: "unsure", text: "잘 모르겠다" }]);
      choices.forEach(function (c) {
        var b = h("button", c.id === "unsure" ? "unsure" : null, c.text);
        b.dataset.choice = c.id;
        box.appendChild(b);
      });
      var lock = h("button", "accent", s.button || "정답 보기");
      var ans = h("div", "dk-ans ltt-hidden" + (s.answerVisual ? "" : " solo"));
      var av = h("div", "dk-avis");
      var why = h("div", "dk-why", LTT.badge("accent", "정답과 이유") + "<p></p>");
      why.querySelector("p").innerHTML = s.why || "";
      ans.append(av, why);
      if (s.visual) fill(w.appendChild(h("div", "dk-pvis")), s.visual, ctx);
      w.append(h("p", "dk-hint2", LTT.icon("question") + "<span>" + (s.hint || "틀려도 괜찮다. 감으로 하나 고른다.") + "</span>"), box, h("div", "dk-actions"), ans);
      w.querySelector(".dk-actions").appendChild(lock);
      body.appendChild(w);
      LTT.predict({ question: s.question || s.title, choices: box, button: lock, answer: s.answer, show: [ans],
        reveal: function (v) {
          w.classList.add("done");
          if (typeof s.answerVisual === "function") s.answerVisual(av, v);
          else if (s.answerVisual) av.innerHTML = s.answerVisual;
          LTT.linkTerms(ans, ctx.index);
          if (s.reveal) s.reveal(v);
          ctx.fit();
        } });
      return {};
    },
    // With `recall` questions the recap is retrieval practice in plain text: the question comes first and the takeaway
    // opens only after the viewer has tried, since re-reading takeaway cards builds a feeling of knowing, not recall.
    summary: function (s, body, ctx) {
      var cards = LTT.summaryCards(s, ctx.scenes);
      if (cards.some(function (c) { return c.recall; })) return recallList(s, cards, body, ctx);
      var w = h("div", "dk-sum");
      cards.forEach(function (c) {
        var d = h("div", "dk-sc");
        d.innerHTML = "<div class='t'>" + (c.n ? "<i>" + pad2(c.n) + "</i>" : "") + "<span></span></div><p></p>";
        d.querySelector(".t span").innerHTML = c.title || "";
        d.querySelector("p").innerHTML = c.text;
        if (c.ask) d.appendChild(h("div", "ask", "<b>agent에게</b>" + c.ask));
        w.appendChild(d);
      });
      if (s.extra) {
        var x = h("div", "dk-sc dark");
        x.innerHTML = "<div class='t'><span></span></div><p></p>";
        x.querySelector(".t span").innerHTML = s.extra.title;
        x.querySelector("p").innerHTML = s.extra.text;
        w.appendChild(x);
      }
      var n = w.children.length;
      w.style.setProperty("--c", s.cols || (n <= 4 ? n : Math.min(4, Math.ceil(n / 2))));
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    keywords: function (s, body) {
      var w = h("div", "dk-kw");
      var a = h("section", "dark"), b = h("section"), c = h("section");
      a.appendChild(h("h3", null, "이 이름으로 기억"));
      (s.terms || []).forEach(function (t) { a.appendChild(h("div", "dk-term", t.ko + (t.en ? "<small>" + t.en + "</small>" : ""))); });
      b.appendChild(h("h3", null, "이럴 때 떠올린다"));
      var ul = h("ul");
      (s.signals || []).forEach(function (x) { ul.appendChild(h("li", null, x)); });
      b.appendChild(ul);
      if (s.neighbors) {
        b.appendChild(h("h3", null, "헷갈리는 이웃")).style.marginTop = "18px";
        var nb = h("div", "dk-nb");
        s.neighbors.forEach(function (n) { var d = h("div"); d.append(h("b", null, n.term), h("span", null, n.diff)); nb.appendChild(d); });
        b.appendChild(nb);
      }
      c.appendChild(h("h3", null, "검색어 (눌러서 복사)"));
      (s.queries || []).forEach(function (q) {
        var k = h("span", "dk-q", LTT.icon("search") + "<span></span>");
        k.lastChild.textContent = q;
        k.onclick = function () {
          if (navigator.clipboard) navigator.clipboard.writeText(q);
          k.classList.add("copied");
          setTimeout(function () { k.classList.remove("copied"); }, 900);
        };
        c.appendChild(k);
      });
      w.append(a, b, c);
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    }
  };

  function recallList(s, cards, body, ctx) {
    var w = body.appendChild(h("ol", "dk-rc"));
    cards.forEach(function (c) {
      var li = w.appendChild(h("li", null, "<p class='q'></p>"));
      li.firstChild.innerHTML = c.recall || c.title || "";
      var a = h("div", "a" + (c.recall ? " ltt-hidden" : ""), "<p></p>");
      a.firstChild.innerHTML = c.text;
      if (c.ask) a.appendChild(h("p", "ask", "<b>agent에게</b>" + c.ask));
      if (c.recall) {
        var row = li.appendChild(h("div", "row"));
        var box = row.appendChild(h("textarea"));
        box.rows = 1;
        box.placeholder = "떠올린 답 (적지 않아도 된다)";
        var b = row.appendChild(h("div", "dk-actions")).appendChild(h("button", "ghost", "답 보기"));
        b.onclick = function () {
          a.classList.remove("ltt-hidden"); b.disabled = true;
          LTT.linkTerms(a, ctx.index);
          ctx.fit();
          LTT.record("recall", { scene: c.title, question: stripTags(c.recall), answer: box.value.trim() });
        };
      }
      li.appendChild(a);
    });
    if (s.extra) {
      var x = w.appendChild(h("li", "extra", "<p class='q'></p><div class='a'><p></p></div>"));
      x.querySelector(".q").innerHTML = s.extra.title;
      x.querySelector(".a p").innerHTML = s.extra.text;
    }
    if (w.children.length > 3) w.style.setProperty("--c", 2);
    return { enter: function () { rise(w.children); } };
  }
  function stripTags(html) { return String(html).replace(/<[^>]*>/g, ""); }

  var SPLIT_OFF = { hook: 1, keywords: 1, summary: 1, terms: 1, contrast: 1, predict: 1, figure: 1, statement: 1 };
  var NO_HEAD = { hook: 1, statement: 1 };

  // A scene must read as one screen: if it would scroll, shrink it (not below 78%) instead.
  function fit(el, inner) {
    inner.style.zoom = inner.style.width = "";
    // Measure the rendered box each pass: scrollHeight before zooming does not predict the zoomed layout.
    var avail = el.clientHeight - 8, z = 1;
    for (var k = 0; k < 4 && z > 0.78; k++) {
      var got = inner.getBoundingClientRect().height;
      if (got <= avail + 1) return;
      z = Math.max(0.78, z * avail / got);
      // A zoomed 100%-wide box keeps its visual width, so width-driven content (SVG) would not shrink; scale the width too.
      inner.style.zoom = z;
      inner.style.width = z * 100 + "%";
    }
  }

  var MOCKS = ".ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code";
  var VISUALS = "svg.ltt-svg,svg.ltt-dg,.ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code,canvas,img,.ltt-ba,.dk-fig-stage>*,[data-visual]";

  function area(r) { return Math.max(0, r.width) * Math.max(0, r.height); }

  // Rendered-layout measurements for LTT.auditScene; hidden scenes still lay out, so this runs without showing them.
  function measure(s, el) {
    var inner = el.firstChild, body = el.querySelector(".dk-body"), stage = area(el.getBoundingClientRect()) || 1;
    var zoom = parseFloat(inner.style.zoom) || 1, ih = inner.getBoundingClientRect().height;
    var biggest = 0;
    [].forEach.call(body.querySelectorAll(VISUALS), function (v) { biggest = Math.max(biggest, area(v.getBoundingClientRect()) * zoom * zoom); });
    // Compare rows read as one figure together, so their visuals count as a sum rather than the largest one.
    if (s.type === "compare") {
      var sum = 0;
      [].forEach.call(body.querySelectorAll(".dk-item .vis"), function (v) { sum += area(v.getBoundingClientRect()) * zoom * zoom; });
      biggest = Math.max(biggest, sum);
    }
    var fig = el.querySelector(".dk-fig-stage"), figRatio = null;
    if (fig && fig.firstElementChild) {
      var fr = fig.getBoundingClientRect(), cr = fig.firstElementChild.getBoundingClientRect();
      figRatio = Math.min(1, area(cr) / (area(fr) || 1));
    }
    var sizes = {};
    [].forEach.call(body.querySelectorAll("*"), function (n) {
      if (n.closest(MOCKS) || n.closest("svg") || n.closest(".ltt-mk")) return;
      var own = [].some.call(n.childNodes, function (c) { return c.nodeType === 3 && c.nodeValue.trim(); });
      if (own) sizes[Math.round(parseFloat(getComputedStyle(n).fontSize))] = 1;
    });
    return {
      type: s.type || "", layout: s.layout || "", zoom: zoom, compact: innerWidth <= 1000,
      hscroll: Math.max(0, Math.round(Math.max(inner.scrollWidth, body.scrollWidth) - inner.clientWidth - 1)),
      overflow: ih * zoom > el.clientHeight + 2,
      visualRatio: body.querySelector(VISUALS) ? biggest / stage : null,
      figRatio: figRatio, fill: Math.min(1, (ih * zoom) / (el.clientHeight || 1)),
      fontSizes: Object.keys(sizes).length,
      goals: [].map.call(body.querySelectorAll(".ltt-goal[data-samples]"), function (g) {
        return { hits: +g.dataset.hits, samples: +g.dataset.samples, start: g.dataset.start === "1" };
      })
    };
  }

  // Scenes mount lazily on first visit; `enter` runs on every visit so motion replays when the viewer comes back.
  function deck(spec) {
    var style = h("style");
    style.textContent = STYLE;
    document.head.appendChild(style);
    LTT.theme(spec.theme || "studio");

    var defs = {};
    Object.keys(spec.glossary || {}).forEach(function (k) { defs[k] = spec.glossary[k]; });
    spec.scenes.forEach(function (s) { if (s.type === "terms") s.terms.forEach(function (t) { if (!defs[t.key]) defs[t.key] = t.plain; }); });
    LTT.setGlossary(defs, LTT.termIndex(spec));
    var lint = LTT.lintDeck(spec);
    lint.forEach(function (w) { LTT.warn((w.scene ? "장면 " + w.scene + ": " : "덱: ") + w.msg); });
    if (lint.length) LTT.record("lint", lint);

    var root_ = h("div", "dk");
    var top = h("header", "dk-top"), prog = h("div", "dk-prog"), count = h("span", "dk-count"), dots = h("nav", "dk-dots");
    var stage = h("div", "dk-stage"), nav = h("footer", "dk-nav");
    top.append(h("h1", null, "<span></span>"), prog);
    top.querySelector("h1 span").textContent = spec.title;
    prog.append(count, dots);
    var prev = h("button", "ghost", LTT.icon("arrow", { cls: "flip" }).replace("<svg", "<svg style='transform:scaleX(-1)'") + "이전");
    var next = h("button", null, "다음" + LTT.icon("arrow"));
    var hint = h("span", "dk-hint", "<kbd>←</kbd> <kbd>→</kbd> 키로 이동 · 밑줄 친 용어에 마우스를 올리면 풀이");
    nav.append(prev, hint, next);
    root_.append(top, stage, nav);
    document.title = spec.title;
    (spec.mountIn ? document.querySelector(spec.mountIn) : document.body).appendChild(root_);

    var scenes = spec.scenes, cur = -1, mounted = [];
    scenes.forEach(function (s, i) {
      var d = h("i");
      d.title = s.title || "";
      d.onclick = function () { go(i); };
      dots.appendChild(d);
      stage.appendChild(h("section", "dk-scene"));
    });

    function mount(i) {
      var s = scenes[i], el = stage.children[i], ctx = { el: el, scene: s, index: i, scenes: scenes };
      var inner = el.appendChild(h("div", "dk-in"));
      if (!NO_HEAD[s.type]) {
        var head = inner.appendChild(h("div", "dk-head"));
        if (s.number !== false) head.appendChild(h("div", "dk-no", pad2(i + 1)));
        else head.style.gridTemplateColumns = "1fr";
        var ht = head.appendChild(h("div", "dk-ht"));
        if (s.kicker) ht.appendChild(h("span", "dk-kicker", s.kicker));
        if (s.title) ht.appendChild(h("h2", null, s.title + (s.en ? " <span class='en'>" + s.en + "</span>" : "")));
        if (s.chips) ht.appendChild(LTT.chips(s.chips));
        if (s.sub && s.type !== "statement") inner.appendChild(h("p", "dk-sub", s.sub));
      }
      // "full": the visual takes the whole width and its reading guide sits underneath like a figure caption.
      var full = s.layout ? s.layout === "full" : s.type === "figure";
      var split = !full && (s.layout ? s.layout === "split" : !SPLIT_OFF[s.type] && !!(s.narration || s.points));
      var main = inner.appendChild(h("div", "dk-main" + (split ? " split" : full ? " full" : "")));
      var body = main.appendChild(h("div", "dk-body" + (s.bare || full ? " bare" : "")));
      var rail = split ? main.appendChild(h("aside", "dk-rail")) : full ? inner.appendChild(h("div", "dk-capbar")) : null;
      if (!split && !full && s.narration) inner.insertBefore(h("div", "dk-lead"), main).appendChild(LTT.narration(s.narration));

      var r = TYPES[s.type] ? TYPES[s.type](s, body, ctx) : {};
      var custom = s.mount ? s.mount(body, ctx) : null;
      var anno = null;
      if (rail && s.narration) rail.appendChild(LTT.narration(s.narration));
      if (s.points) {
        var target = s.pointsOn ? body.querySelector(s.pointsOn) :
          (s.type === "figure" && body.querySelector(".ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code")) || body.querySelector("[data-annotate]") || body.firstElementChild;
        anno = LTT.annotate(target, s.points, { tone: s.pointsTone });
        if (rail) { if (s.narration && !full) rail.appendChild(h("hr")); rail.appendChild(anno.list); }
        else inner.insertBefore(anno.list, main.nextSibling);
      }
      if (s.aside) fill((rail || inner).appendChild(h("div")), s.aside, ctx);
      if (s.tex) {
        var m = h("details", "dk-math");
        m.append(h("summary", null, "수식으로 보기"), h("div"));
        m.lastChild.dataset.tex = s.tex;
        m.lastChild.setAttribute("data-display", "");
        (rail || inner).appendChild(m);
        LTT.math(m);
      }
      if (s.basis) (rail || inner).appendChild(h("p", "ltt-basis", s.basis));
      if (s.takeaway) inner.appendChild(LTT.takeaway(s.takeaway, s.sources));
      LTT.linkTerms(el, i);
      ctx.fit = function () { fit(el, inner); };
      mounted[i] = { fit: ctx.fit, enter: function () {
        if (r && r.enter) r.enter();
        if (custom && custom.enter) custom.enter();
        if (anno) anno.replay();
        if (s.enter) s.enter(body, ctx);
      }, leave: custom && custom.leave };
    }

    function go(i) {
      i = Math.max(0, Math.min(scenes.length - 1, i));
      if (i === cur) return;
      if (cur >= 0) {
        if (mounted[cur] && mounted[cur].leave) mounted[cur].leave();
        stage.children[cur].classList.remove("cur");
        stage.children[cur].classList.toggle("prev", i > cur);
      }
      if (!mounted[i]) mount(i);
      var el = stage.children[i];
      el.classList.remove("prev");
      el.classList.add("cur");
      el.scrollTop = 0;
      cur = i;
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === i); d.classList.toggle("seen", j < i); });
      count.textContent = pad2(i + 1) + " / " + pad2(scenes.length);
      prev.disabled = i === 0;
      next.disabled = i === scenes.length - 1;
      try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) { /* file:// or sandboxed */ }
      LTT.record("scene", { index: i, title: scenes[i].title || scenes[i].type });
      mounted[i].enter();
      mounted[i].fit();
    }

    function refit() { if (mounted[cur]) mounted[cur].fit(); }
    addEventListener("resize", refit);
    // Pretendard swaps in after first paint and changes line heights.
    if (document.fonts) document.fonts.ready.then(refit);

    prev.onclick = function () { go(cur - 1); };
    next.onclick = function () { go(cur + 1); };
    document.addEventListener("keydown", function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(cur - 1); }
    });
    // Mounts every scene and checks the rendered layout; `?audit` in the URL runs it on load.
    function audit() {
      var found = [];
      scenes.forEach(function (s, i) {
        if (!mounted[i]) mount(i);
        mounted[i].fit();
        LTT.auditScene(measure(s, stage.children[i])).forEach(function (w) { found.push({ scene: i + 1, rule: w.rule, msg: w.msg }); });
      });
      found.forEach(function (w) { LTT.warn("화면 점검 · 장면 " + w.scene + ": " + w.msg); });
      document.documentElement.setAttribute("data-ltt-audit", found.length);
      LTT.record("layout-audit", { viewport: [innerWidth, innerHeight], found: found });
      return found;
    }

    var start = parseInt((location.hash || "").slice(1), 10);
    go(isFinite(start) ? start - 1 : 0);
    if (/[?&]audit\b/.test(location.search)) {
      if (document.fonts) document.fonts.ready.then(function () { setTimeout(audit, 300); }); else setTimeout(audit, 300);
    }
    return { go: go, lint: lint, audit: audit, get index() { return cur; } };
  }

  LTT.deck = deck;
  LTT.deckTypes = TYPES;
})(typeof globalThis !== "undefined" ? globalThis : this);
