// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, graph, cartesian, node, edge, label, legend, code, rect, line, sweep, split, cells, cell, path, arrow, custom } = api;

  /** @typedef {{s:string,p:string,o:string}} Tr */
  /** @param {string} s @param {string} p @param {string} o @returns {Tr} */
  const T = (s, p, o) => ({ s, p, o });
  const EMP = [{ id: 17, name: "김하나", dept: 3 }, { id: 21, name: "이도윤", dept: 3 }, { id: 30, name: "박서준", dept: 5 }];
  const DEPT = [{ id: 3, name: "데이터팀" }, { id: 5, name: "영업팀" }];
  /** @param {Tr} t */
  const k = (t) => t.s + "|" + t.p + "|" + t.o;
  /** RDFS rdfs2·rdfs7·rdfs9·rdfs11 + OWL 2 hasKey, as in v1. @param {Tr[]} input */
  const closure = (input) => {
    const set = new Map(input.map((t) => [k(t), t]));
    let changed = true;
    /** @param {Tr} t */
    const add = (t) => { if (!set.has(k(t))) { set.set(k(t), t); changed = true; } };
    while (changed) {
      changed = false;
      const all = [...set.values()];
      for (const a of all) for (const b of all) {
        if (a.p === "subClassOf" && b.p === "subClassOf" && a.o === b.s) add(T(a.s, "subClassOf", b.o));
        if (a.p === "a" && b.p === "subClassOf" && a.o === b.s) add(T(a.s, "a", b.o));
        if (a.p === "domain" && b.p === a.s) add(T(b.s, "a", a.o));
        if (a.p === "subPropertyOf" && b.p === a.s) add(T(b.s, a.o, b.o));
      }
      for (const hk of all.filter((t) => t.p === "hasKey")) {
        const mem = all.filter((t) => t.p === "a" && t.o === hk.s).map((t) => t.s);
        for (const x of mem) for (const y of mem) {
          if (x >= y) continue;
          const vx = all.filter((t) => t.s === x && t.p === hk.o).map((t) => t.o);
          if (all.some((t) => t.s === y && t.p === hk.o && vx.includes(t.o))) add(T(x, "sameAs", y));
        }
      }
    }
    return [...set.values()];
  };
  /** @param {Tr[]} ts @param {string} c */
  const countType = (ts, c) => new Set(ts.filter((t) => t.p === "a" && t.o === c).map((t) => t.s)).size;
  const ONTO = [T(":팀장", "subClassOf", ":직원"), T(":직원", "subClassOf", ":사람")];
  const TYPES = [T(":emp17", "a", ":팀장"), T(":emp21", "a", ":직원"), T(":emp30", "a", ":직원")];
  const base6 = [...ONTO, ...TYPES];
  const HR = [T(":emp17", ":이름", '"김하나"'), T(":emp17", ":이메일", '"kim@hanbit.co"'), T(":emp17", ":소속", ":dept3"), T(":dept3", ":이름", '"데이터팀"')];
  const CRM = [T("crm:u9", ":이메일", '"kim@hanbit.co"'), T("crm:u9", ":담당", "crm:acct42"), T("crm:acct42", ":회사명", '"한빛물산"')];

  const kg = model({ infer: true }, (p) => {
    const table = [
      ...EMP.flatMap((e) => [T(":emp" + e.id, ":이름", `"${e.name}"`), T(":emp" + e.id, ":소속", ":dept" + e.dept)]),
      ...DEPT.map((d) => T(":dept" + d.id, ":이름", `"${d.name}"`))];
    const inf6 = closure(base6);
    const inferred6 = inf6.filter((t) => t.p === "a" && !base6.some((b) => k(b) === k(t)));
    const base8 = [...base6, T(":담당", "domain", ":직원"), T("crm:u9", ":담당", "crm:acct42")];
    const inf8 = closure(base8);
    const merged = [...HR, ...CRM];
    const inf9 = closure([...merged, ...base8, T(":사람", "hasKey", ":이메일")]);
    return {
      tableN: table.length, inferred6,
      emp: { off: countType(base6, ":직원"), on: countType(p.infer ? inf6 : base6, ":직원") },
      person: { off: countType(base6, ":사람"), on: countType(p.infer ? inf6 : base6, ":사람") },
      emp6: countType(inf6, ":직원"), emp8: countType(inf8, ":직원"),
      hrN: new Set(HR.map(k)).size, crmN: new Set(CRM.map(k)).size, unionN: new Set(merged.map(k)).size,
      sameN: inf9.filter((t) => t.p === "sameAs").length,
    };
  }, "v1 closure(): RDFS rdfs2/7/9/11 (RDF 1.1 Semantics §9.2) + OWL 2 HasKey §9.5; data from v1 lesson");

  /** @param {number} t @param {number} st @param {number} [len] */
  const fade = (t, st, len = 400) => Math.max(0, Math.min(1, (t - st) / len));

  // Scene 3/4 triple graph; positions copied from v1 (y flipped by using at in a 960x420 box).
  /** @param {(id:string)=>number} op */
  const tripleGraph = (op) => {
    const empY = /** @type {Record<number, number>} */ ({ 17: 350, 21: 230, 30: 110 });
    return [
      ...EMP.flatMap((e) => [
        node("e" + e.id, ":emp" + e.id, { at: [560, empY[e.id]], shape: "round", opacity: op("e" + e.id) }),
        node("n" + e.id, `"${e.name}"`, { at: [385, empY[e.id]], shape: "box", opacity: op("n" + e.id) }),
        edge("e" + e.id, "n" + e.id, { text: "이름", directed: true, opacity: op("e" + e.id + "->n" + e.id) }),
        edge("e" + e.id, "d" + e.dept, { text: "소속", directed: true, opacity: op("e" + e.id + "->d" + e.dept) }),
      ]),
      node("d3", ":dept3", { at: [790, 310], shape: "round", opacity: op("d3") }),
      node("d5", ":dept5", { at: [790, 130], shape: "round", opacity: op("d5") }),
      node("dn3", '"데이터팀"', { at: [790, 220], shape: "box", opacity: op("dn3") }),
      node("dn5", '"영업팀"', { at: [790, 40], shape: "box", opacity: op("dn5") }),
      edge("d3", "dn3", { text: "이름", directed: true, opacity: op("d3->dn3") }),
      edge("d5", "dn5", { text: "이름", directed: true, opacity: op("d5->dn5") }),
      legend([{ tone: "ref", text: "타원 = IRI(자원)" }, { tone: "muted", text: "네모 = 리터럴(값)" }], { at: [312, 400] }),
    ];
  };

  const empStart = [600, 2400, 3200], deptStart = [4200, 5000], deptFirst = { 3: 1200, 5: 3800 };
  /** @type {Record<string, number>} */
  const sched = {};
  EMP.forEach((e, i) => {
    sched["e" + e.id] = empStart[i]; sched["n" + e.id] = empStart[i] + 300;
    sched[`e${e.id}->n${e.id}`] = empStart[i] + 300; sched[`e${e.id}->d${e.dept}`] = empStart[i] + 600;
  });
  sched.d3 = deptFirst[3]; sched.d5 = deptFirst[5];
  DEPT.forEach((d, i) => { sched["dn" + d.id] = deptStart[i] + 300; sched[`d${d.id}->dn${d.id}`] = deptStart[i] + 300; });
  const edgeIds = Object.keys(sched).filter((x) => x.includes("->"));
  const rowSpans = [...EMP.map((e, i) => ["emp" + e.id, empStart[i], empStart[i + 1] || 4200]), ...DEPT.map((d, i) => ["dept" + d.id, deptStart[i], deptStart[i] + 800])];

  const rowTables = figure(cartesian({ x: [0, 300, "px"], y: [0, 420, "px"], loop: { ms: 7000, span: [0, 7000], once: true } }), (m, t) => [
    label([16, 384], "직원 표"),
    code([16, 360], "id | 이름   | 부서_id\n17 | 김하나 | 3\n21 | 이도윤 | 3\n30 | 박서준 | 5", { id: "empTable" }),
    label([16, 182], "부서 표"),
    code([16, 160], "id | 이름\n3  | 데이터팀\n5  | 영업팀", { id: "deptTable" }),
    rowSpans.map(([id, a, b]) => {
      const row = /** @type {Record<string, number>} */ ({ emp17: 326, emp21: 292, emp30: 258, dept3: 126, dept5: 92 })[String(id)] ?? 0;
      const on = t >= Number(a) && t < Number(b), done = t >= Number(b);
      return (on || done) && rect([16, row - 17], [256, row + 17], { id: "row-" + id, tone: on ? "focus" : "muted", fill: "soft", opacity: on ? 1 : 0.4 });
    }),
    label([16, 20], `${EMP.length}행 × 2 + ${DEPT.length}행 × 1 = ${m.kg.tableN}`, { id: "formula", tone: "focus", opacity: fade(t, 6000) }),
  ]);
  const rowGraph = figure(graph({ layout: "layered", direction: "right", loop: { ms: 7000, span: [0, 7000], once: true } }), (m, t) => [
    tripleGraph((id) => fade(t, sched[id] ?? 0)),
    label([944, 400], `트리플 ${edgeIds.filter((id) => fade(t, sched[id]) >= 1).length}개`, { id: "counter", tone: "focus", anchor: "ne" }),
    [label([560, 318], "주어"), label([474, 318], "술어"), label([385, 318], "목적어")].map((x) => x),
    label([474, 300], "", { id: "spo-anno", opacity: fade(t, 900) * (1 - fade(t, 2400)) }),
  ]);
  const row2triples = split(["rowTables", "rowGraph"], { link: "e17" });

  const hot = new Set(["dn3", "d3", "e17", "e21", "n17", "n21", "d3->dn3", "e17->d3", "e21->d3", "e17->n17", "e21->n21"]);
  const joinCode = figure(cartesian({ x: [0, 400, "px"], y: [0, 420, "px"], static: "SQL 조인과 SPARQL 질의" }), () => [
    label([0, 410], "SQL — 키 값을 맞춘다"),
    code([0, 390], "SELECT e.이름\nFROM 직원 e JOIN 부서 d\n  ON e.부서_id = d.id\nWHERE d.이름 = '데이터팀';", { lang: "sql", highlight: [3], id: "sql" }),
    code([0, 270], "이름\n김하나\n이도윤", { id: "sqlResult" }),
    label([0, 190], "SPARQL — 같은 노드를 지나는 길을 찾는다"),
    code([0, 170], "SELECT ?n WHERE {\n  ?e :소속 ?d .\n  ?d :이름 \"데이터팀\" .\n  ?e :이름 ?n . }", { lang: "sparql", highlight: [2, 3], id: "sparql" }),
  ]);
  const joinGraph = figure(graph({ layout: "layered", static: "장면 3 그래프에서 데이터팀 경로 강조" }), () => [
    tripleGraph((id) => (hot.has(id) ? 1 : 0.25)),
    label([944, 400], `결과 ${EMP.filter((e) => e.dept === 3).length}명`, { tone: "focus", anchor: "ne" }),
  ]);
  const join = split(["joinCode", "joinGraph"], { link: "d3" });

  const certGiven = figure(cartesian({ x: [0, 900, "px"], y: [0, 200, "px"], static: "현재 구조와 새 사실" }), (m) => [
    label([0, 190], "테이블 (지금 구조)"), code([0, 170], "직원(id, 이름, 부서_id)\n부서(id, 이름)"),
    label([320, 190], "그래프 (지금 데이터)"), label([320, 160], `트리플 ${m.kg.tableN}개 — 정해 둔 열 목록은 없다`),
    label([0, 40], "새로 기록할 사실: 김하나(id 17, :emp17)의 자격증 2개 — SQLD, AWS-SAA", { tone: "focus" }),
  ]);
  const certSql = figure(cartesian({ x: [0, 400, "px"], y: [0, 220, "px"], static: "DDL로 새 테이블" }), () => [
    label([0, 210], "테이블: 다중 값이라 새 테이블(DDL)", { tone: "warn" }),
    code([0, 190], "CREATE TABLE 직원_자격증 (\n  직원_id INT REFERENCES 직원(id),\n  자격증  TEXT);\nINSERT … (17,'SQLD'), (17,'AWS-SAA');", { lang: "sql", highlight: [1, 2, 3] }),
  ]);
  const certGraph = figure(graph({ layout: "layered", direction: "right", static: "트리플 2개 추가" }), (m) => [
    node("e17", ":emp17", { shape: "round" }),
    node("c1", '"SQLD"', { shape: "box", tone: "focus" }), node("c2", '"AWS-SAA"', { shape: "box", tone: "focus" }),
    edge("e17", "c1", { text: "자격증", directed: true, tone: "focus" }), edge("e17", "c2", { text: "자격증", directed: true, tone: "focus" }),
    label([10, 6], `트리플 ${m.kg.tableN} + 2 = ${m.kg.tableN + 2}개 · 구조 변경 없음`, { tone: "focus" }),
  ]);
  const certAnswer = split(["certSql", "certGraph"]);

  const inferStart = (/** @type {number} */ i) => 1000 + i * 900;
  const infer = figure(cartesian({ x: [0, 1000, "px"], y: [0, 430, "px"], loop: { ms: 6000, span: [0, 6000], once: true } }), (m, t) => {
    const inf = /** @type {Tr[]} */ (m.kg.inferred6);
    const P = /** @type {Record<string, [number, number]>} */ ({ ":팀장": [200, 350], ":직원": [440, 350], ":사람": [680, 350], ":emp17": [200, 80], ":emp21": [440, 80], ":emp30": [640, 80] });
    const shown = inf.filter((_, i) => m.kg.emp.on !== m.kg.emp.off || fade(t, inferStart(i), 500) >= 1);
    const vis = [...base6, ...(m.kg.person.on > 0 ? shown : [])];
    return [
      sweep("y", 220, { tone: "muted", weight: "thin" }),
      label([20, 234], "스키마(온톨로지)", { tone: "muted" }), label([20, 196], "데이터", { tone: "muted" }),
      Object.entries(P).map(([n, at]) => label(at, n, { id: n, size: "m" })),
      ONTO.map((x) => arrow(P[x.s], P[x.o], { label: "subClassOf", id: `${x.s}->${x.o}` })),
      TYPES.map((x) => arrow(P[x.s], P[x.o], { label: "a", weight: "thin", id: `${x.s}-a-${x.o}` })),
      m.kg.person.on > 0 && inf.map((x, i) => [
        line([P[x.s], P[x.o]], { dash: true, tone: "focus", weight: "bold", reveal: fade(t, inferStart(i), 500), id: `inf-${x.s}-${x.o}` }),
      ]),
      legend([{ tone: "focus", text: "점선 = 추론된 a" }, { tone: "ref", text: "실선 = 적어 둔 a" }], { at: [780, 30] }),
      label([890, 290], "질의 결과(명)"), label([915, 252], "추론 끔", { tone: "muted" }), label([972, 252], "켬", { tone: "muted" }),
      [[":직원", 208], [":사람", 164]].map(([cls, y]) => [
        code([784, Number(y)], `?x a ${cls}`),
        label([915, Number(y)], String(countType(base6, String(cls)))),
        label([972, Number(y)], String(countType(vis, String(cls))), { tone: "focus", id: "on-" + cls }),
      ]),
    ];
  });

  const tagSide = figure(cartesian({ x: [0, 400, "px"], y: [0, 300, "px"], static: "태그 열 질의 결과 0행" }), () => [
    label([0, 290], "태그 열 — 빠진 것: '팀장'이 '사람'의 한 종류라는 사실", { tone: "bad" }),
    code([0, 260], "id | 이름   | 태그\n17 | 김하나 | 팀장\n21 | 이도윤 | 직원\n30 | 박서준 | 직원"),
    code([0, 110], "SELECT * FROM 직원\nWHERE 태그 = '사람';", { lang: "sql" }),
    label([0, 30], "→ 0행", { size: "l", tone: "bad", id: "tag-result" }),
  ]);
  const ontoSide = figure(graph({ layout: "layered", static: "온톨로지 + 추론 결과 3명" }), (m) => [
    node(":팀장", ":팀장", { at: [80, 250], shape: "circle" }), node(":직원", ":직원", { at: [260, 250], shape: "circle" }), node(":사람", ":사람", { at: [440, 250], shape: "circle" }),
    edge(":팀장", ":직원", { text: "subClassOf", directed: true, tone: "good" }), edge(":직원", ":사람", { text: "subClassOf", directed: true, tone: "good" }),
    node("e17", ":emp17", { at: [80, 130], shape: "round" }), node("e21", ":emp21", { at: [230, 130], shape: "round" }), node("e30", ":emp30", { at: [380, 130], shape: "round" }),
    edge("e17", ":팀장", { text: "a", directed: true }), edge("e21", ":직원", { text: "a", directed: true }), edge("e30", ":직원", { text: "a", directed: true }),
    code([10, 60], "SELECT ?x WHERE { ?x a :사람 }", { lang: "sparql" }),
    label([10, 16], `→ ${m.kg.person.on}명 (추론 켬)`, { size: "l", tone: "good", id: "onto-result" }),
  ]);
  const tagVsOnto = split(["tagSide", "ontoSide"]);

  const domainGiven = figure(cartesian({ x: [0, 900, "px"], y: [0, 200, "px"], static: "domain 한 줄과 CRM 트리플" }), (m) => [
    label([0, 190], "지금 (앞 장면, 추론 켬)"), code([0, 160], "?x a :직원"), label([140, 160], `→ ${m.kg.emp6}명 (emp17, emp21, emp30)`),
    label([320, 190], "온톨로지에 한 줄 추가"), code([320, 160], ":담당 rdfs:domain :직원 ."),
    label([0, 40], "CRM에서 들어온 트리플: crm:u9 :담당 crm:acct42 . — crm:u9의 타입(a)은 어디에도 없다", { tone: "focus" }),
  ]);
  const domainAnswer = figure(graph({ layout: "layered", static: "u9이 추론으로 직원이 됨" }), (m) => [
    node("u9", "crm:u9", { at: [90, 50], shape: "round" }), node("acct", "crm:acct42", { at: [330, 50], shape: "round" }), node("emp", ":직원", { at: [90, 160], shape: "circle" }),
    edge("u9", "acct", { text: ":담당", directed: true }),
    edge("u9", "emp", { text: "a (추론)", directed: true, tone: "focus", weight: "bold", id: "u9-a-emp" }),
    label([250, 150], `${m.kg.emp6} + 1 = ${m.kg.emp8}명`, { tone: "focus" }),
  ]);

  const merge = figure(cartesian({ x: [0, 960, "px"], y: [0, 440, "px"], loop: { ms: 8000, span: [0, 8000], once: true } }), (m, t) => {
    const e = (/** @type {number} */ v) => v * v * (3 - 2 * v);
    const mv = e(fade(t, 1000, 1200));
    const xh = 325 + (480 - 325) * mv, xc = 635 + (480 - 635) * mv;
    /** @type {Record<string, [number, number]>} */
    const P = { e17: [250, 290], nm: [90, 290], d3: [250, 150], dn: [250, 50], u9: [720, 290], ac: [800, 150], cn: [800, 50] };
    const pathAt = /** @type {[string, number][]} */ ([["dn", 4200], ["d3->dn", 4400], ["d3", 4600], ["e17->d3", 4800], ["e17", 5000], ["same", 5200], ["u9", 5400], ["u9->ac", 5600], ["ac", 5800], ["ac->cn", 6000], ["cn", 6200]]);
    const hotT = /** @type {Record<string, boolean>} */ (Object.fromEntries(pathAt.map(([id, at]) => [id, t >= at])));
    /** @param {string} id */
    const tn = (id) => (hotT[id] ? "focus" : undefined);
    const counter = t < 2200 ? `HR ${m.kg.hrN}개 · CRM ${m.kg.crmN}개` : t < 3600 ? `합집합 ${m.kg.hrN} + ${m.kg.crmN} = ${m.kg.unionN}개` : `${m.kg.unionN} + sameAs ${m.kg.sameN} = ${m.kg.unionN + m.kg.sameN}개`;
    return [
      rect([16, 8], [400, 384], { fill: "soft", tone: "muted", label: "HR 출처" }),
      rect([560, 8], [944, 384], { fill: "soft", tone: "muted", label: "CRM 출처" }),
      label(P.e17, ":emp17", { id: "e17", tone: tn("e17") }), label(P.nm, '"김하나"', { id: "nm" }),
      label(P.d3, ":dept3", { id: "d3", tone: tn("d3") }), label(P.dn, '"데이터팀"', { id: "dn", tone: tn("dn") }),
      label(P.u9, "crm:u9", { id: "u9", tone: tn("u9") }), label(P.ac, "crm:acct42", { id: "ac", tone: tn("ac") }), label(P.cn, '"한빛물산"', { id: "cn", tone: tn("cn") }),
      arrow(P.e17, P.nm, { label: "이름" }),
      arrow(P.e17, P.d3, { label: "소속", id: "e17->d3", tone: tn("e17->d3") }),
      arrow(P.d3, P.dn, { label: "이름", id: "d3->dn", tone: tn("d3->dn") }),
      arrow(P.u9, P.ac, { label: ":담당", id: "u9->ac", tone: tn("u9->ac") }),
      arrow(P.ac, P.cn, { label: "회사명", id: "ac->cn", tone: tn("ac->cn") }),
      label([xh, 200], '"kim@hanbit.co"', { id: "mailHR" }),
      mv < 1 && label([xc, 200], '"kim@hanbit.co"', { id: "mailCRM" }),
      arrow(P.e17, [xh, 200], { label: "이메일" }), arrow(P.u9, [xc, 200], { label: "이메일" }),
      line([P.e17, P.u9], { id: "same", label: "≡ owl:sameAs", weight: "bold", tone: tn("same") ?? "ref", opacity: fade(t, 2800, 800) }),
      label([480, 144], "규칙: 이메일이 같은 :사람은 같은 개체 (owl:hasKey)", { opacity: fade(t, 2800, 800) }),
      label([480, 404], counter, { id: "counter", tone: "focus" }),
      label([480, 90], "데이터팀이 담당하는 고객사 → 한빛물산 (1곳)", { id: "result", opacity: fade(t, 6600) }),
    ];
  });

  const erp = figure(cartesian({ x: [0, 900, "px"], y: [0, 240, "px"], static: "ERP 통합 절차" }), (_m, _t, ctx) => (ctx.params.side === "table"
    ? [label([0, 230], "테이블 통합", { tone: "warn" }),
       code([0, 200], "1. 공통 스키마에 거래처 테이블·담당자 열 추가 (DDL)\n2. ETL: ERP.vendor → 공통 스키마 매핑 작성\n3. '담당 고객사' 질의·뷰에 UNION·JOIN 추가"),
       label([0, 60], "변경이 스키마·ETL·질의 세 곳에 퍼진다", { tone: "warn" }), label([0, 30], "대신 도구·성능·팀 숙련은 지금 그대로다.", { tone: "muted" })]
    : [label([0, 230], "온톨로지 통합", { tone: "good" }),
       code([0, 200], "1. ERP 행을 트리플로 변환(R2RML 등)\n2. 공리 한 줄: erp:manager subPropertyOf :담당\n3. '담당 고객사' 질의는 그대로"),
       label([0, 60], "변경이 매핑과 공리에 모인다", { tone: "good" }), label([0, 30], "대신 트리플 저장소·추론기 운영과 집계 성능 비용이 생긴다.", { tone: "muted" })]));

  const decideRows = [
    ["출처 수", "1–3개, 더 늘 계획 없음", "여럿이고 계속 늘어남"],
    ["스키마 변화", "드묾, 한 팀이 관리", "잦음, 출처마다 다른 이름·키"],
    ["주 질의", "집계·리포트·트랜잭션", "관계 따라가기, 분류 계층(\"모든 사람\")"],
    ["같은 대상", "원본 시스템이 하나", "여러 시스템에 다른 키로 흩어짐"],
    ["운영 비용", "지금 팀·도구 그대로", "트리플 저장소·추론기, 온톨로지 관리 역할 필요"]];
  const decide = figure(cells({ cols: 3, rows: 6, static: "결정 표" }), () => [
    ["조건", "테이블로 충분", "온톨로지가 값한다"].map((h, c) => cell(c, 0, { text: h, weight: "bold" })),
    decideRows.map((r, i) => r.map((s, c) => cell(c, i + 1, { text: s, tone: c === 2 ? "good" : c === 1 ? "ref" : "muted" }))),
  ]);

  const tree = figure(graph({ layout: "tree", direction: "right", static: "이번 수업 세 단과 다음 개념" }), () => {
    const roots = ["RDF 트리플", "클래스 계층·추론", "다중 출처 통합"];
    const leaves = [[0, "SPARQL 질의"], [0, "속성 그래프(LPG)와 비교"], [1, "SHACL 검증"], [1, "OWL 2 프로필과 추론 비용"], [2, "R2RML·가상 지식 그래프"], [2, "엔티티 해석(같은 대상 찾기)"]];
    return [
      roots.map((r) => node("r-" + r, r, { shape: "circle", group: "이번 수업" })),
      leaves.map(([r, l]) => [node("l-" + l, String(l), { shape: "round", group: "다음에 배울 것" }), edge("r-" + roots[Number(r)], "l-" + l)]),
    ];
  });

  const rungs = [
    ["표", ["알고 있음: 행·열·키·조인"]],
    ["트리플", ["① 칸 하나 = 트리플 하나", "② 조인 = 같은 노드를 지나는 길", "(예측) 새 속성은 트리플만 더함"]],
    ["클래스·추론", ["③ 계층 → 적지 않은 사실도 질의에", "④ 태그 ≠ 개념 사이 관계", "(예측) domain은 추론, 검사는 SHACL"]],
    ["다중 출처 통합", ["⑤ 합치기 = 합집합 + sameAs", "⑥ 새 출처는 공리를 더함"]],
    ["결정", ["⑦ 출처 수·변화·계층 질의로 고름"]]];
  const overview = figure(cartesian({ x: [0, 960, "px"], y: [0, 420, "px"], static: "표에서 결정까지 사다리" }), () => [
    label([16, 400], "이 수업의 사다리 — 단마다 앞 장면의 핵심 문장 번호(요약 순서)", { tone: "muted" }),
    rungs.map(([name, items], i) => {
      const x = 16 + i * 188, top = 270 + i * 30;
      return [
        rect([x, 10], [x + 176, top], { tone: i === 0 ? "muted" : "focus", fill: "soft", id: "rung" + i }),
        label([x + 12, top - 30], String(name), { weight: "bold" }),
        /** @type {string[]} */ (items).map((ln, j) => label([x + 12, top - 66 - j * 50], ln, { tone: i === 0 ? "muted" : undefined })),
      ];
    }),
    path(rungs.flatMap((_, i) => /** @type {import("ltt").PathCmd[]} */ ([[i === 0 ? "M" : "L", 16 + i * 188, 270 + i * 30], ["L", 16 + i * 188 + 176, 270 + i * 30]])), { tone: "focus", weight: "bold", id: "stair" }),
  ]);

  const terms = figure(graph({ layout: "layered", direction: "right", steps: ["트리플", "IRI", "리터럴", "클래스", "추론기"] }), (_m, _t, ctx) => [
    ctx.step === 0 && [node("s", "주어", { shape: "round" }), node("o", "목적어", { shape: "box" }), edge("s", "o", { text: "술어", directed: true })],
    ctx.step === 1 && node("iri", ":emp17", { shape: "round" }),
    ctx.step === 2 && node("lit", '"김하나"', { shape: "box" }),
    ctx.step === 3 && [node("x", ":emp17", { shape: "round" }), node("c", ":팀장", { shape: "circle" }), edge("x", "c", { text: "a", directed: true })],
    ctx.step === 4 && [node("p", "적은 트리플", { at: [120, 60], shape: "box" }), node("q", "만든 트리플", { at: [120, 20], shape: "box" }),
      edge("p", "p", { id: "solid", tone: "ref" }), edge("q", "q", { id: "dashed", tone: "focus" })],
  ]);

  const hook = figure(graph({ layout: "force", idle: { ms: 6000 } }), () => [
    ["a", "b", "c", "d", "e", "f"].map((n) => node(n, "", { shape: "circle", size: "s" })),
    [["a", "b"], ["b", "c"], ["a", "d"], ["d", "e"], ["c", "f"], ["e", "f"], ["b", "e"]].map(([f, t]) => edge(f, t)),
  ]);

  void custom;
  return {
    models: { kg },
    figures: { hook, terms, rowTables, rowGraph, row2triples, joinCode, joinGraph, join, certGiven, certSql, certGraph, certAnswer, infer, tagSide, ontoSide, tagVsOnto, domainGiven, domainAnswer, merge, erp, decide, tree, overview },
    scenes: [
      { type: "hook", title: "테이블이면 충분할까, 온톨로지가 필요할까?", say: "사내 데이터 통합", figure: "hook", focus: [] },
      { type: "steps", title: "그래프 쪽 말 다섯 개", figure: "terms", steps: ["트리플", "IRI", "리터럴", "클래스", "추론기"].map((s) => ({ say: s, focus: [] })) },
      { type: "explain", title: "표의 칸 하나가 트리플 하나가 된다", say: "행 키는 주어 IRI, 열 이름은 술어, 칸의 값은 목적어.", figure: "row2triples", focus: ["counter", "formula"] },
      { type: "explain", title: "조인은 같은 IRI 노드를 지나는 길이다", say: "SQL이 맞추는 값은 노드 :dept3 하나다.", figure: "join", focus: ["d3", "dn3", "e17", "e21"] },
      { type: "predict", title: "새 속성이 생기면 무엇을 고쳐야 할까", ask: "기존 구조를 바꾸는 문장(DDL)이 필요한 쪽은?", figure: "certGiven", focus: [],
        input: { kind: "choice", options: [{ text: "테이블만", correct: true }, { text: "그래프만", feedback: "그래프는 술어도 데이터다." }, { text: "둘 다", feedback: "그래프는 트리플만 더한다." }, { text: "둘 다 아니다", feedback: "다중 값은 새 테이블이 필요하다." }] },
        reveal: { say: "관계형은 열 목록이 곧 스키마다. 그래프는 새 술어 트리플을 더하기만 한다.", figure: "certAnswer" } },
      { type: "explore", title: "계층을 적어 두면, 적지 않은 사실도 질의에 나온다", say: "점선은 추론기가 만든 트리플.", figure: "infer", focus: ["on-:직원", "on-:사람"], knobs: { infer: true } },
      { type: "explain", title: "태그는 문자열이고, 온톨로지는 개념 사이의 관계다", say: "둘 다 '사람'을 묻는다.", figure: "tagVsOnto", focus: ["tag-result", "onto-result"] },
      { type: "predict", title: "도메인 규칙은 막을까, 덧붙일까", ask: "'?x a :직원'을 다시 물으면 몇 명?", figure: "domainGiven", focus: [],
        input: { kind: "choice", options: [{ text: "3명 — u9은 타입이 없어 빠진다", feedback: "domain은 타입을 만든다." }, { text: "4명 — u9도 직원이 된다", correct: true }, { text: "넣을 때 거부된다", feedback: "domain은 막지 않는다(SHACL이 막는다)." }] },
        reveal: { say: "rdfs:domain은 추론 규칙(rdfs2)이다.", figure: "domainAnswer" }, targets: "domain을 제약으로 오해" },
      { type: "explain", title: "두 출처를 합치는 일은 합집합이고, 같은 대상은 한 줄로 잇는다", say: "HR :emp17과 CRM crm:u9.", figure: "merge", focus: ["same", "counter", "result"] },
      { type: "compare", title: "출처가 하나 더 들어오면: 테이블은 스키마를 고치고, 온톨로지는 공리를 더한다", say: "ERP manager 열.", figure: "erp", focus: [], a: { side: "table" }, b: { side: "onto" }, labels: ["테이블 통합", "온톨로지 통합"] },
      { type: "explain", title: "출처가 늘고, 같은 대상이 흩어지고, 계층을 물을 때 온톨로지가 값한다", say: "결정 표.", figure: "decide", focus: [] },
      { type: "explain", title: "이어서 배울 것", say: "세 단에서 뻗어 나가는 다음 개념.", figure: "tree", focus: [] },
      { type: "explain", title: "표에서 결정까지 한 장으로", say: "아는 단에서 결정 표까지.", figure: "overview", focus: ["stair"] },
    ],
  };
};

const SRC = "archive/v1:site/gallery/knowledge-graph/ontology-triples.html";
/** @param {string} scene */
const base = (scene) => ({ fig: "ontology-triples#" + scene, src: SRC, corpus: /** @type {const} */ ("lesson"), domain: "지식 그래프" });

/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  { ...base("hook-network"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "G", text: "장식용 네트워크 그림(art: network) — 노드와 간선", essential: false, why: "v2 hook. art는 장식이라 제목·결론이 기대지 않는다", status: "kept", by: "graph layout force, node, edge" },
  ] },
  { ...base("terms"), verdict: "G", custom: [], candidates: ["dashed-edge", "node-shape-semantics"], props: [
    { id: "P1", cat: "G", text: "트리플 = 주어 타원 → 술어 화살표 → 목적어 네모", essential: true, why: "v2 define(용어마다) 또는 steps. 용어 카드의 시각 정의", status: "kept", by: "edge directed; node shape round/box" },
    { id: "P2", cat: "E", text: "IRI는 타원, 리터럴은 네모로 구별(이후 모든 그림의 표기 약속)", essential: true, why: "plain 문장 '그림에서는 타원/네모'가 기댄다", status: "ambiguous", by: "node shape", diff: "d.ts는 shape 이름만 주고 round/box가 같은 그림 안에서 일관되게 구별된 모양으로 그려진다는 보장이 없다" },
    { id: "P3", cat: "E", text: "추론기: 적은 트리플 실선 vs 만든 트리플 점선(accent)", essential: true, why: "이후 장면 6 범례와 같은 약속", status: "approx", diff: "edge에 dash 옵션이 없어 tone(ref/focus)으로만 구별하고 자기 간선으로 견본을 흉내 낸다" },
  ] },
  { ...base("row2triples"), verdict: "G", custom: [], candidates: ["table-mark", "row-highlight-sync"], props: [
    { id: "P1", cat: "Q", text: "트리플 수 = 3행×2 + 2행×1 = 8 (카운터·공식)", essential: true, why: "v2 explain. 제목 '칸 하나가 트리플 하나'의 수치 결론", status: "kept", by: "model + label Text; edge 완성 수를 t로 계산" },
    { id: "P2", cat: "G", text: "행 키→주어 IRI, 열 이름→술어(간선 라벨), 값→목적어; 외래 키는 리터럴이 아니라 :dept 노드로 가는 간선", essential: true, why: "sub·takeaway가 기대는 대응", status: "kept", by: "node/edge(text, directed); node shape box=리터럴" },
    { id: "P3", cat: "T", text: "행마다 순서대로 강조되고 그 행의 노드·간선이 페이드인(7초, 1회)", essential: true, why: "행→트리플 대응을 시간으로 보여 준다", status: "kept", by: "Loop once; opacity를 t로 계산; split가 t 공유" },
    { id: "P4", cat: "S", text: "왼쪽 표, 오른쪽 그래프를 나란히 + 현재 행과 생겨나는 노드의 짝", essential: true, why: "표 행과 노드의 대응", status: "approx", diff: "표를 code 텍스트로 그리고 행 강조 rect 좌표를 수작업으로 맞춘다; 표 칸 단위 구조는 잃는다" },
    { id: "P5", cat: "X", text: "주어·술어·목적어 주석이 첫 행 그래프 위에 잠시 나타남", essential: false, why: "보조 주석", status: "approx", diff: "주석 라벨에 opacity 시간 변화를 일부만 연결" },
    { id: "P6", cat: "G", text: "노드 고정 배치(직원 열, 이름 열, 부서 열)", essential: false, why: "장면 4와 같은 배치 재사용", status: "ambiguous", by: "node at overrides layout", diff: "graph frame의 at 좌표계 단위가 d.ts에 정의되지 않음" },
    { id: "P7", cat: "E", text: "IRI 타원 / 리터럴 네모 구별", essential: true, why: "범례가 기대는 표기", status: "ambiguous", by: "node shape", diff: "shape가 시각적으로 구별된다는 보장 없음" },
  ] },
  { ...base("join"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "G", text: "SQL 조인 키(e.부서_id = d.id)가 그래프의 노드 :dept3 하나에 대응", essential: true, why: "v2 explain(split). 제목 결론", status: "kept", by: "split link: 'd3'; code highlight [3]" },
    { id: "P2", cat: "E", text: "'데이터팀'→:dept3→소속 역방향→두 직원·이름 경로만 강조, 나머지 흐림", essential: true, why: "'길을 찾는다'의 시각화", status: "approx", diff: "hot/dim 클래스를 opacity 0.25로 바꿨다; 강조 색은 runtime이 정한다" },
    { id: "P3", cat: "Q", text: "결과 2명(김하나, 이도윤)", essential: true, why: "SQL·SPARQL 결과가 같다는 결론", status: "kept", by: "label; code" },
    { id: "P4", cat: "X", text: "SPARQL에서 ?d 변수 강조", essential: false, why: "공유 노드 = 공유 변수", status: "approx", diff: "highlight가 줄 단위라 변수 토큰만 강조하지 못한다" },
  ] },
  { ...base("cert-given"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "X", text: "현재 테이블 구조·트리플 8개·새 사실(자격증 2개)", essential: true, why: "v2 predict figure. 질문의 전제", status: "kept", by: "code, label Text(model tableN)" },
  ] },
  { ...base("cert-answer"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "X", text: "테이블 쪽은 새 테이블 DDL", essential: true, why: "v2 predict reveal.figure. 정답 근거", status: "kept", by: "Predict reveal.figure; code lang sql" },
    { id: "P2", cat: "G", text: "그래프 쪽은 :emp17에서 리터럴 2개로 '자격증' 간선 2개만 추가", essential: true, why: "구조 변경 없음 결론", status: "kept", by: "node/edge directed, tone focus" },
    { id: "P3", cat: "Q", text: "트리플 8 + 2 = 10, 구조 변경 없음", essential: true, why: "수치 결론", status: "kept", by: "label Text with model" },
  ] },
  { ...base("infer"), verdict: "G", custom: [], candidates: ["node-in-cartesian", "dashed-edge"], props: [
    { id: "P1", cat: "G", text: "스키마 층(클래스 subClassOf 사슬)과 데이터 층(직원)을 구분선 위아래로", essential: true, why: "v2 explore(추론 토글). 온톨로지 = 스키마 층", status: "approx", diff: "graph frame에 구분선을 둘 수 없어 cartesian에 label·arrow로 노드를 흉내 내, 타원 모양을 잃는다" },
    { id: "P2", cat: "T", text: "추론된 a 4개가 0.9초 간격으로 점선으로 나타나고 '켬' 열 수가 그에 맞춰 증가(6초)", essential: true, why: "추론이 질의 결과를 늘리는 과정", status: "kept", by: "Loop once; line reveal; label 값이 t로 계산" },
    { id: "P3", cat: "Q", text: "?x a :직원 끔 2 / 켬 3, ?x a :사람 끔 0 / 켬 3", essential: true, why: "제목 결론의 수치", status: "kept", by: "model countType, check 대상 값" },
    { id: "P4", cat: "I", text: "추론 끄기 토글: 점선 사라지고 켬 열이 끔 열과 같아짐; 켜면 처음부터 재생", essential: true, why: "toggle-row 설명이 기대는 조작", status: "ambiguous", by: "Explore knobs boolean", diff: "knob 변경 시 loop가 seek(0)·재생되는지 d.ts가 말하지 않는다" },
    { id: "P5", cat: "E", text: "추론 a는 accent 점선, 적은 a는 실선(범례)", essential: true, why: "적은/만든 구별", status: "kept", by: "line dash, tone focus; legend" },
  ] },
  { ...base("tag-vs-onto"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "S", text: "같은 직원 세 명, 왼쪽 태그 열(bad) / 오른쪽 온톨로지(good) 나란히", essential: true, why: "v2 compare에 가깝지만 두 그림이 다르므로 explain + split", status: "kept", by: "split; tone bad/good" },
    { id: "P2", cat: "Q", text: "태그='사람' → 0행 vs ?x a :사람 → 3명", essential: true, why: "결론 수치", status: "kept", by: "label with model person.on" },
    { id: "P3", cat: "G", text: "오른쪽에 subClassOf 화살표가 더해진 것(태그엔 없는 관계)", essential: true, why: "'개념 사이 관계' 결론", status: "kept", by: "edge directed text subClassOf" },
  ] },
  { ...base("domain-given"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "X", text: "현재 ?x a :직원 → 3명, 추가할 domain 공리, 타입 없는 crm:u9 트리플", essential: true, why: "v2 predict figure. 질문 전제", status: "kept", by: "code, label with model emp6" },
  ] },
  { ...base("domain-answer"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "G", text: "crm:u9 :담당 acct42 에서 u9 → :직원 '추론된 a' 간선(강조)", essential: true, why: "v2 predict reveal.figure. domain = 추론", status: "approx", diff: "추론 간선의 점선 표기를 edge에 줄 수 없어 tone·weight로만 구별" },
    { id: "P2", cat: "Q", text: "3 + 1 = 4명", essential: true, why: "정답 수치", status: "kept", by: "label with model emp6/emp8" },
  ] },
  { ...base("merge"), verdict: "V", custom: [], candidates: ["node-in-cartesian", "label-move-from"], props: [
    { id: "P1", cat: "S", text: "HR 영역과 CRM 영역 두 상자", essential: true, why: "v2 explain. 출처 경계", status: "kept", by: "rect fill soft label" },
    { id: "P2", cat: "T", text: "두 이메일 리터럴이 가운데로 이동해 하나로 합쳐짐(1.0–2.2초, smoothstep)", essential: true, why: "'같은 값 리터럴은 한 노드' = 합집합", status: "kept", by: "Loop once; t로 좌표 계산; mailCRM이 mv=1에서 사라짐" },
    { id: "P3", cat: "T", text: "2.8초 sameAs 선과 hasKey 규칙 페이드인", essential: true, why: "같은 대상을 잇는다", status: "kept", by: "opacity from t" },
    { id: "P4", cat: "T", text: "4.2–6.2초 데이터팀→dept3→emp17→sameAs→u9→acct42→한빛물산 경로 순차 강조, 6.6초 결과", essential: true, why: "질의가 출처 경계를 넘는다", status: "kept", by: "tone focus by t threshold" },
    { id: "P5", cat: "Q", text: "카운터 HR 4 · CRM 3 → 합집합 7 → 7 + sameAs 1 = 8; 고객사 1곳", essential: true, why: "합집합 결론의 수치", status: "kept", by: "model + label Text" },
    { id: "P6", cat: "E", text: "IRI 타원/리터럴 네모 표기", essential: false, why: "앞 장면 약속", status: "lost", diff: "cartesian에 node가 없어 label로 그려 모양 구별을 잃는다" },
  ] },
  { ...base("erp-compare"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "S", text: "테이블 통합(warn) 3단계 vs 온톨로지 통합(good) 3단계 나란히", essential: true, why: "v2 compare", status: "kept", by: "Compare a/b params, labels; tone warn/good" },
    { id: "P2", cat: "X", text: "판정 '세 곳에 퍼진다' vs '매핑과 공리에 모인다' + 비용 노트", essential: true, why: "제목 결론", status: "kept", by: "label, code" },
  ] },
  { ...base("decide"), verdict: "V", custom: [], candidates: ["table-mark"], props: [
    { id: "P1", cat: "S", text: "5개 조건 × (테이블로 충분 / 온톨로지가 값한다) 표", essential: true, why: "v2 explain(또는 summary). 결정 기준", status: "approx", diff: "cells로 그려 표 머리·열 너비 대신 균등 칸을 쓴다" },
    { id: "P2", cat: "X", text: "중간안(R2RML 가상 그래프) 문단", essential: false, why: "보조", status: "lost", diff: "그림에 넣지 않았다(장면 say 몫)" },
  ] },
  { ...base("tree"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "G", text: "이번 수업 3단(뿌리) → 다음 개념 6개(각 2개) 트리", essential: true, why: "v2 explain(이어서 배울 것)", status: "kept", by: "graph layout tree direction right; edge" },
    { id: "P2", cat: "X", text: "열 머리 '이번 수업'/'다음에 배울 것'", essential: false, why: "열 구분", status: "ambiguous", by: "node group", diff: "group이 라벨이 붙은 열로 그려지는지 d.ts가 말하지 않는다" },
  ] },
  { ...base("overview"), verdict: "V", custom: [], candidates: [], props: [
    { id: "P1", cat: "G", text: "5단 계단(표→트리플→클래스·추론→다중 출처→결정), 단마다 핵심 문장 번호", essential: true, why: "v2 summary figure", status: "kept", by: "rect, label, path" },
    { id: "P2", cat: "E", text: "아는 단(표)만 muted, 나머지 accent; 계단 윤곽선", essential: true, why: "아는 단에서 올라감", status: "kept", by: "tone muted/focus; path weight bold" },
  ] },
];
