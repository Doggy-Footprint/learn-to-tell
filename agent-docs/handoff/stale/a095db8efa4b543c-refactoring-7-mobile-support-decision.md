# refactoring-7: 모바일 지원 여부를 ADR로 정리하고 kit 분기를 그 결정에 맞추기

## Goal

"이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-7. 사용자 결정이 먼저이고, 결정에 따라 refactoring-4·8의 범위(모바일 분기 유지 여부, 점검 크기)가 달라진다.
- ADR과 코드가 어긋나 있다:
  - `agent-docs/adr/8a61c967e180bedb-desktop-only-min-720px.md`(2026-10-15, Accepted): 폭 720px 이상 데스크톱 전용. 휴대폰 분기와 390×844 점검을 없앴다. 근거: 서버가 loopback에만 열려 휴대폰에서 열 경로가 없고, 두 번째 레이아웃의 설계·점검·스크린샷 비용이 든다.
  - 커밋 `b73f059`(2026-10-17, "automatic mobile reflow"): `data-ltt-mobile`, `LTT.mobile()`, `mobileFit`, deck CSS `[data-ltt-mobile]` 18줄, autoLayout `DOWN` 재배치를 다시 넣었다. ADR status는 바뀌지 않았다.
  - 이 브랜치의 `4a72991`(placement survives resize and mobile), `956df3f`(phone stepper drawings keep column width)도 모바일 수정이다.
  - 문서: `kit/API.md` "폰(폭 760px 미만)에서는 ... 참고용 화면이라 점검 대상이 아니다", `SKILL.md` §3.6 "모바일 화면을 따로 만들거나 열어 보지 않는다", `README.md` "폭 1280px 이상의 데스크톱 브라우저를 기준으로 만든다", `standalone.md`(claude.ai 웹·모바일에서 artifact 수업: 모바일 수요의 실제 근거).
- 관련 코드 위치(`956df3f`): `ltt.js` 696~702(`data-ltt-mobile` 토글, `mobile()`), `ltt-deck.js` 229~246(모바일 CSS)·791~813(`mobileFit`)·405·478·1011, `ltt-parts.js` 1555(autoLayout `DOWN`).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. 사용자에게 결정을 받는다(ADR 체크리스트 충족: 되돌리기 비용이 크고, 대안이 있고, 이유를 코드로 복원할 수 없다). 선택지:
   - (a) claude.ai 모바일 열람을 지원 범위에 넣는다. ADR 8a61c967을 supersede하는 새 ADR: 작성·점검은 데스크톱 1280px 이상, 폰은 "열람 보장"(한 열·세로 스크롤·가로 넘침 없음)만 하고 수업마다 점검하지 않는다.
   - (b) 분기를 제거하고 `standalone.md`에 "폰에서는 레이아웃을 보장하지 않는다"를 적는다. ADR 8a61c967은 그대로 유효.
2. (a)면: 모바일 레이아웃도 kit 변경 때 깨질 수 있으므로 자동 audit(진행 중)에 390×844 한 크기를 약한 검사(`hscroll` 0, 글자 10px 이상)로만 넣을지 정한다. SKILL.md의 "열어 보지 않는다"는 유지한다(수업 생성 비용과 충돌하지 않게).
3. (b)면: 위 코드 위치와 API.md·SKILL.md의 폰 문단을 지우고, 갤러리 자동 audit로 데스크톱 2크기가 변하지 않았음을 확인한다.
4. 어느 쪽이든 ADR index와 README 지원 범위 문구를 결정과 일치시킨다.

## Open Questions

- claude.ai 모바일에서 artifact 수업을 실제로 연 사례가 있었는지. 없으면 (b)가 비용이 적다.
- (a)에서 폰 점검을 넣으면 kit 변경 때 검사 1크기가 늘어난다. 수업 생성 비용(intent 1)에는 영향이 없지만 kit 개발 비용은 늘어난다.

## Spec

없음(ADR 작성과 코드 삭제/유지 결정).

## Execution Ledger

- 2026-10-18 측정: `[data-ltt-mobile]` 선택자를 가진 deck CSS 줄 18, `mobileFit` 23줄, 이 브랜치의 모바일 관련 커밋 2건.
- 2026-10-18 사용자 결정: 선택지 (a). claude.ai 모바일 열람을 지원 범위에 넣고, 작성·점검은 데스크톱 1280px 이상, 폰(폭 760px 미만)은 열람 보장(한 열·세로 스크롤·가로 넘침 없음)만 한다. 수업마다 폰 화면을 점검하지 않고(SKILL.md §3.6 유지), 390×844 자동 audit는 넣지 않으며(폰에서 깨진 사례가 보고되면 다시 정함), 기존 모바일 코드는 유지한다. 변경 파일: `agent-docs/adr/dbd5ddb9b247aa15-phone-viewing-guarantee.md`(새 ADR, 8a61c967 supersede), `agent-docs/adr/8a61c967e180bedb-desktop-only-min-720px.md`(Status), `agent-docs/adr/index.md`, `README.md`(지원 범위 문구), `skills/learn-to-tell/standalone.md`(폰 열람 보장 한 문장). `kit/API.md`·`SKILL.md`의 폰 문단은 (a)와 어긋나지 않아 그대로 둔다. 코드 변경 없음. refactoring-4·8은 모바일 분기를 유지하는 전제로 진행한다.
