# map 저장소 견고화

## Context
v0 map은 가져오기, 중복 방지, 백업, 복구, 삭제를 구현했다. 2026-10-13 설계는 map을 단순하게 두고, 검증·복구 장치는 실제 문제가 확인된 곳에만 추가한다(ADR 06a89373 규칙 1). map 파일(`map.md`, `map-data.json`, `concepts/*.md`)은 lesson의 `result.md` frontmatter와 `decisions.jsonl`에서 `ltt-map rebuild`가 다시 만드는 파생물이다. 다시 만들 수 없는 원본은 `result.md`와, 덧붙이기만 하는 `decisions.jsonl`이다. 이 기록은 `learn-to-tell-PROJECT.md`의 옛 7장 "폐기한 설계와 이유"(commit `b7ded9d`)에서 옮겼다.

## Rejected Alternative
map 저장소에 다음 장치를 둔다: 원자적 쓰기, 백업 5개 보관, restore, 토큰을 확인하는 delete, revision 충돌 검사, content hash.

## Reason
단일 사용자의 작은 파일에는 과했다.

## Revisit Condition
실사용에서 다음 중 하나가 1건 이상 확인될 때: `result.md`나 `decisions.jsonl`의 손상·유실, 또는 두 세션이 동시에 써서 생긴 map 불일치. 확인되면 그 문제에 해당하는 장치만 검토한다. 옛 표의 원문은 "실제 문제가 확인되면 다시 검토"였다.

## Chosen Instead
skills/learn-to-tell/map/ltt-map.mjs (`rebuild`가 원본에서 파생물을 다시 만들고, `writeIfChanged`로 내용이 바뀔 때만 쓴다), agent-docs/adr/06a89373c78aaf85-rewrite-v0-with-minimal-design.md
