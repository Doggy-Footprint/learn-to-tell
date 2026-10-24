# Intent: Learn to Tell v3

Status: draft (2026-10-24). v1은 태그 `archive/v1`(`0da38db`), v2는 `archive/v2`(`23a8a96`)에 있다. 시작 인계는 `agent-docs/handoff/86bf8c8f61fad9f3-v3-start.md`다.

## What I want (사용자 원문, 2026-10-24)

1. 품질은 측정하지 않고 사용자에게 검수 받는다. 기준선 과의 정량적 품질 비교는 업무 대상이 아니며, "사용자가 허용하는 수준"의 품질 + 기준선과 유사하거나 1.5배 수준의 비용이다.
2. v3의 핵심 원칙은 검증된 외부 라이브러리를 통해 agent가 생성에 집중할 수 있도록 하는 것이다. 이후 스타일/테마 등을 고쳐서 약간의 수정을 가하되, agent가 우리 라이브러리를 새롭게 이해해야 하는 문제는 피한다.
3. rule 기반으로 검증할 수 있는 대상을 먼저 정한다. ex. 함수를 통한 graph-plot modeling 등. 할 수 있는지 확실하지 않은 대상을 실험을 통해 증명하지 않는다.
4. 우리는 실험을 하는 게 아니라 프로젝트를 제작하는 거다. try는 없다. 근거가 없는 주장은 받지 않는다.

## 사용자 결정 (2026-10-24)

| 항목 | 결정 |
|---|---|
| 비용 | 목표는 기준선의 1.5배다. 재고 보고만 하고, 넘어도 막지 않는다. 1.5배 기준은 agent가 처음 한 번 쓰는 구간에만 적용한다 |
| 품질 | 사용자 검수. 기준선과 정량 품질 비교는 하지 않는다 |
| v2 의도 2 (움직이는 infographic) | 상호작용 + 자동 무빙. 라이브러리 공개 API 범위 안에서 한다 |
| v2 의도 5 (페이지 전환 때 요소가 제자리를 찾음) | 뺀다 |
| 범위 | 유지: 진단 사다리·지식 map, 작업 복귀, claude.ai 경로. 뺀다: 15–20분 분량 조건 |
| rule 밖 내용 | agent가 한 번 쓴 뒤 서브에이전트가 한 번 검증하고 직접 고친다 |
| 그래프·차트 라이브러리 | Vega-Lite |

## 구조

수업은 agent가 쓰는 HTML 한 장이다. 우리 runtime과 작성 형식은 없다.

| 부분 | 쓰는 방법 | 검증 |
|---|---|---|
| 함수·수치 모델 그래프 | Vega-Lite spec. 시간 변화는 매개변수 `t`를 페이지 스크립트가 `view.signal`로 바꿔 움직이고, 같은 `t`에 슬라이더를 연결할 수 있다 | rule |
| 데이터 차트(막대·선·산점도) | Vega-Lite spec | rule |
| 퀴즈 정답 | HTML | rule |
| 본문 글, 개념 설명, 도식·일러스트, 화면 배치 | 자유 HTML | 서브에이전트 1회 검증·직접 수정, 그 뒤 사용자 검수 |
| 테마 | Vega-Lite `config` 객체와 페이지 CSS. 우리가 미리 정해 둔다 | — |

### rule 검증

- 프로그램이 돌려 통과/실패를 낸다. LLM이나 사람의 판정은 쓰지 않는다.
- 그래프·차트: Node에서 화면 없이 Vega View를 만들고, 매개변수를 정해진 값들로 바꿔 넣은 뒤 그릴 데이터를 꺼내 기준점과 비교한다. spec은 Vega-Lite JSON 스키마도 통과해야 한다.
- 퀴즈: 수치 문항의 정답은 모델 계산값과 같다. 선택형은 정답이 1개다.

이 대상을 고른 근거:

- InteractScience(arXiv 2510.09724): LLM이 만든 과학 시뮬레이션은 화면은 80% 넘게 동작했지만 과학적으로 맞은 것은 50% 미만이었다. 실패의 53%가 화면 상태와 수식의 불일치였다.
- v2 정답 검산이 실제 수치 오류 1건을 잡았다(`archive/v2:bench/m1/generation-results.md`).

rule 대상에서 뺀 것:

| 대상 | 이유 |
|---|---|
| 화면 배치(겹침·잘림) | v2 자동 배치 검사는 세 수업 모두 0건이었지만 검토자는 겹침 4건을 찾았다(`archive/v2:bench/m1/gen/<topic>/sheet-review.md`) |
| 수식 문법(KaTeX), 도식 문법(Mermaid) | 규칙은 만들 수 있지만, 일반 요청에서 자주 틀린다는 근거가 없다 |
| 글의 사실 정확성, 설명 품질, 미감 | 규칙으로 판정할 수 없다 |

### Vega-Lite 근거 (공식 문서, 2026-10-24 확인)

| 사실 | 출처 |
|---|---|
| BSD-3-Clause. vega-lite 6.5.0, vega 6.4.0, vega-embed 7.3.0 모두 cdnjs와 jsDelivr에 있다 | npm registry, https://api.cdnjs.com/libraries/vega-lite |
| 매개변수에 슬라이더 같은 입력을 연결한다(`bind`) | https://vega.github.io/vega-lite/docs/bind.html |
| 매개변수는 Vega View API로 바꿀 수 있다: "by modifying the underlying signal in a Vega view API" | https://vega.github.io/vega-lite/docs/parameter.html |
| `view.signal(name, value)`로 값을 넣고 `runAsync`로 다시 그린다. `view.data(name)`은 dataflow가 쓰는 데이터를 돌려준다 | https://vega.github.io/vega/docs/api/view/ |
| 서버에서는 `renderer: 'none'`으로 DOM 없이 View를 만든다 | https://vega.github.io/vega/usage/ |
| 테마는 spec의 `config` 객체다 | https://vega.github.io/vega-lite/docs/config.html |
| Vega-Lite 자체에는 애니메이션·타이머 기능이 없다(문서 목차) | https://vega.github.io/vega-lite/docs/ |

## 생성 흐름

| 단계 | 하는 일 | 1.5배 구간 |
|---|---|---|
| 0 | 진단 사다리(v1 SKILL §1). 결과로 가르칠 단계와 오개념이 정해진다 | 밖 |
| 1 | agent가 HTML 한 장을 쓴다 | 안 |
| 2 | rule 검사를 돌리고 실패한 것을 고친다 | 안 |
| 3 | 서브에이전트가 한 번 검증하고 직접 고친다 | 밖 |
| 4 | 사용자에게 연다. Claude Code는 로컬 HTML, claude.ai는 artifact | 밖 |
| 5 | 학습 뒤 대화 서술 퀴즈와 결과를 지식 map에 넣고 원래 작업으로 돌아간다(v1 §4–§6) | 밖 |

- 기준선은 skill 없이 같은 작업 문장으로 요청한 결과다. 분량 지시는 넣지 않는다.
- 단계 2를 1.5배 구간에 넣은 것은 기본값이다. 사용자가 바꿀 수 있다.

## v2에서 가져올 후보

| 자산 | 위치 | 쓰임 |
|---|---|---|
| 진단 사다리·지식 map·작업 복귀 | `archive/v1` SKILL.md §1·§4–§6, `skills/learn-to-tell/map/` | 단계 0·5 |
| 정답 검산 지침 | `archive/v2:skill/learn-to-tell/verify-answers.md` | 단계 3 |
| 두 폭 스크린샷 | `archive/v2:packages/runtime/src/cli/` sheet(playwright-core) | 단계 3 |
| 시험 주제·고정 진단 | `archive/v2:bench/topics.md` | 비용 측정 |

## 기각한 대안

| 대안 | 이유 |
|---|---|
| v2 runtime 유지(agent는 spec, runtime이 그림) | 일반 요청 대비 비용 2–3배, 시간 1.2–2.3배였다. 일반 요청보다 낫다는 근거가 없다(`archive/v2:bench/m1/generation-results.md`) |
| JSXGraph | 슬라이더는 있지만, 그릴 값을 Node에서 화면 없이 꺼내는 방법을 공식 문서에서 찾지 못했다. rule 검증이 안 된다 |
| Plotly.js | 슬라이더는 있지만 Node 검증 방법을 확인하지 못했다 |
| Observable Plot | 매개변수 입력이 내장돼 있지 않다. 문서는 새 plot으로 교체하라고 한다 |
| Mafs | React 컴포넌트다. cdnjs에 없다 |
| Vega로 직접 써서 timer 이벤트로 움직임 | spec이 Vega-Lite보다 길어 비용이 는다. agent가 Vega를 정확히 쓴다는 근거가 없다 |
| 페이지 전환 효과(v2 의도 5) | 학습 효과의 근거가 외부에도 우리 측정에도 없다. 만들려면 우리 runtime이 필요하다 |

v2 `plan.md`는 "Vega-Lite를 그림 층으로" 쓰는 안을 기각했다. 이유는 두 가지였다. 첫째, 프레임마다 모델을 그리는 애니메이션과 도식에 맞지 않는다. 둘째, agent가 배울 계약이 하나 더 생긴다. v3에서 이 이유가 어떻게 바뀌는지는 다음과 같다.
- 애니메이션: `view.signal`로 `t`를 바꾸면 된다(위 근거).
- 도식: rule 밖의 자유 HTML로 옮겼다.
- 계약: 우리 runtime이 없으므로 Vega-Lite가 유일한 계약이다.

## 알려진 위험

- v1은 자유 HTML이었고 일반 요청 대비 토큰 8.2배였다. 그 비용의 58%는 audit·검증 반복이었고, 탐색한 kit 문서가 최대 85KB였다(`archive/v2:plan.md` "v1에서 확인한 것"). v3는 반복 audit이 없고, 검증은 서브에이전트 1회이며, 우리 kit 문서도 없다. 그래도 비용이 1.5배 안에 든다는 근거는 아직 없다. 측정 전까지는 목표일 뿐이다.
- agent가 Vega 수식 문법(expression)을 정확히 쓰는지에 대한 근거가 없다. rule 검사가 틀린 값을 잡는다.

### 제공 환경 제약 (공식 문서, 2026-10-24 확인)

| 사실 | 출처 |
|---|---|
| Claude Code가 게시하는 artifact는 cdnjs, unpkg, Tailwind·jQuery CDN, jsDelivr의 `/npm/` 등 일부 경로에서만 스크립트를 불러온다. 글꼴은 Google Fonts만 허용된다. `fetch`·XHR는 페이지 자신의 origin과 Google Fonts에만 닿는다 | https://code.claude.com/docs/en/artifacts "Page constraints" |
| claude.ai 코드 실행은 "Python or Javascript"를 실행한다. 네트워크가 켜져 있으면 npm registry에서 패키지를 설치한다. Free·Pro·Max는 네트워크가 기본으로 켜져 있고, Team·Enterprise는 관리자가 설정한다. 네트워크가 꺼지면 "pre-installed packages only"다 | https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude |

- 따라서 Vega-Lite spec의 데이터는 `url`이 아니라 `values`로 넣는다. artifact에서는 외부 데이터 요청이 막힌다.

## 열린 질문

- claude.ai 대화에서 만든 artifact가 허용하는 외부 스크립트 출처는 공개 문서로 확인하지 못했다. Claude Code artifact의 목록만 확인했다.
- claude.ai 코드 실행 환경에서 Node를 실행할 수 있는지는 문서에 명시되어 있지 않다("Javascript"만 있다). 네트워크가 꺼진 환경에서는 vega 패키지를 설치할 수 없다.
- rule 검사가 기준점을 어디서 받는가: agent가 HTML 안에 선언할지, 별도 파일로 둘지.
- 퀴즈 정답을 프로그램이 읽을 수 있게 HTML에 어떻게 표시할지.
