// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, geo, line, dot, label, rect } = api;
  /** @type {Record<string, import("ltt").P>} */
  const PL = { puurs: [4.29, 51.07], icn: [126.45, 37.46], hub: [127.44, 37.27], ctr: [126.99, 37.57] };
  const names = { puurs: "푸어스(벨기에) 공장", icn: "인천공항", hub: "물류센터(이천 일대)", ctr: "중앙접종센터(서울)" };
  const stages = [
    { from: "puurs", to: "icn", head: "① 국가 간 · 항공", temp: "−90~−60 °C", d: "드라이아이스 열 차단 상자 · 약 11시간 비행" },
    { from: "icn", to: "hub", head: "② 도시 간 · 냉동 트럭", temp: "−90~−60 °C", d: "공항에서 초저온 냉동고가 있는 물류센터로" },
    { from: "hub", to: "ctr", head: "③ 창고 → 접종센터", temp: "2~8 °C", d: "해동 뒤 냉장 · 냉장 보관은 날짜 제한" },
  ];
  const chain = model({ n: 3 }, () => ({ stages }), "코미나티 보관 조건(−90~−60 °C, 해동 뒤 2~8 °C), 질병관리청 2021 초도 물량 수송 보도; 물류센터 위치 불확실");
  /** @param {import("ltt").P} a @param {import("ltt").P} b @param {number} f @returns {import("ltt").P[]} */
  const seg = (a, b, f) => Array.from({ length: 49 }, (_, j) => /** @type {import("ltt").P} */ ([a[0] + (b[0] - a[0]) * f * j / 48, a[1] + (b[1] - a[1]) * f * j / 48]));
  return {
    models: { chain },
    figures: {
      s24: figure(geo({ projection: "mercator", loop: { ms: 10500, span: [0, 3] } }), (m, t) => {
        const k = Math.min(2, Math.floor(t)), l = t - k, r = Math.max(0, Math.min(1, (l - 0.3) / 0.45));
        const st = m.chain.stages[k];
        /** @param {keyof typeof names} id */
        const place = (id) => [dot(PL[id], { id: `p-${id}` }), label(PL[id], names[id], { id: `l-${id}`, anchor: id === "icn" || id === "ctr" ? "e" : "w" })];
        const shown = new Set(stages.slice(0, k + 1).flatMap((s) => [s.from, s.to]));
        return [
          stages.map((s, i) => { const f = i < k ? 1 : i === k ? r : 0; return f > 0 && line(seg(PL[s.from], PL[s.to], f), { id: `route${i}`, tone: "focus", weight: "bold" }); }),
          [...shown].map((id) => place(/** @type {keyof typeof names} */ (id))),
          r > 0 && r < 1 && dot(seg(PL[st.from], PL[st.to], r)[48], { id: "pkg", tone: "focus", size: "l" }),
          rect([-170, -55], [-100, -35], { id: "temp-card", fill: "soft" }),
          label([-165, -40], `${st.head}\n${st.temp}\n${st.d}`, { id: "temp", anchor: "nw" }),
        ];
      }),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s24", src: "s24-vaccine-cold-chain.html", corpus: "shot", domain: "콜드체인 · 백신이 국가→도시→창고로 가는 순서, 지도 확대",
  props: [
    { id: "b1", cat: "T", text: "넓은 지도에서 국가 간 경로가 그려지고 점이 흐르며 온도 상자가 바뀐다", essential: true, why: "beat 1", status: "approx", diff: "geo frame에서 line은 투영 평면 직선으로 보간해 원본의 대권 경로(d3.geoInterpolate)가 아니고, 온도 상자는 frame 고정 위치가 아니라 데이터 좌표 label이다" },
    { id: "b2", cat: "T", text: "지도가 한 지역으로 확대되고 도시 간 경로가 그려진다", essential: true, why: "beat 2", status: "lost", diff: "geo frame에는 camera가 없고 region은 고정이라 시간에 따른 확대가 없다; 세계 축척에서 인천–이천 구간은 거의 한 점이 된다" },
    { id: "b3", cat: "T", text: "더 확대되어 마지막 구간이 그려지고 온도 상자가 2~8 °C로 바뀐다", essential: true, why: "beat 3", status: "lost", diff: "확대가 없어 마지막 구간을 읽을 수 없다; 온도 글자 전환만 남는다" },
    { id: "q1", cat: "Q", text: "지점 경위도(푸어스 4.29E 51.07N, 인천 126.45E 37.46N 등)와 구간별 온도", essential: true, why: "그림의 사실", status: "kept", by: "geo: Points are [lon, lat] degrees; model src" },
    { id: "p1", cat: "S", text: "축척 자체를 단계로(확대→경로→머묾 한 박자), 글자 크기는 고정", essential: true, why: "principle", status: "lost", diff: "축척 단계가 표현되지 않는다" },
  ],
  verdict: "G", custom: [], candidates: ["geo-camera", "great-circle-line", "frame-anchored-label"],
}];
