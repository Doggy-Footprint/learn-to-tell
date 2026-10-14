---
version: 3
run_id: 8f96def5ba48e754
status: complete
base_commit: fb20cc68e7d0987de5e676cd782558d190f43fcb
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 수업 페이지를 만드는 agent | 꺾인 화살표·경유점·변 지정을 페이지에서 직접 그리지 않고 `LTT.diagram` 옵션으로 쓴다 | 엣지 `via`·`from`/`to`·`shape`로 그린 경로가 `diagramLayout` 출력과 화면에 나타난다 |
| UI-2 | 같은 agent | 같은 두 노드 사이 여러 엣지가 겹치지 않는다 | 평행 엣지가 수직 방향으로 벌어져 있다 |
| UI-3 | 같은 agent | 영역 안의 영역(중첩)을 표현한다 | 자식 영역이 부모 안쪽, 부모 라벨 아래에 그려진다 |
| UI-4 | 같은 agent | 노드에 여러 줄 라벨을 쓴다 | `\n`이 줄바꿈이 되고 상자가 줄 수에 맞게 커진다 |
| UI-5 | 같은 agent | 패킷·흐름 애니메이션이 꺾인 경로를 따른다 | `send()` 패킷이 그려진 경로 위로 움직인다 |
| UI-6 | 사용자(kit 유지자) | 기존 gallery·수업 도식이 그대로 보인다 | 새 옵션을 쓰지 않은 spec의 좌표가 base_commit과 같다 |
| UI-7 | 다음 run(C 자동 배치) | 픽셀 좌표로 배치된 결과를 그대로 넣을 수 있다 | 노드 `x,y`, 엣지 `points`, 영역 `x,y,w,h` 픽셀 입력이 동작한다 |

# Scope
In scope: `diagramLayout(spec)`의 노드·엣지·영역 기하 계산 확장(경로, 평행 오프셋, 중첩 영역, 여러 줄 라벨, 픽셀 입력, 입력 오류), `diagram(svg, spec)`의 렌더링을 `<path>` 엣지·`<tspan>` 줄·깊이 순 영역·경로를 따르는 `send`로 변경, `edge(id)` 접근자 추가.
Out of scope: `send()`의 모션 감소 즉시 resolve 검증(기존 코드 경로를 바꾸지 않음), 자동 배치(elk, 다음 run), sketch 테마의 rough.js 손그림 선, `LTT.state`, 엣지-노드 충돌 회피, 라벨 충돌 회피, API.md·catalog 문서 갱신(마무리에서 main이 함), 기존 페이지 수정.

# Paths
Implementation: skills/learn-to-tell/kit/ltt-parts.js
Tests: tests/diagram.test.mjs
Test command: node --test tests/
Review evidence: R-1 differential — main이 base_commit의 `ltt-parts.js`와 현재 파일을 각각 vm에 올려 gallery의 모든 `LTT.diagram` spec(catalog.html diagram 데모, gpu/single-gpu-dataflow.html 두 spec)의 `diagramLayout` 출력 중 legacy 필드(width, height, nodes x/y/w/h/cx/cy, edges id/f/t/x1/y1/x2/y2, zones x/y/w/h)를 비교, 차이 0이어야 함. 산출물: spec-log Execution ledger에 비교 결과 기록. R-2 browser — main이 Chrome에서 catalog(`?audit`)와 gpu 페이지를 1440×900·390×844로 열어 (a) lint·audit 경고 0, 콘솔 에러 0, (b) catalog에 추가할 경로 데모(ortho·curve·via·평행·중첩 영역·여러 줄 노드 포함)에서 모든 노드 라벨(`text.l`, `text.s`) bbox가 해당 `rect.box` bbox 안에 있음(JS로 측정; flaw 배지 "!"는 의도적으로 모서리에 걸치므로 라벨이 아님), (c) `send()` 진행 중 패킷 중심이 해당 엣지 path에서 2px 이내(getPointAtLength 200점 샘플 최근접 거리, 패킷 3개 이상 측정), (d) 스크린샷 육안 확인, (e) SC7–SC12 항목을 측정 스크립트로 확인. 측정 스크립트는 `agent-docs/spec-logs/8f96def5ba48e754-r2-review.js`(archive 때 함께 보관)로 저장하고 Chrome 페이지 문맥에서 실행한다. 산출물: Execution ledger 기록(패킷 수·엣지 모양·샘플 수, 페이지별 콘솔 에러·lint·audit 수 포함).
Fuzzing: none — 무작위 입력 속성 검사는 VO-12로 Test command 안에서 고정 seed로 실행한다.
Mutation tool: none — 저장소에 JS mutation 도구(Stryker 등)가 설치돼 있지 않고 kit은 vm으로 읽는 브라우저 스크립트라 도구 연동 비용이 크다. hand mutation 8–10개로 대신한다.

# Signatures
LTT.diagramLayout(spec) → { width, height, nodes: { [id]: { x, y, w, h, cx, cy, lines, sub } }, edges: [{ id, f, t, shape, x1, y1, x2, y2, pts, d, lx, ly }], zones: [{ id, parent, depth, x, y, w, h }] }
LTT.diagram(svgEl, spec) → { svg, layout, node(id), edge(id), highlight(ids), flow(ids), send(from, to, o) → Promise, clear(), player(container, steps, opts) }
spec: { cols, rows, cell: [w, h] = [210, 120], node: [w, h] = [164, 60], pad = 20, parallel = 14, width, height, maxWidth, label, nodes, edges, zones }
node: { id, c, r | x, y, l, s, k, icon, flaw, w, h }
edge: { f, t, id, l, lo: [dx, dy] = [0, -8], k, dash, both, arrow, via: [[c, r], ...], from, to: "top"|"right"|"bottom"|"left", shape: "straight"|"ortho"|"curve" = "straight", radius = 10, points: [[x, y], ...] }
zone: { id, parent, c0, r0, c1, r1 | x, y, w, h, l, k }

# Functional Requirements
정의(모든 요구사항 공통):
- 격자점 G(c, r) = (pad + (c + 0.5)·cell[0], pad + (r + 0.5)·cell[1]). 픽셀점 P(x, y) = (pad + x, pad + y).
- 노드 상자: 중심 (cx, cy), 크기 (w, h), x = cx − w/2, y = cy − h/2.
- legacy clip(b, dx, dy, g): t = min(dx ≠ 0 ? (b.w/2 + g)/|dx| : ∞, dy ≠ 0 ? (b.h/2 + g)/|dy| : ∞), 결과 (b.cx + dx·t, b.cy + dy·t). dx = dy = 0이면 (dx, dy) = (1, 0)으로 본다.
- 시작 간격 4, 끝 간격 8. 변 점 side(b, s, g): top (cx, y − g), bottom (cx, y + h + g), left (x − g, cy), right (x + w + g, cy). left·right의 방향은 H, top·bottom은 V. 바깥 법선: top (0, −1), bottom (0, 1), left (−1, 0), right (1, 0).
- 숫자 비교 허용 오차는 별도 언급이 없으면 1e-6. `d`의 좌표는 소수 둘째 자리까지 반올림해 쓸 수 있으므로 `d` 비교 허용 오차는 0.01.

| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 노드 위치: `x`와 `y`가 둘 다 숫자면 (cx, cy) = P(x, y), 아니면 (cx, cy) = G(c, r). w = n.w ?? node[0]. 출력 노드에 `lines` = String(n.l || n.id)를 `\n`으로 나눈 배열(빈 문자열 l은 legacy처럼 id), `sub` = n.s가 truthy면 String(n.s)를 `\n`으로 나눈 배열, 아니면 []. | must | handoff B-4, UI-4, UI-7 |
| FR-2 | 노드 높이: n.h가 있으면 n.h. 없고 lines 또는 sub가 2줄 이상이면 max(node[1], 24 + 18·lines.length + 16·sub.length). 그 외 node[1]. | must | UI-4, UI-6 |
| FR-3 | 크기: cols = spec.cols ?? (격자 노드가 있으면 1 + 격자 노드 c 최댓값, 없으면 0; 0이어도 격자 항 2·pad는 max에 남는다). rows도 r로 같은 규칙. width = spec.width ?? max(2·pad + cols·cell[0], 픽셀 노드의 cx + w/2 + pad 최댓값, 픽셀 영역의 (pad + x) + w + pad 최댓값(부모로 잘리기 전 상자 기준)). height도 rows·cell[1], cy + h/2, (pad + y) + h로 같은 규칙. 해당 항목이 없으면 그 항은 빠진다. | must | UI-6, UI-7 |
| FR-4 | straight, 경유점·변·points 없음: legacy 계산. p = clip(a, dx, dy, 4), q = clip(b, −dx, −dy, 8), (dx, dy) = 평행 오프셋을 적용한 b 중심 − a 중심(FR-8). pts = [p, q], d = "M p L q", (x1, y1) = p, (x2, y2) = q. | must | UI-6 |
| FR-5 | straight + via: 경유점 V1…Vk = G(c, r). from이 없으면 p = clip(a, V1 − a 중심, 4), 있으면 p = side(a, from, 4). to가 없으면 q = clip(b, Vk − b 중심, 8), 있으면 q = side(b, to, 8). via 없이 from/to만 있으면 clip 방향 기준점은 상대 노드 중심. pts = [p, V1…Vk, q], d는 pts를 잇는 M/L. | must | handoff B-1, UI-1 |
| FR-6 | ortho: 시작 변 = from ?? 추론, 끝 변 = to ?? 추론. 추론: 기준점 T(시작은 V1 또는 b 중심, 끝은 Vk 또는 a 중심)와 노드 중심의 차 (dx, dy)에 대해 \|dx\| ≥ \|dy\|이면 dx ≥ 0 ? right : left, 아니면 dy > 0 ? bottom : top. 앵커 = [side(a, 시작 변, 4), V1…Vk, side(b, 끝 변, 8)]. 경유점의 방향은 free. 이어지는 앵커 p→q가 x 또는 y가 0.5px 이내로 같으면 꺾지 않는다. 아니면 꺾는 점을 넣는다: pH·qH → (m, p.y), (m, q.y), m = (p.x + q.x)/2. pV·qV → (p.x, m), (q.x, m), m = (p.y + q.y)/2. pH·(qV 또는 free) → (q.x, p.y). pV·(qH 또는 free) → (p.x, q.y). free·qH → (p.x, q.y). free·qV → (q.x, p.y). free·free → (q.x, p.y). pts는 앵커와 꺾는 점을 순서대로, 연속 중복점과 일직선 위 중간점을 제거한 목록이며 각 점은 [x, y] 배열. 0.5px 이내로 정렬돼 꺾지 않은 선분은 좌표를 맞추지 않고 그대로 둔다. 따라서 인접한 pts 선분은 모두 수평 또는 수직이고, 허용 오차는 0.5px. | must | handoff B-1, UI-1 |
| FR-7 | ortho 모서리: 반경 r = e.radius ?? 10. pts의 각 내부 꼭짓점 C에서 r_C = min(r, 앞 선분 길이/2, 뒤 선분 길이/2). r_C > 0이면 d는 C 앞 r_C 지점까지 L, 그 다음 "Q C (C 뒤 r_C 지점)". r = 0이면 Q 없이 L만. d는 pts[0]에서 M으로 시작해 마지막 pts에서 끝난다. | must | handoff B-1 |
| FR-8 | 평행 오프셋: via와 points가 모두 없는 엣지를 순서 없는 노드 쌍 {f, t}로 묶는다. 묶음 크기 n, 묶음 안 spec 순서 i(0부터), o_i = (i − (n − 1)/2)·(spec.parallel ?? 14). 묶음 첫 엣지의 f 중심 → t 중심 단위벡터 u(길이 0이면 (1, 0)), 법선 ν = (−u.y, u.x). straight는 두 노드 상자를 o_i·ν만큼 옮긴 뒤 FR-4/FR-5를 계산한다. ortho·curve는 변 점에 o_i·ν의 변 접선 성분만 더한다(left·right는 y 성분, top·bottom은 x 성분). n = 1이면 오프셋 0. | must | handoff B-2, UI-2, UI-6 |
| FR-9 | curve: 앵커는 FR-6과 같다(꺾는 점 없음). pts = 앵커. d = "M A0" 다음 이어지는 앵커 p→q마다 "C c1 c2 q", t = 0.5·max(\|q.x − p.x\|, \|q.y − p.y\|), c1 = p + dir_out(p)·t, c2 = q + dir_back(q)·t. dir_out: 첫 앵커는 시작 변 바깥 법선, 경유점은 (q − p) 단위벡터. dir_back: 마지막 앵커는 끝 변 바깥 법선, 경유점은 (p − q) 단위벡터. points 입력(FR-10)은 변이 없으므로 모든 앵커에 경유점 규칙을 쓴다. | must | handoff B-1 |
| FR-10 | points: 2개 이상의 [x, y]가 있으면 앵커 = P(x, y) 목록 그대로(변·via·clip·평행 오프셋 무시). shape 규칙(straight는 그대로, ortho는 FR-6의 free·free 꺾기와 FR-7 모서리, curve는 FR-9의 경유점 규칙)을 앵커에 적용한다. | must | UI-7 |
| FR-11 | 라벨 기준점 (lx, ly): straight·ortho는 pts 꺾은선 전체 길이의 절반 지점, curve는 d가 그리는 곡선 길이의 절반 지점(허용 오차 1.5px). FR-4 경우에는 ((x1 + x2)/2, (y1 + y2)/2)와 같다. 화면 라벨 위치 = (lx + lo[0], ly + lo[1]). | must | handoff B-1, UI-6 |
| FR-12 | 엣지 출력: id = e.id ?? f + ">" + t, shape, pts, d, (x1, y1) = pts[0], (x2, y2) = pts 마지막. | must | UI-6 |
| FR-13 | 영역: 격자 영역은 inset = 6 + 10·depth로 x = pad + c0·cell[0] + inset, y = pad + r0·cell[1] + inset, w = (c1 − c0 + 1)·cell[0] − 2·inset, h = (r1 − r0 + 1)·cell[1] − 2·inset. 픽셀 영역은 (pad + x, pad + y, w, h). depth = parent 없으면 0, 있으면 부모 depth + 1. parent는 다른 영역의 출력 id(기본 id "z" + index 포함)를 가리키고 입력 순서와 무관하다. P는 부모의 최종(잘린) 출력 상자. 자식 상자는 자기 상자와 부모 안쪽 상자 [P.x + 10, P.y + (P.l ? 26 : 10), P.x + P.w − 10, P.y + P.h − 10]의 교집합. 출력은 입력 순서, id = z.id ?? "z" + index, parent = z.parent ?? null. | must | handoff B-3, UI-3, UI-6 |
| FR-14 | 렌더링: 영역은 depth 오름차순(같으면 입력 순)으로 그린다. 엣지는 class `e`(기존 k·dash 클래스 유지)를 가진 `<path d>`이고 marker·both·arrow 규칙은 기존과 같다. 노드 라벨은 줄마다 `<tspan>`이고 모든 글자는 `textContent`로 넣는다(HTML 해석 없음). 한 줄 l·s의 글자 위치는 기존과 같다(l: s 있으면 h/2 − 3, 없으면 h/2 + 5; s: h/2 + 14). 여러 줄이면 글자 묶음이 상자 안 세로 가운데에 놓인다. | must | UI-4, UI-6 |
| FR-15 | `send(from, to)`: 패킷이 해당 엣지 경로 위를 따라 움직인다. 엣지가 to→from 방향으로만 있으면 경로를 거꾸로 따른다. 엣지가 없으면 기존처럼 두 노드 중심 사이 직선. 모션 감소 설정이면 즉시 resolve. `edge(id)`는 엣지 path의 d3 selection, highlight·flow의 id 규칙은 기존과 같다. | must | handoff B-5, UI-5 |

# Errors
- 엣지 f 또는 t가 없는 노드를 가리킴 — `Error` throw, 메시지에 엣지 id 또는 index 포함 — 출력 없음(기존 동작).
- f === t(자기 루프) — `Error` throw — 출력 없음.
- 노드에 x·y도 c·r도 없음 — `Error` throw, 메시지에 노드 id — 출력 없음.
- from/to가 top/right/bottom/left 밖의 값, shape가 straight/ortho/curve 밖의 값 — `Error` throw, 메시지에 엣지 id — 출력 없음.
- points가 배열인데 길이 < 2 — `Error` throw — 출력 없음.
- 영역 parent가 없는 id, parent 순환, 영역 id 중복 — `Error` throw — 출력 없음.
- 영역에 격자 필드(c0, r0, c1, r1 모두)도 픽셀 필드(x, y, w, h 모두)도 없음 — `Error` throw, 메시지에 영역 id — 출력 없음.
- 자식 영역 교집합의 w ≤ 0 또는 h ≤ 0 — `Error` throw, 메시지에 영역 id — 출력 없음.
- 정상 입력에서 출력 숫자 필드(x1…y2, pts, lx, ly, 노드·영역 상자)에 NaN·∞가 없어야 한다(실패 신호: 비유한 수 존재).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 2노드 가로 배치, 옵션 없음(기존 테스트 spec) | x1 = 164, x2 = 232, y1 = 50, d = "M 164 50 L 232 50"(허용 0.01), lx = 198 |
| C-2 | normal | catalog·gpu 페이지의 기존 spec 3개 | legacy 필드가 FR 정의(legacy 공식)와 같다 |
| C-3 | normal | ortho, a(0,0)·b(2,1), 변 추론 | 시작 right, 끝 left, pts 4개 Z자, 선분 모두 축 정렬 |
| C-4 | normal | ortho, from: bottom, to: top, 세로 어긋남 | pV·qV 규칙: 가운데 y에서 꺾는 4점 |
| C-5 | normal | ortho, from: right, to: top | pH·qV: 꺾는 점 (q.x, p.y) 하나 |
| C-6 | normal | straight, via 2개 | pts = [clip, V1, V2, clip], d가 M L L L |
| C-7 | normal | ortho, via 1개(free) | 앞뒤 선분 규칙에 맞는 꺾는 점, 축 정렬 |
| C-8 | normal | curve, from·to 지정 | d가 M C, 제어점이 바깥 법선 방향 t 거리 |
| C-9 | normal | 같은 쌍 엣지 3개(a→b, b→a, a→b) | 오프셋 −14, 0, 14가 ν 방향 |
| C-10 | normal | 중첩 영역 3단(루트, 자식, 손자), 부모 라벨 있음 | depth 0/1/2, inset 6/16/26, 자식 y ≥ 부모 y + 26 |
| C-11 | normal | 노드 l "가\n나\n다", s 없음, h 없음, node[1] = 60 | h = max(60, 24 + 54) = 78, lines 3개 |
| C-12 | normal | 픽셀 노드·points 엣지·픽셀 영역 | cx = pad + x, 앵커 = P(points), width가 픽셀 항목을 포함 |
| C-13 | boundary | ortho 두 앵커 y 차이 0.4px / 0.6px | 0.4는 꺾지 않음, 0.6은 꺾음 |
| C-14 | boundary | ortho radius가 짧은 선분 절반보다 큼, radius 0 | r_C가 선분 절반으로 줄어듦 / Q 없음 |
| C-15 | boundary | \|dx\| = \|dy\| 대각 배치 ortho 추론 | 가로 변(right/left) 선택 |
| C-16 | boundary | 평행 묶음 n = 1, n = 2 | 오프셋 0 / ±7 |
| C-17 | boundary | lines 1줄 + sub 1줄, node[1] = 54 | 자동 증가 없음, h = 54 |
| C-18 | boundary | 자식 영역이 부모 밖으로 나감 | 부모 안쪽 상자로 잘림 |
| C-19 | error | Errors 절의 각 조건 | Error throw |
| C-20 | edge | 서로 다른 두 노드 중심이 같음(straight) | NaN 없음, 방향 (1, 0) |
| C-21 | edge | via·points가 있는 엣지와 없는 엣지가 같은 쌍 | via·points 엣지는 묶음에서 빠짐, 남은 엣지만 오프셋 계산 |
| C-22 | edge | 무작위 spec(seed 고정) | NaN·∞ 없음, ortho 선분 축 정렬, d 시작·끝 = pts 처음·끝 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 경로·오프셋·중첩·여러 줄의 기하 정확성이 핵심 |
| Performance efficiency | yes | 큰 도식(C의 20노드 이상)에서 레이아웃 계산이 페이지 표시를 늦추면 안 됨 |
| Compatibility | yes | 기존 gallery·사용자 수업 페이지가 같은 모습이어야 함 |
| Interaction capability | yes | 여러 줄 글자가 상자 밖으로 나가면 읽기 어려움 |
| Reliability | yes | 비정상 입력에서 NaN 도식 대신 명확한 오류 |
| Security | no | 입력은 같은 페이지의 작성자 spec. 단 글자는 textContent로만 넣는다(FR-14) |
| Maintainability | yes | 기하 계산이 DOM 없이 vm에서 시험 가능해야 함 |
| Flexibility | no | 픽셀 입력(C 대비)은 기능 요구(FR-1, FR-10, FR-13)로 다룸 |
| Safety | no | 물리적·인명 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | node vm에서 노드 60개·엣지 120개(straight·ortho·curve 각 1/3, via 섞음)·영역 6개 spec | diagramLayout 5회 실행 시간 중앙값, ms | ≤ 20 ms, 낮을수록 좋음 | automated VO-13 | 기본값 D-5 |
| QR-2 | Compatibility / co-existence | gallery 기존 spec 3개 | legacy 필드 차이 개수(base_commit 대비) | 0 | automated VO-1, review R-1 | UI-6 |
| QR-3 | Interaction capability / user engagement(가독성) | catalog 경로 데모, 1440×900·390×844 | 상자 밖으로 나간 노드 라벨(`text.l`, `text.s`) 수, audit·lint 경고 수 | 0, 0 | review R-2 | UI-4 |
| QR-4 | Reliability / fault tolerance | 무작위 spec 500개(seed 20261015) | 비유한 수가 있는 출력 수 | 0 | automated VO-12 | Errors 절 |
| QR-5 | Maintainability / testability | `diagramLayout`이 document 없는 vm(d3, ltt.js, ltt-parts.js만 로드)에서 동작 | vm 실행 성공 여부 | 성공 | automated(모든 VO가 vm에서 실행) | 기존 테스트 관례 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-2, FR-3, FR-4, FR-11, FR-12, FR-13, C-1, C-2, QR-2 | 옵션 없는 spec, diagramLayout 출력 | unit, gallery spec 3개 전부 + C-1 | equivalence partitioning | EP1 C-1 spec, EP2 catalog diagram spec, EP3 gpu 단일 spec, EP4 gpu batch spec | 100% | legacy 공식으로 독립 계산한 width/height/노드/엣지/영역 값과 같다, d = "M p L q" | tests/diagram.test.mjs |
| VO-2 | FR-6, C-3, C-4, C-5, C-7, C-15 | ortho 꺾기 규칙 표 | unit, 규칙 표의 각 행 1개 | decision table | DT1 pH·qH, DT2 pV·qV, DT3 pH·qV, DT4 pH·free, DT5 pV·qH, DT6 pV·free, DT7 free·qH, DT8 free·qV, DT9 free·free, DT10 정렬(꺾지 않음) | 100% | pts가 규칙대로, 모든 선분 축 정렬 | tests/diagram.test.mjs |
| VO-3 | FR-6, C-3, C-15 | 변 추론 | unit | equivalence partitioning | SI1 right, SI2 left, SI3 bottom, SI4 top, SI5 from 지정이 추론보다 우선, SI6 to 지정 우선, SI7 ortho via 있고 from/to 없음: 기준점이 V1·Vk(상대 노드 중심과 다른 변이 나오는 배치) | 100% | 시작·끝 앵커가 side() 값 | tests/diagram.test.mjs |
| VO-4 | FR-6, FR-7, C-13, C-14, C-16, C-17 | 경계 값 | unit | boundary value analysis (2-value) | BV1 정렬 차 0.4/0.6px, BV2 radius = 선분/2 경계 위·아래, BV3 radius 0, BV4 평행 n = 1/2, BV5 lines 1/2줄로 자동 높이 시작, BV6 \|dx\| = \|dy\| | 100% | Cases 기대값 | tests/diagram.test.mjs |
| VO-5 | FR-7 | ortho d 문자열 | unit | equivalence partitioning | RD1 내부 꼭짓점 수 = Q 개수, RD2 Q 제어점 = 꼭짓점, RD3 d 시작 M pts[0]·끝 = 마지막 pts | 100% | d를 파싱해 비교(쉼표·공백 둘 다 허용, 0.01) | tests/diagram.test.mjs |
| VO-6 | FR-5, C-6 | straight via·from/to | unit | equivalence partitioning | SV1 via만, SV2 from만, SV3 to만, SV4 via + from + to, SV5 via 2개(V1·V2의 clip 방향이 다름, C-6) | 100% | pts·d가 FR-5 | tests/diagram.test.mjs |
| VO-7 | FR-9, C-8 | curve | unit | equivalence partitioning | CV1 변 지정 2앵커, CV2 via 1개, CV3 변 추론, CV4 points + curve(모든 앵커 경유점 규칙), CV5 curve via 있고 from/to 없음: 변 추론 기준점이 V1·Vk | 100% | C 명령의 c1·c2·끝점이 FR-9 | tests/diagram.test.mjs |
| VO-8 | FR-8, C-9, C-16, C-21 | 평행 오프셋 | unit | equivalence partitioning | PO1 n = 3 양방향 섞음, PO2 n = 2, PO3 via 엣지 제외, PO4 ortho 변 접선 성분, PO5 역방향 엣지가 0이 아닌 오프셋(n = 2, a→b·b→a): 첫 엣지 ν 기준 반대편, PO6 오프셋 엣지의 lx·ly가 옮겨진 꺾은선 절반 | 100% | 끝점 이동량이 o_i·ν(또는 접선 성분) | tests/diagram.test.mjs |
| VO-9 | FR-13, C-10, C-18 | 중첩 영역 | unit | equivalence partitioning | ZN1 루트 legacy, ZN2 자식 inset, ZN3 손자, ZN4 부모 라벨 아래로 밀림, ZN5 라벨 없는 부모, ZN6 잘림, ZN7 픽셀 영역, ZN8 id 기본값, ZN9 자식이 부모보다 먼저 나오고 기본 id로 부모를 가리킴, ZN10 손자가 잘린 부모의 최종 상자로 잘림(잘리기 전 상자와 결과가 다름), ZN11 왼쪽 경계(P.x + 10)로 잘림 | 100% | 상자·depth·id·parent가 FR-13 | tests/diagram.test.mjs |
| VO-10 | FR-1, FR-2, FR-3, FR-10, FR-11, C-11, C-12 | 여러 줄·픽셀 입력·라벨 기준점 | unit | equivalence partitioning | ML1 l 여러 줄, ML2 s 여러 줄, ML3 h 지정 우선, ML4 빈 문자열 l은 id, s 빈 문자열은 sub [], PX1 픽셀 노드, PX2 points straight, PX3 points ortho, PX4 width/height 확장, PX5 spec.width 우선, PX6 격자 노드 없음: 2·pad 항이 최대(빈 nodes, 음수 x 픽셀 노드), LB1 ortho 라벨 = 꺾은선 절반, LB2 curve 라벨(1.5px) | 100% | FR 값과 같다 | tests/diagram.test.mjs |
| VO-11 | Errors, C-19 | 오류 입력 | unit | equivalence partitioning | ER1 없는 노드, ER2 자기 루프, ER3 위치 없음, ER4 잘못된 side, ER5 잘못된 shape, ER6 points 1개, ER7 없는 parent, ER8 parent 순환, ER9 영역 id 중복, ER10 빈 교집합(가로로 떨어짐), ER10b 세로로 떨어짐, ER10c 맞닿음(w = 0 또는 h = 0), ER11 영역 위치 없음 | 100% | 각각 throw | tests/diagram.test.mjs |
| VO-12 | Errors(비유한 수), C-20, C-22, QR-4, FR-13, FR-11 | 무작위 spec | unit, seed 20261015, 500개 | random testing | RN1 비유한 수 없음, RN2 ortho 선분 축 정렬, RN3 d 시작·끝 = pts 처음·끝, RN4 (x1, y1)·(x2, y2) = pts 처음·끝, RN5 C-20 같은 중심, RN6 자식 영역이 부모 최종 상자의 안쪽 상자 안, RN7 straight·ortho의 (lx, ly)가 pts 꺾은선 위(1e-6) | none — random(속성 7개 모두 검사) | 위반 0 | tests/diagram.test.mjs |
| VO-13 | QR-1 | 큰 spec | unit | equivalence partitioning | PF1 QR-1 spec | 100% | 중앙값 ≤ 20 ms | tests/diagram.test.mjs |
| VO-14 | FR-14, FR-15, QR-3 | 브라우저 렌더링·send | review | scenario testing | SC1 path 엣지·marker(arrow 기본 marker-end, both는 marker-start도, arrow: false는 marker-end 없음), SC2 tspan 줄·라벨이 상자 안, SC3 영역 depth 순서, SC4 send가 경로를 따름(패킷 3개 이상, ortho·curve·평행 엣지 포함, path 200점 샘플 최근접 ≤ 2px), SC5 역방향 send, SC6 catalog·gpu 콘솔 에러 0과 gallery audit·lint 0, SC7 라벨 `<b>x</b>`가 요소가 아닌 글자로 들어감, SC8 한 줄 l·s의 y가 h/2 + 5 / h/2 − 3, h/2 + 14, SC9 여러 줄 글자 묶음의 위·아래 여백 차 ≤ 3px, SC10 k·dash 클래스가 path에 유지, SC11 엣지 없는 send가 두 노드 중심 사이 직선, SC12 edge(id)가 path selection이고 highlight가 목록 밖 노드·엣지를 dim, flow가 목록 엣지에 run | 100% | R-2 절차 결과 | R-2 |
| VO-15 | QR-2 | base_commit 대비 differential | review | equivalence partitioning | DF1 catalog, DF2 gpu 단일, DF3 gpu batch | 100% | 차이 0 | R-1 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| D-1 | 엣지 옵션 이름: via(격자 좌표), from/to(top·right·bottom·left), shape(straight·ortho·curve, 기본 straight), radius(기본 10), points(픽셀), spec.parallel(기본 14) | handoff B-1이 꺾인 화살표·경유점을 요구, 이름은 미정. 수업 페이지가 쓰는 공개 인터페이스 | brief v1 — approved |
| D-2 | 기존 출력 필드(x1…y2, 노드·영역 상자)는 그대로, pts·d·lx·ly·lines·sub·depth 추가 | 기존 페이지 호환 | brief v1 — approved |
| D-3 | 엣지 DOM을 `<line>`에서 `<path>`로 바꾼다 | 저장소 안에서 `line` 요소를 고르는 코드 없음(grep). class `e`는 유지 | brief v1 — approved |
| D-4 | 중첩 inset 6 + 10·depth, 부모 라벨 자리 26px, 자식은 부모 안쪽으로 잘림 | 영역 라벨 글자 크기 11.5px 기준 | brief v1 — approved |
| D-5 | 여러 줄 자동 높이 24 + 18·줄 + 16·부제 줄, 한 줄일 때는 자동 증가 없음 | 한 줄 l + 한 줄 s도 늘리면 gpu 페이지(node 54) 상자가 커져 UI-6 위반 | brief v1 — approved |
| D-6 | 자기 루프는 오류(그리지 않음) | 지금은 NaN 좌표가 나옴. 자기 루프 모양은 이번 범위 밖 | brief v1 — approved |
| D-7 | 성능 기준 20 ms(60노드·120엣지) | 측정 전 추정, 낮은 위험 | brief v1 — approved |
| D-8 | mutation 도구 없이 hand mutation 8–10개 | Stryker 미설치 | brief v1 — approved |
| D-9 | 기하 계산은 단위 테스트, DOM 렌더링·send는 Chrome 검토 절차(R-2) | 저장소에 jsdom 없음 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-11, C-12 | VO-1, VO-10 | tests/diagram.test.mjs |
| FR-2 | C-11, C-17 | VO-1, VO-4, VO-10 | tests/diagram.test.mjs |
| FR-3 | C-12 | VO-1, VO-10 | tests/diagram.test.mjs |
| FR-4 | C-1, C-2 | VO-1 | tests/diagram.test.mjs, R-1 |
| FR-5 | C-6 | VO-6 | tests/diagram.test.mjs |
| FR-6 | C-3, C-4, C-5, C-7, C-13, C-15 | VO-2, VO-3, VO-4 | tests/diagram.test.mjs |
| FR-7 | C-14 | VO-4, VO-5 | tests/diagram.test.mjs |
| FR-8 | C-9, C-16, C-21 | VO-4, VO-8 | tests/diagram.test.mjs |
| FR-9 | C-8 | VO-7 | tests/diagram.test.mjs |
| FR-10 | C-12 | VO-10 | tests/diagram.test.mjs |
| FR-11 | C-1 | VO-1, VO-10 | tests/diagram.test.mjs |
| FR-12 | C-1, C-22 | VO-1, VO-12 | tests/diagram.test.mjs |
| FR-13 | C-10, C-18 | VO-1, VO-9 | tests/diagram.test.mjs |
| FR-14 | — | VO-14 | R-2 |
| FR-15 | — | VO-14 | R-2 |
| Errors | C-19, C-20, C-22 | VO-11, VO-12 | tests/diagram.test.mjs |
| QR-1 | — | VO-13 | tests/diagram.test.mjs |
| QR-2 | C-2 | VO-1, VO-15 | R-1 |
| QR-3 | — | VO-14 | R-2 |
| QR-4 | C-22 | VO-12 | tests/diagram.test.mjs |
| QR-5 | — | VO-1…VO-13 | tests/diagram.test.mjs |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | none (F-1…F-8 closed by verifier 2) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1, VO-2, VO-4, VO-5, VO-12, VO-13, VO-15 | 3 | tests/diagram.test.mjs rev v3 (85 tests pass; `node --test tests/` 127 pass); R1 | accepted (verifier 1 v2; VO-4, VO-12 new items accepted by verifier 2 v3) | M1–M10 killed; P4, P5', P8 killed by RN7/RN6/BV1 | ltt-parts.js unchanged since verifier 1 |
| VO-3, VO-6, VO-7, VO-8, VO-9, VO-10, VO-11 | 3 | tests/diagram.test.mjs rev v3: SI7, SV5, CV5, PO5, PO6, ZN10, ZN11, PX6, ER10b, ER10c, ER1 message | accepted (verifier 2, v3) | P1, P2, P3, P4, P5', P6, P6b, P7 killed | — |
| VO-14 | 3 | R2 v3 ledger row + agent-docs/spec-logs/8f96def5ba48e754-r2-review.js | accepted (verifier 2, v3) | review | catalog.html, gpu page |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 1 | test-implementer: VO-10 PX4 failed (expected height 300, got 320) | spec gap: FR-3 pixel-zone term lacked trailing pad | v2: term `(pad + x) + w + pad`; tests fixed + zone-dominated variant | resolved, 74/74 |
| 1 | implementer/test challenges: 0.5px tolerance vs axis-aligned, `l: ""`, zone without position, points+curve, parent order/default id, pts shape | spec gaps (contract wording) | v2 amendments; IMP-1 (`n.l \|\| n.id`), IMP-2 (ER11 throw); tests ML4, ER11, CV4, ZN9 | resolved |
| R1 | R-1 differential (scratchpad r1/diff.mjs, base_commit ltt-parts.js vs working tree) on catalog, gpu single, gpu batch specs | — | legacy fields width/height/node boxes/edge id,f,t,x1..y2,label point/zone boxes | 0 differences (DF1–DF3) |
| R2 | R-2 Chrome review, catalog "diagram paths" demo + gallery | — | (a) 10 gallery pages × 1440×900, 390×844 `?audit`: audit 0, expect warn/fail 0; catalog console errors 0. (b) node text bbox inside rect.box: 0 overflow at 1440 and 390 (only the intentional flaw badge "!" sits on the corner, legacy). (c) send() packet distance to path: forward 22 samples max 0.17px; reverse b→a on ortho+via edge 6 samples max 0.40px, progress 0.99→0.01. (d) screenshot: ortho elbow, curve, parallel 쓰기/읽기 split, nested zone under VPC label, 2-line labels, via route under diagram. 0 `<line class=e>`, 10 `<path class=e>`, zones drawn depth order | SC1–SC6 pass |
| M | hand mutations (seed.py backup/restore each, `node --test tests/diagram.test.mjs`) chosen as strongest distinct defect classes: one per non-obvious constant/rule (gap, tie rule, tolerance, radius clamp, normal sign, group exclusion, label push, depth inset, auto height, label point) | — | M1 end gap 8→4, M2 tie ≥→>, M3 tolerance 0.5→0, M4 radius clamp prev seg removed, M5 ν flipped, M6 via edges grouped, M7 push 26→10, M8 inset constant, M9 height ignores sub, M10 label at endpoints midpoint | 10/10 killed by intended assertions (BV6, BV1, BV2, PO1–PO3, PO3, ZN2/4, ZN2/6, ML2, LB1/SV1); restore verified byte-equal |
| 2 | verifier 1 RETRY: F-1 via inference unobserved, F-2 two-via straight, F-3 reversed parallel at non-zero offset + offset labels, F-4 grandchild vs clipped parent + left clip, F-5 cols = 0 grid term, F-6 ER10 vertical/touching, F-7 FR-14/15 clauses without coverage items, F-8 R-2 record incomplete | test evidence gaps (F-1…F-6, F-8); spec gap (F-7) | v3: coverage items SI7, CV5, SV5, PO5, PO6, ZN10, ZN11, PX6, ER10b, ER10c, RN6, RN7, SC7–SC12; reduced-motion resolve declared out of scope (unchanged legacy path); QR-3 measures node labels only. Advisories A-1 (BV1 x axis), A-2 (header v3), A-3 (ER1 id message) applied | tests 85/85; implementation unchanged |
| R2 v3 | R-2 rerun with agent-docs/spec-logs/8f96def5ba48e754-r2-review.js on /gallery/catalog.html (window 1221×1111, motion on) | — | SC1: 0 `line.e`, 5 `path.e`, default marker-end yes, both → marker-start + marker-end, arrow:false → no marker-end. SC2: 0 label overflow. SC3 zone order outer, inner. SC4 (3 packets each, 200-point path sampling): ortho a>c 12 samples max 0.37px; curve c>d 12 max 0.68px; parallel straight a>b 14 max 0.62px; ortho+via r 12 max 0.65px. SC5 reverse d→b on r: 4 samples max 0.76px, progress 0.68→0.01. SC7 `<b>x</b>` → 0 `b` elements, textContent literal. SC8 y: l-with-s 25 = h/2−3, s 42 = h/2+14, l alone 33 = h/2+5. SC9 3+2 lines, 5 tspans, top 12px / bottom 13px, diff 1px. SC10 class "e k-accent dash". SC11 no-edge send a→d: 4 samples, 0px from centre line. SC12 edge() → `path`; highlight([a,b]) dims c and c>d, a hot, a>b lit; flow([r]) runs r only. SC6: console errors 0 on catalog and gpu page (read after reload); gallery sweep (iframe `?audit`, 10 pages × 1440×900, 390×844): `data-ltt-audit` 0 and `#ltt-expect` warn/fail 0 — lint warnings go through LTT.warn into `#ltt-expect`, so lint count 0; catalog 390px label overflow 0, scrollWidth 375 | SC1–SC12 pass |
| R2 note | gpu page at 1221×1111 (not a declared size): audit warn "장면 4: 가장 큰 그림이 화면의 8%" | pre-existing | same warning with base_commit ltt-parts.js swapped in (12 `line.e`) | advisory, out of B scope |
| M2 | hand mutations round 2 (seed.py backup/restore, restore byte-equal verified) — the verifier's predicted escapes | — | P1 inference ignores via → SI7, CV5; P2 end clip V1 → SV5; P3 per-edge ν → PO5; P4 label unshifted → PO6, RN7; P5 (first probe only added an unused var: inconclusive) P5' grandchild clipped by parent pre-clip box → ZN10, RN6; P6 only w → ER10b, ER10c; P6b strict < → ER10c; P7 drop 2·pad → PX6; P8 tolerance y-only → BV1 x | 9/9 executed mutations killed by intended assertions |
| V2 | verifier 2 PASS at v3; advisories A-3 (ER1 index check `includes("0")` weak), A-4 (FR-15 reduced-motion clause is a declared verification exclusion — the code path is unchanged legacy `if (!MOTION_MS) return Promise.resolve()`), A-5 (no reversed edge in an ortho/curve parallel bundle), A-6 (R2 v3 ran at 1221×1111; 1440/390 label overflow from R2 v1 and the v3 390px sweep) | — | advisory, non-blocking; recorded | complete |

# Version Log
## v1
- 초안. handoff `agent-docs/handoff/4f7ea6efa16f46da-kit-library-expansion.md` 갈래 B와 사용자 확인(이해 라운드 승인)에서 작성.
## v2
- 계약 문구만 구체화(brief 항목 변경 없음). 근거: implementer·test-implementer 보고의 spec challenge.
- FR-1: l은 `n.l || n.id`(빈 문자열 l → id, legacy 동작 유지), s는 truthy일 때만. ML4 추가.
- FR-3: 픽셀 영역 크기 항을 `(pad + x) + w + pad`(노드 항과 같은 여백, 부모로 잘리기 전)로 명시, cols = 0일 때 격자 항 2·pad 유지 명시.
- FR-6: 0.5px 이내 정렬 선분은 좌표 보정 없이 두고 축 정렬 허용 오차를 0.5px로 명시. pts 점은 [x, y] 배열.
- FR-9: points + curve는 모든 앵커에 경유점 규칙. CV4 추가.
- FR-13: parent는 기본 id도 가리킬 수 있고 순서 무관, P는 부모 최종 상자. ZN9 추가.
- Errors: 위치 필드가 없는 영역은 throw. ER11 추가.
## v3
- [verifier 1 findings] 계약만 변경(brief 항목 변경 없음). F-1 → SI7·CV5, F-2 → SV5, F-3 → PO5·PO6, F-4 → ZN10·ZN11, F-5 → PX6, F-6 → ER10b·ER10c 추가. RN6·RN7 속성 추가.
- F-7: VO-14에 FR-14·FR-15 절별 coverage item SC7–SC12를 추가하고 SC1·SC4·SC6의 관찰을 구체화. 모션 감소 즉시 resolve는 기존 코드 경로라 검증 범위 밖으로 명시.
- F-8: R-2 측정 스크립트를 spec-log 산출물로 저장하고 ledger에 패킷 수·모양·샘플 수, 페이지별 콘솔·lint·audit 수를 기록하도록 명시. QR-3·R-2(b) 측정 대상을 노드 라벨(`text.l`, `text.s`)로 명시(flaw 배지 제외).

