# v3 시험 생성 3개에서 나온 후속 작업 2건

## User Query

- "좋아 구현 후 빠르게 2-3개 만들어보고 추이를 보자고"
- (시험 생성 보고 뒤) "둘 다 핸드오프에 추가해"

## State

- branch `PoC/v3`. 검사기와 시험 생성 결과는 `d0f5b3c`, `403ad36`로 커밋됐다.
- Next Step 1 완료(커밋 전): `packages/check/src/chart.mjs`, `index.mjs`, `packages/check/test/` 추가·수정. spec `agent-docs/spec-logs/fd0231d3293c45b1-grouped-chart-points.md` v3, complete.
- 실행 transcript(`out.jsonl`)는 저장소에 없다(시험 생성 세션 scratchpad에만 있었다).

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| 생성 agent가 `color`로 선을 나눈 차트(cache-ttl `distLine`, projectile 사거리 곡선)에 기준점을 붙였다 | `point-mark` 실패 5회(cache-ttl 2, projectile 3). agent가 filter를 추가하고 calculate를 옮겨 봤지만 같은 오류가 났다. 결국 줄마다 layer로 쪼개서 통과했다 | verified: vega-lite 6.5.0은 `color`로 나눈 line을 `<name>_pathgroup`(group, `from.facet.data` = top-level dataset)과 `<name>_marks`(`from.data` = `faceted_path_<name>_main`)로 컴파일한다. 검사기 FR-8은 `<name>_marks`의 `from.data`가 top-level dataset이어야 해서 이 경우를 `point-mark`로 거절한다 |
| projectile-drag skill 경로: 항력 궤적을 Vega 식으로 쓸 수 없어 RK4로 미리 계산한 값을 `values`로 넣었다 | HTML 123 KB(기준선 19 KB). 공기저항은 드롭다운 3단계만 고를 수 있다. 기준선은 브라우저에서 RK4를 돌려 발사 속도·종단 속도·각도·높이를 모두 슬라이더로 바꾼다 | verified: Vega expression에는 반복·적분이 없다(`plan.md` 알려진 위험). 미리 계산한 데이터만 허용하면 매개변수 공간을 격자로 고정해야 한다 |

## Next Step

1. ~~색으로 나눈 선 차트 지원~~ — 완료(run fd0231d3293c45b1).
   - 방향을 바꿨다: 부모 group의 `from.facet.data`를 따라 top-level dataset에서 읽는 대신, mark가 그린 scenegraph item의 `datum`을 행으로 쓴다. facet + layer는 cell 안에 top-level과 같은 이름(`data_0`)의 로컬 dataset을 만들어, 이름으로 읽으면 다른 cell의 행이 나온다(`view.data("data_0")`가 마지막 cell의 로컬 데이터를 돌려줌, 확인됨).
   - facet(operator, `encoding.column/row/facet`, layer 포함) 지원, `where`에 그룹 필드가 빠지면 `point-group`.
   - 남은 것: `repeat` 차트, 중첩 필드. 생성 지시문(SKILL)에 `point-group` 사용법을 반영하는 일.
2. **수치 적분이 필요한 모델의 처리 (사용자 결정)**
   - (a) 지금처럼 미리 계산한 `values`만 허용하고 rule 검사를 유지한다. 상호작용은 미리 정한 격자로 제한된다.
   - (b) 페이지 JS 계산을 허용하고 그 그래프는 rule 대상에서 뺀다. 서브에이전트 검증으로 넘긴다.
   - (c) 둘을 섞는다. 기준점용 격자 데이터는 rule로 검사하고, 자유 슬라이더는 페이지 JS가 맡는다.
   - 사용자가 projectile-drag 두 페이지를 직접 비교한 뒤 정한다.

## Open Questions

- 시험 3개의 품질 판정(사용자 검수)이 아직 없다.
- 시험 구간은 생성 흐름 1–2단계뿐이다. 서브에이전트 1회 검증(3단계)을 넣은 비용은 아직 재지 않았다.
- 렌더 확인은 headless Chrome에서 차트가 그려지는지까지만 봤다. 자동 무빙 애니메이션과 브라우저 콘솔 오류는 확인하지 않았다.
- rule 검사가 잡은 실제 결함은 1건뿐이다(diversification에서 `sqrt` 안 미세 음수로 NaN 행이 빠짐). 수치 퀴즈 정답과 모델 값이 어긋난 경우(`quiz-mismatch`)는 0건이었다. 표본이 3개라 rule 검사의 효과를 판단하기에는 부족하다.
- `plan.md` 열린 질문 중 "기준점 선언 위치", "퀴즈 정답 표시"는 spec 6ed8f04e251d4b22로 정해졌다. plan 갱신은 아직 하지 않았다.

## Spec

- 완료: `agent-docs/spec-logs/6ed8f04e251d4b22-m1-rule-checker.md`, v3, complete, run 6ed8f04e251d4b22.
- Next Step 1용 spec은 아직 없다.

## Execution Ledger

- 검사기 run 6ed8f04e251d4b22
  - 수정 2회, 검증 2회(retry 다음 pass)
  - finding F-1(콘솔 감시 범위), F-2(사례 없는 spec 문장 5개)는 닫혔다. advisory A-3, A-4(`process.emitWarning` 감시)는 남겼다.
  - hand mutation M1..M14를 모두 잡았다. fuzz와 mutation tool은 쓰지 않았다(설치된 도구 없음).
  - Test command 결과: 92/92 통과, 커버리지 99.82 / 98.05 / 100.

시험 생성(2026-10-24, opus 5.5 effort low, 6개 병렬, 1–2단계만):

| topic | skill / 기준선 비용 | 시간 | 누적 처리량 | 검사 회차별 rule |
| --- | --- | --- | --- | --- |
| cache-ttl | $0.33 / $0.52 (0.63×) | 106 / 121초 | 173k / 64k | point-mark 3 → point-mark 3 → ok |
| diversification | $0.42 / $0.46 (0.91×) | 79 / 93초 | 88k / 60k | point-row 1 → ok |
| projectile-drag | $0.55 / $0.47 (1.17×) | 119 / 100초 | 187k / 61k | point-mark 1 ×3 → ok |
