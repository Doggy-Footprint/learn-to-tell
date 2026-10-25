# 갤러리 audit 0건 run 1e62814b16984176: verifier 예산 소진, R-3 단계 자막·R-6 JS 표기 증거 남음

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다." 이 목표 아래 refactoring-8(handoff `fb7b84e0280f15ef`)을 진행한다: 갤러리 deck 13편을 1440×900·1280×800 audit·lint·expect 0건으로 맞추고, 기준선을 0으로 내리고, overview hero를 실제 layout 기준으로 판정하고, tls13-quic의 죽은 코드와 `ltt-meta.mode`를 정리한다.

## State

- 브랜치 `fix/run-time`, 기준 커밋 `17ccf58234f84d8bae80736c90b88c389204f635`. 커밋하지 않음(orchestrator가 검토 뒤 커밋).
- 바뀐 파일
  - 구현:
    - `skills/learn-to-tell/kit/ltt.js`: `auditScene` hero 식 1줄, 주석 1줄.
    - `skills/learn-to-tell/kit/API.md`: audit 표 3행, 8,495 코드포인트.
    - `skills/learn-to-tell/kit/CHANGELOG.md`: 0.2.0 작가 계약에 1줄.
    - 갤러리 deck 13쪽(`site/gallery/**`, index·catalog·stale 제외).
  - 테스트: `tests/scene-types.test.mjs`, `tests/gallery.test.mjs`, `tests/gallery-audit.test.mjs`, `tests/gallery-audit.baseline.json`(26개 모두 0), `tests/api-docs.test.mjs`, `tests/release-docs.test.mjs`.
- 결과
  - `npm test` 892/892.
  - `node skills/learn-to-tell/server/audit.mjs --gallery --json`을 3회 돌렸고, 매회 26개 결과에서 audit·lint·expect가 0건이다(기준 커밋 42건, hero 변경을 넣으면 44건).
  - 장면 수: ontology 24→25, tls13 16→18, visual-hierarchy 13→15. 나머지 수업과 scenes.html은 그대로다.
- spec: `agent-docs/spec-logs/1e62814b16984176-gallery-audit-zero.md`(v2, status `limit`). 증거는 같은 폴더의 `1e62814b16984176-*`.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| R-2 v1: 바뀐 장면을 implementer 보고로 골라 대부분 1280에서만 봄 | verifier 1회차 TF-1 | verified: 선정 절차가 없었고, 커버리지 항목(바뀐 장면 × 2크기)을 채우지 않았다. v2에서 장면 서명으로 54곳을 골라 두 크기로 다시 봤다 |
| R-3 v1: 줄인 글을 "압축"으로만 적음 | verifier 1회차 TF-2. 다시 대조하다 CR-2(visual-hierarchy AFTER 장면에 BEFORE 값이 없음)를 찾음 | verified: 전·후 원문이 없어 같은 종류의 뜻 손실(CR-1)을 다시 검토할 수 없었다 |
| R-3 v2: 진입 상태 textContent와 spec 문자열만 비교 | verifier 2회차 TF-4: figure 함수 안에서 페이지가 만든 단계 자막(②단계 이후)이 비교에서 빠진다 | verified: 진입 상태에는 현재 단계 자막 하나만 있고, spec에는 figure가 `[fn]`으로만 남는다 |
| R-6 v2: CSS 표기 정규식만 씀 | verifier 2회차 TF-5: `.style("display","none")`, `overflow-y: hidden`, `.attr("title", …)` 등 JS·d3 표기를 놓친다 | verified: 정규식이 `속성: 값` 꼴만 찾았다 |

## Next Step

1. TF-4·TF-5 진단은 main이 이미 돌렸지만 verifier가 감사하지 않았다(아래 Execution Ledger 14·15). 다음 workflow run에서 이 두 절차를 spec에 R-3·R-6의 일부로 적고, 새 verifier 1회로 감사받는다.
   - TF-4 진단: `node agent-docs/spec-logs/1e62814b16984176-review.mjs steps <tree> <out>`로 기준·최종 트리에서 stepper가 있는 장면을 모두 돌린다(14곳). 단계마다 글을 모아 비교하면, 차이가 난 4곳(diversification 3, gpu 8, trolley 2, visual-hierarchy 4)은 모두 `content-review.md`에서 이미 판정한 글 변경이다. 단계 자막 자체가 바뀐 곳은 trolley ③과 visual-hierarchy 캡션뿐이다.
   - TF-5 진단: 넓힌 정규식(축별 overflow·clip, JS·d3 `display`/`visibility`/`hidden`, 따옴표 종류와 무관한 `title`, `.style("transform"|"zoom")`, `fontSize`, `dataset.visual`)으로 추가 줄을 다시 찾았다. 새로 걸린 것은 0건이고, 글자 크기 3건은 기존 값이라 이미 판정했다.
2. 감사가 통과하면 refactoring-8 handoff(`fb7b84e0280f15ef`)를 닫는다. 순서는 ledger에 결과 줄 추가, index.md에서 stale.md로 이동, 파일을 stale/로 이동이다. 이 handoff도 같은 방법으로 닫는다.
3. advisory는 kit 후보로 남긴다. 각각 다음 kit 작업에서 판단한다.
   - AF-1: 페이지 CSS가 kit 내부 클래스를 덮는다(`.dk-body .dk-kw` 칸 비율 2쪽, `.dk-capbar > .ltt-basis` 1쪽, `ltt-ba-foot` 재사용 1쪽).
   - AF-2: summary를 나누는 `LTT.summaryCards` + 페이지 자체 `recap` 필드 코드가 3쪽에서 반복된다.
   - AF-3: tls13 판단 1·2의 제목이 판정을 미리 말한다.
   - AV-9: mode 검사기가 공백도 20자에 센다.

## Open Questions

- AV-7: FR-2(c)는 API.md에서 "순수 중복 문장·칸 끝 마침표 삭제"만 허용한다. 실제 수정에는 overview 행의 "앞에 두는" → "앞의" 고쳐 쓰기와 `## 원칙` 두 줄 합침도 들어 있다. 이것도 허용 범위로 볼지 사용자가 정한다. 뜻과 토큰은 같다(R-5).
- refactoring-8을 지금 닫을지. 갤러리 0건 목표와 Open Questions의 답(두 크기 유지, 헤드리스 측정 인정, `shrunk` 최소 배율은 의도, overview hero는 실제 layout 기준)은 이미 나왔다. 남은 것은 증거 감사뿐이다.

## Spec

- 경로: `agent-docs/spec-logs/1e62814b16984176-gallery-audit-zero.md`(archived).
- 버전 2, status `limit`, run ID `1e62814b16984176`.

## Execution Ledger

- 판정과 처분
  - verifier 1회차 retry: TF-1~TF-3과 SC-1~SC-4는 v2 개정·증거 재생성으로 닫혔다(2회차가 확인).
  - verifier 2회차 limit-blocking: TF-4, TF-5가 열려 있다. VO-1~VO-9와 VO-11~VO-14 중 VO-8·VO-14를 뺀 나머지는 accepted, VO-10은 종료 단계에서 하도록 설계되어 pending이다.
- correction batch 3회, 모두 implementer에게 보냈다.
  - IMP-1: API.md 8,500자 상한.
  - CR-1: visual-hierarchy 4 캡션의 뜻.
  - CR-2: visual-hierarchy AFTER 장면에 BEFORE 값 비교 추가.
- 손 mutation HM-1~HM-16을 모두 실행했다. 15개는 의도한 assertion으로 실패했고, HM-3(기준선을 1로)은 기대대로 통과했다(기준선은 상한). HM-2 56vw는 gallery.test의 vw 검사만 잡고 audit은 잡지 못했다(`max-width:100%`). 결과는 `1e62814b16984176-hand-mutations-result.json`.
- fuzz none, mutation tool none(사용자 결정).
- 14(진단, 미감사) TF-4: `1e62814b16984176-steps-base.json`·`-steps-final.json`, stepper 장면 14곳, 차이 4곳 모두 판정한 변경.
- 15(진단, 미감사) TF-5: 넓힌 정규식, 새 출현 0건.
- 2026-10-19 사용자 역할이 main의 TF-4·TF-5 진단을 감사 없이 받아들여 닫음(진단 산출물: spec-logs 1e62814b16984176-steps-*.json, -scope-review.md).
- 2026-10-19 Open Question AV-7 답(사용자 역할): 뜻과 토큰이 같은 고쳐 쓰기("앞에 두는" → "앞의")와 `## 원칙` 두 줄 합침은 FR-2(c)의 "순수 중복 삭제"와 같은 범주로 허용. refactoring-8 닫기 질문 답: 지금 닫음.
