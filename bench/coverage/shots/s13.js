// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, label, line } = api;
  const STEPS = [{ l: "장바구니", v: 100 }, { l: "배송 정보", v: 84 }, { l: "결제 수단 선택", v: 72 }, { l: "카드 인증(3DS)", v: 51 }, { l: "주문 완료", v: 47 }];
  const DROP = 3;
  const REASONS = [{ l: "인증 창에서 닫음", v: 10 }, { l: "카드 거절", v: 6 }, { l: "인증 창 로딩 지연", v: 5 }];
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} u @param {number} a @param {number} b */
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  /** @param {number} a @param {number} b @param {number} k */
  const lerp = (a, b, k) => a + (b - a) * k;
  const funnel = model({}, () => ({ steps: STEPS, reasons: REASONS, lost: STEPS[DROP - 1].v - STEPS[DROP].v }), { illustrative: true });
  // x: 잔존율 % (0–100) for the funnel; the detail panel occupies x 130–270 in the same frame. y: row index downward.
  const rowY = (/** @type {number} */ i) => 9 - i * 2;
  const PANEL = { x0: 130, x1: 270, y0: 0, y1: 10.5 };
  return {
    models: { funnel },
    figures: {
      zoom: figure(
        cartesian({ x: [-40, 280, "%"], y: [-0.5, 10.8, ""], loop: { ms: 9000, span: [0, 1] } }),
        (m, u) => {
          const show = seg(u, 0.22, 0.28) * (1 - seg(u, 0.93, 0.99));
          const z = seg(u, 0.28, 0.42) * (1 - seg(u, 0.84, 0.95));
          const lens = { x0: STEPS[DROP].v - 2, x1: STEPS[DROP - 1].v + 2, y0: rowY(DROP) - 0.8, y1: rowY(DROP) + 0.8 };
          const box = { x0: lerp(lens.x0, PANEL.x0, z), x1: lerp(lens.x1, PANEL.x1, z), y0: lerp(lens.y0, PANEL.y0, z), y1: lerp(lens.y1, PANEL.y1, z) };
          const inner = clamp((z - 0.6) / 0.4);
          return [
            label([0, 10.6], "장바구니에 들어온 100명 중 남은 비율", { anchor: "w", tone: "muted" }),
            STEPS.map((p, i) => {
              const k = seg(u, 0.02 + i * 0.03, 0.14 + i * 0.03);
              return [
                label([-2, rowY(i)], p.l, { anchor: "e" }),
                rect([0, rowY(i) - 0.6], [100, rowY(i) + 0.6], { tone: "muted", fill: "soft" }),
                rect([0, rowY(i) - 0.6], [p.v * k, rowY(i) + 0.6], { id: `bar-${i}`, tone: "series1", fill: "solid", label: `${Math.round(p.v * k)}%` }),
              ];
            }),
            show > 0 && rect([STEPS[DROP].v, rowY(DROP) - 0.6], [STEPS[DROP - 1].v, rowY(DROP) + 0.6], { id: "lost", tone: "bad", fill: "soft", opacity: show }),
            show > 0 && rect([lens.x0, lens.y0], [lens.x1, lens.y1], { id: "lens", tone: "focus", fill: "none", weight: "bold", opacity: show }),
            z > 0 && [
              rect([box.x0, box.y0], [box.x1, box.y1], { id: "panel", tone: "focus", fill: "none", weight: "bold", opacity: show }),
              line([[lens.x1, lens.y1], [box.x0, box.y1]], { id: "link-top", tone: "focus", dash: true, opacity: show }),
              line([[lens.x1, lens.y0], [box.x0, box.y0]], { id: "link-bottom", tone: "focus", dash: true, opacity: show }),
            ],
            inner > 0 && [
              label([138, 9.6], "카드 인증 단계에서 사라진 사람", { anchor: "w", tone: "muted", opacity: inner }),
              label([138, 8.6], `−${m.funnel.lost}명 · 퍼널 전체 손실 53명 중 가장 큰 칸`, { id: "lost-n", anchor: "w", tone: "bad", size: "l", opacity: inner }),
              REASONS.map((r, i) => {
                const k = seg(u, 0.44 + i * 0.06, 0.54 + i * 0.06) * (1 - seg(u, 0.84, 0.9));
                const y = 7 - i * 2.2;
                return [
                  label([138, y], r.l, { anchor: "w", opacity: inner }),
                  rect([138, y - 1.3], [138 + r.v * 10 * k, y - 0.5], { id: `reason-${i}`, tone: "bad", fill: "solid", label: `${r.v}명` }),
                ];
              }),
            ],
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "가장 크게 새는 칸을 확대해야 고칠 곳이 보인다", say: "결제 수단 선택 → 카드 인증에서 21명이 빠진다. 사유로 나누면 '인증 창에서 닫음'이 가장 크다.", figure: "zoom", focus: ["lens", "panel", "reason-0"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s13", src: "archive/v1:site/gallery/shots/s13-checkout-funnel-zoom.html", corpus: "shot", domain: "UX · 결제 퍼널 단계, 이탈 지점으로 확대",
  props: [
    { id: "b1", cat: "Q", text: "0–2s 단계 막대(잔존율 100·84·72·51·47%)가 위에서부터 차례로 자란다", essential: true, why: "beat", status: "kept", by: "rect 끝점이 데이터 단위(P 'data units'); draw가 t로 단계별 진행 계산" },
    { id: "b2", cat: "G", text: "2–4s 가장 큰 낙폭(72→51)에 렌즈가 뜨고 오른쪽 패널로 확대", essential: true, why: "beat", status: "kept", by: "draw가 t로 lens→panel 사각형 좌표를 보간(figure 'draw is sampled over the frame's time')" },
    { id: "b3", cat: "Q", text: "4–6s 패널 안 사유별 막대(10·6·5명)가 차례로 차오른다", essential: true, why: "beat", status: "approx", diff: "패널 안 막대가 퍼널과 같은 frame의 x 단위를 빌려 쓰므로 패널 자체 축(명)은 없고 값 label로 읽는다" },
    { id: "b4", cat: "T", text: "6–8s 연결선이 렌즈와 패널을 이은 채 멈춘다", essential: true, why: "beat", status: "kept", by: "line 두 개가 매 프레임 lens·panel 모서리를 잇는다" },
    { id: "p1", cat: "G", text: "확대 패널은 원본의 정확한 자리(렌즈)에서 커져 나오고 연결선이 계속 잇는다", essential: true, why: "principle", status: "kept", by: "panel rect 좌표를 lens 좌표에서 보간; inset은 같은 그림의 확대만 말하므로 쓰지 않음" },
  ],
  verdict: "V", custom: [], candidates: ["drilldown-inset"],
}];
