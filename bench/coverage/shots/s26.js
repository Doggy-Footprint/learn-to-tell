// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, line, circle, path, label } = api;
  const Y0 = 2, Y1 = 1;
  const git = model({ mode: "branch" }, (p) => ({ mode: String(p.mode) }), "Pro Git 3장 3.1·3.2·3.6절 그림");
  /** @param {number} x */
  const c = (x) => Math.max(0, Math.min(1, x));
  return {
    models: { git },
    figures: {
      card: figure(cartesian({ x: [-0.5, 5.5, ""], y: [0, 3, ""], aspect: "equal", loop: { ms: 6000, span: [0, 1] } }), (m, t) => {
        const mode = m.git.mode, fade = t > 0.9 ? 1 - (t - 0.9) / 0.1 : 1;
        /** @param {string} id @param {import("ltt").P} at @param {import("ltt").Tone} tone @param {number} [o] */
        const commit = (id, at, tone, o = 1) => circle(at, 0.15, { id, tone, fill: "soft", opacity: o });
        const base = [label([-0.4, 2.4], "main", { anchor: "w" }), label([-0.4, 0.5], "feature", { anchor: "w", tone: "focus" })];
        if (mode === "branch") {
          const a = c(t / 0.5), fx = 1 + 2 * a, fy = Y0 + (Y1 - Y0) * a;
          return [base, line([[0, Y0], [2 + 0.8 * a, Y0]], { id: "trunk" }),
            path([["M", 1, Y0], ["C", 1.5, Y0, 1.3, fy, fx, fy]], { id: "fork", tone: "focus", opacity: fade }),
            [0, 1, 2].map((i) => commit(`m${i}`, [i, Y0], "ref")),
            commit("f0", [1 + a, fy], "focus", fade), commit("f1", [fx, fy], "focus", fade * c((a - 0.5) * 2)),
            label([2.5, 0.2], "한 커밋에서 갈라진다", { id: "tag" })];
        }
        if (mode === "merge") {
          const a = c((t - 0.15) / 0.45);
          return [base, line([[0, Y0], [3 + a, Y0]], { id: "trunk" }),
            path([["M", 1, Y0], ["C", 1.5, Y0, 1.3, Y1, 2, Y1], ["L", 3, Y1]], { id: "fork", tone: "focus" }),
            line([[3, Y1], [3 + a, Y1 + (Y0 - Y1) * a]], { id: "join", tone: "focus", dash: true, opacity: fade }),
            [0, 1, 2, 3].map((i) => commit(`m${i}`, [i, Y0], "ref")), commit("f0", [2, Y1], "focus"), commit("f1", [3, Y1], "focus"),
            commit("merge", [4, Y0], "ref", fade * c((a - 0.7) / 0.3)),
            label([2.5, 0.2], "부모 둘인 머지 커밋이 생긴다", { id: "tag" })];
        }
        const a = c((t - 0.15) / 0.5), bx = 1 + 2 * a, p0 = 2 + 2 * a, p1 = 3 + 2 * a;
        return [base, line([[0, Y0], [3, Y0]], { id: "trunk" }),
          path([["M", bx, Y0], ["C", bx + 0.5, Y0, bx + 0.3, Y1, p0, Y1], ["L", p1, Y1]], { id: "fork", tone: "focus", opacity: fade }),
          [0, 1, 2, 3].map((i) => commit(`m${i}`, [i, Y0], "ref")), commit("f0", [p0, Y1], "focus", fade), commit("f1", [p1, Y1], "focus", fade),
          label([2.5, 0.2], a < 0.99 ? "커밋을 떼어 main 끝에 다시 붙인다" : "새 커밋(새 해시)으로 한 줄이 된다", { id: "tag" })];
      }),
      s26: multiples("card", { over: { mode: ["branch", "merge", "rebase"] } }),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s26", src: "s26-git-branch-terms.html", corpus: "shot", domain: "git · 브랜치, 머지, 리베이스 용어",
  props: [
    { id: "b1", cat: "T", text: "왼쪽 카드에서 한 커밋으로부터 새 줄이 갈라져 나온다", essential: true, why: "beat 1", status: "kept", by: "draw sampled over frame time; path/circle in data coords" },
    { id: "b2", cat: "T", text: "가운데는 두 줄 끝이 머지 커밋으로 합쳐지고 오른쪽은 커밋이 떼어져 옮겨진다", essential: true, why: "beat 2", status: "kept", by: "multiples share t; params.mode per copy" },
    { id: "b3", cat: "T", text: "세 카드가 완성 그래프로 머문다", essential: true, why: "beat 3", status: "approx", diff: "원본은 카드마다 0.4 s씩 시작이 어긋나는데 multiples는 t를 공유해 세 카드가 동시에 움직인다" },
    { id: "g1", cat: "G", text: "커밋 그래프 위상: 갈라짐 지점 m1, 머지 커밋은 부모 둘, 리베이스 뒤 feature가 m3 뒤", essential: true, why: "용어 정의", status: "kept", by: "path/circle coordinates" },
    { id: "p1", cat: "S", text: "용어마다 같은 그래프, 동작 하나만 다르게", essential: true, why: "principle", status: "kept", by: "multiples: one copy per value, sharing frame, axes" },
  ],
  verdict: "V", custom: [], candidates: ["multiples-stagger"],
}];
