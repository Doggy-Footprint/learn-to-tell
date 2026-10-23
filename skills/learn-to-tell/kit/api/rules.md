언제: check·lint 출력만으로 무엇을 고칠지 모를 때만 읽는다. 등급 "고침"은 공개 전에 0건이어야 하고, "권고"는 점검 3회 안에서 고치고 남으면 `result.md`의 "남은 권고"에 적는다(SKILL.md §3).

# lint·검사 규칙

lint는 장면 데이터만 본다(`LTT.lintDeck`). 용어·채움 글·목표·expect 결함은 "검사" 절이 모든 페이지에서 잡는다. 그려진 화면의 레이아웃은 측정으로 확정되는 넘침만 check가 오류로 내고(`scene-overflow`·`box-overflow`, 처음 상태만), 결정적으로 고칠 수 있는 것(작은 SVG 글자, 카드 제목 줄바꿈)은 kit이 스스로 보정하며, 라벨·선·글자 겹침은 판정하지 않는다. 겹침은 `audit.mjs --shots`가 찍은 PNG를 본다.

등급이 갈 곳은 다르다. "고침" lint는 `#ltt-check`의 `errors`(`where`는 `장면 n`, 덱 전체면 `덱`)에 들어가 audit의 `check`와 `data-ltt-check` 건수에 센다. "권고" lint는 `advice`에만 들어가 audit 출력의 `advice <where> [rule]: msg` 줄로 나오고, 건수와 종료 코드에 세지 않는다.

## lint

| rule | 등급 | 뜻 |
| --- | --- | --- |
| `no-reading-guide` | 고침 | compare·contrast·figure·overview·타입 없는 `mount` 장면에 `narration`·`points`·`sub`·`caption`(contrast는 `before.points`도)이 없다 |
| `overview-missing`, `overview-order`, `overview-no-visual` | 고침 | summary가 있는데 한 장 정리(`overview`)가 없다 / overview가 summary 뒤·keywords 바로 앞이 아니다 / overview에 `figure`가 없다 |
| `unknown-icon` | 고침 | hook `art`, explain `steps[].icon`, terms `terms[].icon`이 아이콘 이름 꼴(`[a-z][a-z0-9-]*`)인데 `LTT.icons`에 없다. 값은 글로 그려진다 |
| `no-title`, `keywords-last` | 고침 | 제목 없는 장면(hook·summary·keywords 제외) / 마지막 장면이 keywords가 아니다 |
| `keywords-no-next` | 고침 | 마지막 keywords 장면에 비어 있지 않은 `next`(개념 나무)가 없다 |
| `predict-choices` | 고침 | predict의 `choices`가 `{id, text}` 두 개 이상이 아니거나(문자열 배열, `label` 필드, `id`·`text` 누락) `answer`가 어느 `id`와도 다르다. 이 형식이 아니면 선택지가 빈 버튼이 된다 |
| `figure-no-type` | 고침 | `figure` 필드가 있는데 `type`이 `figure`·`overview`가 아니다. 그림이 그려지지 않는다 |
| `term-no-visual` | 고침 | terms 항목에 `visual`이 없다(그림으로 못 보일 말은 `visual: false`) |
| `summary-no-recall` | 고침 | summary가 모으는 takeaway에 `recall`이 없다 |
| `no-theme`, `unknown-theme` | 고침 | `theme`이 없거나 없는 이름이다 |
| `unused-term` | 권고 | glossary 용어를 어디에도 표시하지 않았다 |
| `card-monotony` | 권고 | 카드 격자 장면(explain `cards`, compare, terms, `recall` 없는 summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 절반 초과 |
| `no-signature` | 권고 | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |

## 검사(`#ltt-check`)

덱이든 아니든 모든 페이지에서 kit이 연 뒤 한 번 돌린다. audit은 이를 학습자 상태(`?check`)와 `?shot` 두 상태에서 읽어 `where`·`rule`·`msg`가 같은 오류를 하나로 합친다. 결과는 `#ltt-check`의 `errors`, `<html data-ltt-check="건수">`, 패널 경고, `lint` 이벤트다. 아래는 모두 `errors`에 들어가는 고칠 결함이고, 위 lint의 "고침" 등급도 덱에서는 여기에 함께 나온다. 덱은 `where`가 `장면 n`, 덱이 아닌 페이지는 h1–h3로 나눈 구역 `구역 '제목'`(첫 제목 앞은 `구역 (처음)`)이다.

| rule | 뜻 |
| --- | --- |
| `unknown-term` | `{{x}}`의 풀이가 `#ltt-meta` glossary·덱 `glossary`·`terms` 장면에 없다(terms 항목의 plain 누락 포함) |
| `used-before-defined` | glossary 용어를 처음 `{{}}`로 표시하기 전 구역·장면에서 평문으로 썼다(같은 구역·장면 안은 허용). 영문·숫자 용어는 앞뒤가 영문·숫자가 아닐 때만, 한글 용어는 앞이 한글이 아니고 뒤가 끝·한글 아님·조사나 어미(은·는·이·가·을·를·의·에·도·로·이다·한·된 등)일 때만 쓴 것으로 센다(`pt`는 `perceptual`, `상관`은 `상관없이`에 안 걸린다). 덱은 데이터 글에 더해 mount된 장면에 그려진 글(HTML·SVG `<text>`, `aria-hidden` 제외, 용어 표시는 `{{용어}}`로 셈)도 그 장면의 글로 본다. 그려진 글에만 있는 평문 용어도, `{{}}` 표시도, 모르는 `{{}}`도 같은 규칙을 따르고 같은 장면의 같은 오류는 한 번만 낸다 |
| `predict-new-term` | predict 질문·선택지에서 처음 나온 용어(덱만) |
| `filler-content` | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글(단위당 처음 하나) |
| `goal-unreachable` | `sweep` 목표가 어느 손잡이 자리에서도 안 맞는다 |
| `goal-at-start` | 시작 위치에서 이미 목표가 맞는다 |
| `expect-mismatch` | `LTT.expect` 불일치(where는 `페이지`). `lint` 이벤트에는 담지 않는다(별도 `expect-mismatch` 이벤트가 있다) |
| `script-error` | 페이지가 로드된 뒤 처리 안 된 스크립트 오류·Promise 거부가 났다(where는 `페이지`, msg에 오류 문구와 파일:줄). d3를 안 불러오면 `ltt-parts.js`가 던져 덱이 안 그려진다. 메시지가 가리키는 스크립트를 고친다 |
| `scene-error` | 덱 장면을 그리다(render·`mount`·`enter`) 예외가 났다. 그 장면은 빈 본문으로 남고 다른 장면은 그대로 그려진다. msg가 예외 문구다 |
| `clock-duplicate-id` | `LTT.clock` id가 둘 이상이다(where는 `페이지`) |
| `scene-overflow` | 데스크톱에서 장면 섹션(배율은 높이에 맞춰서만 78%까지 줄인다)의 안쪽 여백 상자(padding box) 밖으로 내용이 1px 넘게 나간다. 내용은 글줄 상자(비어 있지 않은 글, 가장 가까운 inline 아닌 조상 상자로 세로를 자른다), 가장 바깥 `<svg>`, `img`·`canvas`·`video`·`iframe`, 폼 컨트롤이다. 비어 있는 상자의 폭·배경·테두리와 섹션 자신의 여백은 세지 않는다. 장면 안 `overflow` auto·scroll·hidden·clip 조상 아래 내용은 그 상자로 자른 만큼만 센다. msg에 방향(세로·가로)과 px. 처음 상태만 보고 폰은 보지 않는다 |
| `box-overflow` | kit 칸(hook 그림 칸, explain 단계 카드, 용어 카드, compare 항목, summary 카드, recall 항목, contrast 쪽)의 자손 요소·바깥 `<svg>`가 칸 밖으로 1px 넘게 나간다(칸마다 1건, msg에 칸 종류·이름·px). `overflow: hidden`·`clip` 조상에 잘려 보이지 않는 부분도 넘침으로 세고, 칸 안의 `overflow: auto`·`scroll` 조상 아래 자손만 그 조상 상자로 잰다 |
| `vw-size` | 페이지 `<style>`·같은 출처 stylesheet(kit 것 제외)·`style` 속성의 `width`·`min-width`·`max-width`·`flex-basis`·`inline-size`·`min-inline-size`·`max-inline-size`에 `vw`·`svw`·`lvw`·`dvw`가 있다(선언마다 1건). `font-size`와 `vh`는 보지 않는다 |
| `check-failed` | 검사 중 예외가 났다(레이아웃 측정 중이면 그 오류만 더하고 다른 오류는 그대로 둔다). msg가 예외 문구이고 페이지는 계속 동작한다. rule 등록부(`LTT.ruleIds`, audit은 `AUDIT_RULE_IDS` 포함) 밖 rule이 나오면 "등록되지 않은 rule <id>"를 더한다 |
| `control-shift` | audit만 낸다. range·dial·pad의 값을 처음부터 끝까지 바꾸는 동안 컨트롤 상자의 left·top·width가 1px 넘게 움직인다. 값 표시 글자 폭이 값마다 달라 컨트롤이 밀리는 경우가 많다. msg에 컨트롤 id와 최대 이동 px가 있다 |
| `probe-failed` | audit만 낸다. `control-shift` 점검 로드가 실패했다. 다른 오류는 그대로 믿는다 |
| `shot-format`, `shot-unknown-clock`, `shot-bad-time` | audit만 낸다(where는 `checklist`, 종료 코드 1). checklist의 `[shot <id> <ms>]`가 형식이 아니다 / 페이지에 그 clock id가 없다 / ms가 그 clock의 `dur`보다 크다 |
