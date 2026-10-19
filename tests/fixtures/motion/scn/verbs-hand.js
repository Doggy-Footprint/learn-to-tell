// Spec 2d467cf453771b95 VO-1 (BVA, restart), VO-2 V1-V10 V12-V13, VO-3 T5-T7 on hand-made <svg> roots. No deck: play runs at once.
// Each play is created with the clock frozen at F0; sampling ms means freezing at F0 + ms and waiting for the loop's next ticks, in a
// deliberately non-monotone order so state must not leak between samples. Groups run one after another because the clock is global.
const S = (H.samples.g = {});
const group = async (name, beats, opts, ms, extra, withTable = false, rootOf = (h) => h.svg) => {
  const h = V.hand();
  const F0 = V.real();
  V.freeze(F0);
  const ref = V.ref(h, withTable);
  const handle = LTT.motion.play(rootOf(h), typeof beats === "function" ? beats(h) : beats, opts);
  await V.wait(50);
  const out = { ref, running: handle && handle.running, samples: [] };
  for (const m of ms) { V.freeze(F0 + m); await V.wait(50); out.samples.push(V.snap(h, m)); }
  if (extra) out.restart = await extra(h, F0);
  S[name] = out;
};
const wrapInDiv = (h) => { const d = document.createElement("div"); h.svg.parentNode.insertBefore(d, h.svg); d.appendChild(h.svg); return d; };
const run = async () => {
  const A = 1000, B = 1050;
  await group("bva", [
    { t: [A, B], draw: "#p" }, { t: [A, B], flow: "#q", count: 1, laps: 10 }, { t: [A, B], camera: "#cam" },
    { t: [A, B], morph: "#m", to: { width: 200 } }, { t: [A, B], stack: ".bar" },
  ], { period: 2000 }, [A - 1, A, A + 1, B - 1, B, B + 1], async (h, F0) => {
    V.freeze(F0 + 1999); await V.wait(50);
    const end = V.snap(h, 1999);
    V.freeze(F0 + 2000); await V.wait(50);
    return { end, after: V.snap(h, 0) };
  }, true);
  await group("draw", [{ t: [0, 1000], draw: "#p" }, { t: [0, 1000], draw: "#ln" }, { t: [0, 1000], draw: "#ci" }], { period: 2000 }, [500, 1500, 250, 0, 1000, 750, 1999]);
  await group("flow", [{ t: [500, 1500], flow: "#q", count: 4, laps: 2 }], { period: 2000 }, [1000, 300, 750, 1700, 500, 1250, 1500, 0, 1999], undefined, true);
  await group("cam", [{ t: [0, 1000], camera: [0, 0, 100, 50] }, { t: [1000, 2000], camera: [300, 100, 100, 50] }], { period: 2000 }, [1500, 500, 1000, 1999, 250, 0, 1750]);
  await group("camTarget", [{ t: [0, 1000], camera: "#cam" }], { period: 2000 }, [500, 1000, 0, 750, 1500]);
  await group("camPad", [{ t: [0, 1000], camera: "#cam", pad: 30 }], { period: 2000 }, [500, 1000, 0, 750]);
  await group("morph", [
    { t: [0, 1000], morph: "#m", to: { width: 200, x: 90, opacity: 0.2 } },
    { t: [0, 1000], morph: "#mc", to: { cx: 500, r: 60 } },
    { t: [0, 1000], morph: "#tr", to: { translate: [40, 20] } },
  ], { period: 2000 }, [500, 1000, 250, 0, 750, 1500]);
  await group("stack", [{ t: [0, 2000], stack: ".bar" }, { t: [0, 2000], stack: ".hb", from: "left" }], undefined, [250, 2000, 1000, 0, 500, 1500, 2500]);
  await group("morphChain", [{ t: [0, 1000], morph: "#m", to: { width: 200 } }, { t: [1000, 2000], morph: "#m", to: { width: 300 } }], { period: 2000 }, [1500, 500, 1000, 1250, 0, 1999, 750]);
  await group("flowDefault", [{ t: [0, 1000], flow: "#q" }], { period: 2000 }, [500, 250, 750, 1500], undefined, true);
  await group("rootD3", [{ t: [0, 1000], draw: "#p" }, { t: [0, 1000], camera: [0, 0, 100, 50] }], { period: 2000 }, [500, 0, 1000], undefined, false, (h) => d3.select(h.svg));
  await group("rootDiv", [{ t: [0, 1000], draw: "#p" }, { t: [0, 1000], camera: [0, 0, 100, 50] }], { period: 2000 }, [500, 0, 1000], undefined, false, wrapInDiv);
  await group("tSel", [{ t: [0, 1000], draw: ".g" }], { period: 2000 }, [500, 0, 1000]);
  await group("tEl", (h) => [{ t: [0, 1000], draw: h.t[3] }], { period: 2000 }, [500, 0, 1000]);
  await group("tArr", (h) => [{ t: [0, 1000], draw: [h.t[2], h.t[4]] }], { period: 2000 }, [500, 0, 1000]);
};
run().catch((e) => H.errors.push("run: " + (e && e.stack || e))).then(() => { V.thaw(); H.done(H.now()); });
