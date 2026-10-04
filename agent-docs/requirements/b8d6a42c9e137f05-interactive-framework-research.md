# 다양한 도메인을 위한 상호작용 프레임워크 검색·추천

상태: 2026-10-04 조사에 따른 추천 중 **Observable Framework 기본 표현 엔진과 공통 학습 모듈·도메인별 모델 구성이 채택 승인되었다.** 학습 화면은 agent가 실행하는 로컬 정적 HTTP 서버로 제공한다. marimo WASM은 Python 계산용 후속 확장 후보다. 버전·패키지 도구·개별 구현 spec은 별도로 결정한다. [PLAN.md §12](../../PLAN.md#12-표현-프레임워크--확정)의 선정 근거이며, ADR이나 교육 효과 검증 기록이 아니다.

## 1. 추천

**Observable Framework를 기본 표현 엔진으로 추천한다.** 설명 문서, 입력 조작, 계산, 시각화의 연결을 맡기고, Learn to Tell의 학습 흐름·수행 기록·결과 내보내기는 별도 공통 모듈로 작성하는 방향이다. Python 실행이 꼭 필요한 수업은 marimo의 WASM export를 후속 확장 후보로 둔다. 이 선택은 아래 기능과 프로젝트 조건을 비교한 설계 판단이다.

Observable Framework는 Markdown 안의 JavaScript로 상호작용을 작성하고 정적 사이트를 생성한다. 입력에 의존하는 계산과 출력은 입력 변경 시 다시 실행된다. 사용자 정의 HTML 입력도 연결할 수 있다. [공식 개요](https://observablehq.com/framework/), [Reactivity](https://observablehq.com/framework/reactivity) — 각각 PRIMARY 88.

이 연결 방식은 ‘조건 변경 → 결과 관찰 → 설명 연결’에 적합하다고 판단한다. 실제 활용·실패 예시, 모델의 정확성, 설명의 질은 콘텐츠 작성·검토의 책임이다. 프레임워크를 채택했다는 사실로 교육의 성질 2 전체나 전 도메인 지원이 충족되었다고 판정하지 않는다.

## 2. 후보 비교

아래의 우선순위와 부담 평가는 이 프로젝트에 대한 판단이며 제품 기능 점수가 아니다. ‘정적’은 계산 backend 없이 제공할 수 있다는 의미로 사용한다. 로컬 HTTP 서버를 쓰는 방식과 인터넷 없이 실행하는 조건을 구분한다.

| 후보 | 공식 자료에서 확인한 기능 | 프로젝트에 대한 판단 |
| --- | --- | --- |
| **Observable Framework** | Markdown·reactive JavaScript, 표준·사용자 정의 입력, 다양한 시각화 라이브러리, 정적 빌드. [개요](https://observablehq.com/framework/), [Reactivity](https://observablehq.com/framework/reactivity) — PRIMARY 88 | **기본 후보 1순위**. 설명 속의 조작과 계산을 연결하기 좋다. 수업 상태·제출 이력·평가·내보내기는 추가 구현한다. |
| **Idyll** | 상호작용 설명 문서와 독립 웹페이지 생성, 변수 변경에 따른 React 컴포넌트 갱신, D3·P5·npm 라이브러리 연결. [공식 문서](https://idyll-lang.org/docs) — PRIMARY 88 | **대안 2순위**. 교육 자료의 표현 목적에 잘 맞는다. 전용 문법과 React 컴포넌트 작성 부담을 비교해야 한다. 현재 의존성 호환성과 유지보수 상태는 이번 조사에서 확인하지 못했다. |
| **marimo** | 코드를 숨긴 app 형태, WASM HTML의 정적 제공, Python runtime·패키지를 함께 받는 offline export. [Apps](https://docs.marimo.io/guides/apps/), [Self-host WASM](https://docs.marimo.io/guides/publishing/self_host_wasm/) — PRIMARY 88 | **Python 계산용 확장 후보**. 기본 JavaScript 계산만 필요한 첫 통계 수업에는 Python runtime을 추가할 필요가 작다고 판단한다. 일반 `marimo run`은 Python app 서버이며 정적 WASM 제공과 구분한다. |
| **Quarto + Observable JS** | 설명 문서 안의 reactive JavaScript, Shiny, widget을 통한 상호작용. [Interactivity](https://quarto.org/docs/interactive/) — PRIMARY 88 | **문서 출판 중심 대안**. 문서·보고서 형식이 우선이면 재검토한다. 첫 버전의 학습 상태 관리와 결과 기록은 별도 작성해야 하므로 우선순위를 낮춘다. Framework와 Observable JS의 작성 문법은 구분한다. |
| **JupyterLite** | 정적 HTTP 서버에서 노트북 환경 제공, Python kernel·패키지를 로컬 자산으로 묶는 offline 구성. [Standalone](https://jupyterlite.readthedocs.io/en/stable/quickstart/standalone.html), [Offline](https://jupyterlite.readthedocs.io/en/stable/howto/configure/advanced/offline.html) — PRIMARY 88 | **학습자가 직접 코드를 수정하는 수업의 후보**. 현재 목표인 짧은 조작 중심 수업에는 노트북 환경의 추가 부담이 크다고 판단한다. |

이 비교는 설치·빌드·브라우저 실험 전의 문서 기반 평가다. 실행 속도, agent 생성 성공률, 접근성, 오프라인 성공은 아직 측정하지 않았다.

## 3. 실행·배포 제약

### Observable Framework

- 빌드 결과는 정적 서버에서 제공할 수 있다. 추천 경로는 agent가 수업을 생성·빌드하고 로컬 HTTP 주소를 여는 것이다. 파일 더블클릭에 의존하는 경로는 이 추천의 검수 기준으로 삼지 않는다. [Deploying](https://observablehq.com/framework/deploying) — PRIMARY 88.
- `npm:` import는 preview/build 때 다운로드되어 자산으로 제공된다. 원격 URL import는 같은 방식으로 묶이지 않는다. 특정 동적 import·추가 자산도 선언 방식에 제약이 있다. 따라서 외부 API·원격 폰트·지도 타일 등까지 오프라인이 되는 것은 아니다. [Imports](https://observablehq.com/framework/imports) — PRIMARY 88.
- 학습 중 오프라인 조건을 만족하려면 필요한 데이터·자산을 함께 묶고 외부 요청을 막은 상태에서 검수해야 한다. 최초 설치·빌드까지 오프라인이어야 하는지는 별도 결정 사항이다.
- 기본 npm import는 최신 버전으로 해석될 수 있다. Framework와 수업에서 import하는 라이브러리를 함께 버전 고정하고, 캐시만으로 재현성을 보장한다고 간주하지 않는 방식을 제안한다. [Imports](https://observablehq.com/framework/imports) — PRIMARY 88.
- 공식 GitHub API에서 `archived=false`, `disabled=false`, `pushed_at=2026-05-15T21:33:09Z`, 라이선스 `ISC`를 확인했다. 최근 push는 최근 릴리스나 유지보수 지원 약속을 뜻하지 않는다. **유지보수 지속성과 지원 환경의 의존성 상태는 M0에서 검토한다.** [공식 저장소 메타데이터](https://api.github.com/repos/observablehq/framework) — PRIMARY 88, 2026-10-04 확인.

### Python 확장의 경계

marimo의 `--offline` export는 Python runtime과 브라우저 호환 패키지를 묶지만, export 과정에는 인터넷과 Playwright/Chromium이 필요하다. 수업 코드가 요청하는 데이터·API·JavaScript 자산은 따로 처리해야 하며, offline export도 HTTP로 제공해야 한다. [Self-host WASM](https://docs.marimo.io/guides/publishing/self_host_wasm/) — PRIMARY 88.

JupyterLite도 kernel·패키지별 offline 구성이 필요하다. PWA 캐시 방식은 최초 연결이 필요할 수 있으므로, 이미 캐시된 브라우저에서만 성공한 것을 오프라인 배포 검증으로 삼지 않는다. [Offline](https://jupyterlite.readthedocs.io/en/stable/howto/configure/advanced/offline.html) — PRIMARY 88.

## 4. ‘다양한 도메인’의 구체적인 의미

공통화할 것은 **입력 → 모델 → 출력 → 시각·텍스트 표현 → 설명·실제 예시 → 이해 확인**의 연결이다. 모든 개념을 슬라이더나 하나의 차트로 표현하지 않는다. 아래는 라이브러리 연결 기능을 바탕으로 한 수업 설계 가능성의 추론이며, 구현·범용성 검증 결과가 아니다. Observable의 공식 개요에는 Plot, D3, Graphviz, Mermaid, KaTeX 등 연결 가능한 라이브러리가 소개되어 있다. [공식 개요](https://observablehq.com/framework/) — PRIMARY 88.

| 표현 유형·분야 예 | 바꾸는 조건과 관찰 결과 | 필요한 표현·한계 |
| --- | --- | --- |
| 수량 관계: 통계 검사 | 집단 비율·검출률·오탐률 → 예상 개수·양성 중 결함 비율 | 표와 분할 그림. 현실에서 검사 성능을 독립 조절할 수 있다는 의미는 아니다. |
| 시간·과정: 소프트웨어 대기열 | 도착 패턴·처리 시간·작업자 수 → 대기·처리 순서 | 사건 타임라인·대기열 상태. 확률 과정이면 seed·분포·시간 범위를 명시한다. |
| 관계·규칙: 권한 설계 | 역할·자원·규칙 → 허용·거부 판정 | 행렬·관계 그래프·판정 근거. 선택한 정책 모델 밖의 실제 시스템에 일반화하지 않는다. |
| 시나리오·논증: 인과 주장 | 비교 집단·누락 조건 → 주장에 필요한 가정·반례 | 사례 카드·관계도·선택 이유. 수치 모델이 없는 주장에 계산된 확률을 붙이지 않는다. |

모델·사례·oracle은 도메인별로 작성한다. 구현은 [SimulationContract](c10a7e6b94d20f38-learning-contract.md#simulationcontract)를 따라 입력 의미·단위·범위·가정·실패 조건을 유지해야 한다. 새로운 분야에서 맞는 표현이나 검증 가능한 모델을 만들 수 없으면 한계를 기록하고 해당 수업 생성을 보류한다.

## 5. Learn to Tell에서 추가할 부분

다음은 프레임워크가 아니라 기존 학습 계약이 요구하는 제품 기능이다.

- 예측 제출·결과 공개·새 사례 확인을 구분하고, 최초 예측과 재시도 이력을 보존한다.
- reactive 출력 갱신과 수행 기록을 분리한다. 화면 재계산이 중복 제출을 만들거나 제출 기록을 초기화하지 않도록 한다.
- 설명·시뮬레이션 왕복 시 입력·미제출 응답·위치를 유지한다.
- 키보드 조작과 텍스트·표 대체 표현을 제공한다. 라이브러리 연결 가능성을 접근성 통과로 간주하지 않는다.
- `SessionResult` JSON을 명시적으로 내보내고 agent가 검증·가져온다. 정적 HTTP 서버는 화면 자산만 제공하며 map 저장 bridge로 확대하지 않는 범위를 제안한다.

## 6. 채택 결과와 실행 확인

**기본 표현 엔진 선정은 완료했다.** 채택된 구성은 ‘Observable Framework 기본 + 공통 학습 모듈 + 도메인별 모델’이며, Python/WASM은 후속 확장 후보다. 실행 검증은 마일스톤에서 진행한다.

다음 기술 검증 항목은 PLAN의 M0–M2에 연결한다. 개별 구현은 승인된 workflow spec에 따라 진행한다.

1. 통계 대표 수업에서 조건 변경에 따른 계산·표·그림의 일치와 기준 계산값을 확인한다.
2. 다른 표현이 필요한 한 분야를 사용자와 선택하고, 입력 변경·결과·설명·실패 예시를 연결할 수 있는지 확인한다.
3. 빌드한 자료를 새로운 브라우저 세션에서 외부 네트워크 요청 없이 로컬 HTTP로 열어 조작하고, 구조화된 결과 파일을 내보낸다.
4. 예측 기록 보존·중복 제출 방지·설명 왕복·키보드 흐름을 확인한다.
5. 지원 OS·브라우저에서 재현 가능한 고정 버전 빌드와 의존성·배포 조건을 검토한다.

§12는 확정된 표현 프레임워크와 검수 범위를 기록한다. 도메인별 한계·새 표현 요구는 수업 단위로 계속 기록한다. 유지보수나 실행 조건이 충족되지 않으면 Quarto + Observable JS 또는 Idyll을 다시 비교한다.

## 7. 검색 기록과 근거의 한계

scored-web-search의 `official-docs` 모드와 `--no-net`으로 출처를 선별했다. 도구 기본 목록에 없는 후보의 공식 문서·제작자 저장소·공식 API 경로는 점수 산정 전에 임시 정책에 1차 출처로 등록했다. 문서의 정식 이전 주소는 원래 공식 주소의 redirect로 읽었다. PRIMARY 88은 **출처 역할에 대한 휴리스틱**이며 프레임워크의 적합성·교육 효과·최신성 점수가 아니다. 신뢰도 점수만으로 기능 주장을 검증하지 않고 본문의 해당 내용을 확인했다.

읽은 자료는 Observable 4개 문서와 저장소 API, Idyll 개요·제작자 저장소, marimo 2개 문서, JupyterLite 2개 문서, Quarto 개요다. Idyll 사용자 정의 컴포넌트 페이지는 가져오기에 실패하여 근거로 쓰지 않았다. GitHub API는 웹 도구에서 접근되지 않아 공개 API를 읽기 요청으로 확인했다. 낮은 점수의 검색 결과는 결론의 근거로 사용하지 않았다. 외부 설명을 실제 수업의 근거로 쓰는 일은 별도 콘텐츠 조사다.

49개 URL 수집 → 43개 선별 통과 → 12개 자료 열람.
