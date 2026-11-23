# kit 3D: three.js를 3D가 핵심인 수업이 생길 때 넣기

## Goal

"handoff에 3D 수업 남겨둘것"

원래 목표(kit 확장 handoff `agent-docs/handoff/stale/4f7ea6efa16f46da-kit-library-expansion.md`): "라이브러리로서 테마, 에셋에 해당하는 것들, 그래프 등 다양한 설명 방법에서 사용하는 형태들를 표현할 수 있는 라이브러리들, 그리고 1,2,3,4 모두 넣어서 하나의 handoff로 만들어줘." 그 handoff의 차트 라이브러리 표 중 3D(벡터·회전·물리) 행만 "3D가 핵심인 수업이 생길 때만" 조건으로 남았다.

## State

- branch: `master`, commit `e1d5dae` 위(이 handoff와 ADR `agent-docs/adr/90dd94ba2dec2365-auto-layout-with-elkjs.md`를 담은 커밋 직전).
- kit 확장 handoff의 나머지(테마 자산, 도식 경로·자동 배치·시퀀스·상태, 차트 래퍼, 부품 백로그)는 커밋 `46fbf5e`, `fb20cc6`, `0e998d7`, `45f9a63`, `e1d5dae`로 끝났다.
- three.js는 vendor하지 않았다. `kit/vendor/` 합계는 약 6.0MB이고, 페이지별로 쓰는 것만 `<script>`로 불러오는 방식이다(elk 1.6MB도 같은 방식, `tests/gallery.test.mjs`가 부품 사용 ↔ vendor 로드를 검사).
- 3D가 핵심인 gallery 수업은 아직 없다. 지금 2D 대안: `LTT.plane`(2×2 행렬 격자 변형), `LTT.axisPlot`, `LTT.sim`.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | three.js는 시도하지 않았다 | 착수 조건(3D 수업 수요) 미충족 (verified) |

## Next Step

착수 조건: 3D가 결정 변수인 수업(예: 3×3 회전·투영, 강체 회전, 3D 좌표계, 점군)이 실제로 요청되거나 `result.md`의 "kit 후보"에 3D가 적힌다.

1. 그 시점의 three.js 최신 안정 버전을 `npm view three version`으로 확인하고(2주 이상 된 버전), 필요한 모듈만 vendor한다. `kit/vendor/VERSIONS`에 버전·파일·sha256, `LICENSE-three`(MIT)를 남긴다.
2. kit에는 얇은 래퍼만 둔다(예: `LTT.space(el, {axes, vectors, points, camera})`): 색은 `--ltt-*`·`LTT.palette()`, 라벨은 kit 글자 크기, 단계 재생은 `player`/figure `steps`와 같은 모양, 모션 감소 설정이면 정지 화면.
3. 정지 화면만으로도 읽혀야 한다(SKILL.md §3.4 모션 원칙). `?audit` 측정과 lint가 canvas/WebGL 그림을 그림으로 세는지 확인한다(`ltt-deck.js`의 `VISUALS` 선택자에 `canvas` 포함).
4. `tests/gallery.test.mjs`의 부품 → vendor 규칙에 래퍼를 추가하고, catalog 데모와 `kit/API.md`, SKILL.md §3.3 부품 표를 갱신한다.

## Open Questions

- 래퍼 범위: 벡터·축만 볼지, 메시·조명까지 둘지(수업 요구에 따라 정한다).
- WebGL을 쓸 수 없는 환경에서 대체 그림(정적 SVG 투영)을 둘지.

## Spec

none — workflow-approach run 없음(착수 전).

## Execution Ledger

없음 — 착수 전. 이전 kit 확장 run 기록: `agent-docs/spec-logs/8f96def5ba48e754-diagram-edge-paths.md`, `agent-docs/spec-logs/145518ce2564d0c0-diagram-auto-layout.md`.
