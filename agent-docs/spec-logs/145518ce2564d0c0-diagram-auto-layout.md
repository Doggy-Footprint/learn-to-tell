---
version: 3
run_id: 145518ce2564d0c0
status: complete
base_commit: 0e998d766f98499133245737a8496066e6260bea
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | 수업 페이지를 만드는 agent | 노드가 많은 도식(20개 이상)을 좌표 없이 연결 관계만 적어 그린다 | `LTT.diagram(svg, await LTT.autoLayout(spec))`가 겹치지 않는 도식을 그린다 |
| UI-2 | 같은 agent | 묶음(그룹, 그룹 안 그룹)을 영역으로 보여 준다 | 그룹이 중첩 영역이 되고 구성원 노드가 그 안에 놓인다 |
| UI-3 | 같은 agent | 단계 재생·하이라이트·패킷 등 기존 도식 기능을 그대로 쓴다 | 결과가 B의 diagram spec(픽셀 입력)이라 player·highlight·send가 동작한다 |
| UI-4 | 사용자(kit 유지자) | 같은 수업은 열 때마다 같은 그림이어야 한다 | 같은 입력 → 같은 출력 |
| UI-5 | 같은 사용자 | elk(1.6MB)를 쓰지 않는 페이지는 영향이 없다 | elk를 부르지 않은 페이지에서 ltt-parts.js가 오류 없이 로드되고 autoLayout만 명확히 실패한다 |

# Scope
In scope: `LTT.autoLayout(spec)` — 좌표 없는 노드·엣지·그룹을 elkjs `layered` 배치로 계산해 B 형식 diagram spec(노드 `x, y`, 엣지 `points` + `shape: "ortho"`, 영역 `x, y, w, h` + `id`·`parent`)을 돌려준다. 입력 오류 처리, catalog에 노드 20개 이상 예시.
Out of scope: `LTT.state`(다음 작업), 라벨 충돌 회피(elk에 엣지 라벨 크기를 넘기지 않음), 그룹을 엣지 끝점으로 쓰기, 노드 순서·층 수동 지정, 손그림 선, diagram 본체 변경, Web Worker 실행.

# Paths
Implementation: skills/learn-to-tell/kit/ltt-parts.js
Tests: tests/autolayout.test.mjs
Test command: node --test tests/
Review evidence: R-1 browser — main이 Chrome에서 catalog의 autoLayout 데모(노드 20개 이상, 그룹 2단 이상, 라벨 있는 엣지 포함)를 1440×900·390×844로 열어 (a) 콘솔 에러 0, catalog에서 실행한 gallery sweep의 audit·lint 0, (b) 노드 상자끼리 겹침 0(getBBox 측정), (c) 노드 라벨이 상자 안, (d) 스크린샷 확인. 측정 스크립트는 `agent-docs/spec-logs/145518ce2564d0c0-r1-review.js`로 저장. 산출물: Execution ledger 기록.
Fuzzing: none — 무작위 그래프 속성 검사는 VO-8로 Test command 안에서 고정 seed로 실행한다.
Mutation tool: none — JS mutation 도구 미설치(B run과 같음). hand mutation 8–10개.

# Signatures
LTT.autoLayout(spec) → Promise<diagramSpec>
spec: { nodes: [{ id, l, s, k, icon, flaw, w, h, group }], edges: [{ f, t, id, l, lo, k, dash, both, arrow }], groups: [{ id, l, k, parent }], direction: "RIGHT"|"DOWN" = "RIGHT", node: [w, h] = [164, 60], spacing: [layer, node] = [72, 36], pad = 20, radius = 10, label, maxWidth }
diagramSpec: { pad, width, height, label, maxWidth, nodes: [{ ...입력 필드, x, y, w, h }], edges: [{ ...입력 필드, shape: "ortho", radius, points: [[x, y], ...] }], zones: [{ id, parent, l, k, x, y, w, h }] }

# Functional Requirements
정의: 모든 출력 좌표는 pad를 빼고 잰 값이다(diagram이 pad를 더한다, B FR-1·FR-10·FR-13). 노드 상자 = 중심 (x, y), 크기 (w, h). 영역 상자 = (x, y, w, h).

| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | 노드 크기: w = n.w ?? node[0]. h = n.h가 있으면 n.h, 없으면 B FR-2 규칙(줄 수는 B FR-1처럼 String(n.l || n.id)·n.s(truthy일 때)를 `\n`으로 나눈 개수; l 또는 s가 2줄 이상이면 max(node[1], 24 + 18·l 줄 수 + 16·s 줄 수), 아니면 node[1]). 출력 노드는 입력 노드의 모든 필드를 그대로 갖고 `x, y`(중심), `w, h`를 더한다. `group`은 그대로 둔다. 출력 노드 순서 = 입력 순서. | must | UI-1, UI-3 |
| FR-2 | 배치: elkjs `layered`, 방향 RIGHT(기본) 또는 DOWN, 직각 엣지 라우팅, 그룹 계층을 함께 배치(`INCLUDE_CHILDREN`), 층 간격 spacing[0], 같은 층 노드 간격 spacing[1]. 결과에서 노드 상자끼리 겹치지 않는다(경계 접촉 제외). | must | UI-1 |
| FR-3 | 방향: 순환이 없는 그래프에서 RIGHT면 모든 엣지의 원본 노드 중심 x < 대상 노드 중심 x, DOWN이면 y로 같은 관계. | must | UI-1 |
| FR-4 | 그룹: 각 그룹은 영역 하나가 된다. 영역 `id`·`l`·`k`는 그룹 값, `parent` = 그룹 parent ?? null. 그룹 안쪽 여백은 위 30(l이 있을 때)·12(없을 때), 좌우·아래 12. 구성원 노드 상자와 자식 영역 상자는 부모 영역 상자의 안쪽 상자 [x + 10, y + (l ? 26 : 10), x + w − 10, y + h − 10] 안에 있다. 그룹에 속하지 않은 노드는 어느 영역 상자와도 겹치지 않는다. 노드가 하나도 없는(자식 그룹도 없는) 그룹은 영역을 만들지 않는다. 출력 영역 순서 = 입력 그룹 순서(빈 그룹 제외). | must | UI-2 |
| FR-5 | 엣지: 출력 엣지는 입력 엣지의 모든 필드를 그대로 갖고 `shape: "ortho"`, `radius`(e.radius ?? spec.radius ?? 10), `points`를 더한다. points는 elk 경로의 시작점·꺾는 점·끝점을 출력 좌표계(절대 좌표)로 옮긴 목록이다. 이어지는 점끼리 x 또는 y가 같다(허용 0.5px). 출력 엣지 순서 = 입력 순서. | must | UI-1, UI-3 |
| FR-6 | 화살표 여백: elk 경로의 첫 선분 길이 L0, 마지막 선분 길이 Ln(줄이기 전). 점이 3개 이상이면 첫 점을 진행 방향으로 min(4, L0/2), 마지막 점을 진행 반대 방향으로 min(8, Ln/2)만큼 옮긴다. 점이 2개(선분 하나, 길이 L)면 시작을 min(4, L/6), 끝을 min(8, L/3)만큼 옮긴다(남는 길이 ≥ L/2). 따라서 출력에서 첫·마지막 선분 길이를 m0·mn이라 하면, 점이 3개 이상일 때 첫 점과 원본 상자의 거리는 min(4, m0), 마지막 점과 대상 상자의 거리는 min(8, mn)이다(허용 1px). 선분 방향은 뒤집히지 않는다. | must | UI-3 |
| FR-7 | 크기: width = 모든 노드·영역 상자의 오른쪽 끝 최댓값 + 2·pad, height도 아래 끝으로 같은 규칙(전부 출력 좌표계, 왼쪽·위 끝 최솟값은 0 이상). 출력 `pad` = spec.pad ?? 20, `label`·`maxWidth`는 값이 있을 때만 전달(없으면 키 자체가 없음). 영역의 `l`·`k`도 값이 있을 때만 키가 있고 `parent`는 항상 있다(없으면 null). 출력을 `LTT.diagramLayout`에 넣으면 오류 없이 계산되고 노드 중심이 (pad + x, pad + y)다. | must | UI-3 |
| FR-8 | 결정성: 같은 spec으로 두 번 부르면 출력이 깊은 비교로 같다. 입력 spec 객체는 바뀌지 않는다. | must | UI-4 |
| FR-9 | 비동기: 반환값은 Promise. 입력 오류도 throw가 아니라 reject로 알린다. | must | elk API |
| FR-10 | elk 없음: 전역 `ELK`가 없으면 reject하고 메시지에 `elk.bundled.js`를 포함한다. ltt-parts.js 로드와 다른 부품은 ELK 없이 동작한다. | must | UI-5 |

# Errors
- 엣지 f 또는 t가 없는 노드 — reject(Error, 메시지에 엣지 id 또는 f>t) — 출력 없음.
- f === t — reject(Error) — 출력 없음.
- 노드 id 중복, 그룹 id 중복 — reject(Error, 메시지에 그 id) — 출력 없음.
- 노드 group 또는 그룹 parent가 없는 그룹 id — reject(Error, 메시지에 그 id) — 출력 없음.
- 그룹 parent 순환 — reject(Error) — 출력 없음.
- direction이 RIGHT·DOWN 밖 — reject(Error) — 출력 없음.
- 전역 ELK 없음 — reject(Error, 메시지에 `elk.bundled.js`) — 출력 없음.
- 정상 입력에서 출력 숫자에 NaN·∞가 없어야 한다(실패 신호: 비유한 수).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 사슬 a→b→c, 그룹 없음, RIGHT | x 증가, 겹침 없음, points 축 정렬 |
| C-2 | normal | 같은 그래프 DOWN | y 증가 |
| C-3 | normal | 그룹 2단(g1 ⊃ g2) + 그룹 밖 노드 + 그룹을 넘나드는 엣지 | 영역 2개, parent 관계, 포함 관계, 밖 노드는 영역과 안 겹침 |
| C-4 | normal | 노드 24개·엣지 30개 | 겹침 없음, 모든 엣지 points 유효 |
| C-5 | normal | 출력을 diagramLayout에 넣음 | 오류 없음, 노드 중심 = pad + x, pad + y |
| C-6 | normal | 노드·엣지 부가 필드(l, s, k, icon, flaw, dash, both, arrow, lo, id) | 출력에 그대로 |
| C-7 | boundary | 노드 1개, 엣지 0개 | 노드 1개, edges [], width = w + 2·pad |
| C-8 | boundary | 여러 줄 라벨 노드(h 없음) / h 지정 | B FR-2 높이 / 지정 높이 |
| C-9 | boundary | 짧은 마지막 선분(층 간격이 작아 8px보다 짧은 경우가 생기도록 spacing [10, 10]) | 그 선분 절반만 줄임, 방향 뒤집힘 없음 |
| C-10 | boundary | 빈 그룹 | 영역 없음 |
| C-11 | error | Errors 절의 각 조건 | reject |
| C-12 | edge | 같은 spec 두 번 | 깊은 비교 같음, 입력 불변 |
| C-13 | edge | 순환 그래프(a→b→a) | 오류 없이 배치, points 유효(FR-3 방향 조건은 적용 안 함) |
| C-14 | edge | 무작위 그래프(seed 고정) | 속성 위반 없음 |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 겹침 없음·포함 관계·경로 유효성이 핵심 |
| Performance efficiency | yes | 수업 화면이 열릴 때 배치가 끝나야 함 |
| Compatibility | yes | 출력이 B의 diagram 입력과 맞아야 하고, elk 없는 페이지는 영향이 없어야 함 |
| Interaction capability | yes | 큰 도식이 좁은 화면에서도 읽혀야 함 |
| Reliability | yes | 같은 입력 같은 그림, 오류 입력은 명확한 reject |
| Security | no | 입력은 같은 페이지 작성자 spec, 문자열은 diagram이 textContent로 넣음 |
| Maintainability | yes | node vm에서 elk를 올려 시험 가능해야 함 |
| Flexibility | no | 배치 알고리즘 교체는 범위 밖 |
| Safety | no | 물리적·인명 위험 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Performance / time behaviour | node vm, 노드 30개·엣지 40개·그룹 3개(2단) | autoLayout 3회(첫 호출 1회 버린 뒤) 시간 중앙값, ms | ≤ 300 ms, 낮을수록 좋음 | automated VO-9 | 기본값 D-6 |
| QR-2 | Compatibility / interoperability | autoLayout 출력 → diagramLayout | 오류 수, 노드 중심 차 | 0, ≤ 1e-6 | automated VO-5 | UI-3 |
| QR-3 | Compatibility / co-existence | ELK 없는 vm에서 ltt-parts.js 로드 | 로드 오류, 다른 부품(diagramLayout) 동작 | 오류 0, 동작 | automated VO-7 | UI-5 |
| QR-4 | Interaction capability / user engagement | catalog 데모, 1440×900·390×844 | 노드 겹침 수, 상자 밖 노드 라벨 수, audit·lint 경고 수 | 0, 0, 0 | review R-1 | UI-1 |
| QR-5 | Reliability / faultlessness | 무작위 그래프 60개(seed 20261015) | 속성 위반 수 | 0 | automated VO-8 | FR-2…FR-8 |
| QR-6 | Maintainability / testability | elk.bundled.js를 vm에 올린 테스트 | 실행 성공 | 성공 | automated(모든 VO) | 관례 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, FR-2, FR-3, FR-5, FR-6, C-1, C-2, C-4 | 그룹 없는 그래프 | unit | equivalence partitioning | EP1 사슬 RIGHT, EP2 사슬 DOWN, EP3 분기·합류(노드 24·엣지 30, RIGHT), EP3b 같은 그래프 DOWN, spacing [72, 50]: 같은 층 노드 간격 ≥ spacing[1] | 100% | 겹침 없음, 방향 조건, points 축 정렬(0.5px), 첫 점 원본 상자에서 4±1px·마지막 점 대상 상자에서 8±1px | tests/autolayout.test.mjs |
| VO-2 | FR-4, C-3, C-10 | 그룹 | unit | equivalence partitioning | GR1 한 단 그룹, GR2 두 단(parent), GR3 그룹 밖 노드, GR4 그룹을 넘나드는 엣지(points가 절대 좌표: 끝점이 실제 노드 상자 근처), GR5 빈 그룹, GR6 라벨 없는 그룹의 위 여백, GR2b 직접 노드 없이 자식 그룹만 가진 그룹도 영역이 됨 | 100% | 영역 수·id·parent·l·k, 포함 관계(FR-4 안쪽 상자), 밖 노드와 영역 비겹침 | tests/autolayout.test.mjs |
| VO-3 | FR-1, FR-5, FR-6, FR-7, C-6, C-7, C-8, C-9 | 경계·필드 보존 | unit | boundary value analysis (2-value) | BV1 노드 1·엣지 0, BV2 1줄/2줄 라벨 높이, BV2b node[1]이 공식보다 큰 경우 node[1] 유지(max 양쪽), BV3 h 지정, BV4 짧은 선분: 점 3개 이상에서 끝 거리 = min(8, mn)·시작 거리 = min(4, m0)(±1px), 점 2개 엣지는 남는 길이 ≥ 줄이기 전 길이의 절반이고 시작 거리 = min(4, L/6)·끝 거리 = min(8, L/3)(L = m + 두 거리, ±1px), BV5 radius 기본·지정, FP1 노드·엣지 부가 필드 보존(엣지 radius 지정 시 그 값), FP3 값 없는 label·maxWidth·영역 l·k는 키가 없음, FP2 순서 보존 | 100% | FR 값 | tests/autolayout.test.mjs |
| VO-4 | FR-8, C-12 | 결정성·입력 불변 | unit | equivalence partitioning | DT1 두 번 호출 깊은 비교, DT2 입력 spec 깊은 복사와 호출 후 비교 | 100% | 같음 | tests/autolayout.test.mjs |
| VO-5 | FR-7, QR-2, C-5 | diagramLayout 연계 | unit | equivalence partitioning | IO1 그룹 없는 출력, IO2 그룹 있는 출력 | 100% | 오류 없음, 노드 중심 = pad + x/y, 영역 상자 = pad + x/y와 w/h(부모 잘림 없음), width/height가 FR-7 | tests/autolayout.test.mjs |
| VO-6 | Errors, FR-9, C-11 | 오류 입력 | unit | equivalence partitioning | ER1 없는 노드, ER2 자기 루프, ER3 노드 id 중복, ER4 그룹 id 중복, ER5 없는 group, ER6 없는 parent, ER7 parent 순환, ER8 잘못된 direction | 100% | Promise reject(동기 throw 아님), 메시지 조건 | tests/autolayout.test.mjs |
| VO-7 | FR-10, QR-3 | ELK 없음 | unit | equivalence partitioning | NE1 ELK 없는 vm에서 로드 성공·diagramLayout 동작, NE2 autoLayout reject 메시지에 elk.bundled.js | 100% | 기대대로 | tests/autolayout.test.mjs |
| VO-8 | FR-2, FR-4, FR-5, FR-6, FR-7, Errors(비유한 수), C-13, C-14, QR-5 | 무작위 그래프 | unit, seed 20261015, 60개(노드 3–25, 그룹 0–3·깊이 ≤ 2, 순환 포함 가능, direction 섞음) | random testing | RN1 비유한 수 없음, RN2 노드 겹침 없음, RN3 points 축 정렬, RN4 끝점 간격(FR-6의 min(4, m0)·min(8, mn) 또는 점 2개 규칙), RN5 그룹 포함 관계, RN6 width/height가 모든 상자 + 2·pad 이상이고 FR-7과 같음; 생성기 보장: 순환 그래프 ≥ 1, RIGHT·DOWN 모두, 그룹 있는 그래프 ≥ 1; C-13 고정 순환(a→b→a, 3-순환) | none — random(속성 6개 모두 검사) | 위반 0 | tests/autolayout.test.mjs |
| VO-9 | QR-1 | 성능 | unit | equivalence partitioning | PF1 QR-1 spec | 100% | 중앙값 ≤ 300 ms | tests/autolayout.test.mjs |
| VO-10 | QR-4, UI-1 | catalog 데모 | review | scenario testing | SC1 콘솔 에러 0, SC2 노드 겹침 0, SC3 라벨이 상자 안, SC4 audit·lint 0(gallery sweep 두 크기), SC5 player 단계·send 동작 | 100% | R-1 | R-1 |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v1 — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| D-1 | 입력 형식: 노드 `group: id`, 그룹 목록 `{id, l, k, parent}`; 결과는 그리지 않고 diagram spec을 돌려줌 | 공개 인터페이스 | user answer (brief v1 A1: ok) |
| D-2 | 기본값: direction RIGHT, spacing [72, 36], node [164, 60], pad 20, radius 10, 그룹 여백 위 30/12·옆 12 | 여백 30·12는 B의 부모 안쪽 상자(26·10)보다 커서 diagram이 다시 자르지 않음 | brief v1 — approved |
| D-3 | 엣지 라벨은 elk에 넘기지 않고 diagram이 경로 절반에 둔다 | 라벨 충돌은 범위 밖, 층 간격 72로 여유 | brief v1 — approved |
| D-4 | 화살표 여백 4/8px(B와 같음) | B 격자 도식과 같은 모습 | brief v1 — approved |
| D-5 | elk는 메인 스레드(번들 내장 가짜 worker)에서 실행 | Worker 파일을 따로 두지 않음, 노드 수십 개면 수십 ms | brief v1 — approved |
| D-6 | 성능 기준 300 ms(노드 30·엣지 40) | 프로브: 노드 3개 첫 호출 54 ms | brief v1 — approved |
| D-7 | hand mutation 8–10개, 도구 없음 | B와 같음 | brief v1 — approved |
| D-8 | elkjs 0.12.0 라이선스는 EPL-2.0 쪽을 택하고 VERSIONS·LICENSE-elkjs에 기록 | 패키지 라이선스 "EPL-2.0 OR GPL-3.0-or-later" | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-6, C-7, C-8 | VO-1, VO-3 | tests/autolayout.test.mjs |
| FR-2 | C-1, C-4, C-14 | VO-1, VO-8 | tests/autolayout.test.mjs |
| FR-3 | C-1, C-2 | VO-1 | tests/autolayout.test.mjs |
| FR-4 | C-3, C-10 | VO-2, VO-8 | tests/autolayout.test.mjs |
| FR-5 | C-1, C-6 | VO-1, VO-3, VO-8 | tests/autolayout.test.mjs |
| FR-6 | C-9 | VO-1, VO-3, VO-8 | tests/autolayout.test.mjs |
| FR-7 | C-5, C-7 | VO-3, VO-5, VO-8 | tests/autolayout.test.mjs |
| FR-8 | C-12 | VO-4 | tests/autolayout.test.mjs |
| FR-9 | C-11 | VO-6 | tests/autolayout.test.mjs |
| FR-10 | — | VO-7 | tests/autolayout.test.mjs |
| Errors | C-11, C-14 | VO-6, VO-8 | tests/autolayout.test.mjs |
| QR-1 | — | VO-9 | tests/autolayout.test.mjs |
| QR-2 | C-5 | VO-5 | tests/autolayout.test.mjs |
| QR-3 | — | VO-7 | tests/autolayout.test.mjs |
| QR-4 | — | VO-10 | R-1 |
| QR-5 | C-14 | VO-8 | tests/autolayout.test.mjs |
| QR-6 | — | VO-1…VO-9 | tests/autolayout.test.mjs |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 3 |
| verifier invocations | 2 |
| open finding ids | none |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1, VO-2, VO-4…VO-9 | 3 | tests/autolayout.test.mjs rev v3 (43 tests) | accepted (verifier 1 v2; new items accepted by verifier 2 v3) | C1–C12, P2–P4 killed | implementation unchanged since verifier 1 |
| VO-3 | 3 | tests/autolayout.test.mjs rev v3: BV2b | accepted (verifier 2, v3) | P1 killed by BV2b | — |
| VO-10 | 3 | ledger R1 + agent-docs/spec-logs/145518ce2564d0c0-r1-review.js (procedure header + sweep added, A-1) | accepted by verifier 1 (v2) | review | catalog autoLayout demo |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| probe | node vm에서 `new ELK()`가 "_Worker is not a constructor"(window 지정 시), "$wnd.Error undefined"(전역 없음)로 실패; 바깥 realm에서 만든 graph를 넘기면 좌표가 비어 돌아옴 | elk.bundled.js가 window → global → self 순으로 전역을 찾고, 배열 판정이 realm에 묶임 | context에 `global = context`를 두고, graph를 vm realm 안에서 만들면 동작(노드 3개 54 ms, 두 번 호출 좌표 같음; 내부 `$H` 번호만 다름) | 테스트·구현 제약으로 반영 |
| 1 | test-implementer: GR4, BV4, RN4 failed — end gap 5px where the literal v1 FR-6 expected 8px (last segment 10px before trimming) | spec gap: FR-6 did not define trimming between 8px and 2·8px nor for 2-point edges | v2: exact rule min(4, L0/2)·min(8, Ln/2), 2-point L/6·L/3, observable gap formulas; implementer changed 2-point rule; tests assert exact relations | 38/38 |
| 1 | implementer challenges: spec-level vs per-edge radius; undefined optional keys | spec gaps | v2: e.radius ?? spec.radius ?? 10; absent optional keys omitted (FP3) | resolved |
| 2 | confirming mutation C12 (`out.label = spec.label` always) survived | test evidence defect: shared helper `J` was a JSON round-trip that drops undefined-valued keys, so key-absence checks saw a cleaned copy | test helper switched to structuredClone + own-key checks in FP3, assertZones, assertSize (shared; affects VO-2, VO-3, VO-4, VO-8) | C12 killed on rerun |
| R1 | R-1 Chrome review with agent-docs/spec-logs/145518ce2564d0c0-r1-review.js on catalog autoLayout demo (22 nodes, 23 edges, 5 groups incl. nested 결제 ⊂ 주문 서비스, labelled edges, direction DOWN) | — | 1440×900 and 390×844: node overlap 0, node labels outside box 0, steps ② ③ reached, 5 packets in flight during step 3, scrollWidth 1425 / 375 (no horizontal scroll); catalog console errors 0; gallery sweep 10 pages × 2 sizes audit 0, `#ltt-expect` warn/fail 0 (lint included). Note: first demo used RIGHT → 2467px wide, unreadable in the catalog column; switched demo to DOWN (1086×1413) | SC1–SC5 pass |
| M | hand mutations (seed.py backup/restore, byte-equal restore verified), strongest distinct classes: container offset, group padding, empty groups, end trim, 2-point trim, radius precedence, auto height, direction, size formula, sync throw, ELK message, key omission | — | C1–C12 | 12/12 killed by intended assertions (GR2/GR4, GR1/GR6, GR5/RN5, EP3/BV4, GR1/BV4, BV5/FP1, BV2, EP2, EP1/IO1, ER8, NE2, FP3/assertSize) |
| 3 | verifier 1 RETRY: E-1 no case where the multi-line formula is below node[1], so dropping max() passes; advisories A-1 (review script procedure), A-2 (no deterministic cycle; parent-only group unreachable), A-3 (spacing[1] unchecked in DOWN), A-4 (header) | test evidence gaps | BV2b (node [164, 100]: 100, 100, 146), C-13 fixed cycles in RIGHT/DOWN, generator guards, GR2b, EP3b; R1 script documents console read, sweep and screenshot; header v2 | 43/43; full suite pass |
| M2 | verifier-proposed mutations (seed.py backup/restore, byte-equal) | — | P1 drop max() → BV2b; P2 spacing[1] ignored in DOWN → EP3b; P3 drop parent-only groups → GR2b, FP3; P4 reject cycles → C-13, RN1–RN6 | 4/4 killed |
| V2 | verifier 2 PASS at v3; advisories A-4 (test header said v2 — updated to v3 at close), A-5 (generator guard shows cycles in input, not that elk saw a back edge; fixed C-13 cases pin cycle handling) | — | advisory | complete |

# Version Log
## v1
- 초안. handoff 갈래 C, 사용자 결정(elkjs), 이해 라운드 확인.
## v2
- 계약 문구만 구체화(brief 항목 변경 없음). 근거: implementer·test-implementer spec challenge.
- FR-6: 짧은 선분 규칙을 min(4, L0/2)·min(8, Ln/2), 점 2개 엣지는 L/6·L/3으로 명시하고 출력에서 관찰 가능한 거리식을 적음(GR4·BV4·RN4 기대값 근거).
- FR-5: 엣지 radius가 spec radius보다 우선. FR-7·FR-4: 값 없는 선택 필드는 키를 만들지 않음. FR-1: 줄 수 규칙을 B FR-1과 같게 명시. FP3 추가.
## v3
- [verifier 1 findings] 계약만 변경(brief 항목 변경 없음): coverage item BV2b, EP3b, GR2b, C-13 고정 순환·생성기 보장을 선언(E-1, A-2, A-3에 대응해 추가된 테스트를 선언 항목으로 올림).

