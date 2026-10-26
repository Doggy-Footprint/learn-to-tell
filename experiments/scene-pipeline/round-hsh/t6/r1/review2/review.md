# 검수: 가비지 컬렉션 방식 (contrast)

대상: scene.html · 기준: storyboard.md, direction.md · 근거: shots/ 스크린샷 step1–7, t1s·t4s·t8s, scene-audit.txt(고침 0건)

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 점검: 생성 직후 A=1, B=1 → B.prev=A로 A=2, C=1 | 통과 | scene.html:24–31 STEPS rc 값, step1·step3·step4 캡션 ①③④ |
| 점검: 루트→A 해제 뒤 A=1, B=1, C=1 | 통과 | scene.html:32–33 STEPS[4] rc, step5 스냅샷 |
| 점검: RC 결과 A·B 생존, C 정상 생존 | 통과 | scene.html:77–78 SNAP.rc |
| 점검: M&S mark={root, C}, 해제 A·B | 통과 | scene.html:81 SNAP.ms, step6 MS 패널 C 초록, step7 MS A·B 없음 |
| 점검: 카운트 합(남은 참조 2) = 남은 객체 2개 | 통과 | scene.html:77 "남은 객체 2개" |
| 점검: RC 즉시성 / M&S 수거 주기 지연 | 통과 | scene.html:83 "수거 주기 전이라" (약하지만 화면에 있음) |
| 점검: 약한 참조는 곁다리, 화면 필수 아님 | 통과 | 화면에 없음, takeaway(scene.html:141)에만 언급 |
| 생성 순서: root→A, A→B, B→A, root→C, 끊음, mark, sweep | 통과 | scene.html:25–37 send 값 순서, step1–4 패킷 방향 |
| 비트 1: 같은 그래프 두 벌, 전부 살아 있음 | 통과 | step4 두 패널 모두 루트·A·B·C |
| 비트 2: 카운트 A=2, B=1, C=1 | 실패 | 수치 값은 맞음(scene.html:31). 그러나 화면 글자가 판독 불가(아래 "읽을 수 없는 글") |
| 비트 3: 루트→A 끊음, A·B 닿을 길 없음 | 통과 | step5 A·B 빨강 강조, 끊음 점선 간선(scene.html:70) |
| 비트 4: RC 쪽 A·B 0이 아니어서 그대로 남음 | 실패 | step6 RC 패널: A·B가 hl 밖이라 흐리게(ghost) 보임. bad 표시 안 보임. scene.html:35 hl 값 |
| 비트 5: M&S mark(C만), 이어서 sweep이 A·B 해제 | 통과 | step6 MS C 초록·A·B 흐림, step7 MS C만 남음 |
| 비트 6: 진단 판단(루트 경로 없는 잔류 → 순환 누수 의심) | 실패 | takeaway 박스가 step5·step7에서 잘림, step6에서는 보이지 않음(아래 "겹침·잘림") |
| 비트 7: sweep 뒤 RC 쪽 A·B 루트 경로 없이 남음, 보유 경로 | 실패 | step7 RC 패널에 A·B가 없음. scene.html:37 n이 ["C"]라 RC 그림에서도 A·B가 빠짐. 스냅샷 글("남은 객체 2개")과 그림이 모순 |
| 화면: 겹침·잘림 | 실패 | step5 하단 핵심 박스가 하단 nav에 가려짐, step6 박스 없음, step7 잘림. 원인: RC 패널(캡션 3–4줄 + 스냅샷 2–3줄)이 step4보다 최대 60px 커짐(scene.html:32–37, 77–78) |
| 화면: 빈 프레임 | 통과 | MS 패널 여백이 많으나 그림과 상태 글이 있음 |
| 화면: 읽을 수 없는 글 | 실패 | 노드 부제("참조 수 N", "mark")와 간선 라벨(next, prev, 루트 참조, 끊음)이 약 5px. step1–7 모두. 그림이 열 3개 폭(630px)을 262px 칸에 맞춰 약 0.4배로 축소됨(scene.html:104–108, 210px 셀) |
| 화면: 움직임이 끝나지 않거나 멈춤 | 통과 | t1s·t4s·t8s가 같은 상태: 자동 재생 없이 사용자 조작을 기다림(의도). step7은 마지막 단계로 끝남 |

## 실패 요약
실패 항목 6개: 비트 2, 4, 6, 7; 화면 겹침·잘림; 읽을 수 없는 글.

## 고친 것
- 비트 2 (카운트 판독): 격자를 3열→2열(`cols: 2`, `cell: [124, 60]`, `node: [90, 40]`)로 바꿔 축소 배율을 낮춤. POS의 B를 [1, 1]로 옮김(scene.html: POS, specOf).
- 비트 4 (RC 쪽 A·B 남음): 6단계 `hl` 제거. 흐림 없이 A·B가 bad로 보임(scene.html:STEPS 6단계).
- 비트 6 (진단 판단 박스): 5·6·7단계 캡션과 RC 스냅샷 글을 1–2줄로 줄여 하단 핵심 박스가 가려지지 않게 함(scene.html:STEPS, SNAP.rc).
- 비트 7 (sweep 뒤 RC 쪽 A·B): 7단계 `n`·`e`·`rc`에 A, B, 간선 복원. RC 그림에 A·B가 다시 보임(scene.html:STEPS 7단계).
- 겹침·잘림: 위 캡션·스냅샷 축약으로 패널 높이를 4단계 수준으로 맞춤(scene.html:STEPS, SNAP.rc).
- 읽을 수 없는 글: 격자 축소 배율을 낮추고 간선 라벨을 next/prev만 남김(“루트 참조” 라벨 제거, scene.html:EDGE).

확인 상태: audit은 고침 0건이었지만 `shots/`가 갱신되지 않았다(파일 시각이 수정 전 그대로). 위 수정의 시각 결과는 스크린샷으로 확인하지 못했다. 다음 단계에서 스크린샷 재생성 후 step5–7과 글자 크기를 다시 봐야 한다.
