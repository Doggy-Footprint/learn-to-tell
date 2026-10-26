# 검수: 신용 창조와 통화 승수 (sweep)

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 라운드별 예금 100, 90, 81, 72.9 | 통과 | scene-t1s.jpg, scene-t4s.jpg, scene-t8s.jpg 예금 라벨; scene.html:30 `dep` |
| 사실: 라운드별 준비금 10, 9, 8.1, 7.3 | 통과 | scene-t8s.jpg 준비금 8.1·7.3; scene.html:79 `racc` |
| 사실: 라운드별 대출 90, 81, 72.9 | 통과 | scene-t1s.jpg 대출 90, scene-t4s.jpg 대출 81, scene-t8s.jpg 대출 72.9 |
| 사실: 누적 예금 100, 190, 271, 343.9 | 통과 | scene-t1s.jpg "지금 100", scene-t4s.jpg "지금 271", scene-t8s.jpg "지금 343.9"; 190은 scene.html:91 |
| 사실: 누적 409.51, 651.3 (5·10라운드) | 통과 | scene.html:31 `cum` 계산 (화면 미캡처) |
| 사실: 상한 1000, 검산 100 + 900 | 통과 | scene-t1s.jpg "상한 1,000 (=100÷10%)"; scene.html:34 `LTT.expect` |
| 사실: 승수 1/r (20%→5배, 10%→10배, 5%→20배) | 통과 | scene-knob-rr-min.jpg "20% → 승수 5배", scene-t1s.jpg "10% → 승수 10배", scene-knob-rr-max.jpg "5% → 승수 20배" |
| 사실: r가 낮을수록 상한 커짐, 발산 없음 | 통과 | scene-knob-rr-min.jpg 상한 500, scene-knob-rr-max.jpg 상한 2,000 |
| 사실: 단위(억 원), 이론상 상한 단서 | 통과 | scene.html:101 sub "(억 원)"; scene.html:108 `ltt-basis`, 모든 shot 하단 |
| 순서: 예금이 대출보다 먼저 | 통과 | scene.html:38·45·56 (짝수 t는 예금, 홀수 t에 분할) |
| 순서: 대출 지출 뒤에야 다음 은행 예금 | 통과 | scene.html:54 화살표만 그림, 다음 은행은 다음 단계 loop(scene.html:42); scene-t1s.jpg |
| 순서: 누적 증가, 상한은 처음부터 고정 | 통과 | scene.html:73 상한선은 매 단계 그림; scene-t1s.jpg에 이미 보임 |
| 순서: r 변경 시 처음부터 재전개 | 통과 | scene.html:122 render → `run()`, t=0 초기화(scene.html:115) |
| 비트 1: 100 중 10 남기고 90 대출 | 통과 | scene-t1s.jpg |
| 비트 2: 대출이 새 예금, 합계 190 | 통과 | scene-t4s.jpg 은행 B 예금 90 생김; 190 캡션은 scene.html:91 |
| 비트 3: 상한에 다가가며 끝없이 커지지 않음 | 통과 | scene-t8s.jpg 343.9와 상한선; scene.html:92 마지막 캡션 |
| 비트 4: 준비금 합계 100 그대로, 불어난 건 예금 | 통과 | scene.html:80 제목; scene-t8s.jpg 누계 34.4 / 100 (권고 참조) |
| 비트 5: 20/10/5% → 500/1000/2000 | 통과 | scene-knob-rr-min.jpg, scene-knob-rr-max.jpg; takeaway scene.html:126 |
| 비트 6: 지준율 인하는 상한 신호, 실제 통화량은 수요·초과준비금이 가른다 | 통과(부분) | scene.html:108 단서 줄이 "실제 승수는 작다"까지만 말함; "지준율 인하" 해석 문장은 화면에 없음 (권고) |
| 화면: 겹침 | 통과 | 모든 shot 확인 |
| 화면: 잘림 | 통과 | scene-knob-rr-max.jpg 상한 라벨이 우측 정렬로 칸 안에 있음 |
| 화면: 빈 프레임 | 통과 | 모든 shot에 그림이 있음 |
| 화면: 읽을 수 없는 글 | 통과 | 준비금 라벨 11px도 읽힘 |
| 화면: 글 조사 오류 (을/를, 이/가) | 실패 | scene-t1s.jpg "10%인 10를 … 90를", scene-t8s.jpg "7.3를 … 65.6를", 72.9 생성 캡션 "72.9이"; scene.html:90·91·93 |
| 화면: 움직임이 끝나거나 멈추는 곳 | 통과 | scene.html:117 마지막 단계에서 stop, scene.html:116 reduced-motion은 최종 상태 |
| 권고: 최종 캡션 "총량 100 그대로" vs 누계 | 통과(권고) | scene.html:92; 10라운드 누계는 65.1/100이라 극한 합으로 읽어야 함. 방향이므로 그대로 둠 |
| 권고: audit 장면 축소 85%(1440), 78%(1280) | 통과(권고) | shots/scene-audit.txt; 글 줄이기는 방향 변경이라 그대로 둠 |

## 요약
- 실패 1건: 글 조사 오류 (을/를, 이/가). 숫자 읽기에 맞춰 조사를 고친다.

## 고친 것
- 화면: 글 조사 오류 — `eul`·`iga` 헬퍼를 scene.html:30–31에 넣고 캡션 세 곳(scene.html:90·91·93)에 적용. 재audit 고침 0건.
