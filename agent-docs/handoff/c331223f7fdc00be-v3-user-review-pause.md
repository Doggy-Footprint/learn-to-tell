# v3 사용자 검수 중단: 시험 2개 판정과 남은 결정

## User Query

- "내가 검수해야 하는 거 어떻게 하면 되는지 알려줘"
- (projectile-drag 비교 뒤) "이걸로는 알기 어려웠음: 공기저항이 있으면 최적 발사각은 왜 45°보다 낮아질까 / 이건 좀 더 나았음: 공기저항이 있으면 최적 발사각은 얼마나 낮아질까? / 주된 이유는 슬라이드를 하며 값을 변경하는 부분에서 항력/중력이라는 초심자에게 난해한 값을 시뮬레이션 함."
- (cache-ttl 보는 중) "baseline: 타임라인으로 보기: ASCII monospace를 이용해서 그림을 그렸네? 가시성은 떨어진다. skill: 마찬가지로 저 그래프는 가시성이 떨어져. diagram으로 표현하는 게 더 시인성이 좋을텐데. 차라리 master에 있는 버전을 다시 개선해볼까? Vega-light로는 이런 그래프가 한계야? 다양한 다이어그램 종류는 못 그려? https://learn-to-tell.vercel.app/gallery/shots/index.html 이런 종류"
- "여기서 일단락 하자 v3. 나머지는 handoff로 빼줘"

## State

- branch `PoC/v3`, HEAD `823adba`. 이 handoff 외 변경 없음.
- 이전 handoff `307d54f26859f69b-v3-trial-findings.md`의 남은 항목은 아래 Next Step으로 옮기고 그 문서는 `stale/`로 옮겼다.
- 검수 대상: `bench/v3/gen/<topic>/skill.html`, `baseline.html`. 요청 원문은 `bench/v3/gen/<topic>/baseline-prompt.md`, 생성 지시는 `bench/v3/gen/gen-common.md`와 각 `prompt.md`.

## 사용자 검수 결과

| topic | 판정 | 사용자 근거 |
| --- | --- | --- |
| projectile-drag | skill 불가, 기준선이 더 나음 | skill 3절 슬라이더가 항력/중력 비(초심자에게 난해한 양)를 조작한다 |
| cache-ttl | skill·기준선 모두 가시성 부족 | 기준선은 타임라인을 ASCII monospace로, skill은 선 그래프로 그렸다. 다이어그램이 필요하다 |
| diversification | 미검수 | — |

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (이전 handoff에서 옮김) 생성 agent가 `color`로 나눈 차트에 기준점을 붙였다 | `point-mark` 실패 5회 | verified: 검사기가 `<name>_marks`의 `from.data`를 top-level dataset으로 요구했다. run fd0231d3293c45b1에서 scenegraph `datum` 판정으로 고쳤다 |
| (이전 handoff에서 옮김) projectile-drag skill: RK4 결과를 `values`로 미리 넣었다 | HTML 123 KB, 공기저항 드롭다운 3단계 | verified: Vega expression에 반복·적분이 없다 |
| projectile-drag skill: 진단 사다리를 그대로 수업 목차로 썼다 | 1–5절이 `prompt.md` 고정 사다리 단과 1:1, h1이 마지막 단의 "왜"를 따랐다. 3절 "종단 속도와 항력/중력 비"가 `ratio` 차트(`vtr` 슬라이더, y=항력/중력)가 됐다. 사용자 판정 불가 | hypothesis(표본 1): 사다리 단을 목차·조작 변수로 옮긴 것이 원인. 기준선은 사다리 없이 아는 것(진공 45°)에서 출발했다 |
| cache-ttl skill: 시각 자료를 모두 Vega-Lite line/point로 그렸다 | mark 집계 line 4, point 1. 사용자 판정 가시성 부족 | hypothesis: `gen-common.md`가 Vega-Lite 사용법만 자세히 적어 도식까지 차트로 그렸다. plan은 도식을 자유 HTML/SVG로 두고 있다 |

## Next Step

1. **v3를 계속할지 결정 (사용자 결정).** 제안된 두 길:
   - v3 유지 + 시각 자료 3갈래: 함수·데이터·타임라인(Gantt `rect` x/x2)은 Vega-Lite+rule, 구조·흐름 도식은 SVG + 외부 애니메이션 라이브러리 공개 API(후보 Motion, anime.js — 라이선스·API 미조사) + 서브에이전트 검증, 생성 지시문에 "차트인가 도식인가" 선택 규칙과 "학습자가 직접 볼 수 있는 양에 슬라이더를 건다"를 넣는다.
   - master(v1 kit, `site/gallery/shots/`) 개선으로 돌아간다. 이 경우 v1 종료 이유(토큰 8.2배, 19–35분)와 plan 원칙 2("우리 라이브러리를 새로 이해해야 하는 문제는 피한다")를 다시 다뤄야 한다.
2. diversification 검수.
3. (이전 handoff에서 옮김) 수치 적분 모델 처리 (a) 미리 계산한 `values`만 / (b) 페이지 JS 허용, rule 제외 / (c) 혼합. 사용자 검수에서 문제는 격자 제한이 아니라 조작 변수 선택이었다. 직관적 양을 자유 슬라이더로 두려면 (b)나 (c)가 필요하다.
4. (이전 handoff에서 옮김) 검사기 `repeat` 차트·중첩 필드 미지원. 생성 지시문에 `point-group` 사용법 반영.
5. (이전 handoff에서 옮김) `plan.md` 열린 질문 "기준점 선언 위치", "퀴즈 정답 표시"를 spec 6ed8f04e251d4b22 결정으로 갱신.

## Open Questions

- Vega-Lite 밖 도식에서 움직임까지 원할 때 비용이 1.5배 목표 안에 드는지 근거가 없다.
- 서브에이전트 1회 검증(생성 3단계)의 비용은 아직 재지 않았다.
- 자동 무빙 애니메이션과 브라우저 콘솔 오류는 확인하지 않았다.

## Spec

- 완료: `agent-docs/spec-logs/6ed8f04e251d4b22-m1-rule-checker.md` (v3, complete), `agent-docs/spec-logs/fd0231d3293c45b1-grouped-chart-points.md` (v3, complete).
- 진행 중 spec 없음.

## Execution Ledger

- 이번 세션은 검수 안내와 판정 기록뿐이다. 코드 변경, 검증기 실행, fuzz·mutation 없음.
- 이전 실행 기록(비용 0.63–1.17×, rule 회차)은 `stale/307d54f26859f69b-v3-trial-findings.md`에 있다.
