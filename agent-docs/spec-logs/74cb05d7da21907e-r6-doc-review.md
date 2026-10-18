# R-6 문서 문장 대조 (spec 74cb05d7da21907e v4, VO-15)

대상: 이번 run이 새로 쓰거나 고친 문장. 대조 기준은 최종 트리의 `skills/learn-to-tell/kit/ltt-deck.js`와 R-1·R-2 결과다.

| # | 파일 | 문장(요지) | 코드·증거 | 판정 |
| --- | --- | --- | --- | --- |
| 1 | API.md 원칙 | figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다) | `.dk-figsteps` 격자의 그림 칸 폭(R-5: 1440 866px, 1280 723px). 갤러리 두 페이지에서 vw를 뺌 | 맞음 |
| 2 | deck-contracts figure | 그림 폭은 페이지 CSS에서 `vw`로 고정하지 않는다(kit이 칸 폭을 준다) | 1과 같음 | 맞음 |
| 3 | deck-contracts figure | 크기 상한이 필요하면 `px`와 `max-width:100%`를 쓴다 | 갤러리 수정값 `800px`·`880px` + `max-width:100%`. R-5에서 칸을 넘치지 않음 | 맞음 |
| 4 | deck-contracts figure | 자막이 아래로 내려가도 kit은 그림을 넓히지 않는다 | `placement.steps.measureAll`의 아래 배치 분기는 `layout("stack")`과 단계별 최대 높이뿐이고, `widen`·`grown`은 파일에 없다(R-3: `widenAnywhere:false`). 폰 재배치(`mobileFit`)는 폰 절에서 따로 다룬다 | 맞음 |
| 5 | deck-contracts predict | 진입 때 문제 상태와 선택지별 정답 상태 중 가장 큰 쪽에 맞춰 정하고, 공개할 때 바꾸지 않는다 | `placement.predict.lock`: `question = ctx.refit()`, 선택지마다 `zs.push(ctx.refit())`, `zoomLock(question, zs)`. R-2 reveal 110/110 Δ ≤ 0.001 | 맞음 |
| 6 | deck-contracts predict | 공개 뒤 창 크기가 바뀌면 배율을 다시 잰다. 그 크기에서 새로 열어 같은 답을 공개한 배율과 같다 | `place`: `size.changed()`면 `lock(revealed)`. R-2 resize 60/60(기준 커밋 18/60 실패) | 맞음 |
| 7 | deck-contracts predict | `answerVisual`은 선택지마다 미리 불릴 수 있다(인자 하나면 한 번만) | `drawn = o.perChoice ? o.choices : o.choices.slice(0, 1)`. R-2 C16 잠금당 1회 | 맞음 |
| 8 | deck-contracts predict | 공개 뒤에도 창 크기가 바뀌면 다시 불리고, 이어서 고른 값으로 한 번 더 불려 공개 모습을 다시 그린다 | restore 단계의 `o.draw(o.chosen())`. R-2 resize `sameAnswerText` 60/60 | 맞음 |
| 9 | internals 표 | `LTT.placement` = `{zoomLock}`. 반환값, 빈 배열, 잘못된 입력이면 1, 인자를 바꾸지 않음 | `zoomLock` 본문. VO-1 테스트, fuzz 100,000 위반 0 | 맞음 |
| 10 | internals 표 | predict 배율 잠금이 `ctx.zmax`를 이것으로 정한다 | `z = zoomLock(question, zs)` → `ctx.zmax = z`(실패하면 1) | 맞음 |
| 11 | internals placement | 지역 `placement`가 미리 그려 재기, 크기 키 비교, predict 잠금, recall 예약을 맡는다 | `placement.still`·`sizeWatch`·`steps`·`predict`·`reserve`/`release` | 맞음 |
| 12 | internals placement | render는 상태 열거와 요소만 넘기고 크기를 직접 읽지 않는다 | R-3: 세 핸들러 본문에서 FR-1 식별자 0건 | 맞음 |
| 13 | internals placement | figure가 넘기는 것: 단계 수, `enter(k, fig, 1)`로 그리는 함수, 현재 단계, 그림 상자·자막 칸·행 | `placement.steps(ctx, {count, draw, current, pic, ctl, row})` | 맞음 |
| 14 | internals placement | predict가 넘기는 것과 "측정은 버튼 표시를 건드리지 않는다" | `placement.predict(ctx, {choices, perChoice, draw, ans, av, w, revealed, chosen})`. `lock` 안에 버튼을 다루는 코드 없음 | 맞음 |
| 15 | internals placement | summary recall: 예약은 자리를 남긴 채 숨기고 해제는 보인다 | `reserve`/`release`가 `pending` 클래스를 붙이고 뗀다(`.dk-rc .a.pending{visibility:hidden}`) | 맞음 |
| 16 | internals placement | 크기 키는 측정을 시작할 때 기록되므로 throw하면 다음 키 변경 때 다시 잰다 | `sizeWatch.changed()`가 비교하면서 `last = key`로 기록한다. R-2 EG4: 크기 변경 뒤 warn 3번째 | 맞음 |
| 17 | internals 측정 모드 | `place`할 때 크기 키가 지난번과 다르면 측정 모드로 미리 불린다 | `LTT.measure` 안의 `o.draw` | 맞음 |
| 18 | internals 측정 모드 | 공개 뒤에도 창 크기가 바뀌면 다시 불리고 고른 값으로 한 번 더 불린다(`s.reveal`·`LTT.record`는 부르지 않는다) | restore의 `o.draw(o.chosen())`. R-2 EG5 reveal 0, record 0, resize `records` 0 | 맞음 |
| 19 | CHANGELOG | figure vw 규칙과 `widen` 제거 | 1·4와 같음 | 맞음 |
| 20 | CHANGELOG | predict: 공개 상태에서 창 크기가 바뀌면 배율을 다시 재고 `answerVisual`이 다시 불린다 | 6·8과 같음 | 맞음 |
| 21 | CHANGELOG | 측정이 `placement` 한 곳으로 모였고 `LTT.placement.zoomLock`을 공개한다 | 11과 같음, R-4: 공개 이름 74 → 75(+`placement`) | 맞음 |

| 22 | internals ctx 표 (이번 run에서 고치지 않음, FR-9 대조 대상) | `ctx.zmax`: 배율 상한(없으면 1). `refit`·`float`·기본 배율 맞춤이 따른다 | `ctx.refit`은 `fit(el, inner, ctx.zmax)`, `ctx.float`은 `floatPanel(…, ctx.zmax)`, `ctx.fit`의 기본 경로는 `fit(el, inner, ctx.zmax)`. predict 잠금이 측정 중 `ctx.zmax = 1`로 두었다가 `zoomLock` 결과로 바꾼다 | 맞음 |
| 23 | internals ctx 표 (고치지 않음) | `ctx.place()`: 데스크톱 배치·배율을 맡는다. 데스크톱에서 진입·창 크기·글꼴 로드·`?audit`, 그리고 장면이 `ctx.fit()`을 부를 때마다 반복해 불린다 | `ctx.fit`이 데스크톱이면 `ctx.place()`를 부르고, `go`·resize `refit`·`fonts.ready`·`audit`가 `fit`을 부른다. figure·predict는 `ctx.place = fp.place / pp.place`. 공개 상태 재측정은 `place` 안에서 크기 키가 바뀌었을 때 일어나며 문장의 범위 안이다 | 맞음 |
| 24 | internals ctx 표 (고치지 않음) | `ctx.refit()`·`ctx.float(...)` 문장 | 위 1014·1015행 정의와 `floatPanel`의 반환(뜨면 true, 아니면 흐름에 붙이고 `fit` 뒤 false) | 맞음 |

결과: 24/24 맞음(v5에서 ctx 표 3행 추가, verifier TV-5).
