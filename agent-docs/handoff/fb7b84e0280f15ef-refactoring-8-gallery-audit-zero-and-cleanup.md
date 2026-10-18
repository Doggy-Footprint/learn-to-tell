# refactoring-8: 갤러리 수업을 1440×900·1280×800 audit 0건으로 맞추고 죽은 코드를 지우기

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다." 갤러리는 agent가 부품 조합을 배우는 참고물이므로(SKILL.md §3.1), 갤러리가 skill 자신의 규칙(§3.6 "두 크기 모두 0건")을 어기면 그 패턴이 수업으로 복제된다.

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-8. 지금 진행 중인 자동 audit 스크립트가 들어온 뒤 그것으로 표를 다시 뽑아 시작한다. refactoring-4(측정 로직)·7(모바일)의 결정에 따라 대상이 바뀔 수 있다.
- 관련 파일: `site/gallery/**/*.html`(live 12편), `skills/learn-to-tell/kit/ltt.js` `auditScene`(`shrunk` 88%, `overflow` 78%, `small-visual` 10%/22%), `skills/learn-to-tell/kit/ltt-deck.js` `lockZoom`·`probe`(장면 진입 시 공개 상태 포함 최소 배율로 zoom 고정, ADR 40552fcb2a7c3985), `agent-docs/handoff/stale/f0ceee98d2eb9ada-audit-1280x800-gallery.md`(같은 목표의 이전 작업, 종료 처리됨).
- 2026-10-18 헤드리스 측정(`Google Chrome --headless=new --window-size=<w>,<h> --virtual-time-budget=12000 --dump-dom <url>?audit`의 `data-ltt-audit` 값; 서버 `LTT_PORT=47999`; 실제 Chrome과 폰트 폴백·행높이가 다를 수 있어 절대값은 재확인 필요, 같은 조건의 전후 비교는 유효):

| 대상 | 1440×900 | 1280×800 |
| --- | --- | --- |
| master(`87bcf44`) 기존 11편 합계 | 4 | 22 |
| 이 브랜치 기존 11편 합계 | 6 | 26 |
| 이 브랜치 새 `network/tls13-quic` | 1 | 5 |

- 브랜치 기준 페이지별(1440×900 / 1280×800): cache-ttl 0/2, anchoring 0/0, diversification 0/3, single-gpu-dataflow 2/3, ontology-triples 2/4, matrix-as-transform 1/2, tls13-quic 1/5, retrieval-practice 0/2, trolley-ethics 0/1, projectile-drag 0/2, color-contrast 0/3, visual-hierarchy-spacing 1/4.
- 경고 종류: `shrunk`(78~87%)가 대부분, `overflow` 2건(ontology 22장면, tls13-quic 14장면; 1280×800), `small-visual` 4건(tls13-quic 6장면 8%, retrieval-practice 6장면 22%, color-contrast 3장면 21%, visual-hierarchy-spacing 7장면 10%; 1280×800).
- 죽은 코드: `site/gallery/network/tls13-quic.html:124` `streamsMiniOld`(호출 없음). 같은 파일 `ltt-meta.mode`가 `"simulation"` 한 단어로, 다른 수업의 서술형 `mode`와 다르다(`tests/gallery.test.mjs`는 존재만 검사).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| handoff f0ceee98(1280×800 경고 0건 맞추기)을 완료로 처리 | 2026-10-18 헤드리스 측정에서 master 11편이 1280×800에서 22건 | hypothesis: 그 뒤 kit 변경(배율 고정이 공개 상태 최소 배율로 zoom을 고정해 `shrunk` 판정 증가; ADR 40552 부정 결과) 또는 헤드리스와 실제 브라우저의 렌더링 차이. 둘 중 어느 쪽인지 미확인 |
| 이 브랜치의 배율 고정을 폭 1400/1000/760에서 zoom 불변으로 검증(handoff e72bbfb2418e2e6d) | SKILL.md가 정한 1440×900·1280×800 audit 건수는 보지 않았고, 두 크기에서 경고가 각각 +2, +4 늘었다 | verified: 검증 항목이 "배율이 바뀌지 않음"이었고 "경고 0건"은 아니었다 |

## Next Step

1. 자동 audit 스크립트(진행 중)로 표를 다시 뽑는다. 실제 Chrome 한 페이지와 헤드리스 결과를 1회 비교해 차이가 있으면 기록한다.
2. `shrunk`: lockZoom 뒤 audit의 `zoom`은 공개 상태를 포함한 최소 배율이다. 이것이 의도라면 API.md audit 표에 명시하고, 수업은 `why`·`answerVisual`·takeaway·recall 답을 줄이거나 장면을 나눈다. 기준 88%는 바꾸지 않는다(f0ceee98의 원칙). 의도가 아니라면 `measure`가 공개 전 배율을 보게 고치는 쪽은 refactoring-4 범위다.
3. `overflow` 2건은 장면을 나눈다. `small-visual` 4건은 그림을 키우거나 `layout: "full"`.
4. `tls13-quic.html`: `streamsMiniOld` 삭제, `ltt-meta.mode`를 다른 수업처럼 "체험형/설명형 + 이유" 서술로.
5. 자동 audit을 `tests/`에 두어(Chrome이 없으면 skip) 갤러리가 다시 규칙을 어기면 테스트가 잡게 한다.
6. 1280×800을 유지할지는 f0ceee98의 Open Question이 그대로 미결이다. 사용자에게 묻는다.

## Open Questions

- 1280×800 크기를 유지할지, 1440×900 하나로 줄일지.
- 헤드리스 측정을 기준으로 삼아도 되는지(실제 Chrome과의 차이 크기).
- `shrunk`가 공개 상태 포함 최소 배율을 보는 것이 의도인지.

## Spec

없음(갤러리 수정과 테스트 추가). kit `measure` 변경이 필요하면 refactoring-4로 넘긴다.

## Execution Ledger

- 2026-10-18 헤드리스 측정 결과는 State의 표와 같다. 측정 스크립트는 세션 scratchpad(`audit-all.sh`, `audit-root.sh`)에 있고 저장소에는 아직 없다(자동 audit 작업에서 들여온다).
