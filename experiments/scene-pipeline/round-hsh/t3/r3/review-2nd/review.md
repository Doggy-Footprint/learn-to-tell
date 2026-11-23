# 검수 2차: Raft 합의 장면 (overview)

대상 `scene.html`, 스크린샷 `shots/` 11장(t1s·t4s·t8s, step1–8).
스크린샷 번호는 step N = 비트 N−1(비트 0–7)이다. 비트 8–13은 스크린샷이 없어 코드로만 판정했다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 사실: 과반수 = floor(N/2)+1, N=5 → 3, 허용 장애 2 | 통과 | scene-t1s.jpg 하단 근거 줄, scene.html:122–123 |
| 사실: 2대 저장은 미커밋, 3대 저장은 커밋 | 통과 | scene-step8.jpg(2/5 미커밋), scene.html:70(3/5 커밋, 스크린샷 없음) |
| 사실: 투표 요청 term+1, term당 한 표, 높은 term이면 리더 강등 | 통과 | scene-step3.jpg(B term 3), scene-step4.jpg(C·D·E term 3), scene.html:75(A term 4, 스크린샷 없음) |
| 사실: election timeout 무작위, heartbeat 주기 짧음 | 통과 | 화면에 수치 없음, 모순 없음. scene.html:63 |
| 사실: 후보 로그가 덜 최신이면 표를 못 받음 | 통과 | scene.html:74 캡션(스크린샷 없음) |
| 사실: 덮어쓰기돼도 커밋 항목은 남음 | 통과 | scene.html:75 A 로그 [1,2,3] commit 3(스크린샷 없음) |
| 생성 순서: 리더가 먼저 append, 그다음 복제 | 통과 | scene-step6.jpg(쓰기, 1/5) → scene-step7.jpg(복제) |
| 생성 순서: 커밋은 복제 응답 과반수 뒤 | 통과 | scene-step8.jpg(2/5 미커밋) → scene.html:70 |
| 생성 순서: term 상승이 선출 결과보다 먼저 | 통과 | scene-step3.jpg → scene-step5.jpg |
| 생성 순서: 팔로워 commit은 한 박자 늦고, ack는 커밋 뒤 | 통과 | scene.html:71–72(코드 순서, 스크린샷 없음) |
| 비트 1: 팔로워 타이머가 먼저 만료 | 통과 | scene-step2.jpg |
| 비트 2: 후보 term 3, 과반 표로 리더 | 통과 | scene-step3.jpg, scene-step4.jpg, scene-step5.jpg |
| 비트 3: 쓰기가 점선 칸, 미커밋, 1/5 | 통과 | scene-step6.jpg |
| 비트 4: 3번째 저장 확인 → 커밋 경계 넘어감 | 통과(코드만) | scene.html:70(스크린샷 없음) |
| 비트 5: 커밋 항목을 가진 노드만 새 리더 | 통과(코드만) | scene.html:73–74(스크린샷 없음) |
| 비트 6: 2대 장애까지 데이터 남음 | 통과 | scene-t1s.jpg 하단 근거 줄(작은 글) |
| 화면: 겹침 | 통과 | 스크린샷 전부 |
| 화면: 잘림 | 실패 | scene-step8.jpg: 하단 근거 줄이 y≈733에서 잘린다. step7(y≈720) 대비 그림·카드·자막이 약 13px 아래로 밀렸다. 그림 폭이 칸 내용에 따라 커지는 것으로 추정(scene.html:15) |
| 화면: 빈 프레임 | 통과 | 해당 없음 |
| 화면: 읽을 수 없는 글 | 통과 | 비활성 노드 라벨은 흐린 상태 표현이다. 근거 줄은 작지만 읽힌다 |
| 화면: 움직임이 멈추지 않는 곳 | 통과 | 단계마다 패킷이 남지 않는다(step3–step8). 재생은 player가 제어 |
| audit 고침: overview-order | 실패 | scene.html:132–145: 장면이 overview 하나뿐이다. summary·keywords가 없다 |

권고(audit): shrunk 82%, small-visual, no-signature는 그대로 둔다.
스크린샷 한계: step8 이후 비트 8–13(D 저장·커밋, ack, 팔로워 commit, B 사망, C 리더, A 복귀)의 화면은 확인하지 못했다.

## 고친 것
- 잘림(scene-step8.jpg 하단 근거 줄): `.raft`에 `width: 100%` 추가(scene.html:15). 원인은 추정이다. 렌더 확인은 하지 못했으니 다음 스크린샷에서 step8 하단을 봐야 한다.
- audit 고침 overview-order: 코드는 건드리지 않았다. 재audit에서 고침 목록에 나타나지 않았다(고침 0건). 원인은 확인하지 못했다.
- 재audit 결과: 권고 shrunk가 1440·1280 모두 78%(이전 82%/78%), small-visual은 사라졌고, no-signature는 남았다.
