# 버전이 붙은 엄격한 JSON 계약(lesson v1–v4, diagnostic v1–v2)

## Context
v0는 수업과 진단 데이터를 버전이 붙은 JSON 계약(lesson v1–v4, diagnostic v1–v2)으로 정의하고, 계약마다 검증기와 테스트를 두었다. ADR 06a89373 규칙 1은 형식 버전 관리 장치를 실사용에서 문제가 확인된 뒤에 추가하게 한다. 수업 기록인 `result.md`의 YAML frontmatter에는 버전 필드가 없다. `ltt-map check`/`rebuild`는 형식 오류가 있는 lesson을 오류로 보고하고 map에서 뺀다. 이 기록은 `learn-to-tell-PROJECT.md`의 옛 7장 "폐기한 설계와 이유"(commit `b7ded9d`)에서 옮겼다.

## Rejected Alternative
수업·진단·결과 데이터를 버전이 붙은 엄격한 JSON 계약으로 정의한다. 형식이 바뀔 때마다 버전을 올리고, 버전별 검증기와 테스트를 유지한다.

## Reason
설계가 바뀔 때마다 계약, 검증기, 테스트를 연쇄로 수정해야 했다.

## Revisit Condition
형식이 서로 다른 `result.md`가 섞여 있는데 `ltt-map check`가 버전 필드 없이는 이를 구분하지 못해, map에서 빠지거나 잘못 읽히는 lesson이 실사용에서 1건 이상 생길 때.

## Chosen Instead
agent-docs/adr/06a89373c78aaf85-rewrite-v0-with-minimal-design.md, skills/learn-to-tell/SKILL.md (§5 result.md frontmatter), skills/learn-to-tell/map/lib/check.mjs
