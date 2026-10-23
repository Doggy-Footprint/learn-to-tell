# v1 측정 기록

v2 목표와 bench가 기준으로 삼는 v1 수치와 측정 방법이다. 원본은 로컬 `measurements/`(커밋하지 않음, 2026-10-19–23)와 태그 `archive/v1`이다. 실행 transcript, 스크린샷, 생성된 home은 옮기지 않았다.

## 지표

- 토큰: 서브에이전트 완료 알림의 `subagent_tokens`. 누적 처리량이 아니라 마지막 시점의 context 크기로 보인다(가설, 확인 안 함).
- 시간: `duration_ms`. 도구 호출: `tool_uses`.
- 생성 단계만 잰다. 진단(§1)·이해 확인(§4) 대화, 서버 실행·공개는 뺀다.
- gallery-v2 토큰에 수업 에이전트 안에서 띄운 검증 서브에이전트 토큰이 들어갔는지는 알림만으로 알 수 없다.

## 일반 요청 vs v1 (compare1, 2026-10-19)

조건: `claude-opus-5-5`, 양쪽 모두 새 context의 서브에이전트. 기준선은 상황·배경과 "학습 자료를 만들어 달라"만 받았고 skill이 없다(ontology만 "교과서 한 챕터 분량으로 길게"). 기준선은 검토·렌더링 확인을 하지 않았다. 산출물과 prompt 문구는 `archive/v1:site/compare1/`.

| 주제 | 기준선 산출물 | 기준선 토큰 · 도구 · 시간 | v1 수업 | v1 생성 토큰 · 시간 | v1 검증 토큰 | v1 합 / 기준선 |
|---|---|---|---|---|---|---|
| cache-ttl | HTML 29.7KB, 8섹션, 슬라이더 시뮬레이터 2, 서술 4문항 | 56.8k · 4 · 161초 | 12장면, 41.0KB | 235.0k · 973초 | 240.7k | 8.4× |
| trolley (공리주의 vs 의무론) | HTML 31.0KB, 7섹션, SVG 5사례, 문턱 시뮬레이터, 서술 5문항 | 55.7k · 4 · 159초 | 12장면, 32.5KB | 215.5k · 1034초 | 229.5k | 8.0× |
| projectile | HTML 28.6KB, 요약 카드 + 6섹션, 궤적·사거리 캔버스 시뮬레이터, 서술 5문항 | 60.3k · 5 · 194초 | 13장면, 41.2KB | 219.5k · 995초 | 248.2k | 7.8× |
| contrast (WCAG 색 대비) | HTML 31.0KB, 9섹션, 대비비 계산기, 객관식 6 + 서술 2 | 59.2k · 8 · 179초 | 14장면, 43.9KB | 248.2k · 1299초 | 246.7k | 8.4× |
| ontology | HTML 61.7KB, 11섹션, 실습 5, 서술 8문항 | 72.4k · 4 · 296초 | 21장면, 53.3KB | 317.3k · 1556초 | 294.4k | 8.4× |
| 합 | | 304.4k | | | | 8.2× |

- v1 검증은 서브에이전트 4종(기대값, 주장, 독자, 눈)의 합이다. 병렬이라 v1 시간에는 넣지 않았다.
- 기준선 시간은 159–296초, v1 생성 시간은 973–1556초(16–26분).

## v1 수업 17개 (gallery-v2, 2026-10-22)

조건: 수업 에이전트 17개를 한 메시지로 동시에 띄웠다. 진단은 고정(`topics.md`). storyboard 선택 대기, 서버·공개, 이해 확인 퀴즈, map rebuild는 하지 않았다. 산출물은 `archive/v1:site/gallery/<분야>/<id>.html`.

| 수업 | 토큰 | 도구 | 시간 | audit | 검증 회차 | 남은 미충족(개수) | lesson.html |
|---|---|---|---|---|---|---|---|
| cache-ttl | 176,543 | 67 | 19분 01초 | 5 | 2 | 0 | 35,094 B |
| llm-hallucination-internal | 161,455 | 67 | 20분 26초 | 6 | 3 | 0 | 35,479 B |
| color-contrast | 190,903 | 86 | 20분 27초 | 6 | 2 | 1 | 35,683 B |
| anchoring | 179,965 | 74 | 20분 29초 | 5 | 2 | 3 | 39,248 B |
| visual-hierarchy-spacing | 206,822 | 101 | 21분 42초 | 7 | 2 | 0 | 34,178 B |
| retrieval-practice | 180,160 | 91 | 23분 32초 | 9 | 3 | 1 | 37,239 B |
| art-of-loving | 187,261 | 89 | 24분 10초 | 10 | 3 | 미검증 수정 있음 | 37,786 B |
| trolley-ethics | 186,063 | 82 | 24분 44초 | 9 | 3 | 0 | 30,836 B |
| single-gpu-dataflow | 200,512 | 104 | 25분 12초 | 10 | 3 | 0 | 37,569 B |
| matrix-as-transform | 209,073 | 112 | 25분 20초 | 7 | 3 | 0 | 39,724 B |
| tls13-quic | 196,936 | 87 | 26분 28초 | 9 | 3 | 3 + 미검증 2 | 41,602 B |
| ontology-triples | 226,293 | 110 | 28분 10초 | 12 | 3 | 미검증 1 | 48,897 B |
| diversification | 241,325 | 134 | 28분 31초 | 12 | 3 | 0 | 40,737 B |
| projectile-drag | 208,067 | 102 | 28분 52초 | 11 | 3 | 3 | 42,345 B |
| investing-basics | 234,375 | 139 | 29분 23초 | 13 | 3 | 2 + 미검증 수정 | 44,801 B |
| drawing-basics | 250,867 | 132 | 29분 26초 | 7 | 3 | 2 | 47,985 B |
| vector-calculus-mml5 | 306,581 | 159 | 35분 21초 | 12 | 3 | 4 | 68,104 B |

- 평균 25분 22초, 토큰 평균 208,424(합 3,543,201), 도구 평균 102, audit 평균 8.8회, 검증 평균 2.8회.
- 검증 2회로 끝난 4개 평균 20분 24초, 3회까지 간 13개 평균 26분 53초. audit 횟수와 총 시간의 상관계수 0.79.
- 사용자 판정: 그림 품질은 괜찮다.

단계별 시간(평균, 파일 생성 시각과 페이지 이벤트에서 추정):

| 계획(outline·checklist·storyboard) | 첫 렌더까지 | audit·검증 반복 | 마무리 | 합 |
|---|---|---|---|---|
| 3분 58초 | 4분 27초 | 14분 37초 (58%) | 2분 18초 | 25분 22초 |

- audit 1회는 평균 27초였고, 수업당 audit 합계는 총 시간의 약 16%였다. 반복 단계의 나머지는 audit 사이 작업(스크린샷 읽기, 수정, 검증 서브에이전트)이다.
- 반복을 만든 결함의 부류: audit check 0으로 통과했는데 검증만 잡은 레이아웃 결함(넘침·작은 글자·겹침), kit 사용 형식 오류(predict `choices` 형식이 틀려 빈 버튼, 검사 통과), lint 경고가 audit 출력에 없음, 덱 순서 규칙 충돌, 깨진 페이지를 audit이 통과(필수 스크립트 누락), 검증할 수 없는 항목이 회차만 소모.
- 수업별 결함 상세는 `archive/v1:agent-docs/handoff/7a0ce2dc6e07a3ca-gallery-v2-test-results-and-generator-fixes.md`, 단계별 시간 상세는 `archive/v1:agent-docs/handoff/7e90f918766e0244-lesson-generation-time-10min.md`.

## 생성기 결함 수정 뒤 재생성 (regen-fix2, 2026-10-23)

조건: gallery-v2에서 검증만 잡던 결함을 audit·lint가 잡게 고친 kit, 빈 home, 3개 병렬. 괄호는 gallery-v2의 같은 주제 값.

| 수업 | 토큰 | 도구 | 시간 | audit | 검증 회차 | 남은 미충족(개수) |
|---|---|---|---|---|---|---|
| vector-calculus | 296,668 (306,581) | 115 (159) | 29분 42초 (35분 21초) | 4 (12) | 2 (3) | 0 (4) |
| projectile-drag | 253,735 (208,067) | 122 (102) | 32분 39초 (28분 52초) | 8 (11) | 3 (3) | 0 (3) |
| investing-basics | 252,381 (234,375) | 105 (139) | 29분 21초 (29분 23초) | 8 (13) | 3 (3) | 미검증 수정 2 (2 + 미검증) |

- 결정적 검사로 잡는 결함을 늘리자 audit 횟수와 남은 미충족은 줄었지만, 생성 시간은 29–33분으로 줄지 않았다.
- 세 수업 모두 3회차 audit부터 check 0이었고, 그 뒤 audit은 검증 서브에이전트가 낸 미충족을 고친 뒤 다시 돈 것이다.

## 블라인드 쌍 비교 (audit5-check, 2026-10-20)

- 같은 주제 3개(cache-ttl, cpu-cache, projectile) × 2회, kit 변경 전(base)과 후(head) 수업을 X/Y로 섞고 판정 agent(opus, effort low)가 채점한 뒤 열쇠(`key.json`)로 풀었다.
- 결과: head 우세 3, base 우세 3. 점수 합 base 123, head 124. 주제·글·숫자·레이아웃을 본보기에서 베낀 사례 0건.
- 쌍마다 점수 차가 1–3점이라 작은 변경의 효과는 이 규모(3주제 × 2회)로 구분되지 않았다.
- 채점 기준 원문은 보존되지 않았다(채점을 띄운 세션의 prompt였다).

## 실행 방법

- 비대화형 실행: 주제마다 빈 작업 디렉터리와 home을 만들고, 공통 지시 + 주제 prompt를 stdin으로 준다.

  ```bash
  env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_ENTRYPOINT \
    LTT_HOME=$R/home claude -p --model <model> --effort <effort> \
    --setting-sources project --strict-mcp-config --mcp-config <빈 mcp json> \
    --plugin-dir <skill 스냅샷> --allowedTools "Read Write Edit Glob Grep Bash Agent Skill" \
    --output-format stream-json --verbose < prompt.md > out.jsonl
  ```

  - 부모 Claude Code 세션의 환경 변수(`CLAUDECODE`, `CLAUDE_CODE_*`, `CLAUDE_PID`, `CLAUDE_EFFORT`)를 지워야 자식 세션이 독립 세션으로 돈다.
  - skill은 실행 전 시점의 스냅샷 디렉터리를 `--plugin-dir`로 준다. 측정 중 저장소가 바뀌어도 결과가 섞이지 않는다.
  - gallery-v2·regen-fix2는 `claude -p` 대신 메인 세션의 Agent 도구로 수업 에이전트를 띄우고 완료 알림의 usage를 기록했다.
- 공통 지시가 막은 것: 사용자에게 묻기, 진단 대화, storyboard 대기, 서버, 이해 확인, map 연결 점검. 다른 수업·갤러리·측정 폴더·`agent-docs/` 읽기도 막았다.
- 도구 호출 추적: `out.jsonl`에서 `type == "assistant"`인 줄의 `tool_use`를 순서대로 뽑았다(도구 이름, 파일 경로 또는 명령 앞 150자).
- contact sheet: 장면마다 headless Chrome으로 0.9초(초기)와 5초(정착) 두 프레임을 `--virtual-time-budget`으로 찍고, 6장면씩 한 장의 PNG로 묶었다. 1280×800, Chrome 4개 병렬.
- 동시 실행 주의: 17개를 동시에 돌리면 audit의 Chrome이 서로 경쟁한다. 시간 비교는 같은 동시 실행 수끼리만 한다.
