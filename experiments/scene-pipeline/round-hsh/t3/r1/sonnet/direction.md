# direction

## 초안별
**a** — 5노드를 오각형으로 놓고 노드 카드 안에 term·역할·로그 칸을 넣었다. 점이 메시지를 따라 움직이고, 아래에 득표 칸 5개와 과반선이 있다. 단계는 9개로 생성 순서(term 증가 → RequestVote → 과반 → append 미커밋 → 복제 → 커밋 → 팔로워 전파)와 사실(3표, 저장 3)이 맞다. 어긋남: 자체 루프로 무한 재생해 사용자 조작이 없고, 3표째에서 "C·D 표"로 B 자기표 포함이 맞다. 결함 코드: type overview를 단독으로 써 overview-order 고침, 그림이 화면의 8%(작음), rAF·replaceChildren로 노드를 매번 다시 그린다.

**b** — LTT.diagram 5노드와 player. 단계 7개, 하이라이트와 패킷만 있고 로그 칸과 득표 수가 화면에 없다. 사실은 맞지만 "미커밋→커밋" 구분이 자막에만 있다. 결함: overview-order, 그림이 작고 글이 많아 shrunk 84%, 안 쓰는 glossary(term·heartbeat).

**c** — type figure + steps. 노드 그림 아래 표(역할, 로그 문자열). 순서와 사실(저장 3 ≥ 3, E 늦음)이 맞다. 로그가 "1 2 | 3 미커밋" 문자열이라 시각 구분이 약하고 득표·과반선 그림이 없다. 결함은 없다(audit 고침 0, shrunk만).

**d** — 5노드 diagram(S1 기존 리더, S2 후보→리더) 옆에 역할 태그·로그 칸(진한=커밋, 점선=미커밋)·득표/저장 확인 막대(과반선 3). 상태를 처음부터 재계산해 앞뒤로 넘겨도 맞다. 11단계가 생성 순서 그대로이고 사실도 맞다(득표 1→3, ack 1→3, 커밋 후 팔로워 전파, S5 마지막). 결함: type overview로 overview-order 고침, 그림이 작아 small-visual, no-signature.

## 가져올 것
d의 뼈대 전부(diagram + 로그 칸 패널 + 득표·저장 막대, 상태 재계산, 단계별 패킷 색). c의 type figure + steps 방식으로 audit 고침을 피한다. a의 "자기 표 포함 3표" 문구.

## 최종 방향
그림이 주인공인 한 장: 왼쪽 5노드 diagram(S1 위, S2·S3·S4·S5 두 열), 오른쪽 노드별 로그 칸 패널과 막대 두 줄(득표, 저장 확인; 3번째 칸 뒤 과반선). 단계: ① heartbeat ② S1 장애, S2 timeout ③ S2 term 3→4, 후보, 자기 표(득표 1) ④ RequestVote 전송 ⑤ S3·S4 표 회신, 득표 3 ⑥ S2 리더, 빈 AppendEntries ⑦ 쓰기가 리더 로그에 미커밋(점선 칸, 저장 1) ⑧ S3·S4에 복제 ⑨ ack 회신, 저장 3 ⑩ S2 커밋(진한 칸) ⑪ 다음 AppendEntries로 커밋 전파, 늦은 S5도 따라잡음. 조작은 단계 이전/다음(kit stepper). 글은 단계 자막, 칸 범례 caption, 제목 하나, takeaway/recall(4노드 vs 5노드로 노드 수 선택에 연결).
