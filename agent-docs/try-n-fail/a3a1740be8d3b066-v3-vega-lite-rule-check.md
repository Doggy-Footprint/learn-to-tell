---
commit: 01f77424cee961dd33ef29dcd6ad24051720c421
---

# 차트는 Vega-Lite 공개 API로 쓰고 Node에서 rule 검사하는 구조(v3)

## Goal
자체 라이브러리 대신 외부 라이브러리(Vega-Lite)의 공개 API를 agent가 그대로 쓰게 한다. 화면이 그릴 값을 Node에서 읽어 기준점·퀴즈 정답과 비교해 수치 정확성을 보장하고, 비용은 일반 요청의 1.5배 안에 둔다.

## Attempts
경로는 태그 `archive/v3` 기준이다(`git show archive/v3:<path>`).

| attempt | failure evidence | cause |
| --- | --- | --- |
| v3 구조 전체: 시험 생성 3주제(opus 5.5, effort low, 생성 1–2단계만) | 비용 0.63–1.17×. 사용자 검수: projectile-drag는 기준선이 더 나음, cache-ttl은 양쪽 모두 가시성 부족, diversification은 미검수. rule 검사가 잡은 실제 결함 1건(`sqrt` 안 미세 음수로 NaN 행), 퀴즈 정답 불일치 0건. 사용자가 v3를 멈추고 master의 gallery shots로 돌아감 | user rejected: "Vega-light로는 이런 그래프가 한계야? 다양한 다이어그램 종류는 못 그려?" (`site/gallery/shots/` 같은 도식이 필요) |
| projectile-drag: 항력 궤적을 RK4로 미리 계산해 `values`로 넣음 | HTML 123 KB(기준선 19 KB). 공기저항은 드롭다운 3단계만 고를 수 있음. 기준선은 브라우저에서 RK4를 돌려 모든 값을 슬라이더로 바꿈 | verified: Vega expression에는 반복·적분이 없다 |
| projectile-drag: 진단 사다리를 그대로 수업 목차·조작 변수로 씀 | 1–5절이 고정 사다리 단과 1:1. 3절이 항력/중력 비 슬라이더가 됨. 사용자: "항력/중력이라는 초심자에게 난해한 값을 시뮬레이션 함" | hypothesis(표본 1): 사다리 단을 목차·조작 변수로 옮긴 것이 원인. 기준선은 아는 것(진공 45°)에서 출발했다 |
| cache-ttl: 시각 자료를 모두 Vega-Lite line/point로 그림 | mark 집계 line 4, point 1. 사용자: "diagram으로 표현하는 게 더 시인성이 좋을텐데" | hypothesis: `bench/v3/gen/gen-common.md`가 Vega-Lite 사용법만 자세히 적어 도식까지 차트로 그렸다 |
| 검사기 FR-8: `color`로 나눈 차트에서 `<name>_marks`의 `from.data`가 top-level dataset이길 요구 | `point-mark` 실패 5회. agent가 줄마다 layer로 쪼개서 겨우 통과 | verified: vega-lite 6.5.0은 `color`로 나눈 line을 `<name>_pathgroup`(facet)과 `<name>_marks`(`from.data` = `faceted_path_<name>_main`)로 컴파일한다. run fd0231d3293c45b1에서 scenegraph `datum` 판정으로 바꿨다 |
| facet + layer 차트에서 `view.data(name)`으로 행 읽기 | `view.data("data_0")`가 마지막 cell의 로컬 데이터를 돌려줌 | verified: facet cell마다 top-level과 같은 이름의 로컬 dataset이 생긴다 |

## Revisit Condition
- 함수·수치 그래프가 중심이고 구조·흐름 도식이 필요 없는 수업을 따로 만들 때.
- 페이지 JS 계산을 허용하는 방식(미리 계산한 격자는 rule로 검사하고, 자유 슬라이더는 페이지 JS가 맡음)을 시험할 때. 이때 RK4 행을 다시 본다.
- 생성 지시문이 "차트인가 도식인가"를 고르는 규칙과 "학습자가 직접 볼 수 있는 양에 슬라이더를 건다"를 갖춘 뒤 같은 주제를 다시 시험할 때.
