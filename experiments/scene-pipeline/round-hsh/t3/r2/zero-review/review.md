# 검수 review: Raft 합의 (overview)

판정은 통과/실패. 근거는 스크린샷 이름 또는 scene.html 위치.

## 스토리보드 사실 점검표

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 과반수 = ⌊5/2⌋+1 = 3, 3대 장애면 선출·커밋 불가 | 통과 | scene.html:78 수식, 캡션 "3대가 죽으면…" (모든 shot 하단) |
| index 7을 S1·S2·S3 저장 → 3/5 커밋, S4 장애여도 커밋 | 통과 | scene-step6.jpg, scene.html:30 (STATES[5]) |
| 더 높은 term을 받은 서버는 term을 올린다 (S4·S5가 RequestVote 수신 후에도 term 2) | 실패 | scene-step3.jpg S4·S5 "term 2"; scene.html:27 STATES[2].t |
| 무작위 timeout 150~300ms | 통과 | scene-step1.jpg 캡션 ① |
| 한 term에 표 한 장, 리더 최대 한 명 | 통과 | scene-step2.jpg "표 1/5", scene-step3.jpg "표 3/5" |
| 짝수 대수 이득 없음, 5대는 2대 장애 견딤 | 통과 | 화면 요구 없음(스토리보드 사실이며 장면에는 쓰지 않음) |
| 커밋된 항목 유지, 무작위 timeout의 목적 | 통과 | 화면 요구 없음 |

## 생성 순서

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| term 증가·자기 투표 → RequestVote 전송 | 통과 | scene-step1.jpg → scene-step2.jpg |
| 표를 센 뒤에야 리더 확정 → heartbeat | 통과 | scene-step3.jpg → scene-step4.jpg |
| 리더 로그에 미커밋 먼저 → 복제 → 과반수 후 커밋 | 통과 | scene-step5.jpg (회색) → scene-step6.jpg (S1 초록) |
| 팔로워 커밋은 리더보다 한 박자 늦음 | 통과 | scene-step6.jpg (S2·S3 회색) → scene-step7.jpg (초록) |

## 비트

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 1 리더 없음, 팔로워 timer가 먼저 끝나 후보 | 통과 | scene-step1.jpg 캡션 ①. timer 자체는 그림에 없고 글로만 있다 |
| 2 표 한 장씩, 3/5에서 리더 | 통과 | scene-step2.jpg, scene-step3.jpg 계수기 |
| 3 heartbeat 후 나머지는 조용한 팔로워 | 통과 | scene-step4.jpg |
| 4 클라이언트 요청은 리더 로그에 미커밋으로 먼저 | 통과 | scene-step5.jpg "클라이언트: x=7 저장" |
| 5 3/5에 닿는 순간 커밋, 죽은 서버가 있어도 진행 | 통과 | scene-step6.jpg "✕ 장애" S4 |
| 6 과반수 못 모으면 멈춤(가용성 양보) | 통과 | 하단 캡션 (모든 shot) |

## 화면 결함

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 역할 링(후보·리더)이 서버 상자와 어긋남 | 실패 | scene-step2.jpg~step7.jpg, 링 rect는 POS 좌표 scene.html:54, 상자는 diagram 배치 |
| 칸(index·term) 행이 상자 아래 테두리와 겹침 | 실패 | scene-step1.jpg S2·S1 칸, scene.html:21 CELLS, :61 |
| 글자 크기: 과반수 식·범례·칸 라벨이 화면에서 7~9px로 읽기 어려움 | 실패 | scene-step1.jpg 하단 "과반수 = …", 범례 scene.html:78, :88, :92 |
| 빈 프레임·잘림 | 통과 | 10장 모두 그림과 캡션이 보인다 |
| 움직임이 끝나지 않거나 멈춤 | 통과 | 단계 재생, 마지막 단계 "다음" 비활성. scene-t1s/t4s/t8s는 수동 재생이라 같은 화면 |
| #ltt-checks | 통과 | 체크 블록 없음, 브리프가 요구하지 않음 |

## lint·audit

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 고침 lint overview-order | 실패 | shots/scene-audit.txt. 이 파일은 장면 한 장이라 summary·keywords가 없다 |
| 권고 장면1 shrunk, small-visual | 권고 | shots/scene-audit.txt (1280·1440). 그림 축소는 레이아웃 문제라 이번 고침에서 제외 |

## 고친 것

- 사실 S4·S5 term: STATES[2].t를 [3,3,3,3,3]으로 고침(scene.html:27). 고침.
- 글자 크기: 칸 라벨·과반수 식·범례·클라이언트 글을 11~14에서 13~20으로 키움. 고침(부분). 그림 축소(약 0.63배) 자체는 남아 있다.
- 링 어긋남: 링 좌표를 `LTT.diagramLayout`의 노드 좌표로 바꿔 봤으나 반환형이 배열이 아니라 페이지가 깨짐. 원상복구. 못 고침. kit 소스를 읽을 수 없어 반환형을 확인하지 못했다.
- 칸-상자 겹침: 위와 같은 원인. 못 고침.
- lint overview-order: 이 파일은 overview 한 장뿐이라 앞에 summary, 뒤에 keywords가 없다. 맞추려면 내용을 지어내야 하므로 못 고침. 덱 조립 단계에서 처리할 일이다.
- audit: 3회 실행. 마지막 결과는 고침 1건(overview-order), 권고 3건.
