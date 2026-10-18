# refactoring-3: 장면 수 기본 예산을 두고 "한 챕터 전체"는 명시적으로만 해제하기

## Goal

"이 스킬은 일반적으로 학습 자료를 요청하는 것보다 빠르고 적은 토큰 소모로 학습 자료를 제작할 수 있도록 지원해야 한다."

## State

- 브랜치 `fix/run-time`, 기준 커밋 `956df3f`. 코드 변경 없음.
- 순서: refactoring-3. refactoring-1(비용 기록)로 효과를 비교한다.
- 관련 파일: `skills/learn-to-tell/SKILL.md` §2(범위: "대략 교과서 한 챕터, 대학 수업 0.6회 정도이며 엄밀한 상한은 아니다")·§3.1("장면 수는 범위(§2)를 따른다"), `learn-to-tell-PROJECT.md` §1·§3(한 회 최대 20분; v0의 15분 하한과 결정 변수·개념 수 상한은 "간단한 개념을 억지로 늘리게" 해 제거), `skills/learn-to-tell/kit/ltt.js` `lintDeck`.
- 지금 상태: 상한도 기본값도 없다. 갤러리 장면 수는 4~24개(아래 Ledger). 길이는 쓰기 비용(수업 바이트)과 검증 비용(스크린샷 수, 독자 검토 분량)에 비례한다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |

## Next Step

1. SKILL.md §2에 기본 예산을 적는다. 초안: 결정 변수마다 장면 4개 이하(terms, 원리, predict, 조작·확인 중 필요한 것만), 고정 장면(hook, summary, overview, keywords)을 더해 전체 8~10장면을 기본으로 한다. 사용자가 "한 챕터 전체"·"길게"를 말했거나 결정 변수가 3개 이상이면 늘린다. 상한이 아니라 기본값이며, v0에서 없앤 것은 하한이었음을 함께 적어 과거 결정과 충돌하지 않게 한다.
2. 예산을 넘길 때는 §2의 범위 알림에 장면 수와 이유를 한 줄 덧붙인다(묻지 않는다).
3. 선택: lint 규칙 `scene-budget`(장면 수 > 결정 변수 수 × 4 + 4면 정보 수준 경고). 사용자가 경고 장치를 생성 비용 때문에 기각한 전례(handoff e72bbfb2418e2e6d Open Questions)가 있으므로 먼저 묻는다. 결정 변수 수는 `ltt-meta.decision`을 세거나 `LTT.deck({decisions: n})`으로 받는다.
4. simple 경로(§2, 대화만)와 시뮬레이션 경로 사이에 "짧은 덱"(4~6장면, 검증 단계 축소) tier를 둘지 refactoring-1의 기록을 보고 정한다.

## Open Questions

- 기본값 8~10의 근거는 갤러리 분포(중앙값 11.5)뿐이다. 20분 기준과 어떻게 맞추나.
- 결정 변수 수를 어디에 적나(`ltt-meta`, deck spec, result.md).
- 짧은 덱 tier를 두면 §3.6 검증 중 무엇을 생략해도 되는지(독자 검토는 유지, 눈 검토는 생략 등).

## Spec

없음(SKILL.md 문구 변경). lint 규칙을 넣으면 `tests/kit.test.mjs`에 단위 테스트 1건.

## Execution Ledger

- 2026-10-18 측정(갤러리 `ltt-meta.pattern` 길이): trolley-ethics 4, cache-ttl 10, anchoring 10, diversification 10, matrix-as-transform 10, projectile-drag 10, retrieval-practice 11, color-contrast 12, single-gpu-dataflow 12, visual-hierarchy-spacing 12, tls13-quic 16, ontology-triples 24. 중앙값 11.5. 파일 크기는 장면 수에 대체로 비례(4장면 11.6KB, 16장면 46.0KB, 24장면 49.6KB).
