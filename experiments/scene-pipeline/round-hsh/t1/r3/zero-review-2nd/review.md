# 검수: B+tree 노드 분할 (scene.html)

| 항목 | 판정(통과/실패) | 근거(스크린샷 이름 또는 코드 위치) |
| --- | --- | --- |
| 사실: 시작 루트 [20·40·60·80], 셋째 잎 [40·45·50·55] 가득 참 | 통과 | scene-t1s.jpg, scene.html:45, :49 |
| 사실: 52 삽입 → 잎 5키, 칸 4개 | 통과 | scene-step2.jpg ("52 삽입 → 5개, 칸은 4개뿐"), scene.html:51 |
| 사실: 잎 분할 2+3, 구분 키 50은 복사(잎에 남음) | 통과 | scene-step3.jpg ("50 복사 ↑ (잎에도 남음)"), scene.html:56 |
| 사실: 루트 5키 → [20·40] / [60·80], 자식 3+3 | 통과 | scene-step4.jpg, scene.html:59 |
| 사실: 가운데 50은 이동(내부 노드에 안 남음) | 통과 | scene-step4.jpg ("50 이동 ↑ (내부 노드엔 안 남음)"), scene.html:60 |
| 사실: 새 루트 [50], 높이 2→3, 모든 잎 깊이 3 | 통과 | scene-step5.jpg, scene.html:63–64 |
| 사실: 팬아웃 ≈ 500, 3층 ≈ 1.25×10⁸, "모델로 계산한 예시" 태그 | 통과 | scene-step6.jpg, scene.html:142–145 |
| 사실: 잎 연결 리스트(형제 포인터) 체인 유지 | 통과 | scene-step1.jpg, scene-step2.jpg 잎 사이 화살표, scene.html:119 |
| 생성 순서 1: 초과가 먼저, 분할은 그다음 | 통과 | scene-step2.jpg → scene-step3.jpg |
| 생성 순서 2: 새 오른쪽 잎 → 구분 키 → 부모 | 통과 | scene-step3.jpg |
| 생성 순서 3: 부모는 구분 키를 받은 뒤 초과, 분할 | 통과 | scene-step3.jpg ("키 5개 → 초과") → scene-step4.jpg |
| 생성 순서 4: 새 루트 마지막, 기존 루트는 두 노드로 갈라짐 | 통과 | scene-step4.jpg → scene-step5.jpg |
| 생성 순서 5: 아래가 아니라 맨 위에 층이 얹힘 | 통과 | scene-step5.jpg (캡션 ⑤, "모든 잎의 깊이 = 3") |
| 비트 1: 52가 들어가 5번째 칸 모자람 | 통과 | scene-step2.jpg |
| 비트 2: [40·45] / [50·52·55], 50 복사 올림 | 통과 | scene-step3.jpg |
| 비트 3: 부모 초과, 가운데 50 이동하며 내부 노드 분할 | 통과 | scene-step4.jpg |
| 비트 4: [50] 새 루트, 높이 2→3, 잎 깊이 동일 | 통과 | scene-step5.jpg |
| 비트 5: 팬아웃 ~500, 루트 분할 거의 없음 | 통과 | scene-step6.jpg |
| 강조점: 잎→루트 경로와 마지막 새 루트 | 통과 | 잎→루트 간선 강조 scene-step3.jpg (scene.html:118), 새 루트 간선 강조 scene-step5.jpg (scene.html:108) |
| 새로 할당된 페이지가 보임 | 통과 | 새 잎 scene-step3.jpg, 새 내부 노드 a·b scene-step4.jpg (강조 없이 그려짐, 권고: scene.html:125) |
| 화면 결함: 겹침 | 통과 | scene-step6.jpg 규모 블록과 루트→오른쪽 간선 사이 약 10px 간격, 겹침 없음 |
| 화면 결함: 잘림 | 통과 | 전 스크린샷에서 캡션·라벨·노드가 프레임 안에 있음 |
| 화면 결함: 빈 프레임 | 통과 | 전 단계에서 그림이 채워짐, 빈 칸은 용량 표시용 점선 칸 |
| 화면 결함: 읽을 수 없는 글 | 통과 | 라벨·키 숫자 전부 판독 가능 |
| 화면 결함: 움직임이 끝나지 않거나 멈춤 | 통과 | 0.6s pop 1회 후 최종 상태 유지(scene.html:32–33, reduced-motion 시 정지 :34), 마지막 단계 scene-step6.jpg에서 진행 막대 완료 |

## 고친 것
- 없음 (실패 0건, scene.html 수정 없음, audit 고침 0건)
