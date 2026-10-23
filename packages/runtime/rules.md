# 수업 규칙 카탈로그

수업 규칙과 강제 층. type 층은 `packages/runtime/types/lesson.d.ts`가 tsc로, check 층은 `ltt check`(M2)가 렌더 전에, runtime 층은 runtime이 렌더할 때 강제한다. "예시 수업 고의 결함"은 `skill/learn-to-tell/examples/projectile-drag.js`에 이 편집을 하면 그 규칙이 걸려야 한다는 뜻이다.

| id | 규칙 | 근거 | 강제 층(type/check/runtime) | 예시 수업 고의 결함 | 상태 |
| --- | --- | --- | --- | --- | --- |
| first-scene | 첫 절의 첫 장면은 hook이다 | 수업은 상황 제시로 연다 | check | 1절의 hook 장면을 지워 predict가 첫 장면이 되게 한다 | 예정(M2) |
| section-count | sections 수는 진단 사다리의 학습 단 수(3–5)와 같다 | 절 = 사다리 한 단 | check | 4절(최적각)을 지운다 | 예정(M2) |
| scene-count | 장면 수(Σ sections[].scenes.length + 2)는 18–24다 | intent 분량 결정 | check | 4절의 steps·explore 장면을 지워 장면 수를 16으로 만든다 | 예정(M2) |
| predict-before-explain | 절마다 define·steps보다 predict가 먼저 온다 | 예측 후 설명 | check | 2절에서 steps를 predict 앞으로 옮긴다 | 예정(M2) |
| section-quiz | 절마다 마지막 장면은 quiz다 | 절 단위 인출 | check | 3절 끝의 quiz 장면을 지운다 | 예정(M2) |
| final-quiz-count | 최종 quiz는 choice·numeric·order·classify를 각 1개 이상 담는다 | 문항 형식 다양성 | check | 최종 quiz에서 order 문항을 지운다 | 예정(M2) |
| misconception-predict | `targets`가 `meta.learner.misconceptions[0]`인 predict가 첫 두 절 안에 있다 | 오개념을 일찍 겨눈다 | check | 1절 predict의 `targets`를 지운다 | 예정(M2) |
| predict-reveal-hidden | predict의 `reveal.marks`는 답하기 전 그려지지 않는다 | 정답 노출 방지 | runtime | 3절 predict의 reveal.marks에서 "vx-area"를 빼 vx 넓이가 확정 전에 보이게 한다 | 예정(M1) |
| focus-required | figure가 있는 장면은 `focus`를 가진다 | 무엇을 볼지 지시 | type | hook 장면의 `focus` 속성을 지운다 | 강제됨(FR-3) |
| focus-unknown-id | focus id는 그 장면 figure가 그리는 mark id다 | 빈 강조 방지 | check | hook의 focus에 "vacum"(오타)을 쓴다 | stub evaluate에서 강제 |
| accent-focus-only | tone focus mark는 그 mark가 보이는 모든 장면에서 그 장면(단계) focus 목록에 있다. focus 목록이 없는 곳(quiz 문항 figure, summary, reveal.figure)에는 tone focus mark가 없다 | 강조색 하나 | check | `forces`의 "grav" 화살표 tone을 "focus"로 바꾼다("grav"는 `forces`를 쓰는 두 장면의 focus에 없다) | 예정(M2) |
| quiz-objective | 모든 문항의 `objective`는 meta.objectives의 id다 | 목표-문항 대응 | check | 최종 quiz numeric의 objective를 "o9"로 바꾼다 | 예정(M2) |
| quiz-distractor-feedback | 오답 선택지는 `feedback`을 가진다 | v1 빈 버튼 결함 | type | 1절 quiz 오답 선택지의 `feedback`을 지운다 | 강제됨(FR-3) |
| quiz-transfer | 최종 quiz에 `transfer: true` 문항이 1개 이상 있다 | 전이 확인 | check | 탁구공 문항의 `transfer`를 지운다 | 예정(M2) |
| term-defined-before-use | define 장면의 term은 그 define 장면보다 앞선 장면 글(title·say·ask·선택지·feedback·reveal.say)에 나오지 않는다 | 모르는 말 금지 | check | 1절 hook의 say에 "항력"을 쓴다(define은 그 뒤 s0.2) | 예정(M2) |
| term-unknown | 장면 글의 굵은 용어·define term은 glossary에 있다 | 용어 일관성 | check | glossary에서 "항력"을 지운다(1절 define의 term) | 예정(M2) |
| model-limit-check | src가 문자열인 model마다 `limit` check가 1개 이상 있다 | 극한으로 검산 | check | `fall`의 limit check를 지운다 | 예정(M2) |
| check-tol-required | number expect는 `tol` 또는 `rel`을 가진다 | 부동소수 비교 | type | check "range45"를 `expect: 48.07`로 바꾸고 tol을 지운다 | 강제됨(FR-3) |
| provenance | model은 `src`(출처 또는 illustrative)를 가진다 | 수치 출처 | type | `flight` model의 셋째 인자 `src`를 지운다 | 강제됨(FR-3) |
| illustrative-label | illustrative model 값을 보이는 장면은 "가정 값"임을 표시한다 | 만든 숫자와 실측 구분 | check | 탁구공 feedback에서 "(가정: C_d 0.5, ρ 1.2)"를 지운다 | 예정(M2) |
| model-pure | model fn은 같은 입력에 같은 출력을 낸다 | 결정성(D5) | check | `flight` fn에 `Math.random()` 잡음을 더한다 | stub evaluate에서 강제 |
| figure-or-none | figure를 가리키는 장면·문항의 키는 figures에 있다 | 깨진 참조 | type | hook의 figure를 "trajj"로 바꾼다 | 강제됨(타입 FigKey) |
| time-declared | frame은 TimeSpec(loop/steps/idle/static) 중 정확히 하나를 가진다 | 시간 영역 명시 | type | `fallv` frame의 `loop`를 지운다 | 강제됨(FR-3) |
| custom-why | custom은 `why`를 가진다 | 탈출구 남용 방지 | type | `angles` figure에 why 없는 api.custom을 넣는다 | 강제됨(FR-3) |
| custom-bounds | custom 출력은 `bounds` 안에 머문다 | 배치 충돌 방지 | runtime | bounds [[0,0],[1,1]]인 custom이 x=50에 그리게 한다 | 예정(M1) |
| id-unique | 한 figure 안의 mark id는 겹치지 않는다 | focus 모호성 | check | `forces`의 "grav" 화살표 id를 "drag"로 바꾼다 | 예정(M2) |
| data-in-domain | mark 좌표는 frame 축 범위 안에 있다 | 잘린 그림 방지 | check | `traj` x축을 [0, 40, "m"]으로 줄인다 | 예정(M2) |
| text-length | 잠정 상한: 제목 40자, 장면 본문 160자, 선택지 50자 | 화면 분량 | check | 1절 define(항력)의 definition을 170자로 늘린다 | 예정(M2), 상한 잠정 |
| goal-reachable | explore goal은 knob 범위 안에서 달성 가능하다 | 막힌 과제 방지 | check | 4절 explore goal을 `range > 60`으로 바꾼다 | 예정(M2) |
| goal-at-start | explore goal은 시작 params에서 이미 달성되어 있지 않다 | 할 일 없는 과제 방지 | check | 4절 explore goal을 `range > 40`으로 바꾼다 | 예정(M2) |
| input-binding | drag 입력의 mark·draw 입력의 answer는 그 figure의 mark id다 | 입력 대상 존재 | check | 2절 predict drag의 mark를 "drag2"로 바꾼다 | 예정(M2) |
| figure-eval | figure draw는 모든 시간 표본에서 예외·NaN·Infinity 없이 끝난다 | 깨진 그림 방지 | check | `traj` draw의 range-dim 끝 x를 `m.flight.range / 0`으로 바꾼다 | stub evaluate에서 강제 |
| handle-binding | explore handles의 mark는 그 figure의 mark id이고 x·y는 선언된 param이다 | 끌기 대상과 param 연결 | check | 4절 explore에 `handles: [{ mark: "ball", x: "deg" }]`를 넣는다("ball"은 `both`(traj·vx)에 없음) | stub evaluate에서 강제(FR-20) |
| multiples-param | multiples `over`의 키는 선언된 param이다 | 사본별 model 평가 | check | `byvt`의 over 키를 "speed"로 바꾼다 | stub evaluate에서 강제(FR-20) |
| reveal-figure-exists | predict·quiz의 reveal.figure와 summary.figures는 figures의 키다 | 깨진 공개 그림 방지 | check | 1절 predict reveal에 `figure: "angle"`(오타)을 넣는다 | stub evaluate에서 강제(FR-20) |
| legend-for-series | series·의미 tone을 둘 이상 쓰는 figure는 그 tone을 설명하는 legend를 가진다 | 색만으로 뜻을 전하지 않는다 | check | `angles`의 "deg45" 점 tone을 "bad"로 바꾼다(good·bad 두 의미 tone, legend 없음) | 예정(M2) |
| label-anchor | label의 `at`은 글자가 가리키는 점이고, 글자를 피하려고 옮긴 좌표가 아니다 | 글자 배치는 runtime이 맡는다(UI-6) | runtime | 예시 수업의 label 하나의 `at`을 그 label이 가리키는 점에서 떨어진 좌표로 옮긴다 | 예정(M1) |
