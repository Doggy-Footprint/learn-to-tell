언제: check·lint 출력만으로 무엇을 고칠지 모를 때만 읽는다. 등급 "고침"은 공개 전에 0건이어야 하고, "권고"는 점검 3회 안에서 고치고 남으면 `result.md`에 적는다(SKILL.md §3).

# lint·검사 규칙

lint는 장면 데이터만 본다(`LTT.lintDeck`). 용어·채움 글·목표·expect 결함은 "검사" 절이 모든 페이지에서 잡는다. 그려진 화면의 레이아웃은 판정하지 않는다. `audit.mjs --shots`가 찍은 PNG를 본다.

## lint

| rule | 등급 | 뜻 |
| --- | --- | --- |
| `no-reading-guide` | 고침 | compare·contrast·figure·overview·타입 없는 `mount` 장면에 `narration`·`points`·`sub`·`caption`(contrast는 `before.points`도)이 없다 |
| `overview-missing`, `overview-order`, `overview-no-visual` | 고침 | summary가 있는데 한 장 정리(`overview`)가 없다 / overview가 summary 뒤·keywords 바로 앞이 아니다 / overview에 `figure`가 없다 |
| `no-title`, `keywords-last` | 고침 | 제목 없는 장면(hook·summary·keywords 제외) / 마지막 장면이 keywords가 아니다 |
| `term-no-visual` | 고침 | terms 항목에 `visual`이 없다(그림으로 못 보일 말은 `visual: false`) |
| `summary-no-recall` | 고침 | summary가 모으는 takeaway에 `recall`이 없다 |
| `no-theme`, `unknown-theme` | 고침 | `theme`이 없거나 없는 이름이다 |
| `unused-term` | 권고 | glossary 용어를 어디에도 표시하지 않았다 |
| `card-monotony` | 권고 | 카드 격자 장면(explain `cards`, compare, terms, `recall` 없는 summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 절반 초과 |
| `no-signature` | 권고 | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |

## 검사(`#ltt-check`)

덱이든 아니든 모든 페이지에서 kit이 연 뒤 한 번 돌린다. 결과는 `#ltt-check`의 `errors`, `<html data-ltt-check="건수">`, 패널 경고, `lint` 이벤트다. 아래는 모두 등급 "고침"이다. 덱은 `where`가 `장면 n`, 덱이 아닌 페이지는 h1–h3로 나눈 구역 `구역 '제목'`(첫 제목 앞은 `구역 (처음)`)이다.

| rule | 뜻 |
| --- | --- |
| `unknown-term` | `{{x}}`의 풀이가 `#ltt-meta` glossary·덱 `glossary`·`terms` 장면에 없다(terms 항목의 plain 누락 포함) |
| `used-before-defined` | glossary 용어를 처음 `{{}}`로 표시하기 전 구역·장면에서 썼다(같은 구역·장면 안은 허용) |
| `predict-new-term` | predict 질문·선택지에서 처음 나온 용어(덱만) |
| `filler-content` | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글(단위당 처음 하나) |
| `goal-unreachable` | `sweep` 목표가 어느 손잡이 자리에서도 안 맞는다 |
| `goal-at-start` | 시작 위치에서 이미 목표가 맞는다 |
| `expect-mismatch` | `LTT.expect` 불일치(where는 `페이지`). `lint` 이벤트에는 담지 않는다(별도 `expect-mismatch` 이벤트가 있다) |
| `check-failed` | 검사 중 예외가 났다. msg가 예외 문구이고 페이지는 계속 동작한다 |
