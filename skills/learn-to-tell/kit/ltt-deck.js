(function (root) {
  "use strict";
  var LTT = root.LTT;
  if (!LTT || !LTT.predict || !LTT.annotate || !LTT.sceneTypes) throw new Error("ltt-deck.js needs ltt.js, ltt-parts.js and ltt-ui.js loaded first");
  var h = LTT.h, fill = LTT.fill;

  var STYLE = /* css:start ltt-deck.css */[
    "html,body{height:100%}",
    "body{overflow:hidden}",
    ".dk{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr auto;height:100vh;height:100dvh;max-width:1440px;margin:0 auto;padding:0 clamp(16px,3.2vw,56px);box-sizing:border-box;overflow-x:clip}",
    ".dk-top{display:flex;align-items:center;gap:16px;padding:clamp(12px,2.2vh,26px) 0 clamp(4px,1vh,10px)}",
    ".dk-top h1{display:inline-flex;align-items:center;gap:10px;margin:0;min-width:0;max-width:60%;font-size:14px;font-weight:700;letter-spacing:-.01em;background:var(--ltt-card);padding:8px 16px 8px 14px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ltt-line)}",
    ".dk-top h1 span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dk-top h1::before{content:'';flex:none;width:9px;height:9px;border-radius:50%;background:var(--ltt-accent)}",
    ".dk-prog{margin-left:auto;display:flex;align-items:center;gap:14px;min-width:0}",
    ".dk-count{font-size:15px;font-weight:700;color:var(--ltt-muted);font-variant-numeric:tabular-nums;white-space:nowrap}",
    ".dk-dots{display:flex;gap:6px;min-width:0}",
    ".dk-dots i{width:28px;flex:0 1 28px;min-width:6px;height:6px;border-radius:3px;background:var(--ltt-line-2);cursor:pointer;transition:background-color .3s,width .3s}",
    ".dk-dots i.seen{background:color-mix(in srgb,var(--ltt-accent) 35%,var(--ltt-line-2))}",
    ".dk-dots i.on{background:var(--ltt-accent)}",
    ".dk-stage{position:relative;min-height:0}",
    ".dk-scene{position:absolute;inset:0;display:flex;flex-direction:column;overflow:auto;padding:4px 2px;opacity:0;visibility:hidden;transform:translateX(24px);transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1),visibility 0s .45s}",
    ".dk-scene.prev{transform:translateX(-24px)}",
    ".dk-scene.cur{opacity:1;visibility:visible;transform:none;transition:opacity .35s,transform .45s cubic-bezier(.2,.7,.2,1)}",
    ".dk-in{margin:auto;display:flex;flex-direction:column;gap:clamp(10px,2.2vh,26px);width:100%}",
    ".dk-head{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:clamp(16px,2.4vw,36px);align-items:center}",
    ".dk-no{font-size:clamp(50px,min(7.6vw,12vh),108px);font-weight:850;letter-spacing:-.06em;line-height:.86;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-ht{display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);min-width:0}",
    ".dk-kicker{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:750;color:var(--ltt-ink-2);background:var(--ltt-card);padding:5px 14px 5px 12px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ltt-line)}",
    ".dk-kicker::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--kc,var(--ltt-accent))}",
    ".dk-scene h2{font-family:var(--ltt-font-display);font-size:clamp(26px,min(3.5vw,5.8vh),50px);font-weight:var(--ltt-display-weight);line-height:1.14;letter-spacing:var(--ltt-display-track);margin:0}",
    ".dk-scene h2 .en{font-size:.52em;font-weight:400;letter-spacing:-.01em;color:var(--ltt-muted);margin-left:.5em;white-space:nowrap}",
    ".dk-sub{font-size:clamp(16px,1.5vw,20px);color:var(--ltt-muted);margin:0;max-width:72ch;line-height:1.55}",
    ".dk-main{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(14px,2vw,28px);align-items:stretch}",
    ".dk-main.split{grid-template-columns:minmax(0,1.45fr) minmax(280px,1fr)}",
    ".dk-body{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:14px}",
    ".dk-main.split>.dk-body{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,2vw,30px);box-shadow:var(--ltt-shadow)}",
    ".dk-main.split>.dk-body.bare{background:none;border:0;box-shadow:none;padding:0}",
    ".dk-rail{display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,2vh,20px);min-width:0;padding:4px 4px}",
    ".dk-rail .ltt-basis,.dk-in>.ltt-basis{margin:0}",
    ".dk-rail hr{border:0;border-top:1px solid var(--ltt-line-2);margin:2px 0;width:100%}",
    ".dk-lead{display:flex;flex-direction:column;gap:6px;max-width:80ch}",
    ".dk-hook{display:grid;grid-template-columns:auto minmax(0,1fr);gap:clamp(20px,5vw,72px);align-items:center;padding:clamp(8px,3vh,40px) 0}",
    ".dk-hook .art{width:clamp(120px,18vw,240px);aspect-ratio:1;border-radius:max(var(--ltt-r-lg),min(36%,calc(var(--ltt-r-lg) * 4)));display:flex;align-items:center;justify-content:center;background:var(--ltt-card);box-shadow:var(--ltt-shadow),inset 0 0 0 1.5px var(--ltt-line);font-size:clamp(60px,9vw,120px);color:var(--ltt-accent)}",
    ".dk-hook .art .ltt-ic{width:52%;height:52%}",
    ".dk-hook.free{grid-template-columns:fit-content(40%) minmax(0,1fr)}",
    ".dk-hook .art.free{width:auto;min-width:0;aspect-ratio:auto;border-radius:0;display:block;background:none;box-shadow:none;font-size:inherit;color:inherit}",
    ".dk-hook .art.free :is(svg,img,canvas){max-width:100%;height:auto}",
    ".dk-hook .tx{display:flex;flex-direction:column;gap:clamp(12px,2.4vh,22px)}",
    ".dk-hook .pre{font-size:clamp(18px,2.4vw,32px);font-weight:400;color:var(--ltt-muted);letter-spacing:-.03em;margin:0;line-height:1.25}",
    ".dk-hook .big{font-family:var(--ltt-font-display);font-size:clamp(32px,5.6vw,78px);font-weight:var(--ltt-display-weight);line-height:1.1;letter-spacing:calc(var(--ltt-display-track) - .015em);margin:0}",
    ".dk-hook .big u{text-decoration:none;background:linear-gradient(transparent 62%,color-mix(in srgb,var(--ltt-accent) 22%,transparent) 0)}",
    ".dk-hook .dk-sub{font-size:clamp(15px,1.6vw,20px)}",
    ".dk-steps{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(12px,2.4vw,36px);align-items:stretch}",
    ".dk-step{position:relative;display:flex;flex-direction:column;gap:8px;background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-step .no{font-size:15px;font-weight:800;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-step .ic{width:clamp(44px,4.6vw,60px);height:clamp(44px,4.6vw,60px);border-radius:var(--ltt-r-md);background:var(--ltt-accent-soft);color:var(--ltt-accent);display:flex;align-items:center;justify-content:center;font-size:clamp(24px,2.6vw,32px);margin:4px 0 6px}",
    ".dk-step .ic .ltt-ic{width:56%;height:56%}",
    ".dk-step b{display:block;overflow-wrap:anywhere;font-family:var(--ltt-font-display);font-size:clamp(19px,1.9vw,27px);font-weight:var(--ltt-display-weight);letter-spacing:-.03em;line-height:1.3}",
    ".dk-step p{margin:0;color:var(--ltt-muted);font-size:clamp(15px,1.3vw,18px);line-height:1.6}",
    ".dk-step .vis{margin-top:auto;padding-top:8px}",
    ".dk-step>.ar{position:absolute;z-index:2;right:calc(-1 * clamp(12px,2.4vw,36px) / 2 - 15px);top:50%;width:30px;height:30px;margin-top:-15px;border-radius:50%;background:var(--ltt-ink);color:var(--ltt-bg);display:flex;align-items:center;justify-content:center}",
    ".dk-step>.ar .ltt-ic{width:16px;height:16px}",
    ".dk-steps.strip{position:relative;gap:clamp(12px,2vw,32px)}",
    ".dk-steps.strip::before{content:'';position:absolute;left:0;right:0;top:27px;border-top:2px solid var(--ltt-line-2)}",
    ".dk-steps.strip .dk-step,.dk-steps.stack .dk-step{background:none;border:0;box-shadow:none;border-radius:0;padding:0}",
    ".dk-node{position:relative;z-index:1;width:54px;height:54px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--ltt-bg);color:var(--ltt-accent);box-shadow:inset 0 0 0 2px var(--ltt-accent);font:700 16px var(--ltt-mono)}",
    ".dk-node .ltt-ic{width:24px;height:24px}",
    ".dk-steps.strip .dk-step .no{margin-top:4px}",
    ".dk-steps.strip .dk-step:last-child .dk-node{background:var(--ltt-accent);color:var(--ltt-on-accent)}",
    ".dk-steps.stack{grid-template-columns:1fr!important;gap:0;max-width:1100px}",
    ".dk-steps.stack .dk-step{display:grid;grid-template-columns:54px minmax(0,1fr) minmax(0,1.15fr);column-gap:clamp(14px,2vw,32px);align-items:start;padding-bottom:clamp(6px,1.4vh,18px)}",
    ".dk-steps.stack .dk-step:not(:last-child)::before{content:'';position:absolute;left:26px;top:54px;bottom:0;border-left:2px solid var(--ltt-line-2)}",
    ".dk-steps.stack .dk-step .tx{display:flex;flex-direction:column;gap:4px;padding-top:8px}",
    ".dk-steps.stack .dk-step .vis{margin:0;padding:0}",
    ".dk-steps.stack .dk-step:not(:has(.vis)){grid-template-columns:54px minmax(0,1fr)}",
    ".dk-terms{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(12px,2vw,28px)}",
    ".dk-tm{display:flex;flex-direction:column;gap:12px;min-height:min(34vh,320px);background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-tm .top{display:flex;align-items:center;gap:12px}",
    ".dk-tm .ic{flex:none;width:52px;height:52px;border-radius:16px;background:var(--ltt-dark);color:var(--ltt-on-dark);display:flex;align-items:center;justify-content:center;font-size:22px}",
    ".dk-tm .ic .ltt-ic{width:24px;height:24px}",
    ".dk-tm .w{min-width:0;overflow-wrap:anywhere;font-family:var(--ltt-font-display);font-size:clamp(24px,2.5vw,34px);font-weight:var(--ltt-display-weight);letter-spacing:-.04em;line-height:1.15}",
    ".dk-tm .w small{display:block;font-size:13px;font-weight:600;color:var(--ltt-muted);letter-spacing:0}",
    ".dk-tm .vis{display:flex;align-items:center;justify-content:center;min-height:clamp(56px,11vh,120px)}",
    ".dk-tm .p{margin:4px 0 0;font-size:clamp(16px,1.45vw,19.5px);line-height:1.6}",
    ".dk-tm .ex{margin-top:auto;font-size:clamp(14px,1.2vw,16px);color:var(--ltt-muted);background:var(--ltt-card-2);border-radius:12px;padding:10px 12px;line-height:1.5}",
    ".dk-tm .ex::before{content:'예) ';font-weight:800;color:var(--ltt-ink-2)}",
    ".dk-cmp{display:grid;grid-template-columns:repeat(var(--m,var(--n)),minmax(0,1fr));gap:clamp(10px,1.6vw,22px)}",
    ".dk-item{display:flex;flex-direction:column;gap:10px;background:var(--ltt-card);border-radius:var(--ltt-r-lg);box-shadow:var(--ltt-shadow),inset 0 0 0 1.5px var(--ltt-line);padding:clamp(14px,1.6vw,22px);transition:box-shadow .3s}",
    ".dk-item .lab{overflow-wrap:anywhere;font-size:clamp(14px,1.2vw,16px);font-weight:750;color:var(--ltt-ink-2);line-height:1.35}",
    ".dk-item .vis{flex:1;display:flex;align-items:center;justify-content:center;min-height:90px}",
    ".dk-item .vd{display:flex;align-items:center;gap:8px;font-weight:800;font-size:clamp(15px,1.3vw,17px);opacity:0;transform:translateY(6px);transition:opacity .4s,transform .4s}",
    ".dk-item .vd .ltt-ic{flex:none;width:22px;height:22px;padding:4px;border-radius:50%;color:#fff;background:var(--ltt-muted);box-sizing:border-box}",
    ".dk-cmp.shown .dk-item .vd{opacity:1;transform:none}",
    ".dk-cmp.shown .dk-item.good{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-good)}",
    ".dk-cmp.shown .dk-item.bad{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-bad)}",
    ".dk-cmp.shown .dk-item.warn{box-shadow:var(--ltt-shadow),inset 0 0 0 2px var(--ltt-warn)}",
    ".dk-item.good .vd{color:var(--ltt-good)}",
    ".dk-item.good .vd .ltt-ic{background:var(--ltt-good)}",
    ".dk-item.bad .vd{color:var(--ltt-bad)}",
    ".dk-item.bad .vd .ltt-ic{background:var(--ltt-bad)}",
    ".dk-item.warn .vd{color:var(--ltt-warn)}",
    ".dk-item.warn .vd .ltt-ic{background:var(--ltt-warn)}",
    ".dk-item .note{font-size:clamp(14px,1.15vw,15.5px);color:var(--ltt-muted);margin:0;line-height:1.5;transition:opacity .4s}",
    ".dk-cmp:not(.shown) .dk-item .note.after{opacity:0}",
    ".dk-fig{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}",
    ".dk-fig-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:min(30vh,320px);min-width:0}",
    ".dk-fig-stage>*{max-width:100%}",
    ".dk-figsteps{display:grid;width:100%;grid-template-columns:auto minmax(0,420px);gap:clamp(24px,4vw,60px);align-items:center}",
    ".dk-figsteps.stack{grid-template-columns:minmax(0,1fr);gap:16px}",
    ".dk-figsteps.stack>.pic{display:flex;justify-content:center}",
    ".dk-figsteps.stack>.pic>*{max-width:100%;height:auto}",
    ".dk-capstack{display:grid}",
    ".dk-capstack>*{grid-area:1/1}",
    ".dk-capstack>.ghost{visibility:hidden}",
    ".dk-figsteps>*{min-width:0}",
    ".dk-figsteps .ltt-caption{font-size:clamp(15px,1.3vw,18px);line-height:1.6}",
    ".dk-fig figcaption{font-size:clamp(14px,1.2vw,16px);color:var(--ltt-ink-2);line-height:1.55;max-width:90ch;border-top:1px solid var(--ltt-line-2);padding-top:10px}",
    ".dk-fig figcaption b{font-family:var(--ltt-font-display);margin-right:6px;color:var(--ltt-ink)}",
    ".dk-main.full{grid-template-columns:minmax(0,1fr)}",
    ".dk-capbar{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:clamp(12px,2vw,28px);align-items:start}",
    ".dk-capbar .ltt-pts{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));grid-column:1/-1}",
    ".dk-capbar .ltt-pts b{font-size:clamp(15px,1.3vw,18px)}",
    ".dk-st{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(20px,5vw,80px);align-items:center;padding:clamp(8px,3vh,36px) 0}",
    ".dk-st.solo{grid-template-columns:minmax(0,1fr);max-width:22em}",
    ".dk-st .tx{display:flex;flex-direction:column;gap:clamp(12px,2.4vh,22px)}",
    ".dk-st .no{font:600 14px var(--ltt-mono);color:var(--ltt-accent);letter-spacing:.04em}",
    ".dk-st .claim{font-family:var(--ltt-font-display);font-size:clamp(30px,4.6vw,66px);font-weight:var(--ltt-display-weight);line-height:1.15;letter-spacing:calc(var(--ltt-display-track) - .01em);margin:0}",
    ".dk-st .claim em{font-style:normal;color:var(--ltt-accent)}",
    ".dk-st .vis{min-width:0;display:flex;justify-content:center}",
    ".dk-cmp.table{grid-template-columns:1fr!important;gap:0;border-top:2px solid var(--ltt-ink)}",
    ".dk-cmp.table .dk-item{display:grid;grid-template-columns:minmax(120px,.7fr) minmax(0,2fr) minmax(150px,.9fr);grid-template-areas:'lab vis vd' 'lab vis note';column-gap:clamp(12px,2vw,28px);row-gap:4px;align-items:center;background:none;border-radius:0;box-shadow:none;padding:clamp(8px,1.4vh,14px) 4px;border-bottom:1px solid var(--ltt-line-2)}",
    ".dk-cmp.table .dk-item .lab{grid-area:lab;font-size:clamp(15px,1.3vw,18px);color:var(--ltt-ink)}",
    ".dk-cmp.table .dk-item .vis{grid-area:vis;min-height:0;justify-content:flex-start}",
    ".dk-cmp.table .dk-item .vd{grid-area:vd;align-self:end}",
    ".dk-cmp.table .dk-item .note{grid-area:note;align-self:start}",
    ".dk-cmp.table.shown .dk-item.good,.dk-cmp.table.shown .dk-item.bad,.dk-cmp.table.shown .dk-item.warn{box-shadow:inset 4px 0 0 var(--tc)}",
    ".dk-cmp.table .dk-head{display:grid;grid-template-columns:minmax(120px,.7fr) minmax(0,2fr) minmax(150px,.9fr);column-gap:clamp(12px,2vw,28px);padding:8px 4px;border-bottom:1px solid var(--ltt-line-2);font:700 12px var(--ltt-mono);color:var(--ltt-muted);letter-spacing:.02em}",
    ".dk-cmp.table .dk-item.good{--tc:var(--ltt-good)}",
    ".dk-cmp.table .dk-item.bad{--tc:var(--ltt-bad)}",
    ".dk-cmp.table .dk-item.warn{--tc:var(--ltt-warn)}",
    ".dk-pred{display:flex;flex-direction:column;gap:12px}",
    ".dk-off{visibility:hidden}",
    ".dk-pred .ltt-choices button{padding:clamp(16px,2.4vh,24px) 20px;font-size:clamp(16px,1.6vw,21px)}",
    ".dk-pred .ltt-choices button.unsure{color:var(--ltt-muted);font-weight:500;box-shadow:inset 0 0 0 1.5px var(--ltt-line-2);border:0;background:transparent}",
    ".dk-pred .ltt-choices button.unsure.wrong{background:transparent;box-shadow:inset 0 0 0 1.5px var(--ltt-line-2)}",
    ".dk-pq{margin:0;font-size:clamp(16px,1.5vw,20px);font-weight:600;line-height:1.5;max-width:72ch}",
    ".dk-hint2{display:flex;align-items:center;gap:8px;font-size:15px;color:var(--ltt-muted);margin:0}",
    ".dk-pred{position:relative}",
    ".dk-pred.done .dk-hint2,.dk-pred.done>.dk-actions{visibility:hidden}",
    ".dk-float{position:absolute;z-index:1;background:var(--ltt-bg)}",
    ".dk-probe{visibility:hidden}",
    ".dk-still,.dk-still *{transition:none!important}",
    ".dk-rc .a.pending{visibility:hidden}",
    ".dk-pred.done.rest-hide .ltt-choices button:not(.right):not([aria-pressed=true]){visibility:hidden}",
    ".dk-pred.done.rest-dim .ltt-choices button:not(.right):not([aria-pressed=true]){opacity:.35}",
    ".dk-pred.done.rest-dot .ltt-choices button:not(.right):not([aria-pressed=true]){color:transparent;position:relative}",
    ".dk-pred.done.rest-dot .ltt-choices button:not(.right):not([aria-pressed=true])::after{content:'';position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--ltt-muted)}",
    ".dk-ans{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(12px,2vw,24px);align-items:center}",
    ".dk-ans.solo{grid-template-columns:1fr}",
    ".dk-avis{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(14px,1.8vw,24px);box-shadow:var(--ltt-shadow)}",
    ".dk-avis:empty{display:none}",
    ".dk-why{display:flex;flex-direction:column;gap:8px}",
    ".dk-why .ltt-badge{align-self:flex-start}",
    ".dk-why p{margin:0;font-size:clamp(16px,1.5vw,20px);line-height:1.65}",
    ".dk-kw{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:clamp(12px,1.8vw,22px)}",
    ".dk-kw section{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,1.8vw,24px);box-shadow:var(--ltt-shadow)}",
    ".dk-kw section.dark{background:var(--ltt-dark);color:var(--ltt-on-dark);border-color:var(--ltt-dark)}",
    ".dk-kw h3{font-size:13px;font-weight:800;color:var(--ltt-accent);margin:0 0 12px;letter-spacing:.02em}",
    ".dk-kw section.dark h3{color:var(--ltt-accent-on-dark)}",
    ".dk-term{font-family:var(--ltt-font-display);font-size:clamp(22px,2.4vw,32px);font-weight:var(--ltt-display-weight);line-height:1.2;letter-spacing:-.035em;margin:0 0 12px}",
    ".dk-term small{display:block;font-size:14px;font-weight:500;color:color-mix(in srgb,var(--ltt-on-dark) 60%,transparent);letter-spacing:0;margin-top:2px}",
    ".dk-kw ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}",
    ".dk-kw li{position:relative;padding-left:18px;line-height:1.5;font-size:clamp(15px,1.3vw,17px)}",
    ".dk-kw li::before{content:'';position:absolute;left:2px;top:.62em;width:7px;height:7px;border-radius:50%;background:var(--ltt-accent)}",
    ".dk-q{display:flex;width:fit-content;max-width:100%;box-sizing:border-box;align-items:flex-start;gap:8px;font:13.5px/1.45 var(--ltt-mono);background:var(--ltt-card-2);border-radius:10px;padding:6px 10px;margin:0 0 8px;cursor:copy;transition:background-color .2s}",
    ".dk-q:hover{background:var(--ltt-accent-soft)}",
    ".dk-q.copied{background:var(--ltt-good-soft)}",
    ".dk-kw.has-tree .dk-tree{grid-column:1/-1}",
    ".dk-trow{display:flex;align-items:center}",
    ".dk-troot{position:relative;flex:none;max-width:24%;background:var(--ltt-dark);color:var(--ltt-on-dark);border-radius:var(--ltt-r-md);padding:10px 14px;font-family:var(--ltt-font-display);font-weight:var(--ltt-display-weight);font-size:clamp(14px,1.2vw,16px);line-height:1.3}",
    ".dk-troot::after{content:'';position:absolute;left:100%;top:50%;width:28px;border-top:2px solid var(--ltt-line-2)}",
    ".dk-kw .dk-tree ul{position:relative;display:grid;gap:6px;margin:0;padding:0;list-style:none}",
    ".dk-kw .dk-trow>ul{flex:1;min-width:0;margin-left:28px}",
    ".dk-kw .dk-tree ul::before{content:'';position:absolute;left:0;top:.9em;bottom:.9em;border-left:2px solid var(--ltt-line-2)}",
    ".dk-kw .dk-tree li{position:relative;padding-left:22px;font-size:clamp(14px,1.15vw,16px);line-height:1.4}",
    ".dk-kw .dk-tree li::before{content:'';position:absolute;left:0;top:.9em;width:16px;height:0;border-top:2px solid var(--ltt-line-2);border-radius:0;background:none}",
    ".dk-kw .dk-tree li>ul{margin:6px 0 0 4px}",
    ".dk-kw .dk-tree li>ul::before{top:-4px}",
    ".dk-tn{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:10px}",
    ".dk-tn b{font-size:clamp(15px,1.3vw,17px)}",
    ".dk-tn span{color:var(--ltt-muted)}",
    ".dk-hold{visibility:hidden}",
    "[data-ltt-mobile] .dk-trow{flex-direction:column;align-items:flex-start;gap:10px}",
    "[data-ltt-mobile] .dk-troot{max-width:none}",
    "[data-ltt-mobile] .dk-troot::after{display:none}",
    "[data-ltt-mobile] .dk-kw .dk-trow>ul{margin-left:0}",
    ".dk-mr{display:grid;grid-template-columns:repeat(var(--c,2),1fr);gap:clamp(12px,1.8vw,22px)}",
    ".dk-mr section{background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,1.8vw,24px);box-shadow:var(--ltt-shadow)}",
    ".dk-mr h3{font-size:13px;font-weight:800;color:var(--ltt-accent);margin:0 0 12px;letter-spacing:.02em}",
    ".dk-mr a{display:block;text-decoration:none;color:inherit;border:1px solid var(--ltt-line);border-radius:10px;padding:8px 12px;margin:0 0 8px;transition:background-color .2s}",
    ".dk-mr a:hover{background:var(--ltt-accent-soft)}",
    ".dk-mr a.frontier{border-style:dashed;color:var(--ltt-muted)}",
    ".dk-mr a b{font-weight:700}",
    ".dk-mr a small{display:block;font-size:12.5px;color:var(--ltt-muted);margin-top:2px}",
    ".dk-nb{display:grid;gap:12px;font-size:clamp(14px,1.2vw,16px);margin-top:6px}",
    ".dk-nb b{display:block;font-size:clamp(15px,1.3vw,17px)}",
    ".dk-nb span{color:var(--ltt-muted);line-height:1.5}",
    ".dk-rc{list-style:none;margin:0;padding:0;counter-reset:rc;display:grid;grid-template-columns:repeat(var(--c,1),minmax(0,1fr));gap:clamp(10px,2vh,22px) clamp(20px,3vw,44px);align-items:start}",
    ".dk-rc li{counter-increment:rc;position:relative;padding-left:clamp(40px,4vw,56px);display:grid;gap:8px}",
    ".dk-rc li::before{content:counter(rc,decimal-leading-zero);position:absolute;left:0;top:.1em;font:700 clamp(15px,1.4vw,18px) var(--ltt-mono);color:var(--ltt-accent)}",
    ".dk-rc li.extra::before{content:'+'}",
    ".dk-rc .q{margin:0;font-family:var(--ltt-font-display);font-size:clamp(17px,1.5vw,21px);font-weight:var(--ltt-display-weight);letter-spacing:-.02em;line-height:1.35}",
    ".dk-rc .a{border-left:3px solid var(--ltt-accent);padding:2px 0 2px 14px}",
    ".dk-rc .a p{margin:0;font-size:clamp(15px,1.4vw,19px);line-height:1.55;color:var(--ltt-ink-2)}",
    ".dk-rc .a .ask{margin-top:6px;font-size:clamp(13.5px,1.15vw,15.5px);color:var(--ltt-ink-2)}",
    ".dk-rc .a .ask b{color:var(--ltt-accent);font-size:12px;margin-right:6px}",
    ".dk-sum{display:grid;grid-template-columns:repeat(var(--c,4),minmax(0,1fr));gap:clamp(10px,1.4vw,20px)}",
    ".dk-sc{display:flex;flex-direction:column;gap:12px;min-height:min(22vh,200px);background:var(--ltt-card);border:1px solid var(--ltt-line);border-radius:var(--ltt-r-lg);padding:clamp(16px,2vw,28px);box-shadow:var(--ltt-shadow)}",
    ".dk-sc .t span{min-width:0;overflow-wrap:anywhere}",
    ".dk-sc .t{display:flex;align-items:baseline;gap:10px;font-family:var(--ltt-font-display);font-size:clamp(18px,1.75vw,24px);font-weight:var(--ltt-display-weight);letter-spacing:-.03em;line-height:1.3}",
    ".dk-pager{margin-top:4px}",
    ".dk-pager .dk-pg{font-size:14px;font-weight:700;color:var(--ltt-muted);font-variant-numeric:tabular-nums}",
    ".dk-sc .t i{font-style:normal;color:var(--ltt-accent);font-variant-numeric:tabular-nums}",
    ".dk-sc p{margin:0;font-size:clamp(15px,1.4vw,19px);color:var(--ltt-ink-2);line-height:1.55}",
    ".dk-sc .ask{margin-top:auto;font-size:clamp(13.5px,1.15vw,15.5px);background:var(--ltt-card-2);border-radius:12px;padding:9px 12px}",
    ".dk-sc .ask b{color:var(--ltt-accent);font-size:12px;margin-right:6px}",
    ".dk-sc.dark{background:var(--ltt-dark);color:var(--ltt-on-dark);border-color:var(--ltt-dark)}",
    ".dk-sc.dark p{color:color-mix(in srgb,var(--ltt-on-dark) 78%,transparent)}",
    "@keyframes ltt-nudge{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ltt-accent) 55%,transparent)}50%{box-shadow:0 0 0 9px color-mix(in srgb,var(--ltt-accent) 0%,transparent)}}",
    ".ltt-nudge{position:relative;outline:2.5px solid var(--ltt-accent);outline-offset:3px;animation:ltt-nudge .9s ease-out 3}",
    ".ltt-nudge:disabled,.done .ltt-nudge{outline:none;animation:none}",
    "[data-ltt-theme=paper] .ltt-nudge,[data-ltt-theme=ledger] .ltt-nudge{outline:none;animation:none;box-shadow:inset 0 -3px 0 var(--ltt-accent),0 0 0 1.5px var(--ltt-ink)}",
    "[data-ltt-theme=blueprint] .ltt-nudge{outline:1.5px dashed var(--ltt-accent);outline-offset:5px;animation:ltt-nudge-blink .5s steps(2) 6}",
    "@keyframes ltt-nudge-blink{50%{outline-color:transparent}}",
    "[data-ltt-theme=terminal] .ltt-nudge{outline:none;box-shadow:0 0 0 1.5px var(--ltt-accent),0 0 14px color-mix(in srgb,var(--ltt-accent) 60%,transparent);animation:ltt-nudge-blink .5s steps(2) 6}",
    "[data-ltt-theme=terminal] .ltt-nudge::before{content:'▶';position:absolute;left:-1.3em;color:var(--ltt-accent);font-family:var(--ltt-mono)}",
    "[data-ltt-theme=lab] .ltt-nudge{outline:2.5px solid var(--ltt-accent);outline-offset:6px;border-radius:var(--ltt-r-md)}",
    "[data-ltt-theme=sketch] .ltt-nudge{outline:2.5px solid var(--ltt-accent);outline-offset:4px;box-shadow:0 0 0 9px transparent,0 0 0 10.5px var(--ltt-accent);animation:none;transform:rotate(-.6deg)}",
    "@media (prefers-reduced-motion:reduce){.ltt-nudge{animation:none!important}}",
    ".dk-bubble{position:fixed;z-index:60;max-width:280px;padding:10px 14px;border-radius:var(--ltt-r-md);background:var(--ltt-dark);color:var(--ltt-on-dark);font-size:14px;line-height:1.45;box-shadow:var(--ltt-shadow);pointer-events:none;opacity:0;transform:translateY(calc(-100% + 6px));transition:opacity .2s,transform .2s}",
    ".dk-bubble.on{opacity:1;transform:translateY(-100%)}",
    ".dk-bubble:not(.center)::after{content:'';position:absolute;right:28px;bottom:-6px;border:6px solid transparent;border-bottom:0;border-top-color:var(--ltt-dark)}",
    ".dk-bubble.center{left:50%!important;top:50%!important;max-width:340px;text-align:center;font-size:16px;padding:16px 22px;transform:translate(-50%,-44%)}",
    ".dk-bubble.center.on{transform:translate(-50%,-50%)}",
    ".dk-bubble kbd{font:12px var(--ltt-mono);padding:1px 6px;border-radius:5px;background:color-mix(in srgb,var(--ltt-on-dark) 18%,transparent)}",
    "[data-ltt-mobile] .dk{padding:0 16px}",
    "[data-ltt-mobile] .dk-top{padding:10px 0 4px;gap:10px}",
    "[data-ltt-mobile] .dk-top h1{max-width:58%;font-size:12.5px;padding:6px 12px}",
    "[data-ltt-mobile] .dk-dots{display:none}",
    "[data-ltt-mobile] .dk-scene{padding:4px 0 24px;overscroll-behavior:contain}",
    "[data-ltt-mobile] .dk-in{margin:0 auto;gap:14px}",
    "[data-ltt-mobile] .dk-head{column-gap:12px}",
    "[data-ltt-mobile] .dk-no{font-size:40px}",
    "[data-ltt-mobile] .dk-scene h2{font-size:24px}",
    "[data-ltt-mobile] .dk-scene h2 .en{display:block;font-size:.6em;margin-top:4px}",
    "[data-ltt-mobile] .dk-sub{font-size:15px}",
    "[data-ltt-mobile] .dk-main.split,[data-ltt-mobile] .dk-main.full{grid-template-columns:minmax(0,1fr)}",
    "[data-ltt-mobile] .dk-steps,[data-ltt-mobile] .dk-terms,[data-ltt-mobile] .dk-cmp,[data-ltt-mobile] .dk-figsteps,[data-ltt-mobile] .dk-st,[data-ltt-mobile] .dk-ans,[data-ltt-mobile] .dk-hook,[data-ltt-mobile] .dk-capbar,[data-ltt-mobile] .dk-kw,[data-ltt-mobile] .ltt-choices{grid-template-columns:minmax(0,1fr)!important}",
    "[data-ltt-mobile] .dk-steps.stack .dk-step,[data-ltt-mobile] .dk-steps.stack .dk-step:not(:has(.vis)){grid-template-columns:40px minmax(0,1fr)}",
    "[data-ltt-mobile] .dk-steps.stack .dk-step .vis{grid-column:2}",
    "[data-ltt-mobile] .dk-cmp.table .dk-item{grid-template-columns:minmax(0,1fr);grid-template-areas:'lab' 'vis' 'vd' 'note'}",
    "[data-ltt-mobile] .dk-cmp.table .dk-head{display:none}",
    "[data-ltt-mobile] .dk-sum{--c:1!important}",
    "[data-ltt-mobile] .dk-hook .art{width:96px;font-size:48px}",
    "[data-ltt-mobile] .dk-hook .art.free{width:auto;max-width:100%;font-size:inherit}",
    "[data-ltt-mobile] .dk-hook .big{font-size:32px}",
    "[data-ltt-mobile] .dk-nav{padding:8px 0 calc(10px + env(safe-area-inset-bottom))}",
    "[data-ltt-mobile] .dk-nav button{padding:10px 18px}",
    "[data-ltt-mobile] .dk-hint{display:none}",
    "[data-ltt-mobile] .dk-wide{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}",
    "[data-ltt-mobile] .dk-wide>svg{max-width:none!important}",
    "[data-ltt-mobile] input[type=range]{min-height:44px}",
    ".dk-zoom{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:6px 12px;font-size:13px}",
    ".dk-zoomov{position:fixed;inset:0;z-index:80;background:var(--ltt-bg);display:flex;flex-direction:column}",
    ".dk-zoomov>button{align-self:flex-end;margin:10px 12px}",
    ".dk-zoomov .pane{flex:1;overflow:auto;touch-action:pan-x pan-y pinch-zoom;padding:12px}",
    ".dk-zoomov svg{max-width:none!important;max-height:none!important}",
    "[data-ltt-mobile] .dk-body svg:not(.ltt-ic){max-height:none!important}",
    "[data-ltt-mobile] .dk-fig-stage>*,[data-ltt-mobile] .dk-figsteps>*{width:100%!important;max-width:100%}",
    "[data-ltt-mobile] .dk-bubble.center{max-width:calc(100vw - 48px)}",
    ".vis>svg.ltt-ic:only-child,.dk-pvis>svg.ltt-ic:only-child,.dk-avis>svg.ltt-ic:only-child,.dk-fig-stage>svg.ltt-ic:only-child{width:clamp(44px,min(5.5vw,9vh),84px);height:auto;aspect-ratio:1;color:var(--ltt-accent)}",
    ".vis>span.ltt-ic:only-child,.dk-pvis>span.ltt-ic:only-child,.dk-avis>span.ltt-ic:only-child,.dk-fig-stage>span.ltt-ic:only-child{width:auto;height:auto;font-size:clamp(40px,min(5vw,8vh),76px);line-height:1}",
    ".dk-math summary{cursor:pointer;font-size:13px;font-weight:650;color:var(--ltt-muted)}",
    ".dk-math{font-size:15px}",
    ".dk-actions{display:flex;gap:8px;flex-wrap:wrap}",
    ".dk-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:clamp(8px,1.6vh,18px) 0 clamp(12px,2.4vh,26px)}",
    ".dk-nav button{display:inline-flex;align-items:center;gap:8px;padding:11px 22px}",
    ".dk-nav .ltt-ic{width:18px;height:18px}",
    ".dk-hint{font-size:12.5px;color:var(--ltt-muted)}",
    ".dk-hint kbd{font:11px var(--ltt-mono);padding:2px 6px;border-radius:5px;background:var(--ltt-card);box-shadow:inset 0 -1px 0 var(--ltt-line-2),0 0 0 1px var(--ltt-line)}",
    "@media (max-height:920px){.dk-top{padding:12px 0 4px}.dk-nav{padding:6px 0 12px}.dk-in{gap:12px}.dk-no{font-size:clamp(48px,10vh,84px)}.dk-scene h2{font-size:clamp(24px,min(3.2vw,5.2vh),44px)}.dk-sub{font-size:16px}.ltt-take{padding:10px 18px;border-radius:18px}.ltt-take .t{font-size:clamp(15px,1.4vw,18px)}}",
    "@media (max-width:1000px){.dk-main.split{grid-template-columns:minmax(0,1fr)}.dk-kw{grid-template-columns:1fr 1fr}.dk-kw section:first-child{grid-column:1/-1}.dk-sum{--c:2!important}.dk-ans{grid-template-columns:1fr}}"
  ].join("")/* css:end */;

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

  /* ---- placement: drawing scene states ahead to measure them, zoom locking, reserved answer space ----
     Handlers only enumerate their states and hand over their elements; every size read and measuring run is here. */

  function zoomLock(question, zs) {
    function ok(z) { return typeof z === "number" && isFinite(z) && z > 0 && z <= 1; }
    if (!ok(question) || !Array.isArray(zs)) return 1;
    var z = question;
    for (var i = 0; i < zs.length; i++) {
      if (!ok(zs[i])) return 1;
      z = Math.min(z, zs[i]);
    }
    return z;
  }

  var placement = {
    // A measurement holds until the window size or the loaded fonts change. The key is taken when measuring starts, so a
    // run that throws is not retried until the next change.
    sizeWatch: function () {
      var last = null;
      return {
        changed: function () {
          var key = innerWidth + "x" + innerHeight + document.fonts.status;
          if (key === last) return false;
          last = key;
          return true;
        },
        reset: function () { last = null; }
      };
    },
    // A probe reads sizes right after each state is drawn, so `root` drops transitions meanwhile; they come back only after
    // `restore` has been laid out, so the restored state does not animate from the last measured one.
    still: function (root, run, fail, restore) {
      root.classList.add("dk-still");
      try { run(); } catch (e) { fail(e); } finally {
        try { restore(); } finally {
          void root.offsetHeight;
          root.classList.remove("dk-still");
        }
      }
    },
    // Figure `steps` may grow the drawing, so on entry and per window size every step is run once (their enter() is
    // idempotent already, since looping jumps from the last step to the first) to fix the picture's height and the caption
    // side up front. A step that still grows the picture later (async drawing) re-runs placement through the ratchet.
    steps: function (ctx, o) {
      var pic = o.pic, ctl = o.ctl, row = o.row;
      var tallest = { side: 0, stack: 0 }, size = placement.sizeWatch(), stuck = false;
      function layout(mode) {
        row.classList.toggle("stack", mode === "stack");
        pic.style.minHeight = tallest[mode] ? tallest[mode] + "px" : "";
        ctx.refit();
      }
      function under() {
        var c = ctl.getBoundingClientRect(), box = { x0: c.left, y0: c.top, x1: c.right, y1: c.bottom };
        return solidRects(pic, null, null, true).some(function (r) { return LTT.rectHit(box, r); });
      }
      function eachStep(fn) {
        LTT.measure(function () { for (var k = 0; k < o.count; k++) { o.draw(k); fn(); } });
      }
      function measureAll() {
        tallest = { side: 0, stack: 0 };
        stuck = innerWidth <= 760;
        if (!stuck) {
          layout("side");
          eachStep(function () { tallest.side = Math.max(tallest.side, pic.offsetHeight); stuck = stuck || under(); });
        }
        if (stuck) {
          layout("stack");
          eachStep(function () { tallest.stack = Math.max(tallest.stack, pic.offsetHeight); });
          layout("stack");
        }
      }
      function probe() {
        placement.still(pic, measureAll, function (e) {
          tallest = { side: 0, stack: 0 };
          LTT.warn("장면 " + (ctx.index + 1) + ": 단계를 미리 그려 보다 실패해 단계마다 배율이 바뀔 수 있다 (" + e.message + ")");
        }, function () {
          // Outside measuring, so the current step's own sends start again after the probe interrupted them; packets
          // already in flight from the entry would otherwise run twice.
          [].forEach.call(pic.querySelectorAll(".pk"), function (c) { c.remove(); });
          o.draw(o.current());
        });
      }
      return {
        stepped: function () {
          requestAnimationFrame(function () {
            var mode = row.classList.contains("stack") ? "stack" : "side";
            if (LTT.mobile() || pic.offsetHeight <= tallest[mode] + 1) return;
            tallest[mode] = pic.offsetHeight;
            ctx.fit();
          });
        },
        // The captions sit beside the picture only while no text, control or diagram box of the picture runs under them.
        place: function () {
          if (size.changed()) probe();
          if (stuck) return layout("stack");
          layout("side");
          if (under()) { stuck = true; layout("stack"); }
        },
        unplace: function () { row.classList.remove("stack"); pic.style.minHeight = ""; size.reset(); }
      };
    },
    // Predict: the zoom is fixed to the smallest any state needs (the question, or the answer for each choice), so
    // revealing never rescales the scene. It is fixed again per window size even after the reveal; the revealed look is
    // then put back with its answer drawn anew. Measuring renders each answer off-screen without recording or s.reveal.
    predict: function (ctx, o) {
      var ans = o.ans, av = o.av, w = o.w, size = placement.sizeWatch();
      function unfloat() { ans.classList.remove("dk-float"); ans.style.left = ans.style.top = ans.style.width = ""; }
      function fail(e) {
        LTT.warn("장면 " + (ctx.index + 1) + ": answerVisual을 미리 그려 보다 실패해 정답을 열 때 배율이 바뀔 수 있다 (" + e.message + ")");
      }
      function lock(revealed) {
        var focused = revealed && ans.contains(document.activeElement) ? document.activeElement : null;
        if (revealed) { unfloat(); w.classList.remove("done"); ans.classList.add("ltt-hidden"); }
        ctx.zmax = 1;
        var question = ctx.refit(), zs = [], z = 1;
        ans.classList.remove("ltt-hidden");
        ans.classList.add("dk-probe");
        w.classList.add("done");
        // A one-parameter answerVisual ignores the choice, so one drawing stands for all of them.
        var drawn = o.perChoice ? o.choices : o.choices.slice(0, 1);
        placement.still(w, function () {
          LTT.measure(function () {
            drawn.forEach(function (c) {
              o.draw(c.id);
              zs.push(ctx.refit());
            });
          });
          z = zoomLock(question, zs);
        }, function (e) { z = 1; fail(e); }, function () {
          w.classList.remove("done");
          ans.classList.remove("dk-probe");
          ans.classList.add("ltt-hidden");
          av.replaceChildren();
          if (!revealed) return;
          w.classList.add("done");
          ans.classList.remove("ltt-hidden");
          try {
            o.draw(o.chosen());
            LTT.linkTerms(ans, ctx.index);
          } catch (e) { z = 1; fail(e); }
          // Hiding the answer while measuring took focus away from its reason text.
          if (focused) focused.focus({ preventScroll: true });
        });
        ctx.zmax = z;
      }
      return {
        place: function () {
          var revealed = o.revealed();
          if (size.changed()) lock(revealed);
          if (revealed) ctx.float(ans, w, ans.__lttPlace.skip, ans.__lttPlace.keepFaded);
          else ctx.refit();
        },
        unplace: unfloat
      };
    },
    // Summary pages: the zoom is fixed to the smallest any page needs, and the list keeps the tallest page's height, so turning
    // a page never rescales the scene or moves the title and pager of a vertically centered scene.
    pages: function (ctx, o) {
      var size = placement.sizeWatch();
      function lock() {
        var cur = o.current(), zs = [], hs = [];
        ctx.zmax = 1;
        o.root.style.minHeight = "";
        placement.still(o.root, function () {
          for (var k = 0; k < o.count; k++) { o.show(k); zs.push(ctx.refit()); }
          ctx.zmax = zoomLock(1, zs);
          for (k = 0; k < o.count; k++) { o.show(k); ctx.refit(); hs.push(o.root.offsetHeight); }
          o.root.style.minHeight = Math.max.apply(null, hs) + "px";
        }, function (e) {
          ctx.zmax = 1;
          o.root.style.minHeight = "";
          LTT.warn("장면 " + (ctx.index + 1) + ": 쪽을 미리 그려 보다 실패해 쪽마다 배율이 바뀔 수 있다 (" + e.message + ")");
        }, function () { o.show(cur); });
      }
      return { place: function () { if (size.changed()) lock(); ctx.refit(); } };
    },
    // Summary recall: the answer keeps its space while hidden, so the scene's zoom already counts it and revealing never rescales.
    reserve: function (a) { a.classList.add("pending"); },
    release: function (a) { a.classList.remove("pending"); }
  };

  // A takeaway that states the answer keeps its space but stays invisible until the viewer has answered.
  function holdTakeaway(ctx, on) {
    if (ctx.takeawayEl) ctx.takeawayEl.classList.toggle("dk-hold", on);
  }

  var PAGE = 6;

  function summaryPages(s, scenes) {
    var n = LTT.summaryCards(s, scenes).length + (s.extra ? 1 : 0);
    return n > PAGE ? Math.ceil(n / PAGE) : 1;
  }

  // Summaries of seven or more items show PAGE per page, so the scene stays one screen instead of shrinking below 78%.
  function paged(w, body, ctx) {
    var items = [].slice.call(w.children), m = Math.ceil(items.length / PAGE), at = 0;
    function visible() { return items.filter(function (it) { return !it.classList.contains("ltt-hidden"); }); }
    if (m < 2) return { enter: function () { rise(w.children); } };
    var bar = body.appendChild(h("div", "ltt-stepper dk-pager"));
    var prev = bar.appendChild(h("button", "ghost", "← 이전 쪽")), next = bar.appendChild(h("button", null, "다음 쪽 →"));
    var pg = bar.appendChild(h("span", "dk-pg"));
    pg.setAttribute("aria-live", "polite");
    function show(k) {
      at = k;
      items.forEach(function (it, i) { it.classList.toggle("ltt-hidden", Math.floor(i / PAGE) !== k); });
      prev.disabled = k === 0;
      next.disabled = k === m - 1;
      pg.textContent = k + 1 + " / " + m;
    }
    function turn(k) { show(k); rise(visible()); ctx.fit(); }
    prev.onclick = function () { turn(at - 1); };
    next.onclick = function () { turn(at + 1); };
    show(0);
    ctx.showState = function (st) {
      var k = /^page-(\d+)$/.exec(st);
      if (!k || +k[1] < 2 || +k[1] > m) return false;
      show(+k[1] - 1);
      ctx.fit();
      return true;
    };
    var pp = placement.pages(ctx, { count: m, show: show, current: function () { return at; }, root: w });
    ctx.place = pp.place;
    return { enter: function () { rise(visible()); } };
  }

  // A figure function gets the box already in the document. It may fill the box and return nothing, return a new node or HTML
  // (inserted), return {el, ...api} (el inserted unless it is the box or already inside it; api is what step `enter` receives),
  // or return the box itself (nothing to insert).
  function mountFigure(box, v, ctx) {
    if (typeof v !== "function") { fill(box, v, ctx); return box; }
    var ret = v(box, ctx);
    if (ret && typeof ret === "object" && !(ret instanceof Node) && ret.el) {
      if (ret.el instanceof Node && ret.el !== box && !box.contains(ret.el)) box.appendChild(ret.el);
      return ret;
    }
    if ((typeof ret === "string" || ret instanceof Node) && ret !== box && !(ret instanceof Node && box.contains(ret))) fill(box, ret, ctx);
    return box;
  }

  var RENDERS = {
    hook: function (s, body, ctx) {
      var w = h("div", "dk-hook");
      var art = h("div", "art");
      var tx = h("div", "tx");
      if (s.kicker) tx.appendChild(h("span", "dk-kicker", s.kicker));
      if (s.pre) tx.appendChild(h("p", "pre", s.pre));
      tx.appendChild(h("p", "big", s.text));
      if (s.sub) tx.appendChild(h("p", "dk-sub", s.sub));
      if (s.chips) tx.appendChild(LTT.chips(s.chips));
      w.append(art, tx);
      body.appendChild(w);
      if (!s.art) art.style.display = "none";
      // Text without markup (an icon name, an emoji) keeps the round icon box; markup, nodes and functions get a free-sized box.
      else if (typeof s.art === "string" && s.art.indexOf("<") < 0) art.innerHTML = iconOr(s.art);
      else { w.classList.add("free"); art.classList.add("free"); fill(art, s.art, ctx); }
      return { enter: function () { rise([art].concat([].slice.call(tx.children))); } };
    },
    // form: "cards" (independent parts), "strip" (one connected sequence), "stack" (vertical timeline with a visual per step).
    explain: function (s, body, ctx) {
      var form = s.form || "cards";
      var w = h("div", "dk-steps " + form);
      w.style.setProperty("--n", s.steps.length);
      body.appendChild(w);
      s.steps.forEach(function (st, i) {
        var c = w.appendChild(h("div", "dk-step"));
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
      });
      return { enter: function () { rise(w.children); } };
    },
    // Introduces glossary terms in plain words before they are used; each card = one term.
    terms: function (s, body, ctx) {
      var w = h("div", "dk-terms");
      w.style.setProperty("--n", s.terms.length);
      body.appendChild(w);
      s.terms.forEach(function (t) {
        var c = w.appendChild(h("div", "dk-tm"));
        c.innerHTML = "<div class='top'>" + (t.icon ? "<span class='ic'>" + iconOr(t.icon) + "</span>" : "") + "<span class='w'></span></div><p class='p'></p>";
        c.querySelector(".w").innerHTML = (t.word || t.key) + (t.en ? "<small>" + t.en + "</small>" : "");
        c.querySelector(".p").innerHTML = t.plain || "";
        if (t.visual) c.insertBefore(h("div", "vis"), c.querySelector(".p"));
        if (t.visual) fill(c.querySelector(".vis"), t.visual, ctx);
        if (t.example) c.appendChild(h("div", "ex", t.example));
      });
      return { enter: function () { rise(w.children); } };
    },
    // Verdicts stay hidden until the viewer asks, so side-by-side cases are judged before being labelled.
    compare: function (s, body, ctx) {
      var w = h("div", "dk-cmp" + (s.form === "table" ? " table" : ""));
      w.style.setProperty("--n", s.items.length);
      if (s.cols) w.style.setProperty("--m", s.cols);
      body.appendChild(w);
      if (s.form === "table" && s.head) {
        var hd = w.appendChild(h("div", "dk-head"));
        s.head.forEach(function (t) { hd.appendChild(h("span", null, t)); });
      }
      var cells = [];
      s.items.forEach(function (it) {
        var c = w.appendChild(h("div", "dk-item " + (it.tone || "")));
        cells.push(c);
        var vis = h("div", "vis");
        var ic = { good: "check", bad: "x", warn: "alert" }[it.tone];
        c.append(h("div", "lab", it.label), vis, h("div", "vd", (ic ? LTT.icon(ic, { weight: 3 }) : "") + "<span>" + (it.verdict || "") + "</span>"),
          it.note ? h("p", "note" + (it.noteAfter ? " after" : ""), it.note) : "");
        fill(vis, it.visual, ctx);
      });
      if (s.reveal === false) w.classList.add("shown");
      else {
        var b = h("button", null, s.revealLabel || "판정 보기"), rs = h("button", "ghost dk-off", "초기화");
        var gate = { btn: b, word: "판정" };
        ctx.gate = gate;
        ctx.holdTakeaway = true;
        ctx.showState = function (st) { if (st !== "reveal" || b.disabled) return false; b.click(); return true; };
        b.onclick = function () {
          ctx.gate = null;
          holdTakeaway(ctx, false);
          w.classList.add("shown"); b.disabled = true; rs.classList.remove("dk-off");
          s.items.forEach(function (it, k) { if (it.onReveal) it.onReveal(cells[k].querySelector(".vis")); });
          LTT.linkTerms(w, ctx.index);
          ctx.fit();
          LTT.record("compare-reveal", { scene: s.title });
        };
        rs.onclick = function () {
          w.classList.remove("shown"); b.disabled = false; rs.classList.add("dk-off");
          ctx.gate = gate;
          holdTakeaway(ctx, true);
          s.items.forEach(function (it, k) { if (it.onReset) it.onReset(cells[k].querySelector(".vis")); });
          ctx.fit();
          LTT.record("compare-reset", { scene: s.title });
        };
        body.appendChild(h("div", "dk-actions")).append(b, rs);
      }
      return { enter: function () { rise(cells); s.items.forEach(function (it, k) { if (it.enter) it.enter(cells[k].querySelector(".vis")); }); } };
    },
    // With `steps`, the figure sits left and a stepper caption column right; figure() may return {el, ...api} and each step's
    // enter(k, api) receives that object, so one drawing can be walked through several states.
    figure: function (s, body, ctx) {
      var f = h("figure", "dk-fig");
      var st = f.appendChild(h("div", "dk-fig-stage"));
      st.setAttribute("data-annotate", "");
      body.appendChild(f);
      if (s.steps) {
        var row = st.appendChild(h("div", "dk-figsteps")), pic = row.appendChild(h("div", "pic"));
        var api = mountFigure(pic, s.figure, ctx);
        var ctl = row.appendChild(h("div", "ctl"));
        var sp, fp = placement.steps(ctx, { count: s.steps.length, pic: pic, ctl: ctl, row: row,
          draw: function (k) { var x = s.steps[k]; if (x.enter) x.enter(k, api, 1); },
          current: function () { return sp.index; } });
        sp = LTT.stepper(ctl, s.steps.map(function (x) {
          return { caption: x.caption, enter: function (k, dir) { if (x.enter) x.enter(k, api, dir); } };
        }), { onStep: fp.stepped });
        // Every caption sits in one grid cell beneath the shown one, so the column is as tall as the longest caption.
        var capEl = ctl.querySelector(".ltt-caption"), capStack = h("div", "dk-capstack");
        ctl.insertBefore(capStack, capEl);
        capStack.appendChild(capEl);
        s.steps.forEach(function (x) {
          var g = capStack.appendChild(h("p", "ltt-caption ghost", (x.caption || "").replace(/\{\{([^}|]+)(\|[^}]*)?\}\}/g, "$1")));
          g.setAttribute("aria-hidden", "true");
        });
        ctx.showState = function (st) {
          var m = /^step-(\d+)$/.exec(st), k = m ? +m[1] : 0;
          if (k < 2 || k > s.steps.length) return false;
          sp.go(k - 1, 1);
          return true;
        };
        ctl.__lttPlace = { scope: pic, keepFaded: true };
        ctx.place = fp.place;
        ctx.unplace = fp.unplace;
      } else mountFigure(st, s.figure, ctx);
      if (s.caption) {
        var n = ctx.scenes.slice(0, ctx.index + 1).filter(function (x) { return x.type === "figure"; }).length;
        var cap = f.appendChild(h("figcaption", null, "<b></b><span></span>"));
        cap.firstChild.textContent = s.label || "그림 " + n + ".";
        cap.lastChild.innerHTML = s.caption;
      }
      return {};
    },
    // Shown after the recall list, never before it: a finished map seen first would replace the attempt to recall.
    overview: function (s, body, ctx) {
      return RENDERS.figure({ figure: s.figure, caption: s.caption, label: s.label || "한 장 정리." }, body, ctx);
    },
    statement: function (s, body, ctx) {
      var w = h("div", "dk-st" + (s.visual ? "" : " solo"));
      var tx = w.appendChild(h("div", "tx"));
      if (s.number !== false) tx.appendChild(h("span", "no", pad2(ctx.index + 1) + " —"));
      if (s.kicker) tx.appendChild(h("span", "dk-kicker", s.kicker));
      tx.appendChild(h("p", "claim", s.title));
      if (s.sub) tx.appendChild(h("p", "dk-sub", s.sub));
      if (s.chips) tx.appendChild(LTT.chips(s.chips));
      body.appendChild(w);
      if (s.visual) fill(w.appendChild(h("div", "vis")), s.visual, ctx);
      return { enter: function () { rise(w.children); } };
    },
    contrast: function (s, body, ctx) {
      var ba = LTT.beforeAfter({ before: s.before, after: s.after }, ctx, body);
      return { enter: function () { rise(ba.el.children); ba.replay(); } };
    },
    // A low-stakes guess, not a quiz: "모르겠다" is always offered and the answer arrives as an infographic.
    predict: function (s, body, ctx) {
      var rest = s.rest || ctx.predictRest || "hide";
      if (["hide", "dim", "dot"].indexOf(rest) < 0) { LTT.warn("predict rest \"" + rest + "\"는 hide·dim·dot 중 하나여야 한다. hide로 둔다."); rest = "hide"; }
      var w = h("div", "dk-pred rest-" + rest);
      body.appendChild(w);
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
      var rs = h("button", "ghost", "초기화");
      why.appendChild(h("div", "dk-actions")).appendChild(rs);
      ans.append(av, why);
      if (typeof s.question === "string" && s.question) w.appendChild(h("p", "dk-pq", s.question));
      if (s.visual) fill(w.appendChild(h("div", "dk-pvis")), s.visual, ctx);
      w.append(h("p", "dk-hint2", LTT.icon("question") + "<span>" + (s.hint || "틀려도 괜찮다. 감으로 하나 고른다.") + "</span>"), box, h("div", "dk-actions"), ans);
      w.querySelector(".dk-actions").appendChild(lock);
      // Only hidden choices free their space; dim and dot choices are meant to stay visible, so the answer avoids them.
      var faded = rest === "hide" ? ".ltt-choices button:not(.right):not([aria-pressed=true])" : null;
      ans.__lttPlace = { scope: ctx.el.firstChild, skip: faded, keepFaded: !faded };
      var chosen = null;
      ctx.holdTakeaway = true;
      ctx.showState = function (st) {
        var pick = st === "reveal" && !w.classList.contains("done") ? [].filter.call(box.children, function (b) { return b.dataset.choice === String(s.answer); })[0] : null;
        if (!pick) return false;
        pick.click();
        lock.click();
        return true;
      };
      function draw(v) {
        if (typeof s.answerVisual === "function") { av.replaceChildren(); s.answerVisual(av, v); }
        else if (s.answerVisual) av.innerHTML = s.answerVisual;
      }
      var pp = placement.predict(ctx, { choices: choices, perChoice: typeof s.answerVisual === "function" && s.answerVisual.length > 1,
        draw: draw, ans: ans, av: av, w: w,
        revealed: function () { return w.classList.contains("done"); },
        chosen: function () { return chosen; } });
      ctx.place = pp.place;
      ctx.unplace = pp.unplace;
      var gate = { btn: lock, alt: box, word: "정답" };
      ctx.gate = gate;
      var pr = LTT.predict({ question: s.question || s.title, choices: box, button: lock, answer: s.answer, show: [ans],
        onReset: function () {
          w.classList.remove("done");
          holdTakeaway(ctx, true);
          ctx.gate = gate;
          ctx.back = null;
          av.replaceChildren();
          if (s.onReset) s.onReset();
          ctx.fit();
        },
        reveal: function (v) {
          ctx.gate = null;
          holdTakeaway(ctx, false);
          ctx.back = pr.reset;
          w.classList.add("done");
          why.tabIndex = -1;
          why.focus({ preventScroll: true });
          chosen = v;
          draw(v);
          LTT.linkTerms(ans, ctx.index);
          if (s.reveal) s.reveal(v);
          ctx.fit();
        } });
      rs.onclick = pr.reset;
      return {};
    },
    // With `recall` questions the recap is retrieval practice in plain text: the question comes first and the takeaway
    // opens only after the viewer has tried, since re-reading takeaway cards builds a feeling of knowing, not recall.
    summary: function (s, body, ctx) {
      var cards = LTT.summaryCards(s, ctx.scenes);
      if (cards.some(function (c) { return c.recall; })) return recallList(s, cards, body, ctx);
      var w = h("div", "dk-sum");
      body.appendChild(w);
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
      var n = Math.min(w.children.length, PAGE);
      w.style.setProperty("--c", s.cols || (n <= 4 ? n : Math.min(4, Math.ceil(n / 2))));
      return paged(w, body, ctx);
    },
    keywords: function (s, body, ctx) {
      var w = h("div", "dk-kw" + (nextItems(s).length ? " has-tree" : ""));
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
      if (nextItems(s).length) w.appendChild(nextTree(s, ctx));
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    },
    "map-related": function (s, body) {
      var w = h("div", "dk-mr");
      s.groups.forEach(function (g) {
        var sec = w.appendChild(h("section"));
        sec.appendChild(h("h3", null, g.label));
        g.items.forEach(function (c) {
          var a = sec.appendChild(h("a", c.frontier ? "frontier" : null, "<b></b><small></small>"));
          a.href = "/map/focus.html?id=" + encodeURIComponent(c.id);
          a.target = "_blank";
          a.firstChild.textContent = c.title || c.id;
          a.lastChild.textContent = c.frontier ? "아직 배우지 않음" : ["L" + c.level, c.status, c.freshness].filter(Boolean).join(" · ");
        });
      });
      w.style.setProperty("--c", s.groups.length);
      body.appendChild(w);
      return { enter: function () { rise(w.children); } };
    }
  };

  function nextItems(s) {
    return (Array.isArray(s.next) ? s.next : []).filter(function (n) { return n && typeof n === "object" && n.term != null; });
  }

  // The deck title is the root; an item whose `from` names no other item (or loops back on itself) hangs from the root.
  function nextTree(s, ctx) {
    var items = nextItems(s), byTerm = {}, parent = items.map(function () { return -1; });
    items.forEach(function (n, i) { if (!(String(n.term) in byTerm)) byTerm[String(n.term)] = i; });
    items.forEach(function (n, i) {
      var at = n.from != null && String(n.from) in byTerm ? byTerm[String(n.from)] : -1;
      parent[i] = at === i ? -1 : at;
    });
    items.forEach(function (n, i) {
      for (var up = parent[i], hops = 0; up >= 0; up = parent[up]) {
        if (up === i) { parent[i] = -1; break; }
        if (++hops > items.length) break;
      }
    });
    function list(at) {
      var ul = h("ul");
      items.forEach(function (n, i) {
        if (parent[i] !== at) return;
        var li = ul.appendChild(h("li"));
        var node = li.appendChild(h("div", "dk-tn"));
        node.append(h("b", null, ""), h("span", null, ""));
        node.firstChild.innerHTML = String(n.term);
        node.lastChild.innerHTML = n.why == null ? "" : String(n.why);
        if (items.some(function (_, j) { return parent[j] === i; })) li.appendChild(list(i));
      });
      return ul;
    }
    var sec = h("section", "dk-tree");
    sec.appendChild(h("h3", null, "다음에 배울 개념"));
    var row = sec.appendChild(h("div", "dk-trow"));
    var root = row.appendChild(h("div", "dk-troot"));
    root.textContent = ctx && ctx.deckTitle ? ctx.deckTitle : "";
    row.appendChild(list(-1));
    return sec;
  }

  function lessonId() {
    try {
      var m = JSON.parse((document.getElementById("ltt-meta") || {}).textContent || "{}");
      if (m.lesson) return m.lesson;
    } catch (e) { /* malformed meta falls back to the path */ }
    var p = /\/lessons\/([^/]+)\//.exec(location.pathname) || /\/gallery\/[^/]+\/([^/]+)\.html$/.exec(location.pathname);
    return p ? decodeURIComponent(p[1]) : null;
  }

  // Related = concepts one edge away from this lesson's concepts in the knowledge map, read at view time so a lesson
  // gains the scene once later lessons link to it. Same-domain-only concepts are excluded on purpose: they are noise.
  function relatedGroups(data, lesson) {
    var byId = {}, own = {};
    (data.concepts || []).forEach(function (c) { byId[c.id] = c; if ((c.lessons || []).indexOf(lesson) >= 0) own[c.id] = 1; });
    var before = {}, after = {};
    (data.edges || []).forEach(function (e) {
      if (own[e.to] && !own[e.from]) before[e.from] = 1;
      if (own[e.from] && !own[e.to]) after[e.to] = 1;
    });
    function items(set) {
      return Object.keys(set).sort().map(function (id) { return byId[id] || { id: id, frontier: true }; });
    }
    return [{ label: "먼저 알면 좋은 것", items: items(before) }, { label: "다음에 배울 것", items: items(after) }]
      .filter(function (g) { return g.items.length; });
  }

  function recallList(s, cards, body, ctx) {
    var w = body.appendChild(h("ol", "dk-rc"));
    cards.forEach(function (c) {
      if (c.recall) {
        LTT.recall(w.appendChild(h("li")), {
          question: c.recall, answer: c.text, ask: c.ask, title: c.title, hold: placement.reserve,
          onReveal: function (a) { placement.release(a); LTT.linkTerms(a, ctx.index); ctx.fit(); }
        });
        return;
      }
      var li = w.appendChild(h("li", null, "<p class='q'></p>"));
      li.firstChild.innerHTML = c.title || "";
      var a = h("div", "a", "<p></p>");
      a.firstChild.innerHTML = c.text;
      if (c.ask) a.appendChild(h("p", "ask", "<b>agent에게</b>" + c.ask));
      li.appendChild(a);
    });
    if (s.extra) {
      var x = w.appendChild(h("li", "extra", "<p class='q'></p><div class='a'><p></p></div>"));
      x.querySelector(".q").innerHTML = s.extra.title;
      x.querySelector(".a p").innerHTML = s.extra.text;
    }
    if (w.children.length > 3) w.style.setProperty("--c", 2);
    return paged(w, body, ctx);
  }

  var SCENE_TYPES = LTT.sceneTypes;
  // Same defaults as ltt.js uses for these fields; entries added at runtime may omit any of them.
  var META_DEFAULTS = { head: true, autoSplit: true, fullByDefault: false, pointsOnMock: false, sumVisualAreas: false };
  function sceneMeta(type, field) {
    var e = typeof type === "string" ? SCENE_TYPES[type] : undefined, v = e == null ? undefined : e[field];
    return v === undefined ? META_DEFAULTS[field] : v;
  }
  Object.keys(RENDERS).forEach(function (type) {
    if (!SCENE_TYPES[type]) throw new Error("ltt-deck.js: LTT.sceneTypes has no entry for scene type '" + type + "'");
  });
  Object.keys(RENDERS).forEach(function (type) { SCENE_TYPES[type].render = RENDERS[type]; });

  // A scene must read as one screen: if it would scroll, shrink it (not below 78%) instead.
  // `zmax` caps the zoom so a scene can keep the scale of a larger state it will switch to.
  function fit(el, inner, zmax) {
    var z = Math.min(1, zmax || 1);
    zoomTo(inner, z);
    // Measure the rendered box each pass: scrollHeight before zooming does not predict the zoomed layout.
    var avail = el.clientHeight - 8;
    for (var k = 0; k < 4 && z > 0.78; k++) {
      var got = inner.getBoundingClientRect().height;
      if (got <= avail + 1) break;
      z = Math.max(0.78, z * avail / got);
      zoomTo(inner, z);
    }
    return z;
  }

  // A zoomed 100%-wide box keeps its visual width, so width-driven content (SVG) would not shrink; scale the width too.
  function zoomTo(inner, z) {
    inner.style.zoom = z < 1 ? z : "";
    inner.style.width = z < 1 ? z * 100 + "%" : "";
    // Reduced motion gives every property a 1ms transition, so zoom and width would read their old values until the next frame
    // and every size measured after fitting would be stale.
    if (inner.getAnimations) inner.getAnimations().forEach(function (a) { if (a.transitionProperty) a.finish(); });
  }

  // On phones a scene scrolls instead of shrinking. A drawing whose text would fall below ~10px at column width keeps
  // that minimum scale and scrolls sideways inside its own box, so the page itself never scrolls horizontally.
  function mobileFit(el, inner) {
    inner.style.zoom = inner.style.width = "";
    [].forEach.call(inner.querySelectorAll("svg[viewBox]"), function (svg) {
      if (svg.closest(".dk-wide") || svg.closest(".ltt-ic")) return;
      var vb = svg.viewBox.baseVal, box = svg.parentElement;
      if (!vb || !vb.width || !box) return;
      // Page CSS may pin a drawing's box to a viewport fraction (60vw) meant for desktop; let it take the column.
      for (var up = box; up && up !== inner; up = up.parentElement) {
        if (up.parentElement && up.clientWidth < up.parentElement.clientWidth - 2 && getComputedStyle(up.parentElement).display === "block") up.style.width = "100%";
      }
      var need = vb.width * 0.62;
      // A stepper may redraw its svg on every step, which drops the wrapper, so its drawing keeps the column width throughout.
      if (box.clientWidth && need > box.clientWidth + 1 && !svg.closest(".dk-figsteps")) {
        var wrap = h("div", "dk-wide"), zoom = h("button", "ghost dk-zoom", LTT.icon("search") + "크게 보기");
        box.insertBefore(wrap, svg);
        wrap.appendChild(svg);
        box.insertBefore(zoom, wrap.nextSibling);
        zoom.onclick = function () { openZoom(svg); };
        svg.style.width = need + "px";
      }
    });
  }

  // Full-screen copy of a drawing at its own pixel size; the viewer pans it and pinch-zooms with the browser.
  function openZoom(svg) {
    var ov = h("div", "dk-zoomov"), close = h("button", null, "닫기"), pane = h("div", "pane"), copy = svg.cloneNode(true);
    copy.style.width = svg.viewBox.baseVal.width + "px";
    pane.appendChild(copy);
    ov.append(close, pane);
    close.onclick = function () { ov.remove(); };
    document.body.appendChild(ov);
  }

  // Rectangles a placed panel must not cover: every rendered text line, control and drawing; a box diagram counts only its
  // boxes and labels so the space between them stays usable. Hidden, inert, faded (opacity < .5) and `skip` parts do not count,
  // except with `keepFaded`: a stepper dims parts only for the current step and brings them back on the next.
  function solidRects(root, panel, skip, keepFaded) {
    var out = [];
    function gone(e) {
      if (getComputedStyle(e).visibility === "hidden") return true;
      for (var o = 1; e && e !== root.parentNode; e = e.parentElement) {
        if (e === panel || e.inert || (skip && e.matches(skip))) return true;
        o *= +getComputedStyle(e).opacity;
      }
      return !keepFaded && o < 0.5;
    }
    function add(r) { if (r.width > 0 && r.height > 0) out.push({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }); }
    [].forEach.call(root.querySelectorAll(VISUALS + ",button,input,select,textarea"), function (v) {
      if ((panel && v.contains(panel)) || v.parentElement.closest("svg") || gone(v)) return;
      if (v.matches("svg.ltt-dg")) [].forEach.call(v.querySelectorAll("rect,text,circle,ellipse,polygon"), function (p) { if (!gone(p)) add(p.getBoundingClientRect()); });
      else add(v.getBoundingClientRect());
    });
    var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), t, range = document.createRange();
    while ((t = walk.nextNode())) {
      if (!t.nodeValue.trim() || t.parentElement.closest("svg") || gone(t.parentElement)) continue;
      range.selectNodeContents(t);
      [].forEach.call(range.getClientRects(), add);
    }
    return out;
  }

  // Lays `panel` over free space of the scene so revealing it does not grow the scene; with no free spot it joins the flow
  // below `host`'s other content and fit() shrinks the scene as before.
  function floatPanel(el, inner, panel, host, skip, keepFaded, zmax) {
    panel.classList.add("dk-float");
    panel.style.left = panel.style.top = "";
    fit(el, inner, zmax);
    panel.style.width = host.clientWidth + "px";
    var z = parseFloat(inner.style.zoom) || 1, hr = host.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    var region = { x0: hr.left, y0: hr.top, x1: hr.right, y1: el.getBoundingClientRect().bottom - 8 };
    var at = LTT.freeSlot(region, [pr.width, pr.height], solidRects(inner, panel, skip, keepFaded), 10 * z);
    if (at) {
      panel.style.left = (at[0] - hr.left) / z + "px";
      panel.style.top = (at[1] - hr.top) / z + "px";
      return true;
    }
    panel.classList.remove("dk-float");
    panel.style.width = "";
    fit(el, inner, zmax);
    return false;
  }

  var CELLS = [
    { sel: ".dk-hook > .art", kind: "hook 그림 칸", label: ".dk-hook .big" },
    { sel: ".dk-steps > .dk-step", kind: "explain 단계 카드", label: "b" },
    { sel: ".dk-terms > .dk-tm", kind: "용어 카드", label: ".w" },
    { sel: ".dk-cmp > .dk-item", kind: "compare 항목", label: ".lab" },
    { sel: ".dk-sum > .dk-sc", kind: "summary 카드", label: ".t span" },
    { sel: ".dk-rc > li", kind: "recall 항목", label: ".q" },
    { sel: ".ltt-ba > .ltt-ba-side", kind: "contrast 쪽", label: ".ltt-badge" }
  ];
  var SVG_NS = "http://www.w3.org/2000/svg";

  // The most any descendant sticks out of `cell`, measured by a scrolling (overflow auto|scroll) ancestor's box when one lies between; hidden/clip does not hide an overflow. Only the outermost <svg> of a drawing
  // counts (its inner shapes are the drawing's own business), and the explain arrow badge sits on the card edge by design.
  function stickOut(cell) {
    var cr = cell.getBoundingClientRect(), worst = 0;
    if (!cr.width || !cr.height) return 0;
    var walker = document.createTreeWalker(cell, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { return n.namespaceURI === SVG_NS && n.parentNode.namespaceURI === SVG_NS ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    }), d;
    while ((d = walker.nextNode())) {
      if (d.closest(".dk-step > .ar")) continue;
      var b = d.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      var over = Math.max(cr.left - b.left, b.right - cr.right, cr.top - b.top, b.bottom - cr.bottom);
      if (over <= 1) continue;
      var r = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      for (var a = d.parentElement; a && a !== cell; a = a.parentElement) {
        var cs = getComputedStyle(a), ar = null;
        var scrollX = cs.overflowX === "auto" || cs.overflowX === "scroll", scrollY = cs.overflowY === "auto" || cs.overflowY === "scroll";
        if (!scrollX && !scrollY) continue;
        ar = a.getBoundingClientRect();
        if (scrollX) { r.left = Math.max(r.left, ar.left); r.right = Math.min(r.right, ar.right); }
        if (scrollY) { r.top = Math.max(r.top, ar.top); r.bottom = Math.min(r.bottom, ar.bottom); }
      }
      if (r.right <= r.left || r.bottom <= r.top) continue;
      worst = Math.max(worst, cr.left - r.left, r.right - cr.right, cr.top - r.top, r.bottom - cr.bottom);
    }
    return worst > 1 ? Math.round(worst) : 0;
  }

  var SPILL_REPLACED = "img,canvas,video,iframe,input,button,select,textarea";

  // How far content reaches past the scene's padding box on each side. Only content counts: text line boxes (SVG text is
  // stood for by its outermost svg), svg, replaced elements and controls. Empty boxes, padding and backgrounds are not content.
  // Content under an in-scene overflow auto|scroll|hidden|clip box is clipped to that box first.
  function sceneSpill(sec) {
    var sr = sec.getBoundingClientRect(), box = { left: sr.left + sec.clientLeft, top: sr.top + sec.clientTop }, over = { top: 0, bottom: 0, left: 0, right: 0 };
    box.right = box.left + sec.clientWidth;
    box.bottom = box.top + sec.clientHeight;
    var clips = [];
    function clipOf(e) {
      var c = clips.filter(function (k) { return k.el === e; })[0];
      if (!c) {
        var cs = getComputedStyle(e);
        c = { el: e, x: cs.overflowX !== "visible", y: cs.overflowY !== "visible", r: null };
        clips.push(c);
      }
      if (!c.r && (c.x || c.y)) c.r = e.getBoundingClientRect();
      return c;
    }
    function add(b, holder) {
      if (!b.width || !b.height) return;
      var r = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      for (var a = holder; a && a !== sec; a = a.parentElement) {
        var c = clipOf(a);
        if (c.x) { r.left = Math.max(r.left, c.r.left); r.right = Math.min(r.right, c.r.right); }
        if (c.y) { r.top = Math.max(r.top, c.r.top); r.bottom = Math.min(r.bottom, c.r.bottom); }
      }
      if (r.right <= r.left || r.bottom <= r.top) return;
      over.top = Math.max(over.top, box.top - r.top);
      over.bottom = Math.max(over.bottom, r.bottom - box.bottom);
      over.left = Math.max(over.left, box.left - r.left);
      over.right = Math.max(over.right, r.right - box.right);
    }
    var walker = document.createTreeWalker(sec, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 3) return n.nodeValue.trim() && n.parentNode.namespaceURI !== SVG_NS ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        return n.namespaceURI === SVG_NS && n.parentNode.namespaceURI === SVG_NS ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    }), n, range = document.createRange();
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) {
        range.selectNodeContents(n);
        // A line box taller than its line-height (a big number set at line-height .86) pokes out of its block without being cut off,
        // so vertically the text counts only as far as the nearest non-inline ancestor's box.
        var blk = n.parentElement;
        while (blk !== sec && /^inline/.test(getComputedStyle(blk).display)) blk = blk.parentElement;
        var br = blk === sec ? null : blk.getBoundingClientRect();
        [].forEach.call(range.getClientRects(), function (r) {
          add(br ? { left: r.left, right: r.right, top: Math.max(r.top, br.top), bottom: Math.min(r.bottom, br.bottom), width: r.width, height: Math.min(r.bottom, br.bottom) - Math.max(r.top, br.top) } : r, n.parentElement);
        });
      } else if ((n.namespaceURI === SVG_NS && n.localName === "svg") || n.matches(SPILL_REPLACED)) add(n.getBoundingClientRect(), n.parentElement);
    }
    return over;
  }

  var VISUALS = "svg.ltt-svg,svg.ltt-dg,.ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code,canvas,img,.ltt-ba,.dk-fig-stage>*,[data-visual]";

  // @ltt-part LTT.deck | 대상: 순서대로 넘기는 설명, 슬라이드, slides | 방식: 장면 덱, deck, 발표, 넘김 | 그림: 한 화면씩 장면 | 문서: kit/API.md
  // Scenes mount lazily on first visit; `enter` runs on every visit so motion replays when the viewer comes back.
  function deck(spec) {
    var style = h("style");
    style.setAttribute("data-ltt-kit", "");
    style.textContent = STYLE;
    document.head.appendChild(style);
    if (!LTT.theme(spec.theme || "studio")) LTT.warn("알 수 없는 theme \"" + spec.theme + "\": studio로 그린다. 이름은 kit/API.md 테마 표에 있다");

    var defs = {};
    Object.keys(spec.glossary || {}).forEach(function (k) { defs[k] = spec.glossary[k]; });
    spec.scenes.forEach(function (s) { if (s.type === "terms") s.terms.forEach(function (t) { if (!defs[t.key]) defs[t.key] = t.plain; }); });
    LTT.setGlossary(defs, LTT.termIndex(spec));
    var lint = LTT.lintDeck(spec);
    // Fix-grade findings reach the panel through the check; only advice has no other row.
    lint.filter(function (w) { return LTT.isAdvice(w.rule); }).forEach(function (w) { LTT.warn((w.scene ? "장면 " + w.scene + ": " : "덱: ") + w.msg); });
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

    var scenes = spec.scenes, cur = -1, mounted = [], sceneErrors = [];
    scenes.forEach(function (s, i) {
      var d = h("i");
      d.title = s.title || "";
      d.onclick = function () { go(i); };
      dots.appendChild(d);
      stage.appendChild(h("section", "dk-scene"));
    });

    function sceneFail(i, e) {
      var msg = e && e.message ? e.message : String(e), where = "장면 " + (i + 1);
      if (!sceneErrors.some(function (x) { return x.where === where && x.msg === msg; })) sceneErrors.push({ where: where, rule: "scene-error", msg: msg });
      console.warn("[ltt] " + where + "을 그리다 예외가 나 빈 본문으로 둔다:", e);
    }

    function mount(i) {
      var s = scenes[i], el = stage.children[i], ctx = { el: el, scene: s, index: i, scenes: scenes, predictRest: spec.predictRest, deckTitle: spec.title };
      var inner = el.appendChild(h("div", "dk-in"));
      ctx.refit = function () { return fit(el, inner, ctx.zmax); };
      ctx.float = function (panel, host, skip, keepFaded) { return floatPanel(el, inner, panel, host, skip, keepFaded, ctx.zmax); };
      if (sceneMeta(s.type, "head")) {
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
      var full = s.layout ? s.layout === "full" : !!sceneMeta(s.type, "fullByDefault");
      var split = !full && (s.layout ? s.layout === "split" : !!sceneMeta(s.type, "autoSplit") && !!(s.narration || s.points));
      var main = inner.appendChild(h("div", "dk-main" + (split ? " split" : full ? " full" : "")));
      var body = main.appendChild(h("div", "dk-body" + (s.bare || full ? " bare" : "")));
      var rail = split ? main.appendChild(h("aside", "dk-rail")) : full ? inner.appendChild(h("div", "dk-capbar")) : null;
      if (!split && !full && s.narration) inner.insertBefore(h("div", "dk-lead"), main).appendChild(LTT.narration(s.narration));

      var entry = typeof s.type === "string" ? SCENE_TYPES[s.type] : undefined, r = null, custom = null, anno = null;
      try {
        r = entry && entry.render ? entry.render(s, body, ctx) : {};
        custom = s.mount ? s.mount(body, ctx) : null;
        if (rail && s.narration) rail.appendChild(LTT.narration(s.narration));
        if (s.points) {
          var target = s.pointsOn ? body.querySelector(s.pointsOn) :
            (sceneMeta(s.type, "pointsOnMock") && body.querySelector(".ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code")) || body.querySelector("[data-annotate]") || body.firstElementChild;
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
      } catch (e) {
        // One scene's exception must not stop the others from mounting (their clocks and sweeps live in their own mount).
        sceneFail(i, e);
        body.replaceChildren();
        r = custom = anno = null;
        ctx.place = ctx.unplace = ctx.gate = ctx.back = ctx.showState = null;
        ctx.holdTakeaway = false;
      }
      if (s.takeaway) {
        ctx.takeawayEl = inner.appendChild(LTT.takeaway(s.takeaway, s.sources));
        if (ctx.holdTakeaway) ctx.takeawayEl.classList.add("dk-hold");
      }
      LTT.linkTerms(el, i);
      ctx.fit = function () {
        if (LTT.mobile()) { if (ctx.unplace) ctx.unplace(); mobileFit(el, inner); return; }
        if (ctx.place) ctx.place(); else fit(el, inner, ctx.zmax);
        LTT.fixSvgText(inner);
      };
      mounted[i] = { ctx: ctx, fit: ctx.fit, enter: function () {
        if (r && r.enter) r.enter();
        if (custom && custom.enter) custom.enter();
        if (anno) anno.replay();
        if (s.enter) s.enter(body, ctx);
      }, leave: custom && custom.leave };
    }

    function go(i) {
      i = Math.max(0, Math.min(scenes.length - 1, i));
      if (i === cur) return;
      clearNudge();
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
      try { mounted[i].enter(); } catch (e) { sceneFail(i, e); }
      mounted[i].fit();
    }

    function refit() { if (mounted[cur]) mounted[cur].fit(); }
    // Each fit re-probes every step/answer of the scene, so a window drag measures once after it settles.
    var resizing = 0;
    addEventListener("resize", function () { clearTimeout(resizing); resizing = setTimeout(refit, 120); });
    // Pretendard swaps in after first paint and changes line heights.
    if (document.fonts) document.fonts.ready.then(refit);

    prev.onclick = function () { go(cur - 1); };
    next.onclick = function () { forward("button"); };
    // Moving on before the compare verdict or predict answer is revealed skips the scene's point, so the first
    // forward press only points at the reveal button and a second press in the same scene goes through.
    var armed = -1, nudged = null, bubble = h("div", "dk-bubble"), bubbleTimer = 0;
    root_.appendChild(bubble);
    function clearNudge() {
      armed = -1;
      if (nudged) nudged.classList.remove("ltt-nudge");
      nudged = null;
      bubble.classList.remove("on");
    }
    function forward(via) {
      var m = mounted[cur], gate = m && m.ctx.gate;
      // The reveal lands 350ms after the click; a press in that gap would otherwise nudge at a locked question.
      if (gate && gate.alt && gate.btn.disabled && gate.alt.querySelector("[aria-pressed=true]")) return;
      // A picked choice means the viewer has guessed, so forward reveals the answer even after a nudge armed the skip.
      if (gate && gate.alt && !gate.btn.disabled && cur < scenes.length - 1) {
        LTT.record("auto-reveal", { scene: cur + 1, via: via });
        return gate.btn.click();
      }
      if (!gate || armed === cur || cur === scenes.length - 1) {
        if (gate && armed === cur) LTT.record("skip-reveal", { scene: cur + 1, via: via });
        return go(cur + 1);
      }
      armed = cur;
      nudged = gate.btn.disabled && gate.alt ? gate.alt : gate.btn;
      nudged.classList.remove("ltt-nudge");
      void nudged.offsetWidth;
      nudged.classList.add("ltt-nudge");
      nudged.scrollIntoView({ block: "nearest", behavior: "smooth" });
      var key = via !== "button";
      bubble.innerHTML = "아직 " + gate.word + "을 안 봤어요.<br>" +
        (via === "key" ? "<kbd>→</kbd> 키를 한 번 더 누르면" : via === "swipe" ? "한 번 더 넘기면" : "한 번 더 누르면") + " 넘어갑니다.";
      bubble.classList.toggle("center", key);
      if (!key) {
        var r = next.getBoundingClientRect();
        bubble.style.left = Math.max(12, r.right - 280) + "px";
        bubble.style.top = (r.top - 10) + "px";
      } else bubble.style.left = bubble.style.top = "";
      bubble.classList.remove("on");
      void bubble.offsetWidth;
      bubble.classList.add("on");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove("on"); }, 2800);
      LTT.record("skip-warn", { scene: cur + 1, via: via });
    }
    document.addEventListener("keydown", function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
      var d = e.key === "ArrowRight" || e.key === "PageDown" ? 1 : e.key === "ArrowLeft" || e.key === "PageUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var back = d < 0 && mounted[cur] && mounted[cur].ctx.back;
      if (back) { LTT.record("predict-back", { scene: cur + 1 }); return back(); }
      var btn = visibleStepButton(d);
      if (btn) btn.click(); else if (d > 0) forward("key"); else go(cur + d);
    });
    // Horizontal swipes page through scenes on touch screens, except over controls that are themselves dragged.
    var touch = null;
    stage.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      touch = e.touches.length === 1 && !e.target.closest("input,.ltt-dial,.ltt-pad,.ltt-drag,.dk-wide,button") ? [t.clientX, t.clientY] : null;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (!touch) return;
      var t = e.changedTouches[0], dx = t.clientX - touch[0], dy = t.clientY - touch[1];
      touch = null;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      if (dx < 0) forward("swipe"); else go(cur - 1);
    }, { passive: true });
    // An in-scene stepper on screen takes the arrow keys until it reaches its own end in that direction.
    function visibleStepButton(d) {
      var bars = stage.children[cur].querySelectorAll(".ltt-stepper");
      for (var k = 0; k < bars.length; k++) {
        var r = bars[k].getBoundingClientRect();
        if (!r.width || r.bottom <= 0 || r.top >= innerHeight) continue;
        var b = bars[k].querySelectorAll("button")[d > 0 ? 1 : 0];
        if (b && !b.disabled) return b;
      }
      return null;
    }
    function mountAll() {
      scenes.forEach(function (s, i) {
        if (!mounted[i]) mount(i);
        try { mounted[i].fit(); } catch (e) { sceneFail(i, e); }
      });
    }
    // map-related is appended after load from other lessons' titles, so it is not part of what the author wrote.
    function written() { return scenes.filter(function (s) { return s.type !== "map-related"; }); }
    function lintFindings() {
      return LTT.lintDeck({ theme: spec.theme, glossary: spec.glossary, scenes: written() }).map(function (w) {
        return { where: w.scene ? "장면 " + w.scene : "덱", rule: w.rule, msg: w.msg };
      });
    }
    function stateList(s) {
      if (s.type === "predict" || (s.type === "compare" && s.reveal !== false)) return ["reveal"];
      var m = s.type === "figure" && Array.isArray(s.steps) ? s.steps.length : s.type === "summary" ? summaryPages(s, scenes) : 0, out = [];
      for (var k = 2; k <= m; k++) out.push((s.type === "summary" ? "page-" : "step-") + k);
      return out;
    }
    LTT.checkSource({
      issues: function (known) {
        return LTT.deckIssues({ glossary: spec.glossary, scenes: written(),
          rendered: function (i) { return mounted[i] ? LTT.renderedText(stage.children[i]) : null; } }, known)
          .concat(lintFindings().filter(function (w) { return !LTT.isAdvice(w.rule); }), sceneErrors);
      },
      advice: function () { return lintFindings().filter(function (w) { return LTT.isAdvice(w.rule); }); },
      prepare: function () { if (/[?&](check|shot)\b/.test(location.search)) mountAll(); },
      // Only the state the page loaded in is judged; reveal, step and page states are not drawn here.
      layout: function () {
        var out = [];
        written().forEach(function (s, i) {
          if (!mounted[i]) return;
          var sec = stage.children[i], where = "장면 " + (i + 1);
          var ov = sceneSpill(sec), parts = [];
          [["세로(아래)", ov.bottom], ["세로(위)", ov.top], ["가로(오른쪽)", ov.right], ["가로(왼쪽)", ov.left]].forEach(function (d) { if (d[1] > 1) parts.push(d[0] + " " + Math.round(d[1]) + "px"); });
          if (parts.length) {
            out.push({ where: where, rule: "scene-overflow", msg: "내용이 " + (ov.bottom > 1 || ov.top > 1 ? "78%까지 줄여도 " : "") + "장면 상자 밖으로 " + parts.join(", ") + " 나간다. 장면은 스크롤된다. 내용을 줄이거나 나눈다" });
          }
          CELLS.forEach(function (c) {
            [].forEach.call(sec.querySelectorAll(c.sel), function (cell) {
              var px = stickOut(cell);
              if (!px) return;
              var named = cell.querySelector(c.label) || (c.sel.indexOf(".art") > 0 ? sec.querySelector(c.label) : null);
              var label = named ? named.textContent.replace(/\s+/g, " ").trim().slice(0, 30) : "";
              out.push({ where: where, rule: "box-overflow", msg: c.kind + (label ? " '" + label + "'" : "") + "의 안쪽이 칸 밖으로 " + px + "px 나간다. 칸 폭에 맞게 줄이거나 칸 안에 넣는다" });
            });
          });
        });
        return out;
      },
      scenes: function () { return written().length; },
      sceneList: function () {
        return written().map(function (s, i) {
          return { n: i + 1, title: String(s.title || s.text || "").replace(/<[^>]*>/g, "").trim(), states: stateList(s) };
        });
      },
      state: function (st) {
        var m = mounted[cur];
        return !!(m && m.ctx.showState && m.ctx.showState(st));
      },
      reveal: function (el) {
        var sec = el.closest(".dk-scene"), i = sec ? [].indexOf.call(stage.children, sec) : -1;
        if (i >= 0) go(i);
      },
      whereOf: function (el) {
        var sec = el.closest(".dk-scene");
        return sec ? "장면 " + ([].indexOf.call(stage.children, sec) + 1) : "페이지";
      }
    });

    function addScene(s) {
      scenes.push(s);
      var i = scenes.length - 1, d = h("i");
      d.title = s.title;
      d.onclick = function () { go(i); };
      dots.appendChild(d);
      stage.appendChild(h("section", "dk-scene"));
      count.textContent = pad2(cur + 1) + " / " + pad2(scenes.length);
      next.disabled = cur === scenes.length - 1;
    }

    var start = parseInt((location.hash || "").slice(1), 10);
    go(isFinite(start) ? start - 1 : 0);
    var lesson = lessonId();
    if (lesson && window.fetch) {
      fetch("/map/data.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        var groups = data ? relatedGroups(data, lesson) : [];
        if (!groups.length) return;
        addScene({ type: "map-related", kicker: "지식 지도", title: "이 수업과 이어지는 개념", groups: groups });
        if (start === scenes.length) go(start - 1);
      }).catch(function () { /* no server or no map yet: the scene simply stays absent */ });
    }
    return { go: go, lint: lint, get index() { return cur; } };
  }

  LTT.deck = deck;
  LTT.placement = { zoomLock: zoomLock };
  LTT.deckTypes = LTT.sceneTypes;
})(typeof globalThis !== "undefined" ? globalThis : this);
