# 측정 모듈 분리 run 74cb05d7da21907e: verifier 예산 소진, 오류 경로 증거(TV-6) 남음

## Goal

"이 스킬에서 사용하는 라이브러리는 계속 개발하며 확장 가능해야하고, UIUX적으로 유지보수 가능한 아키텍쳐를 가지고 있어야 한다." (refactoring-4 3·4·6번)과 "보류할 것들은 핸드 오프로 남기고." (refactoring-5 1–4번)

## State

- 브랜치 `fix/run-time`, 기준 커밋 `b3d5ba5ee8d1baf0682d20a1749cc6ff24d3e6c3`. 커밋하지 않음(orchestrator가 검토 뒤 커밋).
- 바뀐 파일
  - 구현: `skills/learn-to-tell/kit/ltt-deck.js`(내부 `placement`, `LTT.placement.zoomLock(question, zs)`, 공개 상태 재측정, `widen` 제거), `skills/learn-to-tell/kit/API.md`(vw 규칙 한 줄, 8,500 코드 포인트), `kit/api/internals.md`, `kit/api/deck-contracts.md`, `kit/CHANGELOG.md`(0.2.0 줄 추가), `site/gallery/network/tls13-quic.html`(`.seqwrap{width:800px;max-width:100%}`), `site/gallery/knowledge-graph/ontology-triples.html`(`.kg.wide,.ladder{width:880px;max-width:100%}`).
  - 테스트: `tests/placement.test.mjs`(새 파일), `tests/api-docs.test.mjs`, `tests/scene-types.test.mjs`, `tests/release-docs.test.mjs`, `tests/gallery.test.mjs`. `tests/gallery-audit.baseline.json`은 바뀌지 않았다(건수가 줄지 않음).
  - 문서: `agent-docs/rejections/3a2d6645686921a6-stacked-step-frames.md`, `agent-docs/rejections/3c711c4d7cad7c40-ltt-later-deferred-draw.md`, `agent-docs/rejections/index.md`. 증거 산출물은 `agent-docs/spec-logs/74cb05d7da21907e-*`.
- `npm test` 832/832 pass. verifier 2회 중 2회째가 blocking 1건(TV-6)으로 retry를 냈고, 다음 감사 예산이 없어 status `limit`로 멈췄다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| E(띄우기를 고려한 배율) 첫 측정: `?audit` 덤프에서 lockZoom 직후 float을 잼(spec ledger 0) | 실제 사례 8로 나왔으나, 현재 장면만 재면 24경우 사례 0·최대 차이 0(`74cb05d7da21907e-e-remeasure-visible.json`). 기준 R-2에서 8개 장면 모두 실제 공개 때 float false | verified: `?audit`은 장면을 `visibility:hidden`으로 mount하고 `solidRects`는 숨은 상자를 빼므로 `freeSlot`이 늘 성공한다 |
| 안 C 구현(phase 2, spec v1–v3) | 보이지 않는 장면을 보이게 하는 처리 없이는 audit만 실제보다 좋은 배율이 됨(audit 42→41), 처리를 넣으면 진입 배율 변화 0 | verified: 갤러리에 해당 사례가 없음. 사용자 결정 IM-1로 걷어 냄(spec v4) |
| hand mutation HM-6(미리 그리기가 마지막 단계를 건너뜀)을 R-1 DOM 대조로 판정 | R-1 nomatch가 B 페이지뿐(탐지 못함) | verified: 갤러리 figure `steps`에 마지막 단계만 가장 높은 장면이 없다. fixture C-17로 옮겨 탐지(HM-6b) |
| vw 문장을 API.md "원칙"에 85자로 추가 | `tests/api-docs.test.mjs` "real kit/API.md is at most 8,500 code points" 실패(8,540) | verified: 기존 문서 크기 예산. 문장을 줄여 8,500 |

## Next Step

1. TV-6(a): R-2 errors fixture에 공개 상태 재측정이 throw할 때 zmax 1을 판별하는 장면을 둔다.
   - 지금 fixture 1장면은 고른 답 a가 1400px이라 zmax와 관계없이 배율이 하한 0.78에 붙는다.
   - 고른 답의 흐름 안 배율이 0.78보다 크고 1보다 작게 하고, throw하는 선택지는 따로 둔다.
   - 기대: 재측정 뒤 배율이 "상한 1로 맞춘 공개 상태 배율"이고, "성공한 상태만으로 잠근 값"이나 옛 값이 아니다.
   - EG2의 세 번째 warn을 `⚠ 장면 1: answerVisual을 미리 그려 보다 실패해 정답을 열 때 배율이 바뀔 수 있다 (fixture b)`와 글자 단위로 비교한다.
2. TV-6(b): E-2 fixture 단계가 측정 모드 밖에서 `.pk`(비행 중 패킷)를 남기게 해, 실패 경로의 `.pk` 정리를 판별한다. 예: 진입 때 `diagram.send` 연출을 쓰는 단계 그림.
3. 1·2를 `74cb05d7da21907e-cdp-review.mjs errors`에 반영한다. 기준 커밋·최종 트리에서 결과를 저장하고, P-1(재측정 오류 경로가 zmax를 1 미만이나 옛 값으로 둠), P-2(`.pk` 정리 생략), P-3(재측정 경로 warn 문구 변경)을 hand mutation으로 확인한다.
4. 새 workflow run의 verifier로 VO-8만 다시 감사한다(spec v5 audit state의 다른 VO는 accepted 또는 retained).
5. 통과하면 refactoring-4(`47c0f728cfa2d600`)와 refactoring-5(`e72bbfb2418e2e6d`) handoff를 닫고(index → stale.md, 파일 → stale/), 이 handoff도 닫는다.

## Open Questions

- 공개 상태에서 창 크기를 바꿀 때 재측정이 정답 패널을 잠시 숨겼다 보이므로 `ltt-rise` 등장 애니메이션이 한 번 더 재생될 수 있다(implementer 보고, 화면 확인 안 함). 문제로 볼지.
- verifier advisory: A-9(재진입 행의 `LTT.record` 1회가 장면 이동 기록인지 고정되지 않음), A-1(vw를 사용자 정의 속성·`inline-size`·`flex-basis`로 거는 경우는 FR-7 범위 밖).

## Spec

`agent-docs/spec-logs/74cb05d7da21907e-placement-module-float-aware-zoom.md`, version 5, status `limit`, run ID `74cb05d7da21907e`.

## Execution Ledger

- 사용자 결정
  - 이해 라운드 답 1–3: `LTT.placement`, kit CSS 허용과 스크린샷 대조, E 경계 0.02.
  - brief v1 승인: 기각 기록 2개 포함.
  - IM-1(v4): 안 C 제거, `zoomLock(question, zs)`.
  - IM-2(v4): R-5 "나빠짐" 기준.
- 발견과 처리
  - test-implementer challenge 6건 → spec v2.
  - scene-types 공개 이름 test defect → v3.
  - ID-1 API.md 크기 예산 → batch 3.
  - verifier 1 TV-1..TV-5 → v5와 batch 4로 해소(verifier 2가 닫힘 확인).
  - verifier 2 TV-6(VO-8 오류 경로 판별력) → 미해결(Next Step 1–3).
- 증거(최종 트리)
  - R-1: 기준 덤프 5회 대 최종 5회 nomatch 4(B 두 페이지 × 2크기). 폭 선언, tls13 4 zoom, `min-height`만 다르다.
  - audit 26회: 배열 차이 0, 42건.
  - R-2
    - reveal: 110/110, 진입 zoom 24개가 기준과 같다.
    - resize: 60/60(기준 커밋 18/60 실패). MutationObserver 변경 0, `LTT.record` 0.
    - errors: EG1·EG3–EG5·C16·C17은 기대대로. EG2는 TV-6.
    - timing: 최대 +6.5 ms, 최대 24.6 ms.
  - R-3: 핸들러 hit 0, `widen`·`unwiden`·`grown` 0, `placement.predict`의 표시·style 쓰기 0, 크기 키에 `fonts.status`.
  - R-4: 74 → 75(+placement).
  - R-5: 나빠짐 0.
  - R-6: 24/24.
- fuzz: `74cb05d7da21907e-zoomlock-fuzz.mjs` seed 20261019, 100,000 입력, 위반 0, 잘못된 입력 9,950.
- hand mutation
  - 1차 HM-1..HM-12: 11/12 탐지, HM-6 미탐지.
  - v5 HM-6b·HM-13..HM-16: 5/5 탐지.
  - 결과 파일 `-hand-mutations-result.json`, `-hand-mutations-v5-result.json`, `seed: none`.
  - mutation 도구: 없음(Stryker 미설치).
- refactoring-5 결과
  - 1·2번: 기각 기록.
  - 3번: 측정 근거로 구현하지 않음(재측정 사례 0).
  - 4번: 구현(R-2 resize).
- refactoring-4 결과
  - 3번: `placement` 모듈.
  - 4번: vw 규칙과 갤러리 두 페이지, `widen` 제거. `widen`은 측정 크기 중 창 폭 760에서만 작동했다(`74cb05d7da21907e-widen-sizes.json`).
  - 6번: `server/audit.mjs`와 기준선 테스트를 이 run의 oracle로 씀.
- 카운터: correction batch 4회, verifier 2회(retry, retry).
