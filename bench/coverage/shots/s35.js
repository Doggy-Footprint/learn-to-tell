// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, rect, label, split } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, 200 - y];
  const SLOT = 2.4, PERIOD = SLOT * 4;
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  /** api.github.com request: ports 53/443, TLS 1.3 ClientHello SNI, HTTP/1.1 request line (RFC 1035, RFC 8446) */
  const WEB = [
    { name: "Ethernet II", f: ["a4:83:e7:1c:02:9e → 00:1a:2b:3c:4d:5e"] },
    { name: "IPv4", f: ["10.0.0.5 → 140.82.112.6", "TTL 64"] },
    { name: "TCP", f: ["51734 → 443  [SYN] Seq=0", "Win=64240 MSS=1460"] },
    { name: "TLS 1.3", f: ["Handshake: ClientHello", "SNI = api.github.com"] },
    { name: "HTTP/1.1", f: ["GET /repos/octo/app HTTP/1.1", "Host: api.github.com"] }];
  const DNS = [
    { name: "Ethernet II", f: ["a4:83:e7:1c:02:9e → 00:1a:2b:3c:4d:5e"] },
    { name: "IPv4", f: ["10.0.0.5 → 1.1.1.1", "TTL 64"] },
    { name: "UDP", f: ["60211 → 53", "Len=40"] },
    { name: "DNS", f: ["Standard query A", "api.github.com"] }];
  const SHOTS = /** @type {[typeof WEB, number, string][]} */ ([[DNS, 3, "No. 1  10.0.0.5 → 1.1.1.1  DNS  Standard query A api.github.com"],
    [WEB, 2, "No. 3  10.0.0.5 → 140.82.112.6  TCP  51734 → 443 [SYN]"],
    [WEB, 3, "No. 6  10.0.0.5 → 140.82.112.6  TLSv1.3  Client Hello"],
    [WEB, 4, "No. 9  10.0.0.5 → 140.82.112.6  HTTP  GET /repos/octo/app"]]);
  /** @param {number} t */
  const state = (t) => {
    const u = ((t % PERIOD) + PERIOD) % PERIOD, k = Math.floor(u / SLOT), l = u - k * SLOT;
    const z = l < 0.3 ? 0 : l < 0.9 ? ease((l - 0.3) / 0.6) : l < 1.9 ? 1 : 1 - ease(Math.min(1, (l - 1.9) / 0.5));
    return { k, z };
  };
  const box = (/** @type {number} */ i) => ({ x: 6 + i * 12, y: 22 + i * 34, w: 308 - i * 24, h: 172 - i * 34 });
  const TERMS = [["DNS", "① 이름 묻기"], ["TCP", "② 연결 열기"], ["TLS", "③ 암호 걸기"], ["HTTP", "④ 요청 보내기"]];
  return {
    figures: {
      packet: figure(
        cartesian({
          x: [0, 320, "px"], y: [0, 200, "px"], aspect: "equal", loop: { ms: PERIOD * 1000, span: [0, PERIOD] },
          camera: (m, t) => {
            const { k, z } = state(t), b = box(SHOTS[k][1]), to = [b.x - 3, b.y - 3, 140, 87.5], v = [0, 0, 320, 200].map((a, j) => a + (to[j] - a) * z);
            return { x: [v[0], v[0] + v[2]], y: [200 - v[1] - v[3], 200 - v[1]] };
          },
        }),
        (m, t) => {
          const { k } = state(t), [stack, focus, txt] = SHOTS[k];
          return [
            label(pt(6, 12), txt, { id: "capture-line", anchor: "w", tone: "focus", size: "s" }),
            stack.map((L, i) => {
              const b = box(i), on = i === focus;
              return [
                rect(pt(b.x, b.y + b.h), pt(b.x + b.w, b.y), { id: `layer-${i}`, fill: "soft", tone: on ? "focus" : "muted" }),
                label(pt(b.x + 6, b.y + 13), L.name, { id: `layer-name-${i}`, anchor: "w", tone: on ? "focus" : undefined, weight: "bold" }),
                L.f.map((s, j) => label(pt(b.x + 6, b.y + 21 + j * 7), s, { id: `field-${i}-${j}`, anchor: "w", size: "s" })),
              ];
            }),
          ];
        },
      ),
      terms: figure(
        cartesian({ x: [0, 100, ""], y: [0, 4, ""], loop: { ms: PERIOD * 1000, span: [0, PERIOD] } }),
        (m, t) => {
          const { k } = state(t);
          return TERMS.map(([en, word], i) => label([4, 3.5 - i], `${word} · ${en}`, { id: `term-${en}`, anchor: "w", tone: i === k ? "focus" : "muted", weight: i === k ? "bold" : "normal" }));
        },
      ),
      s35: split(["packet", "terms"]),
    },
    scenes: [{ type: "explain", title: "요청 하나는 네 번의 순서로 열리고, 뒤 층은 앞 층 안에 실린다", say: "캡처한 패킷을 차례로 확대한다. 바깥 상자일수록 먼저 열리고, 안쪽 상자는 바깥 상자의 내용물이다.", figure: "s35", focus: ["capture-line"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s35", src: "s35-packet-layers.html", corpus: "shot", domain: "네트워크 · DNS·TCP·TLS·HTTP 용어, 패킷 캡처 확대",
  props: [
    { id: "b1", cat: "T", text: "겹친 패킷 상자에서 DNS 층으로 확대되고 옆 목록의 DNS가 강조된다", essential: true, why: "beat 1", status: "kept", by: "cartesian camera over t; split 'Both share t'; term label tone focus by slot" },
    { id: "b2", cat: "T", text: "축소했다가 TCP SYN 층으로 다시 확대되고 목록 강조가 따라 옮겨진다", essential: true, why: "beat 2", status: "kept", by: "camera z goes 1→0→1 within each 2.4 s slot; packet swaps from DNS to WEB stack by t" },
    { id: "b3", cat: "T", text: "TLS ClientHello 상자로 확대되어 그 자리가 크게 보인다", essential: true, why: "beat 3", status: "kept", by: "camera window to box of layer 3" },
    { id: "b4", cat: "T", text: "가장 안쪽 HTTP GET으로 확대된 뒤 전체로 축소되며 처음으로 돌아간다", essential: true, why: "beat 4", status: "kept", by: "Loop ms 9600 span [0, 9.6] repeats; camera returns to full" },
    { id: "g1", cat: "G", text: "안쪽 층 상자가 바깥 층 상자 안에 들어 있다(캡슐화)", essential: true, why: "결론 '뒤 층은 앞 층 안에 실린다'", status: "kept", by: "rect in data coordinates, nested boxes; later marks paint on top" },
    { id: "p1", cat: "S", text: "용어를 카드로 나누지 않고 용어가 함께 사는 그림 하나를 확대·축소해 각 용어의 자리를 가리킨다", essential: true, why: "principle", status: "approx", diff: "원본의 용어 카드(평이한 설명·예)는 장면 부품이라 여기선 split의 글자 목록으로만 대신하고 설명 문장은 잃는다" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
