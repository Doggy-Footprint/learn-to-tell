// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, label, arrow } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, 470 - y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} x @param {number} y @param {number} w @param {number} h @param {import("ltt").MarkOpts} o */
  const box = (x, y, w, h, o) => rect(pt(x, y + h), pt(x + w, y), o);
  const Y = [...Array(8)].map((_, r) => [...Array(8)].map((_, c) => Math.round(r + c > 8 ? 70 + 4 * r : 190 - 6 * r + 2 * c)));
  const QT = [16,11,10,16,24,40,51,61, 12,12,14,19,26,58,60,55, 14,13,16,24,40,57,69,56, 14,17,22,29,51,87,80,62,
    18,22,37,56,68,109,103,77, 24,35,55,64,81,104,113,92, 49,64,78,87,103,121,120,101, 72,92,95,98,112,100,103,99];
  const jpeg = model({ quality: 50 }, () => {
    /** @type {number[]} */
    const coef = [];
    const C = (/** @type {number} */ k) => (k ? 1 : Math.SQRT1_2);
    for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) {
      let s = 0;
      for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) s += (Y[x][y] - 128) * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * Math.cos(((2 * y + 1) * v * Math.PI) / 16);
      coef.push(0.25 * C(u) * C(v) * s);
    }
    const qv = coef.map((c, i) => Math.round(c / QT[i]));
    /** @type {number[]} */
    const zz = [];
    for (let s = 0; s < 15; s++) {
      const d = [];
      for (let i = 0; i <= s; i++) if (i < 8 && s - i < 8) d.push(i * 8 + s - i);
      zz.push(...(s % 2 ? d : d.reverse()));
    }
    const nz = qv.filter((v) => v !== 0).length;
    const lastNZ = zz.reduce((a, idx, k) => (qv[idx] !== 0 ? k : a), 0);
    return { coef, qv, zz, nz, lastNZ };
  }, "ITU-T T.81 부록 K 표 K.1 휘도 양자화표(품질 50), 8×8 DCT-II; 블록 값은 예시");
  const PW = 250, GAP = (1120 - 4 * PW) / 3, CELL = 24, G = CELL * 8, BY = 300, scale = PW / 192;
  const figures = {
    pipeline: figure(
      cartesian({ x: [0, 1120, ""], y: [0, 470, ""], aspect: "equal", loop: { ms: 9000, span: [0, 1] } }),
      (m, u) => {
        const j = m.jpeg, fade = clamp((u - 0.93) / 0.07);
        const maxC = Math.max(...j.coef.map(Math.abs));
        const panels = [
          { n: "①", t: "RGB 화소", total: 192, unit: "값", note: "R·G·B 각 64개" },
          { n: "②", t: "YCbCr 4:2:0", total: 96, unit: "값", note: "밝기 64 + 색 16 + 16" },
          { n: "③", t: "DCT 계수", total: 64, unit: "계수", note: "에너지가 왼쪽 위로 모인다" },
          { n: "④", t: "양자화 뒤", total: j.nz, unit: "0 아닌 값", note: `지그재그 ${j.lastNZ + 1}번째 뒤로 전부 0` },
        ];
        return panels.map((p, i) => {
          const X = i * (PW + GAP), gx = X + (PW - G) / 2, gy = 40;
          const local = ease(clamp((u - i * 0.2) / 0.18));
          const vis = (/** @type {number} */ k, /** @type {number} */ n) => (k < Math.floor(local * n) ? 1 - fade : 0);
          /** @type {import("ltt").MarkTree[]} */
          const cells = [];
          if (i === 0) {
            /** @type {import("ltt").Tone[]} */
            const tones = ["series1", "series2", "series3"];
            tones.forEach((tone, ch) => {
              const o = (2 - ch) * 7;
              for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                const k = ch * 64 + r * 8 + c, op = vis(k, 192);
                if (op) cells.push(box(gx + c * (CELL - 3) + o + 8, gy + r * (CELL - 3) + o, CELL - 4, CELL - 4, { id: `rgb-${k}`, tone, fill: "solid", opacity: op * (0.15 + 0.8 * Y[r][c] / 255) }));
              }
            });
          } else if (i === 1) {
            for (let k = 0; k < 96; k++) {
              const op = vis(k, 96);
              if (!op) continue;
              if (k < 64) { const r = Math.floor(k / 8), c = k % 8; cells.push(box(gx - 18 + c * 19, gy + 20 + r * 19, 17, 17, { id: `y-${k}`, fill: "solid", opacity: op * (0.1 + 0.8 * Y[r][c] / 255) })); }
              else { const q = k - 64, ch = Math.floor(q / 16), r = Math.floor((q % 16) / 4), c = q % 4; cells.push(box(gx + 140 + c * 17, gy + 20 + ch * 82 + r * 17, 15, 15, { id: `c-${q}`, tone: ch ? "series3" : "series1", fill: "soft", opacity: op })); }
            }
            cells.push(label(pt(gx - 18, gy + 14), "Y 밝기", { id: "lab-y", anchor: "w", tone: "muted" }), label(pt(gx + 140, gy + 14), "Cb", { id: "lab-cb", anchor: "w", tone: "muted" }), label(pt(gx + 140, gy + 96), "Cr", { id: "lab-cr", anchor: "w", tone: "muted" }));
          } else {
            j.zz.forEach((/** @type {number} */ idx, /** @type {number} */ k) => {
              const op = vis(k, 64);
              if (!op) return;
              const r = Math.floor(idx / 8), c = idx % 8, x = gx + c * CELL, y = gy + r * CELL;
              if (i === 2) cells.push(box(x, y, CELL - 2, CELL - 2, { id: `dct-${idx}`, tone: "focus", fill: "solid", opacity: op * (0.06 + 0.9 * Math.sqrt(Math.abs(j.coef[idx]) / maxC)) }));
              else {
                const v = j.qv[idx];
                cells.push(box(x, y, CELL - 2, CELL - 2, { id: `q-${idx}`, tone: v ? "focus" : "muted", fill: v ? "solid" : "soft", opacity: op }), label(pt(x + CELL / 2 - 1, y + CELL / 2), String(v), { id: `qv-${idx}`, size: "s", weight: v ? "bold" : "normal", opacity: op }));
              }
            });
          }
          const val = Math.round(local * p.total);
          return [
            label(pt(X, 22), `${p.n} ${p.t}`, { id: `title-${i}`, anchor: "w", weight: "bold" }),
            i < 3 && arrow(pt(X + PW + 8, 40 + G / 2), pt(X + PW + GAP - 14, 40 + G / 2), { id: `step-${i}`, tone: "muted" }),
            cells,
            box(X, BY, PW, 14, { id: `track-${i}`, tone: "muted", fill: "soft" }),
            box(X, BY, val * scale * (1 - fade), 14, { id: `bar-${i}`, tone: i === 3 ? "focus" : "ref", fill: "solid" }),
            local > 0 && label(pt(X, BY + 50), `${val} ${p.unit}`, { id: `num-${i}`, anchor: "w", size: "l", weight: "bold" }),
            label(pt(X, BY + 76), p.note, { id: `note-${i}`, anchor: "w", tone: "muted" }),
            i === 0 && label(pt(0, BY - 12), "막대 = 남은 값의 개수(같은 축, 192 = 원본)", { id: "bar-key", anchor: "w", tone: "muted", size: "s" }),
          ];
        });
      },
    ),
  };
  return { models: { jpeg }, figures, scenes: [{ type: "explain", title: "JPEG은 값을 지우기 좋은 모양으로 바꾼 뒤 지운다", say: "막대는 각 단계 뒤 남은 값의 개수다.", figure: "pipeline", focus: ["bar-0", "bar-1", "bar-2", "bar-3"] }] };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s41", src: "s41-jpeg-pipeline.html", corpus: "shot", domain: "이미지 · JPEG 압축 단계(YCbCr→DCT→양자화) 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "0–2s ① 칸 격자가 채워지고 아래 막대가 192까지 차오른다", essential: true, why: "beat", status: "kept", by: "Loop{ms:9000,span:[0,1]}; 칸 수·막대 폭을 t로 계산" },
    { id: "b2", cat: "Q", text: "2–3s ② 칸이 채워지며 같은 축 막대가 96에서 멈춘다", essential: true, why: "beat", status: "kept", by: "단일 cartesian frame, 막대 폭 = 값 × 250/192 데이터 단위" },
    { id: "b3", cat: "G", text: "4–5s ③ 칸이 지그재그로 채워지고 막대는 64까지만", essential: true, why: "beat", status: "kept", by: "model의 지그재그 인덱스 순서대로 칸 공개" },
    { id: "b4", cat: "Q", text: "7–8s ④ 칸까지 다 차고 네 막대가 192→16(0 아닌 계수 수)으로 줄어든 채 머문다", essential: true, why: "beat", status: "kept", by: "model jpeg.nz(DCT·T.81 표로 계산), label" },
    { id: "p1", cat: "S", text: "작은 칸들이 같은 축 막대를 공유해 단계마다 줄어드는 양을 길이로 비교한다", essential: true, why: "principle", status: "kept", by: "네 칸을 한 frame에 그려 막대가 같은 데이터 축척을 쓴다" },
    { id: "q1", cat: "Q", text: "칸 명암이 화소 밝기·|계수| 크기를 나타낸다", essential: false, why: "보조 인코딩", status: "approx", diff: "MarkOpts.opacity로 명암을 내므로 테마 색 위 불투명도이며 cell의 sequential scale처럼 값 척도가 보장되지는 않는다" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
