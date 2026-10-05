# T4 기록 왕복 — spec 작성 전 결정과 선행 계약 변경

## Goal
"결정할 것들에 대한 옵션과 트레이드 오프를 포함해서 하나하나 질문으로 물어봐줘."
"둘 다로 하고 handoff로 만들어줘. 그 handoff를 마무리 한 다음에 spec을 작성하고 지금 테스크를 이어서 할게"

## State
- branch: `main`, commit: `d49945a`
- 변경 파일: 이 handoff 문서와 `agent-docs/handoff/index.md`뿐이다. 코드·계약 변경은 없다.
- 정지 사유: T4 spec을 쓰려면 T1 계약 변경(콘텐츠 hash)이 먼저 끝나야 한다는 사용자 결정.

### 사용자 확정 결정
1. **파일 배치:** `~/.learn-to-tell/profiles/<profileId>/map.json` 하나와 `backups/map.<revision>.json`. 백업은 최근 5개만 유지한다.
2. **원자적 저장:** 같은 디렉터리의 temp 파일에 쓰고 fsync → rename. rename 직전 디스크의 revision을 처음 읽은 값과 비교하고, 다르면 저장하지 않고 다시 가져오도록 안내한다. lock 파일은 쓰지 않는다.
   - 기각: temp 파일 기반 복구. rename이 temp를 소비하므로, 동시 쓰기에서 덮인 결과는 map·temp·백업 어디에도 남지 않는다. 유일한 복구 경로는 내보낸 결과 JSON을 다시 가져오는 것이다.
   - 기각: lock 파일. 비정상 종료 뒤 남은 lock을 정리하는 규칙과 테스트가 추가로 필요하고, 단일 사용자 범위에서는 revision 검사로 충분하다.
3. **중복 판정:** 콘텐츠 hash를 result(`contentHash`, 브라우저가 내보낼 때 기록, 가져올 때 다시 계산해 변조·손상 검출)와 map(가져온 결과의 hash) 두 곳 모두에 둔다.
   - resultId가 달라도 hash가 같으면 중복으로 보고 저장하지 않는다(no-op). 그러려면 hash 입력에서 resultId를 제외해야 한다.
   - 같은 resultId인데 hash가 다르면 기존대로 CONFLICT로 거부한다(`contracts/index.mjs` import 검사).
4. **복구:** 읽기 실패나 버전 불일치가 생기면 쓰기를 멈춘다. 검증을 통과하는 최신 백업과, 복구하면 잃게 될 revision을 보여 주고 사용자가 확인한 뒤에만 복구한다. 손상된 파일은 보존한다.
5. **삭제 단위:** 결과 1건. previousResultId로 이어진 후속 checkpoint와 관련 observation도 함께 지우며, 지울 범위를 미리 보여 준다. 관련 백업에서도 제거한다.
6. **노출 형태:** module API(`knowledge/*.mjs`) 위에 얇은 CLI(`scripts/map.mjs import|show|delete|restore`, JSON 출력)를 둔다. map 표시는 CLI의 텍스트 요약으로 한다.

## Failed Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | | |

## Next Step
1. (완료) 결정 7–10을 입력으로 콘텐츠 hash 계약 변경을 별도 workflow-approach 작업으로 진행했다. result·map v2, `contentHash`, validateBundle의 `duplicateOf` 신호가 들어갔다.
   - 범위: result·map 스키마 버전 올림(`contracts/definitions.mjs`, `contracts/schemas/`), hash 정규화 규칙, `contracts/index.mjs`의 검증·import 검사, T3 내보내기(`learning/result.mjs`의 `buildResult`)에서 hash 기록, fixture 갱신
2. 그 작업이 끝나면 위 결정 1–6을 입력으로 T4 spec을 작성하고 구현한다.

## Open Questions
없음. 아래 결정 7–10으로 확정했다.

### 콘텐츠 hash 확정 결정
7. **알고리즘:** SHA-256. 브라우저 `crypto.subtle`과 Node `crypto`가 같은 결과를 내야 하며, 브라우저 쪽이 비동기이므로 내보내기 경로는 async가 된다.
8. **hash 입력:** result에서 `resultId`와 `contentHash`만 제외한다. `responses[].recordedAt`은 포함한다.
   - 기각: `recordedAt` 제외. 서로 다른 세션이 우연히 같은 답을 내면 중복으로 잘못 병합된다.
9. **정규화·버전:** 재귀적으로 키를 정렬한 공백 없는 JSON을 UTF-8로 hash한다. v1 result·map은 버전 불일치로 거부한다(변환하지 않음).
10. **map 저장 위치:** `map.results[]` 각 항목 안의 `contentHash`.
    - 기각: 별도 `resultHashes` 목록. results와의 일관성 검증이 추가로 필요하다.

## Spec
- 선행 계약 변경: `agent-docs/spec-logs/ba4dd28c51280386-content-hash-contract.md` v3, status complete, run ID `ba4dd28c51280386`.
- T4 spec: 아직 작성하지 않았다.

## Execution Ledger
해당 없음(workflow 실행 전).
