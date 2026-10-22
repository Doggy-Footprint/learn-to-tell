# gallery v2 시험 생성 결과와 고쳐야 할 생성기 결함

## Goal

- 시험 지시: "/Users/hwansu/toy-projects/learn-to-tell/measurements/20261022-all-topics/ lesson에 있는 것들 gallery에 있는 것들 모두 리스트업해줘. 그리고 archived로 옮기고, sub agent를 이용해서 fresh하게 새로운 gallery를 구성해줘. gallery리는 list-view로 볼 수 있게 해줘. 각 gallery는 실제 스킬 사용을 가정해서 sub-agent에서 제작해줘. 그걸로 품질을 테스트 할거야."
- 이 handoff: "일단 그림 퀄리티는 괜찮으니까, 테스트 결과와 고쳐야 할 항목/생성시간을 10분 대로 줄여야 한다 이 2가지를 handoff로 추가해줘. 테스트 결과는 각각 handoff에 넣어주고, 상세하게 넣어줘."
- 사용자 판정: 그림 품질은 괜찮다. 남은 일은 아래 생성기 결함을 SKILL.md·kit 문서·kit 코드·audit·lint에서 고치는 것이다(AGENTS.md "Generated Lesson Defects"). 수업 파일은 고치지 않는다.
- 생성 시간 단축은 `agent-docs/handoff/7e90f918766e0244-lesson-generation-time-10min.md`가 맡는다.

## State

- 2026-10-23 갱신: workflow run `753ff3c539424409`(spec `agent-docs/spec-logs/753ff3c539424409-generator-defects-audit-lint-docs.md` v4, complete)로 결함 1, 3, 4, 5, 6, 7, 8(전반), 9, 17, 19를 고쳤다. 브랜치 `test`, HEAD `bd8e3e4` 위 커밋하지 않은 변경:
  - 코드: `skills/learn-to-tell/kit/ltt.js`, `ltt-deck.js`, `ltt-deck.css`, `server/audit.mjs`.
  - 지시 rewrite: `SKILL.md`, `kit/API.md`, `kit/api/deck-contracts.md`, `kit/api/rules.md`, `kit/api/internals.md`. run 뒤 사용자 지시로 문서 분량 상한 테스트를 모두 지웠다(`tests/api-docs.test.mjs` API.md 11,500 code points·API.md+부품 문서 18,000·표 행 300, `tests/generator-defects.test.mjs` SKILL.md+API.md 36,139 B). 문서 분량은 사용자가 직접 관리한다. 같은 때 RV-1이 놓친 두 가지를 고쳤다: API.md "부품 찾기"의 "걸리지 않으면 다른 축의 말로 한 번 더 찾고, 그래도 없으면 직접 짠다" 복원, SKILL.md 검증 절의 중복 문장(`check`는 … 두 상태에서 읽어 합친다) 제거.
  - 테스트: 새 `tests/generator-defects.test.mjs`, `tests/generator-defects-audit.test.mjs`, `tests/term-boundary.fuzz.mjs`(npm test 밖), `tests/fixtures/generator-defects/`; 갱신 `api-docs`, `kit`, `lint-rules`, `scene-types`, `shots` 테스트, `tests/fixtures/check/` 덱 11개(keywords에 `next`), `tests/gallery-audit.baseline.json`(갤러리 18페이지 × 2크기 각 +1, 모두 `keywords-no-next`).
  - `npm test` 1347/1347 pass, fuzz 20,000건 차이 0, 손 mutation 14건 모두 검출.
- 아래 첫 State 항목들은 이 handoff를 처음 쓴 시점(HEAD `8ed403f`)의 기록이다. 그때의 갤러리 변경은 `f2ce682`로 커밋되었다.

- 브랜치 `test`, HEAD `8ed403f`. 커밋하지 않은 변경:
  - 옛 갤러리 `site/gallery/{index.html, cache-ttl.html, cognition, finance, gpu, knowledge-graph, linear-algebra, network, pedagogy, philosophy, physics, uiux}`를 `site/gallery/archived/20261022/`로 `git mv`(staged). `catalog.html`, `scenes.html`, `shots/`, `stale/`는 그대로.
  - 새 갤러리(untracked): `site/gallery/index.html`(list-view 표) 과 `site/gallery/{art,backend,cognition,finance,gpu,knowledge-graph,math,ml,network,pedagogy,philosophy,physics,uiux}/*.html` 17개. `measurements/20261022-gallery-v2/build-gallery.mjs`가 `home/lessons/<id>/lesson.html`을 복사하고 인덱스를 쓴다.
  - 옛 갤러리에 묶인 테스트 정리: `tests/gallery.test.mjs`(vendor 지원표·옛 ltt-meta `domain/pattern/mode`·13페이지 개수·옛 페이지 CSS·vw 검사 삭제, `archived/` 제외, ltt-meta는 API.md 필드 `topic, audience, theme, medium, decision`), `tests/autolayout.test.mjs`(ontology KG 회귀를 `tests/fixtures/autolayout/ontology-kg.json`로 분리), `tests/server.test.mjs`(`/gallery/index.html`), `skills/learn-to-tell/server/audit.mjs`(`GALLERY_SKIP_DIRS`에 `archived/`), `tests/gallery-audit.baseline.json`(새 17개 + scenes, 두 크기 모두 0), `README.md`(기준선은 같음 비교, archived 제외 설명).
  - `npm test` 1153 pass / 0 fail.
- 시험 자료(gitignore된 `measurements/`):
  - `measurements/archived/20261022-all-topics/`: 이전 시험(옛 run).
  - `measurements/20261022-gallery-v2/`: `prompts/`(common.md + 주제 17개, 진단 고정), `home/lessons/<id>/`(outline.md, checklist.md, answers.md, storyboard.html, lesson.html, shots/, events.jsonl, result.md), `cost.md`, `record.sh`, `build-gallery.mjs`.
- 시험 조건: 수업마다 general-purpose 서브에이전트 1개(17개 병렬, 2026-10-22 22:12경 시작). common.md 지시: 진단은 주제 prompt로 고정, 서버·publish·§4 퀴즈·§6 rebuild 생략, `measurements/`·`site/`의 다른 파일은 읽지 않는다. 검증은 각 수업 에이전트가 띄운 검증 서브에이전트(최대 3회).
- 생성 뒤 내가 고친 것(생성기 결함의 증거, 수업 품질과 무관):
  - `home/lessons/20261022-ontology-triples/result.md`, `20261022-trolley-ethics/result.md`: frontmatter `aliases`·`definition`에 `: `가 있어 YAML 파싱 실패 → 값을 따옴표로 감싸고 `ltt-map rebuild` 성공(개념 92개).
  - 서브에이전트 하나가 디버깅 중 만든 self symlink `skills/learn-to-tell/kit/kit`(와 build가 복사한 `packages/ltt-kit/kit`)가 kit 빌드 테스트 4개를 깨뜨려 삭제.

## 테스트 결과

### 수업별 요약

토큰·도구 호출·시간은 수업 에이전트 완료 알림의 usage다(검증 서브에이전트 토큰 포함 여부는 알림으로 알 수 없다). 장면 수는 에이전트 보고 또는 `shots/`의 1440 장면 PNG 수.

| 수업 | 테마 | 장면 | 토큰 | 도구 | 시간 | audit | 검증 회차 | 남은 미충족 | lesson.html |
|---|---|---|---|---|---|---|---|---|---|
| cache-ttl | terminal | 12 | 176,543 | 67 | 19분 01초 | 5 | 2 | 0 | 35,094 B |
| llm-hallucination-internal | notebook | 16 | 161,455 | 67 | 20분 26초 | 6 | 3 | 0 | 35,479 B |
| color-contrast | studio | 15 | 190,903 | 86 | 20분 27초 | 6 | 2 | 7 | 35,683 B |
| anchoring | paper | 15 | 179,965 | 74 | 20분 29초 | 5 | 2 | 2, 4, 5 | 39,248 B |
| visual-hierarchy-spacing | studio | 12 | 206,822 | 101 | 21분 42초 | 7 | 2 | 0 | 34,178 B |
| retrieval-practice | paper | 14 | 180,160 | 91 | 23분 32초 | 9 | 3 | 11 | 37,239 B |
| art-of-loving | essay | 15 | 187,261 | 89 | 24분 10초 | 10 | 3 | 3회차 수정분 미검증(11, 8, 16) | 37,786 B |
| trolley-ethics | essay | 16 | 186,063 | 82 | 24분 44초 | 9 | 3 | 0 | 30,836 B |
| single-gpu-dataflow | blueprint | 15 | 200,512 | 104 | 25분 12초 | 10 | 3 | 0 | 37,569 B |
| matrix-as-transform | chalk | 16 | 209,073 | 112 | 25분 20초 | 7 | 3 | 0 | 39,724 B |
| tls13-quic | spec | 16 | 196,936 | 87 | 26분 28초 | 9 | 3 | 3a, 5a, 8a (+13·15 미검증) | 41,602 B |
| ontology-triples | spec | 15 | 226,293 | 110 | 28분 10초 | 12 | 3 | 19(수정 후 미검증) | 48,897 B |
| diversification | ledger | 15 | 241,325 | 134 | 28분 31초 | 12 | 3 | 0 | 40,737 B |
| projectile-drag | lab | 14 | 208,067 | 102 | 28분 52초 | 11 | 3 | 5, 9, 19 | 42,345 B |
| investing-basics | ledger | 18 | 234,375 | 139 | 29분 23초 | 13 | 3 | 14, 15 (+3회차 수정 미검증) | 44,801 B |
| drawing-basics | atelier | 16 | 250,867 | 132 | 29분 26초 | 7 | 3 | 18, 26 | 47,985 B |
| vector-calculus-mml5 | chalk | 16 | 306,581 | 159 | 35분 21초 | 12 | 3 | 6, 8, 12, 24 | 68,104 B |

- 합계 토큰 3,543,201, 평균 208,424. 평균 시간 25분 22초(최소 19분 01초, 최대 35분 21초). 평균 audit 8.8회, 검증 2.8회.
- audit 1회는 페이지 이벤트 기준 평균 27초(18–74초), 수업당 audit 합계 평균 3분 57초(총 시간의 약 16%), audit 사이 간격 평균 1분 22초. 수업별 표와 측정 방법은 시간 handoff의 "audit 횟수와 audit 한 번당 시간"에 있다.
- 마지막 audit은 17개 모두 두 크기(1440×900, 1280×800)에서 check 0. 이후 `npm run audit:baseline`도 17개 모두 0.
- 미충족 0으로 끝난 수업 7개(cache-ttl, llm-hallucination, visual-hierarchy, trolley, single-gpu, matrix, diversification). 나머지 10개는 미충족 또는 미검증 수정이 남았다.
- 미충족이 남은 원인 분류:
  - 검증 불가(audit이 상태를 안 찍음): color-contrast 7, anchoring 4·5, tls13 3a·5a·8a, drawing 26 — predict 공개 상태.
  - 장면 번호 어긋남(체크리스트 수정 금지): retrieval 11, investing 14·15 — 개념 나무가 덱 순서 규칙 때문에 이동.
  - 체크리스트·답안과 수업 설계 충돌: anchoring 2(예측 전 답을 숨긴 것과 충돌), vector-calculus 22↔1(보고만, 미충족 아님).
  - audit이 못 잡은 레이아웃: vector-calculus 6·12(8–10px 글자), 8·24(잘림·겹침), projectile 5(슬라이더 트랙 안 보임)·9(라벨 겹침)·19(2회차 수정이 만든 축 어긋남).
  - 내용: drawing 18(초보에게 풀이 없는 표기), ontology 19(정의 없는 용어).

### 수업별 상세

각 항목은 수업 에이전트의 최종 보고에서 옮겼다.

- **cache-ttl** — storyboard A(한 상품 키의 시간축 → λT 로그-로그 miss 곡선 → 카탈로그 결정). B(sankey)는 비율만 보이고 시간 메커니즘을 숨겨서, C(요청 격자)는 TTL 길이가 그림에 없어서 버림. audit 5회, expect 20개 일치. 검증 1회차 3건(predict takeaway가 공개 전 답 노출, hit 점 색이 answers.md와 다름, 1280에서 곡선 장면 넘침) 수정 → 2회차 없음. 보고된 결함: predict takeaway 노출, audit 넘침 미검출, 개념 나무 위치, predict 필드 형식, `LTT.sweep` `#id`가 덱 mount 안에서 찾아지는지 불명(직접 버튼 작성), 잘못된 아이콘 이름 `database`가 글자로 렌더되는데 check 통과, 체크리스트 `[shot timeline 3200]`이 clock dur 3000보다 길어 `shot-bad-time`(형식 오류라 체크리스트 수정), "미검증" 표기 규칙 없음.
- **llm-hallucination-internal** — storyboard B(점구름과 경계선 probe) + A의 token×layer 격자. A의 히트맵은 AUC 선행 교육이 필요해 버림. audit 6회(1회차 `used-before-defined` '오류 탐지'). 검증 1회차 14(predict 화면이 "Canberra"를 강조해 답 노출)·16(가상 수치에 "가상 예시" 표시 없음), 2회차 13("층 l" 미정의, l이 I로 읽힘), 3회차 없음. 논문 수치를 확인하지 못해 모두 빼고 가상 예시·개념도로 표시. 보고된 결함: overview 위치 규칙 문서 불일치, 개념 나무 부품 없음, lint 경고가 audit 출력에 없고 패널로만, 패널이 스크린샷을 가림, background.md 경로가 없을 때 규칙 없음, `[shot]` 파일 이름 연결 규칙 미문서화.
- **color-contrast** — storyboard B(회색 견본 + 대비비 곡선을 한 슬라이더로) + A의 계산 파이프라인 + C의 오개념 대비. 검증 1회차 5·7·4·16: 5(장면 6 steps가 1단계만 찍힘)는 `LTT.clock`으로 바꿔 해결, 4·16은 answers.md 표현 오류라 그대로, 7은 predict 공개 상태 미촬영이라 해결 불가 → 3회차 없이 중단. 보고된 결함: predict `choices` 형식(`label`로 써서 빈 버튼, lint·audit 통과), 공개 상태 미촬영, steps 첫 단계만 촬영, 장면 번호 이동, lint 패널, figure 함수가 `el`에 여러 형제를 넣으면 가로 열로 배치됨(deck-contracts.md에 없음), `sweep` `goal.target` 의미 불명·201점 샘플링이 정수 목표 `gv === 118`을 놓침.
- **anchoring** — storyboard A("실험실 증거 먼저", Gandhi 9/140 predict) + B의 조정 부족·증거 점 그림, C는 적용 장면에만. audit 5회(1회차 `predict-new-term` 중앙값). 검증 1회차: 장면 3 shot이 흐린 단계에서 찍힘, clock 프레임이 모두 같음, 버튼이 글자를 가림, UN·1776 사례가 소개 없이 나옴 → 모두 수정. 2회차 뒤 2·4·5 남음(2는 설계 충돌, 4·5는 공개 상태 미촬영), 3회차 생략. 보고된 결함: predict `choices`/`answer` 형식(문자열은 빈 상자), takeaway 노출, 공개 상태·steps 미촬영, `?shot&clock`을 `LTT.sweep`의 첫 render가 덮어써 모든 clock 프레임이 최종 상태, `LTT.hbars`가 `play()` 전엔 빈 막대, steps형 sweep의 `stops`/`stopLabel` 미문서화, lint 패널. 연구 수치(Englich 2006 5.28/7.81개월, Ariely 2003 $16/$56)는 기억에 의존, 원문 미확인.
- **visual-hierarchy-spacing** — storyboard A(같은 대시보드를 단계별로 고침, 12/12 → 1/12 강조) + B 단어 목록 + C 흐리게 보기. 검증 1회차 2(측정 글씨 너무 작음)·6(카드 숫자가 간격 표시보다 먼저 보임) → 2회차 없음. 개념 나무를 lint 때문에 summary 앞으로 옮기고, 검증 전에 checklist·answers 장면 번호를 고침. 보고된 결함: overview 위치 규칙 불일치, predict 형식, hook `art` HTML이 원형 칸을 넘어 제목과 겹쳐도 check 0, contrast 장면이 넓은 목업을 약 270px 칸에 잘라 넣음(`LTT.mock.browser` `width` 무시), `LTT.redline` px 글씨 6–7px·옵션 없음, glossary "pt"가 "perceptual" 안에서 걸림, lint 패널, figure HTML 안 `{{용어}}` 변환 여부 미문서화.
- **retrieval-practice** — storyboard A(실험 데이터로 반박 + 예측: Ebbinghaus, Roediger & Karpicke 2006, Kornell 2009). B(기억 강도 모델)는 측정 안 된 곡선을 보이게 되어, C(주간 달력)는 수치가 약해 버리고 달력만 계획 장면에 남김. audit 9회(1회차 정의 전 용어 4건). 검증 1회차 5건(나무 위치, 미정의 용어, 출처 안 보임, 반올림 불일치, 강조색이 범례와 충돌), 2회차 5건 → 3회차 뒤 11(개념 나무 장면 번호·다음 개념 이름) 남음. 보고된 결함: 개념 나무 vs 덱 순서(나무를 overview로 씀), 체크리스트는 장면 번호 대신 제목으로 가리켜야 함, lint 패널·audit 출력에 경고 없음, 1280 하단 잘림 미검출(직접 `max-height: 58vh` → SVG 글자 10–11px, 이것도 미검출), recall이 있는 summary가 takeaway를 숨겨 "한 장 정리"로 인정 안 됨, `aside`·keywords `signals`/`queries` 형식·`basis` 안 `{{}}` 미문서화, `?shot&clock`이 그림까지 스크롤해 장면 제목이 잘림, background.md 없음.
- **art-of-loving** — storyboard A(원과 경계선 기하 은유) + B의 기준 비교표. audit 10회. 검증 1회차 3·4·8·10·14, 2회차 14·3, 3회차 11·8·16 → 고쳤으나 재검증 없음. 11은 표지 sub에 `{{기술}}`을 넣어 고쳐서 예측 전에 팝오버가 실마리를 줄 수 있다. 보고된 결함: d3가 필수인지 문서로 알 수 없음(빼면 `ltt-parts.js` 예외로 덱이 검게 나옴), audit이 깨진 페이지를 "check 0 · shots 1"로 통과(단서는 `shot-unknown-clock`뿐, 원인은 임시 서버 + headless Chrome으로 콘솔을 직접 봐서 찾음), lint 경고가 audit에 없음, 1280 takeaway 잘림 미검출, predict 형식, 책 제목 『사랑의 기술』의 '기술'이 `used-before-defined`, SVG 약 11px 글자 미검출, `LTT.record`를 어디에 쓰는지 모호.
- **trolley-ethics** — storyboard B(인과 사슬) + A의 선로 지도 + C의 응답 막대. 생성 중 단계형 사슬을 2×2 격자(사람 유무 × Switch/Footbridge)로 바꿈. audit 9회 + storyboard에 1회. 검증 1회차 "한 명" 라벨이 다섯 명 위, 2회차 밀기 전후 위치 안 보임, 3회차 없음. Awad et al. 2020(PNAS) Switch 81%, Loop 72%, Footbridge 51%는 웹으로 확인. 보고된 결함: predict `choices`(`{id, label}`로 빈 버튼), overview·keywords 순서가 허용된 네 절에 없음, lint 패널, steps 첫 단계만 촬영, `autoLayout` + `LTT.diagram` SVG가 자연 크기로 작거나 넘침(100% 폭은 화면 밖, check 0), 한 audit 실행에서 1440 shot 22개 중 21개만 저장(s14 누락)하고 보고 없음(재현 안 됨), storyboard 렌더 확인 단계 없음.
- **single-gpu-dataflow** — storyboard A(파이프와 계산부 → 시간 막대 → roofline). B(roofline 먼저)는 "아예 모름"에 너무 가파르고, C(주방 비유)는 바이트·FLOP 수치와 연결이 흐려짐. audit 10회, expect 15개 일치. 검증 1회차 13·25(compare 장면이 공개 전 판정 노출, 장면 9 readout 잘림, 장면 6 라벨·선 겹침, 용어 카드 제목 넘침, overview 번호 배지가 선을 가림), 2회차 18·20·22(산술 강도와 ridge 혼동 문장, hook에서 FLOPS 정의 전 사용, summary 제목·내용 불일치), 3회차 없음. 규칙 위반: lesson.html을 `sed`로 1회 수정, checklist·answers 장면 번호를 두 번 고침. 보고된 결함: predict·compare takeaway 노출, audit 미검출(recall 9개 summary가 1280에서 9번째 잘림, mount 장면 readout이 하단 내비에 잘림, 아이콘 있는 용어 카드 제목 넘침), `used-before-defined`가 mount HTML 안 `{{}}`를 보지 않음·"FLOPS" 안의 "FLOP"을 사용으로 셈, 덱 순서 규칙 분산, lint 패널, SVG `<text>` 안 `{{}}`·mount 반환 형식 미문서화.
- **matrix-as-transform** — storyboard A(격자 자체가 변형) + C의 색칠한 행렬 열. B(점 추적 표)는 행렬식 넓이 그림이 없어 버림. audit 7회, expect 20개 일치. 검증 1회차 4건(hook 그림이 너무 작음, "e2의 상이 (1,0)" 질문 화면 라벨 잘림, 합성 장면이 첫 단계만 찍힘 등), 2회차 2건(행렬식·고유벡터 그림 라벨·선 겹침, "det = −6" 목표 상자가 현재 값처럼 보임), 3회차 없음. 보고된 결함: `LTT.plane`이 한 줄 문서(vectors·shape 형식, 라벨, `.to(m)` 애니메이션 여부 없음)라 직접 작성, `figure`가 있는 장면에 `type: "figure"`가 없으면 빈 화면인데 check 0(첫 그림 전부 빈 화면), steps 첫 단계만 촬영(정적 4패널로 바꿈), hook `art` 약 240px 고정·DOM 노드를 넘기면 "[object HTMLDivElement]"(kit 클래스 이름을 모른 채 `:has()` CSS로 상자 크기를 덮어씀 — 이것이 갤러리 vw 검사에 걸린 `min(440px, 34vw)`), `LTT.expect` 문자열 값이 같아도 불일치, figure HTML·제목 안 첫 등장 용어가 `used-before-defined`, lint 패널, 테마마다 색 순서가 달라(chalk는 1=파랑, 2=주황) 본문의 색 이름이 틀림.
- **tls13-quic** — storyboard A(RTT 시간축에 맞춘 사다리 도식) + B의 Gantt 막대(손잡이 장면) + C의 패킷 봉투(QUIC 계층 도식, "HTTP/3가 TLS를 없앴다" 오개념). audit 9회, expect 13개 일치. 검증 1회차(overview QUIC 패널 둘 다 ④, 사다리 라벨·화살표 겹침, lint 경고 3), 2회차(RTT 10ms에서 막대가 거의 안 보임 → 축 자동 조정, hook과 카드 장면이 TLS 1.3 예측 답 노출, 질문 그림이 답 암시, summary 제목 없음, "handshake" 카드 제목 넘침), 3회차 13·15 수정 후 미검증, 3a·5a·8a는 공개 상태 미촬영으로 남음. 보고된 결함: SKILL.md가 요구하는 "정답 공개 그림만 보고…" 항목을 검증할 수단 없음, 카드 제목 넘침·SVG 라벨 겹침 미검출, 개념 나무 위치, `predict-new-term`이 predict 질문 안 `{{}}` 정의를 오류로 보고 해결법은 출력에만 있음, 손으로 그린 SVG 안 평문 용어(UDP)는 `used-before-defined`가 못 잡음, `LTT.sweep`이 허용된 네 절에 없어 "조합 조각"을 봐야 함("부품 찾기"·"원칙"도 사실상 필요), `LTT.sequence`에 시간 축척 없음, 체크리스트 수정 금지 때문에 `[shot l0 2200]`을 유지하려 코드에 `still` 옵션을 덧댐.
- **ontology-triples** — storyboard A("표가 풀린다": 같은 직원·부서 데이터가 표 → 트리플 → 추론 → 두 출처 병합, 수치가 장면 사이로 이어짐 8→10, 3→4, 7→8). audit 12회(1회차는 d3를 안 불러와 덱이 안 그려짐). 검증 1회차 7·12·15·19·23, 2회차 10·19, 3회차 19(장면 1 부제의 "추론" 미정의) → 고쳤으나 미검증. 개념 나무를 장면 12로 옮기고 검증 전에 checklist·answers 번호 수정. 보고된 결함: 스크립트 오류가 audit 실패가 아님(d3 누락으로 빈 페이지가 "check 0 · shots 1", `--json`에도 없음, 원인은 임시 정적 서버 + headless Chrome으로 찾음), predict takeaway 노출(takeaway·recall을 빼서 summary에서도 빠짐), 공개 상태 미촬영, lint 경고 3종이 audit 출력에 없고 패널이 그림을 가림, contrast `visual` HTML이 상자를 넘쳐 겹침·1280 takeaway가 하단 내비에 가려짐·shrink-to-fit 래퍼 안 SVG가 절반 크기 — 모두 check 0, compare `form: "table"`·keywords `signals`/`queries` 형식 미문서화, glossary 키 `a`가 모든 "a"에 걸림(`{{a|rdf:type}}`로 우회), `predict-new-term` 때문에 답을 주지 않고 앞 장면에서 정의하기 까다로움.
- **diversification** — storyboard 2("넓이 정사각형": 포트폴리오 분산을 정사각형 네 칸으로, ρ가 겹침 칸을 깎음) + 1의 상쇄 막대 + 3의 위험–수익 평면. audit 12회. 검증 1회차(predict 선택지 글자 없음, 장면 5 takeaway 잘림), 2회차 4건(1280 장면 10 takeaway 잘림, 곡선이 "9.56%" 라벨을 지남, 장면 3에서 σ 정의 전 사용, 장면 6 "가상 예시" 표시 없음), 3회차 없음. 보고된 결함: predict `choices`(`label` → 빈 버튼, lint·audit 통과), figure 함수 반환 계약 불명(인자 `el`을 그대로 `{el}`로 반환 → `check-failed: appendChild … contains the parent`), `points`/`pointsOn`이 SVG에서 조용히 아무것도 안 함·`[data-annotate]` 래퍼에선 위치가 어긋남, audit 미검출(분리된 div 그림이 약 300px로 접혀 SVG 글자가 작아짐, 장면 8 정사각형 글자 7–9px, takeaway가 하단 내비에 가려짐), lint 패널, steps 첫 단계만 촬영(clock 누적 그리기로 바꿈), `sweep` `#id-v` 선택 여부 미문서화, "분산 투자"가 glossary "분산"과 충돌, keywords `signals`/`queries` 형식, 서버 금지라 storyboard.html을 렌더해 보지 못함.
- **projectile-drag** — storyboard A(화면 속 궤적) + B의 vx 넓이 그림 + C의 힘 곡선·최적 각 곡선. audit 11회, expect 15개 일치. 검증 1회차 8건, 2회차 4건, 3회차 3건 남음: 5(장면 3 속도 슬라이더 초기값에서 궤적이 거의 안 보임), 9(장면 8 진공 사각형 오른쪽 변이 "착지 10.6"·"(진공의 0.51)" 라벨을 가로지름), 19(2회차에 x축 라벨을 4px 옮겨 "0 m"가 발사점과 어긋나고 착지점이 41.3 대신 약 39.4로 읽힘). 보고된 결함: figure 함수가 문서에 붙기 전에 실행돼 `LTT.sweep`이 `#id`를 못 찾음(`check-failed: sweep param has no element`) → 그 예외가 뒤 장면 clock까지 죽여 `shot-unknown-clock`으로만 보임(requestAnimationFrame으로 우회), hook `art`는 작은 아이콘 칸(함수는 "okArt(n)" 글자로, 넓은 SVG는 약 240px로 눌리고 글자 자동 확대로 겹침, `big` 클래스도 확대) — 모두 check 0, 라벨·선·글자 겹침, SVG 가장자리 잘림, 안 보이는 슬라이더 트랙 미검출, `stopLabel`·keywords `signals` 형식, predict 형식은 "조합 조각"에만, lint 패널(overview·sub 누락 경고), 본인 체크리스트 오류 `[shot fan 4020]`(clock은 5,300ms).
- **investing-basics** — storyboard A("한 축 장부": 0–30년·1,000만원 축을 복리와 수수료에 재사용) + B의 종목 수에 따라 좁아지는 분포. C(두 사람)는 시뮬레이션 1회의 중앙값을 일반론으로 만들어 버림. audit 13회, expect 28개 일치. 검증 1회차(predict takeaway 노출, 카드·summary·그림 잘림), 2회차(영어 부제 불일치, 1280 잘림, 이전 장면 연결 없음), 3회차 12·14·15·16·21 → 12·16·21 수정 후 audit만, 14·15(장면 번호) 남음. 보고된 결함: 개념 나무 vs 고정 순서(summary 뒤에 두자 lint 거부), takeaway가 하단 내비에 반복해서 잘림(덱의 "78% 축소"로도 안 고쳐지고 steps 장면의 그림은 줄지 않음) — check 0, lint 경고 3종이 audit에 없음, glossary "상관"이 "상관없이"에 걸림, summary가 takeaway·recall 12개를 모아 1280에서 넘침(상한 문서 없음, 6개로 줄임), knob 장면 안 `ltt-stat` 숫자가 너무 큼, mount innerHTML 안 `{{용어}}` 변환 여부·kit CSS 링크 필요 여부 미문서화, steps 첫 단계만 촬영.
- **drawing-basics** — storyboard A(정물 하나를 끝까지) + B의 식탁 사다리꼴·얼굴 눈높이 대비. audit 7회, expect 11개 일치. 검증 1회차 3·13·15·17·26 + 1280 s07 핵심 줄 잘림, 2회차 3·26 + s15 그늘이 오히려 밝음, 3회차 뒤 18(원근 장면 "그림 거리 f"·(cosθ, 0, sinθ) 표기·단위 없는 소실점 수치 +866/−289)·26(타원 predict 정답 그림 공개 상태 미촬영) 남음. 보고된 결함: predict takeaway 노출(빼서 summary에서도 빠짐), 공개 상태·steps 뒷단계 미촬영(steps를 버리고 한 장으로), mount·figure 함수 시점에 SVG가 문서에 없어 `getTotalLength()`가 0 → `LTT.clock` 선 그리기가 처음부터 끝 상태(원인 찾는 데 검증 2회 소모), predict `choices`·contrast `before`/`after` 형식이 네 절에 없음, `LTT.sweep` `#id` 조회 범위 미문서화, audit 미검출(작은 viewBox에서 CSS px 글꼴 과확대·라벨 잘림, 1280 핵심 띠 잘림), 덱 순서·recall 누락은 lint 패널에만, 개념 나무 부품 없음.
- **vector-calculus-mml5** — storyboard A(야코비안을 국소 선형 사상으로, 모양 라벨) + B(모양 규칙 장면) + C(역전파 장면). audit 12회(1회 Chrome `probe-failed` "Session with given id not found", 재실행 통과), expect 17개 일치. 검증 1회차 8건, 2회차 8건, 3회차 4건 남음: 6(야코비안 범례·안내 글자 8–9px), 8(모양 규칙 장면 takeaway가 1440에선 내비 아래, 1280에선 화면 밖), 12(행렬 기울기 장면 보조 글자 9–10px), 24(1280에서 summary 9번째 질문 잘림, overview 배지 2·9가 Δx 열·H 칸을 가림). 보고된 결함: audit이 넘침·작은 글자 미검출(내비에 잘림, 스크롤로 제목 가려짐, SVG viewBox 축소로 7–9px — 원인은 viewBox 축소, split 레이아웃 해설 레일이 폭 절반 차지, `layout: "stack"` 넘침), 레이아웃별 그림 가용 크기 미문서화, recall 9개 summary가 1280에 안 들어감(kit 생성이라 수업에서 못 고침), overview 위치, steps 첫 단계만 촬영, `type` 없이 `figure`만 있는 장면은 빈 상자에 경고 없음, `LTT.sweep` `steps`/`stopLabel`·`LTT.facts`는 예시로만, 다이얼 각도 규약과 수학 각도 대응 미문서화, SVG 표현 속성 `fill="var(--…)"`가 적용 안 됨(`style()` 사용), 본문 색 이름과 테마 색 불일치, 체크리스트 22(예측 전 답 금지)와 1(편미분 장면에서 df/dx를 행으로 보임) 충돌.

## 고쳐야 할 항목

보고 수는 17개 보고 중 해당 결함을 직접 적은 수업 수다. 우선순위는 보고 수와, 생성 시간·검증 회차를 직접 늘린 정도로 정했다(시간 근거는 시간 handoff).

| # | 결함 | 보고 수업 | 고칠 곳(후보) |
|---|---|---|---|
| 1 | lint 경고(overview 위치, term `visual` 누락, takeaway에 recall 없음, sub 누락 등)가 audit의 check 출력에 없고, 열린 lint·expect 패널이 `?shot` 스크린샷의 오른쪽·아래를 가린다 | llm, color, anchoring, visual, retrieval, art, trolley, gpu, matrix, tls, ontology, diversification, projectile, investing, drawing (15) | audit.mjs가 lint 결과를 check로 보고, `?shot`에서 패널을 숨김 |
| 2 | audit이 레이아웃 결함을 못 잡는다: 장면 넘침·하단 내비에 가려진 takeaway, 라벨·선·글자 겹침, SVG viewBox 축소로 7–11px 글자, 카드 제목 넘침, hook `art` 넘침, 접힌 그림 | cache, color(간접), visual, retrieval, art, trolley, gpu, matrix, tls, ontology, diversification, projectile, investing, drawing, vector (14) | audit/check 규칙 + 결정적으로 고칠 수 있는 것은 kit 자동 보정(Design Principle 3) |
| 3 | 개념 나무(SKILL §1-3 "수업 끝")와 덱 고정 순서(summary → overview → keywords, lint는 overview가 keywords 바로 앞이길 요구, API.md는 "summary 바로 뒤"만 적음)가 충돌하고 개념 나무 부품이 없다. 나무를 옮기면 체크리스트 장면 번호가 어긋난다 | cache, llm, visual, retrieval, art, trolley, gpu, matrix, tls, ontology, projectile, investing, drawing, vector (14) | SKILL.md·API.md에 나무 위치(예: overview가 나무) 명시, lint와 문서 일치, 체크리스트는 장면을 번호 대신 제목으로 가리키게 |
| 4 | predict `choices`/`answer` 형식(`[{id, text}]`, `answer: id`)이 SKILL이 허용한 API.md 네 절에 없고 "조합 조각"에만 있다. 틀린 형식(`label`, 문자열)은 빈 버튼이 되는데 lint·audit이 통과시킨다 | cache, color, anchoring, visual, retrieval, art, trolley, gpu, tls, diversification, projectile, drawing (12) | API.md 장면 표에 형식, lintDeck이 빈 선택지를 오류로 |
| 5 | `?shot`이 predict 공개 상태(answerVisual)와 figure `steps`의 뒷단계를 찍지 않는다. `[shot]` 표지는 clock에만 된다. 체크리스트의 공개 그림 항목은 구조적으로 검증 불가 | color, anchoring, trolley, matrix, tls, ontology, diversification, investing, drawing, vector (10) | audit에 공개·단계 촬영 표지, 또는 SKILL.md가 그런 항목을 쓰지 않게 |
| 6 | predict(와 compare)의 `takeaway`가 공개 전에 보여 답을 노출한다. 피하려고 takeaway를 빼면 summary에서도 빠진다 | cache, anchoring, gpu, ontology, investing, drawing, tls(유사) (7) | kit이 공개 전 takeaway 숨김 |
| 7 | 체크리스트·answers가 장면 번호에 묶여 있어 순서 조정 때마다 어긋난다. 수정 금지 규칙 때문에 일부는 번호를 고치고(gpu, visual, ontology) 일부는 미충족으로 남김(retrieval, investing) | color, visual, retrieval, gpu, ontology, investing, tls(shot 표지) (7) | SKILL.md: 장면은 제목으로 지칭, 번호 고침은 허용 범위 명시 |
| 8 | glossary `used-before-defined`가 부분 문자열로 맞춘다("pt"⊂perceptual, "FLOP"⊂FLOPS, "a", "분산"⊂분산 투자, "상관"⊂상관없이, 책 제목 안 '기술'). 반대로 mount/figure HTML·SVG 안 용어는 안 본다 | visual, gpu, ontology, diversification, investing, art, tls (7) | lint 단어 경계, 대상 필드 문서화 |
| 9 | 스크립트 오류·빈 페이지가 audit을 통과한다(d3 누락, `type: "figure"` 누락, 앞 장면 예외로 뒤 clock 사망) | art, ontology, matrix, projectile, vector (5) | audit이 uncaught error·덱 미렌더·빈 figure를 오류로, API.md에 d3 필수 명시 |
| 10 | figure/mount 함수가 문서에 붙기 전에 실행된다(`LTT.sweep` `#id` 실패, `getTotalLength()` 0). figure 반환 계약(새 노드 반환, 형제 여러 개는 가로 열)도 문서에 없다 | projectile, drawing, cache(우려), diversification, color (5) | kit이 attach 뒤 실행하거나 문서에 시점·계약 명시 |
| 11 | hook `art`가 약 240px 칸이고 크기·허용 값이 문서에 없다(DOM 노드·함수는 글자로 찍힘, 넘쳐도 check 0) | matrix, projectile, visual (3) | API.md 명시 + check |
| 12 | summary가 모든 takeaway·recall을 모아 1280에서 넘친다(recall 9–12개). recall만 보이면 "한 장 정리"로 인정되지 않는다 | gpu, investing, vector, retrieval (4) | kit 상한·분할, 문서 |
| 13 | 미문서화 필드·부품: `LTT.plane`, `LTT.sweep`(`stops`/`stopLabel`/`goal.target`/`#id-v`/조회 범위), keywords `signals`/`queries`, compare `form: "table"`, contrast `before`/`after`, `aside`, `LTT.facts`, `LTT.record` 용도, `LTT.hbars`는 `play()` 필요, `LTT.redline` 글자 크기, `points`/`pointsOn`의 SVG 무동작, 레이아웃별 그림 가용 크기, `{{용어}}` 변환 범위(mount·figure·SVG·basis), kit CSS 링크 필요 여부 | 거의 전부 | API.md·kit/api/ |
| 14 | `LTT.expect`가 같은 문자열 값을 불일치로 본다 | matrix (1) | kit |
| 15 | `?shot&clock`을 `LTT.sweep`의 첫 render가 덮어써 모든 clock 프레임이 최종 상태 | anchoring (1) | kit |
| 16 | 테마마다 팔레트 순서가 달라 본문 색 이름이 틀린다. SVG 표현 속성 `fill="var(--…)"`가 적용 안 됨 | matrix, vector (2) | API.md 경고 또는 lint |
| 17 | result.md frontmatter 값을 따옴표로 감싸라는 규칙이 없어 `: `가 든 값이 YAML 파싱 실패(ontology, trolley → map rebuild 실패) | 내가 발견 | SKILL.md·result 템플릿, 또는 ltt-map이 쓰기 전에 검사 |
| 18 | figure 폭을 vw로 고정하지 말라는 규칙(API.md, deck-contracts.md)을 lint·audit이 막지 않는다(matrix의 `:has(> svg.hookart) { width: min(440px, 34vw) }`) | 갤러리 테스트로 발견 | lint |
| 19 | background.md가 없을 때 검증 프롬프트 규칙이 없다. "미검증" 표기 규칙이 모호하다 | llm, retrieval, art, cache (4) | SKILL.md |
| 20 | 서브에이전트가 kit 안에 self symlink(`kit/kit`)를 만들었다. 디버깅을 위해 임시 서버·headless Chrome을 직접 띄운 수업도 있다(art, ontology) — audit이 원인(콘솔 오류)을 보여 주지 않아서다 | 내가 발견 | 9번을 고치면 원인 제거. symlink 생성 경로는 미확인 |

## 처리 현황 (run `753ff3c539424409`)

| # | 상태 | 바뀐 것 |
|---|---|---|
| 1 | 고침 | lint "고침"은 `#ltt-check` `errors`(audit check, 종료 1), "권고"(`unused-term`, `card-monotony`, `no-signature`)는 `advice`(출력 `advice` 줄, 종료 코드 무관). `?shot`에서 `#ltt-expect` 패널 숨김 |
| 3 | 고침 | 개념 나무 = keywords `next: [{term, why, from?}]`, kit이 덱 제목을 뿌리로 그림. 없으면 lint `keywords-no-next`(고침). 덱 순서 hook → … → summary → overview → keywords |
| 4 | 고침 | API.md 장면 표에 `choices: [{id, text}]`·`answer: id`. lint `predict-choices`(고침) |
| 5 | 고침 | `?shot&state=reveal\|step-<k>#n`, `#ltt-check.sceneList`, audit `--shots`가 predict·compare 공개와 steps 2단계 이후를 `sNN-reveal.png`·`sNN-step<k>.png`로 찍고 `<dir>/index.md`(파일·장면·제목·상태)를 씀. 장면+상태 합 30장 상한 |
| 6 | 고침 | predict·compare(판정 공개형) takeaway는 공개 전 `visibility:hidden`(자리 유지), 공개 뒤 보임. summary는 그대로 모음 |
| 7 | 고침 | SKILL.md: checklist는 장면을 제목으로 지칭, 순서·제목 변경으로 지칭만 어긋난 곳은 고쳐도 됨(질문·정답은 안 됨) |
| 8 | 전반 고침 | `LTT.usesTerm`: 영문·숫자는 단어 경계, 한글은 앞이 한글 아님 + 뒤가 끝·비한글·조사/어미 목록. "분산 투자", 『…기술』은 여전히 사용으로 셈. 후반(mount/figure HTML·SVG 안 용어 검사)은 남음 |
| 9 | 고침 | 로드 중 예외·unhandled rejection → `script-error`(파일:줄), 장면 render/mount 예외 → `scene-error`(그 장면만 빈 본문, 나머지는 계속), `figure` 필드 + type 없음 → lint `figure-no-type`. API.md 불러오기에 d3·ltt.js·ltt-parts.js·ltt-ui.js "필수" |
| 17 | 고침 | SKILL.md: frontmatter 문자열에 `: `·`#`·따옴표가 있으면 큰따옴표, 템플릿 `definition`은 기본 큰따옴표 |
| 19 | 고침 | 검증 서브에이전트에 `background.md`는 있을 때만, shot `index.md` 전달. "미검증"은 검증 못 한 항목만, 못 고친 advice는 result.md "남은 권고" |
| 20 | 원인 일부 제거 | 9번으로 audit이 콘솔 예외를 보여 준다. symlink 생성 경로는 미확인 |
| 2, 10–16, 18 | 남음 | 이번 run 범위 밖(사용자 결정: 2번은 다음 run) |

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 생성 뒤 `ltt-map rebuild` | ontology-triples·trolley-ethics result.md YAML 파싱 오류 | `definition`·`aliases` 값의 `: `를 따옴표 없이 씀 (verified) |
| 생성 뒤 `npm test` | kit 빌드 테스트 4개 EINVAL "cannot copy kit to subdirectory of self" | 서브에이전트가 22:24에 만든 `skills/learn-to-tell/kit/kit` self symlink (verified, 삭제로 해결) |
| 새 갤러리에 옛 vw 검사 적용 | `math/matrix-as-transform.html :has(> svg.hookart) { width: min(440px, 34vw) !important }` | hook `art` 240px 고정을 피하려 수업이 kit 상자를 덮어씀(11·18번) (verified) |
| run 753ff3c539424409: 지시 rewrite를 base 바이트 예산 안에서 수행 | `npm test`의 gate-gaps 2건 실패(평가 기준 2번 문장 변형, SKILL.md에서 `?check` 언급 삭제), RV-1에서 katex CSS 주석 삭제·남은 advice를 "미검증"에 넣음 발견 | 예산을 맞추려 다른 문장을 줄이다 기존 테스트가 지키는 문장과 "필수/선택" 표시를 건드림 (verified, 복원함). rewrite 때는 기존 테스트가 글자 그대로 지키는 문장 목록을 먼저 확인할 것 |

## Next Step

1. 이번 변경을 커밋할지 사용자에게 묻는다(아직 커밋 안 함).
2. 남은 2번(레이아웃 결함 탐지: 넘침·하단 내비 가림·겹침·SVG 축소로 작은 글자·카드 제목 넘침·hook `art` 넘침)을 다음 workflow run으로 한다. 지금 rules.md는 "그려진 화면의 레이아웃은 판정하지 않는다"이므로 이 원칙을 바꾸는 결정부터 필요하다. 결정적으로 고칠 수 있는 것은 자동 보정(Design Principle 3).
3. 이어서 10–16, 18번과 8번 후반.
4. 고친 뒤 3–4개 주제로 같은 조건(prompts/common.md, 진단 고정)에서 다시 생성해 audit 회차·검증 회차·미충족이 줄었는지 이 표와 비교한다. 재생성 결과는 새 run 디렉터리(`measurements/<date>-…/`)에 둔다.
5. 생성 시간 목표(10분대)와 겹치는 항목은 시간 handoff와 함께 본다.

## Open Questions

- (해결) 개념 나무 → keywords `next`(사용자 답 1-A). 공개 상태 → audit이 찍음. 장면 지칭 → 제목, 지칭만 고침 허용(사용자 답 2-A). 새 갤러리 커밋 → `f2ce682`.
- run 753ff3c539424409 변경을 커밋할지.
- 2번에서 레이아웃을 audit이 판정하게 할지(지금 원칙과 충돌), 판정 범위(넘침·작은 글자·겹침 중 어디까지).

## Spec

- 처음 작성 시: 없음(workflow-approach를 쓰지 않은 시험 생성).
- run `753ff3c539424409`: `agent-docs/spec-logs/753ff3c539424409-generator-defects-audit-lint-docs.md`, v4, status complete. 검증 2/2회(1회 retry → 2회 pass), 보정 묶음 3회.

## Execution Ledger

- findings: 위 "고쳐야 할 항목" 20개. 처리 현황 표대로 10개 고침·1개 일부, 2·10–16·18번 open. run의 finding(F-1..F-6, G-1..G-6, S-1, A-1..A-4)과 처분은 spec 실행 원장에 있다.
- evidence: 수업 에이전트 17개의 최종 보고(이 세션), `measurements/20261022-gallery-v2/cost.md`, 각 `home/lessons/<id>/result.md`·`events.jsonl`·`shots/`.
- fuzz·mutation(run 753ff…): `tests/term-boundary.fuzz.mjs` 20,000건 seed 1 차이 0. 손 mutation M1–M14 모두 의도한 단언이 검출. mutation 도구 없음.
- 검증 회차: 수업별 표의 "검증 회차" 열. 이 handoff 작업 자체의 verifier는 없음.
