# 예시 수업 규칙 검토 (R2)

- 대상: `skill/learn-to-tell/examples/projectile-drag.js`
- 규칙: `packages/runtime/rules.md`에서 강제 층이 check인 규칙 27개
- 절차: 규칙마다 해당 장면 경로를 찾아 손으로 확인한다. stub이 강제하는 규칙(focus-unknown-id, model-pure, figure-eval, handle-binding, multiples-param, reveal-figure-exists)은 `npm run verify:example` 결과로 확인한다.
- 장면 경로: `s<절>.<장면>`(0부터). `q<n>`은 최종 quiz 문항.

## 1차 (spec v5, 커밋 46fcb17의 예시)

| 규칙 | 경로 | 결과 | 근거 |
|---|---|---|---|
| first-scene | s0.0 | 충족 | hook |
| section-count | sections | 충족 | 4절 = 진단 사다리 4단 |
| scene-count | 전체 | 충족 | 16 + 2 = 18 |
| predict-before-explain | s0–s3 | 충족 | 절마다 predict가 define·steps보다 앞 |
| section-quiz | s0.3, s1.3, s2.3, s3.3 | 충족 | |
| final-quiz-count | q0–q3 | 충족 | choice·numeric·order·classify |
| misconception-predict | s0.1 | 충족 | targets = misconceptions[0] |
| focus-unknown-id | 전체 | 충족 | verify:example |
| accent-focus-only | s3.2, s2.0, s3.1, q1 | **위반** | tone focus mark가 focus 목록 밖에서 보인다: `traj` drag-path(s3.2 focus는 range-dim·launch, q1은 focus 없음), `fallv` v-curve(s2.0 공개 뒤), `angles` best-dot(s3.1 첫 단계). 그림을 여러 장면이 같이 쓰면 mark의 tone을 고정할 수 없다 |
| quiz-objective | 전체 | 충족 | o1–o4 |
| quiz-transfer | q0 | 충족 | |
| term-defined-before-use | s0.1 | **판정 불가** | 규칙이 glossary 정의도 인정하므로 glossary 용어는 늘 충족한다. 고의 결함("define(항력)을 2절 뒤로")도 걸리지 않는다. 규칙의 뜻을 define 장면 기준으로 바꾸면, s0.1 오답 feedback이 define(s0.2)보다 먼저 "항력"을 쓰므로 위반 |
| term-unknown | s0.2 | 충족 | define term "항력"이 glossary에 있다 |
| model-limit-check | flight, best, fall | 충족 | 각 limit check 1개 이상 |
| illustrative-label | q0, q3 | 충족 | "(가정: …)" 표시 |
| model-pure | 전체 | 충족 | verify:example |
| id-unique | 모든 figure, both | 충족 | |
| data-in-domain | traj | **위반** | range-dim의 y = −3(축 [0, 60] 밖); drag-force 화살표가 발사 순간 (−22.6, −22.6)까지 간다(항력/중력 비 4 × 8 m); gravity 화살표가 y < 8에서 0 아래로; s3.2 knob deg가 59°를 넘으면 진공 궤적 최고점이 60 m를 넘는다(81.6·sin²θ) |
| text-length | 전체 | 충족 | 제목·본문·선택지 상한 안 |
| goal-reachable | s2.2, s3.2 | 충족 | vt 5에서 사거리 < 30; deg 36에서 49.58 > 49.5 |
| goal-at-start | s2.2, s3.2 | 충족 | 시작값 48.07 |
| input-binding | s1.0, s2.0 | 충족 | "drag"는 forces, "v-curve"는 fallv의 id |
| figure-eval | 전체 | 충족 | verify:example |
| handle-binding | — | 충족(해당 없음) | handles 없음 |
| multiples-param | byvt | 충족 | vt는 flight param |
| reveal-figure-exists | summary | 충족 | angles, fallv |
| legend-for-series | traj | 충족 | series tone 1개, legend 있음 |

규칙 밖에서 찾은 결함(예시가 M3 few-shot 원본이므로 같이 고친다):

| 경로 | 결함 | 근거 |
|---|---|---|
| s0.1 | 예측 전에 정답이 보인다 | `angles` 곡선의 정점(36°)이 확정 전에 그려진다 |
| s2.2 | knob vt가 그림을 바꾸지 못한다 | figure `byvt`의 over vt가 knob을 이긴다(A-20 우선순위) |
| s3.0 | 묻는 각도가 그림에 없다 | "60°와 30° 중"을 묻는데 `both`는 장면 params가 없어 45°로 그린다 |
| s3.2 | goal이 의미 없이 쉽다 | knob drag를 끄면 사거리 163 m로 goal을 바로 넘긴다 |
| q1 | 문항 그림이 정답을 보인다 | `traj`의 range-dim이 "48.1 m"를 그린다 |
| traj | 그림이 model과 다르다 | 항력 화살표 길이가 vt = 20을 고정해 쓴다. byvt 사본(vt 10, 40)에서 틀린다 |
| euler | label-anchor(runtime) 위반 | label "note"의 at [6, 2]은 가리키는 점이 아니라 글자를 둘 자리다 |

## 2차 (spec v6, 수정 묶음 4 뒤)

바뀐 장면만 다시 보지 않고 27개 규칙을 전부 다시 확인했다. 수정 뒤 장면 수는 16 + 2 = 18로 같다.

| 규칙 | 경로 | 결과 | 근거 |
|---|---|---|---|
| first-scene | s0.0 | 충족 | hook |
| section-count | sections | 충족 | 4절 |
| scene-count | 전체 | 충족 | 18 |
| predict-before-explain | s0–s3 | 충족 | s0.1 < s0.2 define, s1.0 < s1.1 steps, s3.0 < s3.1 steps |
| section-quiz | s0.3, s1.3, s2.3, s3.3 | 충족 | |
| final-quiz-count | q0–q3 | 충족 | |
| misconception-predict | s0.1 | 충족 | |
| focus-unknown-id | 전체 | 충족 | verify:example focusErrors 0 |
| accent-focus-only (v6) | forces | 충족 | tone focus는 `forces` "drag" 하나다. forces를 쓰는 s0.2(focus drag, vel)와 s1.0(focus drag) 모두 focus에 있다. focus 목록이 없는 곳(최종 quiz, summary의 angles·fallv·byvt, s0.1 reveal.figure angles)에는 tone focus mark가 없다 |
| quiz-objective | 전체 | 충족 | |
| quiz-transfer | q0 | 충족 | |
| term-defined-before-use (v6) | s0.0, s0.1 → s0.2 | 충족 | define 앞 장면 글에 "항력"이 없다(s0.1 feedback은 "공기저항"). 테스트 VO-10이 같은 내용을 자동으로 확인한다 |
| term-unknown | s0.2 | 충족 | |
| model-limit-check | flight, best, fall | 충족 | |
| illustrative-label | q0, q3 | 충족 | |
| model-pure | 전체 | 충족 | |
| id-unique | 모든 figure, both | 충족 | traj(key, vacuum, drag-path, launch, range-dim) + vx(vx-area, vx-line)가 겹치지 않는다 |
| data-in-domain | traj, vx, vxby, both, byvt | 충족 | implementer 검사 스크립트(deg 10–60, vt 5–60, drag 켬·끔, t 0–6): 진공 최고점 55°에서 54.78 m, 진공 사거리 45°에서 163.3 m, vx0 10°에서 39.39 m/s, 60° 비행 시간 4.56 s, range-dim y = 2. 검사 밖: trace·legend·sweep 인자. 손 확인: legend at (120, 55), sweep은 best.deg ≈ 36.2 |
| text-length | 전체 | 충족 | |
| goal-reachable | s2.2, s3.2 | 충족 | vt 5에서 6.10 m < 30; deg 36에서 49.58 > 49.5 (VO-10 자동 확인) |
| goal-at-start | s2.2, s3.2 | 충족 | 시작값 48.07 |
| input-binding | s1.0, s2.0 | 충족 | |
| figure-eval | 전체 | 충족 | |
| handle-binding | — | 충족(해당 없음) | |
| multiples-param | byvt, vxby | 충족 | vt, deg는 flight param |
| reveal-figure-exists | s0.1, summary | 충족 | angles; angles, fallv, byvt |
| legend-for-series | traj | 충족 | |

1차 규칙 밖 결함 7건의 처리:

| 경로 | 처리 |
|---|---|
| s0.1 | figure를 `traj`로 바꾸고 `angles`는 reveal.figure로 확정 뒤에만 보인다 |
| s2.2 | figure `traj`, knob vt. `byvt`는 summary로 옮겼다 |
| s3.0 | `vxby` = multiples(vx, deg 30·60). 넓이(vx-area)는 reveal.marks |
| s3.2 | knob drag를 뺐다(deg 10–55만) |
| q1 | figure를 뺐다 |
| traj | 항력·중력 화살표를 뺐다 |
| euler | 메모를 `code` mark의 label로 옮겼다 |

남은 관찰(규칙 위반 아님): s3.0 reveal.say의 "48.8 m", "39.1 m"는 숫자를 직접 쓴 글이다. C-32 값과 맞지만 model이 바뀌면 같이 바뀌지 않는다. Text 함수로 바꾸는 것이 낫다(M3 few-shot 원본 품질).

## 2차 보강 (spec v7, verifier V1-6)

check 층 규칙 목록: `rules.md`에서 강제 층 칸이 check인 행은 27개이고, 위 2차 표의 27행과 id가 같다(first-scene, section-count, scene-count, predict-before-explain, section-quiz, final-quiz-count, misconception-predict, focus-unknown-id, accent-focus-only, quiz-objective, quiz-transfer, term-defined-before-use, term-unknown, model-limit-check, illustrative-label, model-pure, id-unique, data-in-domain, text-length, goal-reachable, goal-at-start, input-binding, figure-eval, handle-binding, multiples-param, reveal-figure-exists, legend-for-series).

고의 결함 판정: 고친 예시에 각 행의 "예시 수업 고의 결함"을 적용하면 그 규칙 문장에 걸리는지 본다.

| 규칙 | 결과 | 근거 |
|---|---|---|
| first-scene, section-count, scene-count(16), predict-before-explain, section-quiz, final-quiz-count, misconception-predict, focus-unknown-id | 걸림 | 편집이 규칙 문장의 조건을 직접 깬다 |
| accent-focus-only | 걸림 | "grav"는 s0.2(drag, vel)·s1.0(drag) focus에 없다 |
| quiz-objective, quiz-transfer, model-limit-check, illustrative-label, model-pure, id-unique | 걸림 | |
| term-defined-before-use | 걸림 | s0.0 say에 "항력", define은 s0.2 |
| term-unknown | **처음엔 안 걸림 → 고침** | "종단 속도"는 굵은 용어도 define term도 아니다. 결함을 "glossary에서 '항력'을 지운다"로 바꿨다(s0.2 define term) |
| data-in-domain | 걸림 | x축 40 m < 진공 사거리 163 m |
| text-length | **처음엔 안 걸림 → 고침** | 3절에 define이 없다. 결함을 "1절 define(항력) definition 170자"로 바꿨다 |
| goal-reachable | 걸림 | 최대 사거리 49.58 m < 60 |
| goal-at-start | 걸림 | 시작 48.07 m > 40 |
| input-binding, figure-eval, multiples-param, reveal-figure-exists | 걸림 | |
| handle-binding | 걸림 | "ball"은 `both`(traj·vx)에 없다(문구를 traj → both로 고침) |
| legend-for-series | **처음엔 안 걸림 → 고침** | `traj`는 series tone이 series1 하나라 legend가 필요 없다. 결함을 "`angles` deg45 tone을 bad로"(good·bad 두 의미 tone, legend 없음)로 바꿨다 |
