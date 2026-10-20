# 생성 비용 측정

`run.sh`로 고정 진단의 수업을 비대화형으로 한 편 만들고(`claude -p`, Sonnet medium), `summary.mjs`로 비용과 결과를 모은다. 가중 토큰은 `../transcript-cost.mjs`의 가중치(input 1, cache write 1.25, cache read 0.1, output 5)로 센다.

```bash
scripts/measure/run.sh <set-dir> <commit|WORKTREE> <topic> <variant> <rep>   # topic: prompts/*.md
node scripts/measure/summary.mjs <set-dir>...
```

## 기준선 (cache-ttl · cpu-cache · projectile, 수업당)

| 판 | 가중 토큰 | 시간 | 비용 | 측정 |
| --- | --- | --- | --- | --- |
| v1 (dd6e1f9) | 497–555k | 345–390초 | $1.04–1.12 | 2026-10-20 final-check |
| v2 (1758a26) | 411–557k (평균 461k) | 352–551초 | $0.84–1.12 | 2026-10-20 v2 |

목표는 v1의 40%(약 210k)다. v2에서 가중 토큰의 약 45%는 출력이고, 그 대부분은 `lesson.html`을 쓰는 응답의 사고(12–24k 토큰)다. 측정 원자료는 `~/toy-projects/learn-to-tell/measurements/`에 있다.

## 사실 검토자 시험 (2026-10-20)

과거 outline 5편(cache-ttl, cpu-cache, projectile, llm-hallucination, vector-calculus)의 `## 주장`·`## 모델`에 틀린 주장 3개와 틀린 수치 2개씩을 심고, SKILL.md의 검토 프롬프트로 Sonnet 서브에이전트에 맡겼다. 주장 15/15, 수치 10/10을 잡았고 오탐은 수업당 0–1건, 비용은 수업당 46–48k 토큰(28–44초)이었다. v1의 검토 3종(기대값·주장·독자) 합계는 141–175k였고, 독자 검토가 잡던 용어 순서 문제는 lint가 잡는다.
