# 범위 감사 프로토콜

spec `agent-docs/specs/c30ff9a3faa18a2a-m0-contract-coverage.md`의 review evidence R1 절차다. 감사를 시작하기 전에 확정하고, 이 파일의 sha256을 `report.md`에 적는다. 감사 도중 이 파일을 바꾸면 바꾼 이유와 새 sha256을 report.md에 적고, 바꾸기 전 판정은 다시 계산한다.

## 대상과 그림 단위

| corpus | 대상 | 그림 1개 |
|---|---|---|
| shot | `archive/v1:site/gallery/shots/sNN-*.html` 중 s05·s08을 뺀 49개 | shot 1개 |
| shot-extra | s05, s08 | shot 1개 |
| lesson | `archive/v1:site/gallery/<분야>/<id>.html` 중 drawing-basics(pilot) + 나머지 16개에서 `random.Random(20261023).sample(…, 6)`으로 뽑은 investing-basics, llm-hallucination-internal, ontology-triples, single-gpu-dataflow, trolley-ethics, visual-hierarchy-spacing | 데이터·도식을 그리는 시각 함수 하나(`figure`, `mount`, `visual`, `art`, `answerVisual`, kit 차트 호출). kit UI 부품(facts, chips, badge, takeaway, explain card)은 그림이 아니다 |
| new-b1 | 생명과학, 음악(pilot), 경제학, 법, 운동역학, 통계 | Stage A brief의 그림 하나 |
| new-b2 (held-out) | 화학, 지구과학, 의학·생리, 역사, 지리, 언어학 | Stage A brief의 그림 하나 |

- held-out 분할: 생명과학·음악은 pilot이라 batch 1에 둔다. 나머지 10분야는 `random.Random(20261023).sample(10분야, 4)`로 batch 1에 4개를 뽑았다.
- 새 분야는 분야당 주제 2개다. A = 그 분야 입문 교재의 핵심 챕터. B = 그 분야에서 차트가 아닌 그림에 가장 기대는 주제. v1 shot·수업과 같은 주제는 피한다(아래 "피할 주제").

## 역할

| 역할 | 보는 것 | 보지 않는 것 | 내는 것 |
|---|---|---|---|
| Stage A 설계자(새 분야) | 분야, 학습자 상황 한 줄, v2 수업 구조(절 3–5개, 장면 타입 hook·predict·define·steps·explore·compare·quiz·summary), v1 그림 원칙 두 단락, 매체 조건 | `lesson.d.ts`, 어휘 목록, v1 kit, look.md, 다른 감사 결과 | `new/<분야>/<주제>.brief.md` |
| 표현자 | 원본(shot HTML·beats·axes 행 / 수업 HTML / brief), `packages/runtime/types/lesson.d.ts`와 ext, `bench/coverage/fragment.d.ts` | 다른 표현자의 조각 | 조각 `.js` |
| 반박자 | 원본 또는 brief, 조각, d.ts | 표현자의 추론 과정 | 반박 기록 `refute/<묶음>.md` |

- 설계자·표현자는 model opus, effort low. 반박자는 model opus, effort medium.
- 매체 조건: "브라우저에서 코드로 그리는 SVG·Canvas. 사진·영상·외부 이미지는 없다. 구현 가능성은 생각하지 말고 뛰어난 교재 저자가 그릴 그림을 설계하라."
- v1 그림 원칙 두 단락: "그림이 보여주는 것은 모두 사실이어야 한다. 그림의 요소와 관계는 실제 대상과 대응하고, 학습자가 그림에서 읽어 낸 결론은 실제에서도 성립해야 한다. 단순화하거나 축척을 깨야 하면 그림에 그렇게 표시한다." / "그림은 설명하고자 하는 것을 담고, 그 중 핵심 관계가 가장 먼저 눈에 띄게 한다."

## brief 형식 (Stage A)

```
# <분야> · <주제>
## 상황            (bench/topics.md 형식: 작업, 배경)
## 진단 결과(고정)  (사다리, 학습 수준, 오개념)
## 장면 목록        (장면마다 type 한 줄)
## 그림
### F1 <이름>
- 보여 주는 것: …
- 속성:
  - P1 [Q|G|T|I|E|S|X] <성질> — 필수/선택, 이유
```

- 수치 인코딩(Q) 속성은 변수, 범위, 단위, 척도(선형·로그·같은 축척), 식 또는 데이터 출처를 적는다.
- 속성은 표현자가 지우거나 약하게 고칠 수 없다.

## 속성과 판정

- 범주: Q 수치 인코딩, G 기하 관계, T 시간, I 조작, E 강조, S 구도, X 그림 안 글자.
- 감사하지 않는 성질(runtime 소유): px 위치, 글꼴, 테마 색, card 배치, 컨트롤 모양, 의미 없는 easing.
- 필수 속성:
  - shot은 `beats/sNN.json`의 비트와 `principle`에 있는 성질 전부.
  - lesson은 그 장면의 제목·결론이 기대는 성질.
  - new는 brief의 필수 표시.
- status: kept(`by`에 그것을 보장하는 d.ts 항목·옵션을 적는다), approx(`diff`에 차이를 한 문장으로), lost, custom, ambiguous(d.ts가 그 의미를 보장하지 않음).
- 판정은 `count.mjs`가 일관성을 검사한다(spec FR-32).

  | 판정 | 조건 |
  |---|---|
  | V | custom 없음, 필수 속성 모두 kept·approx |
  | C | custom 블록 1개 이상 |
  | G | custom 없음, 필수 속성 중 lost·ambiguous 있음 |
  | X | 매체 한계(사실적 일러스트 등), `reason` 필수 |
  | N | `figure: none`(글이 본질), `reason` 필수 |

- 지표: (C+G)/(V+C+G). X와 N은 따로 보고한다.
- 조각은 `// @ts-check` JS다. `export default`는 `Fragment`, `export const audit`는 `AuditRow[]`. `@ts-ignore`·`@ts-expect-error`·`@ts-nocheck`·`{any}`·`{*}`는 금지한다.
- 조각은 `npx tsc -p bench/coverage/tsconfig.json`을 통과해야 한다. 통과하지 못하면 그 조각의 그림은 G로 본다.

## 반박

- 반박자는 kept마다 "d.ts를 지키면서도 이 속성을 깨는 runtime 구현"을 하나 들 수 있는지 본다. 들 수 있으면 ambiguous다. 빠진 필수 속성과 approx의 정당성도 본다.
- 표본: pilot은 V 전부, in-sample(shot·lesson)은 V의 15%(말뭉치당 최소 8개), batch 1은 V의 25%, batch 2는 V의 30%. 여기에 main이 바꾼 판정 전부를 더한다. 표본은 `random.Random(20261023)`으로 뽑는다.
- 반박률 = 필수 속성이 반박된 표본 V ÷ 표본 V. 묶음의 반박률이 10%를 넘으면 그 묶음을 새 표현자가 한 번 다시 감사한다.
- main이 판정을 바꾼 수는 "재분류 n"으로 따로 센다.

## 승격과 개정

- 같은 custom 패턴이나 후보가 3행 이상, 서로 다른 domain 2개 이상에서 나오면 어휘 후보로 승격한다(count.mjs FR-35). core 예산(21,000 B) 안이면 core에, 아니면 ext에 넣는다.
- 어휘 개정은 batch 2 전까지 최대 2회 한다. 1차는 pilot 직후, 2차는 batch 1까지의 결과로 필요할 때만 한다. 반영 대상은 승격 항목, ambiguous 해소, 예시 수업에서 드러난 수업 층 문제다. 개정 뒤에는 모든 조각을 다시 tsc하고, 이름 바꾸기 같은 기계적 수정만 허용한다.
- batch 2는 개정된 계약으로만 감사한다. batch 2가 10%를 넘으면 다시 고쳐 재판정하지 않는다. 사용자가 (a) 수용·문서화 / (b) 항목 추가 후 새 held-out 6분야로 재측정 / (c) intent "표현 범위" 축소 중에서 고른다.

## 변경 기록

- 2026-10-23 pilot 뒤(사용자 답): 개정 최대 2회, gallery 표본 6개, 반박자 effort medium. 변경 전 sha256 41522e08764cebce39eb74c08b00ea0e8e5776bc23d7a4237b83bdd89fcd0c8b.

## 진행

1. pilot (완료: shot 33%, lesson 43%, new-b1 24%, 반박률 42%·23%)
   - shot: s01, s13, s27, s38, s50, s51
   - lesson: drawing-basics
   - Stage A: 생명과학, 음악 각 2주제 → 표현 → 반박
   - 결과를 사용자에게 보고하고 전체 규모를 결정받는다.
2. 어휘 1차 개정(spec v4) → pilot 묶음은 반박률이 10%를 넘었으므로 새 표현자가 개정 계약으로 다시 감사한다.
3. 전체: shot 나머지, shot-extra, lesson 표본 6개, batch 1 나머지 4분야 → 반박 표본 → 필요하면 2차 개정 → 모든 조각 tsc.
4. batch 2: Stage A → 표현 → 반박.
5. `node bench/coverage/count.mjs bench/coverage --out bench/coverage/out` → `report.md`.

## 피할 주제 (Stage A에 주는 목록)

v1 shot: 세포 주기, 기준금리 전달 시차, 페이지 로드 예산, 키르히호프 전류 법칙, 현미경 개구수, 해운 리드타임, fan-out tail latency, HSL·OKLCH 명도, 작업 세트와 메모리 계층, 온도조절기 되먹임, 리전 수와 지연·비용, Node 이벤트 루프, 결제 퍼널, 심슨의 역설, 증권화, 남향·북향 채광, WAL·체크포인트, A/B 검정력, 푸리에 변환, 지분율 연결 범위, 포식자-피식자, 동적 전력, 카르노 사이클, 백신 콜드체인, CPI 가중치, git 브랜치, Wi-Fi 신호 세기, 투약 간격과 반감기, 대중교통 접근성, 컴파일러 단계, 시각적 위계, 얼음-알베도 되먹임, 편향-분산, 열염순환, 프로토콜 패킷 캡처, 번들 코드 분할, 의존 구문 분석, 역세권 가격 띠, 기술 부채, 웨이퍼 수율, JPEG 압축, 이진 탐색 트리, 뱅크런, PACELC, 냉동 사이클, 적정 곡선, 전력 믹스, 랜섬웨어 측면 이동, 농구 기대 득점, 달의 위상, 갈톤 보드.

v1 수업: 앵커링, 사랑의 기술, 캐시 TTL, 색 대비, 분산 투자, 소묘 기초(원근), 투자 기초, LLM 환각 내부, 행렬과 선형 변환, 온톨로지 트리플, 공기저항과 사거리, 인출 연습, GPU 데이터 흐름, TLS 1.3·QUIC, 트롤리 딜레마, 벡터 미적분, 시각 위계와 간격, CPU 캐시와 AoS·SoA.
