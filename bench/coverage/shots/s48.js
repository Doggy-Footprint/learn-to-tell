// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, line, rect, label, flow } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, 330 - y];
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const N = [{ id: "pc", l: "직원 PC", x: 50, y: 70 }, { id: "pc2", l: "직원 PC 2", x: 50, y: 190 }, { id: "fs", l: "파일 서버", x: 200, y: 70 }, { id: "dc", l: "도메인 컨트롤러", x: 200, y: 190 }, { id: "bk", l: "백업 서버", x: 125, y: 270 }];
  const E = [["pc", "fs"], ["pc", "dc"], ["pc2", "dc"], ["dc", "fs"], ["dc", "bk"], ["pc", "pc2"]];
  const STAGES = [
    { t: "① 초기 침투", s: "피싱 메일 첨부 실행", hot: ["pc"], flow: [], ext: true, lock: false },
    { t: "② 자격 증명 탈취", s: "Mimikatz로 관리자 해시", hot: ["pc"], flow: [["pc", "dc"]], ext: false, lock: false },
    { t: "③ 측면 이동", s: "RDP 3389 · SMB 445 · PsExec", hot: ["pc", "dc", "pc2", "fs"], flow: [["pc", "dc"], ["dc", "fs"], ["dc", "pc2"], ["dc", "bk"]], ext: false, lock: false },
    { t: "④ 백업 삭제 후 암호화", s: "모든 노드에 동시 실행", hot: ["pc", "dc", "pc2", "fs", "bk"], flow: [["dc", "fs"], ["dc", "pc2"], ["dc", "bk"], ["dc", "pc"]], ext: false, lock: true },
  ];
  const stage = model({ stage: 0 }, (q) => STAGES[Math.max(0, Math.min(3, Math.round(Number(q.stage))))], "MITRE ATT&CK 단계(TA0001, TA0006, TA0008, TA0040); 그래프는 예시");
  /** @param {string} id */
  const at = (id) => { const n = N.find((k) => k.id === id); return n ? p(n.x, n.y) : p(0, 0); };
  const panel = figure(
    cartesian({ x: [0, 250, ""], y: [0, 330, ""], aspect: "equal", loop: { ms: 4000, span: [0, 1] } }),
    (m, u) => {
      const st = m.stage, grow = ease(clamp(u / 0.5));
      return [
        label(p(14, 24), st.t, { id: "stage-title", anchor: "w", weight: "bold" }),
        label(p(14, 314), st.s, { id: "stage-sub", anchor: "w", tone: "muted", size: "s" }),
        E.map(([a, b]) => line([at(a), at(b)], { id: `e-${a}-${b}`, tone: "muted" })),
        N.map((n) => {
          const k = st.hot.indexOf(n.id), on = k >= 0 && grow >= k / Math.max(1, st.hot.length);
          return [
            rect(p(n.x - 17, n.y + 14), p(n.x + 17, n.y - 14), { id: `n-${n.id}`, tone: on ? "bad" : "muted", fill: on ? "soft" : "none" }),
            label(p(n.x, n.y + 28), n.l, { id: `n-${n.id}-l`, size: "s" }),
            st.lock && on && u > 0.45 && label(p(n.x, n.y), "ENC", { id: `n-${n.id}-lock`, tone: "bad", weight: "bold" }),
          ];
        }),
        st.ext && label(p(14, 46), "외부 → invoice.docm", { id: "ext", anchor: "w", tone: "bad", size: "s" }),
        st.ext && flow([p(0, 40), at("pc")], { id: "f-ext", n: 4, rate: 3, seed: 9, t: u, tone: "bad", size: "s" }),
        st.flow.map((/** @type {string[]} */ f, /** @type {number} */ i) => flow([at(f[0]), at(f[1])], { id: `f-${f[0]}-${f[1]}`, n: 4, rate: 3, seed: i + 1, t: u, tone: "bad", size: "s" })),
      ];
    },
  );
  const grid = multiples("panel", { over: { stage: [0, 1, 2, 3] } });
  return { models: { stage }, figures: { panel, grid } };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s48", src: "s48-ransomware-lateral.html", corpus: "shot", domain: "보안 · 랜섬웨어의 측면 이동",
  props: [
    { id: "b1", cat: "S", text: "0–0.8s 네 칸이 같은 그래프를 공유하고 첫 칸은 밖에서 입자가 한 노드로 흐른다", essential: true, why: "beat", status: "kept", by: "Api.multiples over stage \"sharing frame, axes, t\" + Api.flow 외부→pc" },
    { id: "b2", cat: "T", text: "0.8–2s 칸마다 다른 간선으로 입자가 흐르며 감염 노드가 차례로 빨개진다", essential: true, why: "beat", status: "kept", by: "model stage.flow별 Api.flow; hot 순서 k/len ≤ grow(t)일 때 tone bad (Tone \"bad\" semantic)" },
    { id: "b3", cat: "E", text: "2–4s 마지막 칸은 모든 노드가 빨개지고 잠김 표시가 뜬 채 입자만 계속 흐른다", essential: true, why: "beat", status: "kept", by: "lock label t>0.45; flow는 loop마다 계속" },
    { id: "pr", cat: "S", text: "작은 여러 칸이 같은 그래프를 공유하면 칸마다 달라지는 것만 눈에 들어온다", essential: true, why: "principle", status: "kept", by: "Api.multiples 같은 노드 좌표·간선, 바뀌는 것은 model 출력뿐" },
    { id: "t1", cat: "T", text: "입자가 간선 양 끝에서 서서히 나타나고 사라진다(sin 투명도)", essential: false, why: "원본 세부", status: "approx", diff: "flow 입자의 끝 처리 방식은 runtime이 정한다." },
  ],
  verdict: "V", custom: [], candidates: [],
}];
