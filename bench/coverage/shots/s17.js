// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, line, dot, label, arrow } = api;
  const REC = [["0/3000028", "BEGIN"], ["0/3000060", "INSERT orders"], ["0/30000C8", "UPDATE stock"], ["0/3000130", "COMMIT"],
    ["0/3000168", "CHECKPOINT"], ["0/30001A0", "INSERT orders"], ["0/3000208", "COMMIT"], ["0/3000240", "UPDATE stock"]];
  const CK = 4, CRASH = 7.8, WY = 3, DY = 0, RY = 2.2;
  const wal = model({}, () => ({ recs: REC.map(([lsn, op], i) => ({ i, lsn, op })), ck: CK }), "PostgreSQL 'WAL Configuration' 문서; LSN 값은 예시");
  /** @param {number} x */
  const cl = (x) => Math.max(0, Math.min(1, x));
  return {
    models: { wal },
    figures: {
      timeline: figure(
        cartesian({ x: [-1.5, 8.5, "기록 순서(LSN)"], y: [-0.8, 4, ""], loop: { ms: 9000, span: [0, 1] } }),
        (m, u) => {
          const wx = CRASH * cl(u / 0.52), fu = cl((u - 0.24) / 0.1), ru = cl((u - 0.6) / 0.2);
          return [
            label([-1.4, WY], "WAL pg_wal/", { anchor: "w" }),
            label([-1.4, DY], "데이터 파일 base/", { anchor: "w" }),
            line([[0, DY], [8.3, DY]], { id: "datafile", tone: "muted", dash: true }),
            line([[0, WY], [wx, WY]], { id: "wal", tone: "focus", weight: "bold" }),
            m.wal.recs.map((/** @type {{ i: number; lsn: string; op: string }} */ r) => wx >= r.i && [
              dot([r.i, WY], { id: `rec-${r.i}`, tone: r.i === CK ? "warn" : "focus", fill: "none", size: r.i === CK ? "l" : "m" }),
              label([r.i, WY + 0.5], `${r.op}\n${r.lsn}`, { anchor: "s", tone: r.i === CK ? "warn" : undefined }),
            ]),
            [1, 2].map((k) => fu > 0 && line([[k, WY - 0.2], [k, WY - 0.2 - (WY - 0.4) * fu]], { id: `flush-${k}`, tone: "warn" })),
            fu > 0 && label([1, DY - 0.4], "체크포인트 때 디스크에 반영", { tone: "warn", opacity: fu }),
            u > 0.52 && label([CRASH, WY], "✕ 전원 끊김", { id: "crash", tone: "bad" }),
            ru > 0 && arrow([CK, RY], [CK + (CRASH - 0.2 - CK) * ru, RY], { id: "redo", tone: "good", weight: "bold", label: "REDO: 체크포인트부터 끝까지 다시 적용" }),
            [5, 6, 7].map((i, k) => {
              const du = cl((u - 0.66 - k * 0.05) / 0.08);
              return du > 0 && line([[i, RY - 0.2], [i, RY - 0.2 - (RY - 0.4) * du]], { id: `replay-${i}`, tone: "good", dash: true });
            }),
            u > 0.78 && label([5, DY - 0.4], "복구 때 WAL에서 다시 반영", { tone: "good" }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "로그를 먼저 쓰고, 체크포인트에서 끊어 두면, 복구는 그 뒤만 다시 읽는다", say: "WAL은 먼저 적는 로그, 체크포인트는 디스크 반영과 복구 시작 자리, REDO는 체크포인트부터 끝까지 다시 적용이다.", figure: "timeline", focus: ["wal", "rec-4", "redo"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s17", src: "archive/v1:site/gallery/shots/s17-wal-checkpoint.html", corpus: "shot", domain: "DB · WAL, 체크포인트, 복구 용어와 로그 타임라인",
  props: [
    { id: "b1", cat: "T", text: "0–2s 로그 선이 왼쪽부터 그려지며 기록 점이 순서대로 나타난다", essential: true, why: "beat", status: "kept", by: "loop TimeSpec; line 끝점과 dot 출현이 t의 함수" },
    { id: "b2", cat: "G", text: "2–4.5s 체크포인트에서 앞선 기록이 아래 데이터 파일로 선을 그으며 내려간다", essential: true, why: "beat", status: "kept", by: "line 끝점 보간" },
    { id: "b3", cat: "T", text: "4.7–7s 끊김 표시 후 체크포인트부터 다시 적용 화살표가 오른쪽으로", essential: true, why: "beat", status: "kept", by: "arrow from CK, to가 t로 늘어남" },
    { id: "b4", cat: "T", text: "7–8.6s 뒤쪽 기록도 아래로 내려가고 다 그려진 채 멈춘다", essential: true, why: "beat", status: "approx", diff: "원본은 마지막 4%에 전체 페이드아웃 후 반복; 여기선 loop 재시작 시 바로 사라진다" },
    { id: "p1", cat: "S", text: "용어 셋을 한 타임라인 위 사건 자리로 묶는다", essential: true, why: "principle", status: "approx", diff: "타임라인 위 사건 자리는 남지만, 원본의 용어 카드 셋(terms)은 그림 밖 say 문장 하나로 합쳐진다" },
    { id: "p2", cat: "T", text: "선이 그려지는 순서를 인과 순서(기록→반영→끊김→재적용)와 맞춘다", essential: true, why: "principle", status: "kept", by: "draw의 구간 순서" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
