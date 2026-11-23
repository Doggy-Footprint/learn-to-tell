---
commit: 5f34dde236295a3018f23847db292d70bf495c2b
---

# v0의 버전 붙은 데이터 형식 계약

## Goal
수업·진단·결과 데이터의 형식을 깨지지 않게 관리한다.

## Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| v0(2026-10-03 ~ 10-08): 수업·진단 데이터를 버전이 붙은 엄격한 JSON 계약(lesson v1–v4, diagnostic v1–v2)으로 정의하고, 계약마다 검증기와 테스트를 둠 | 설계가 바뀔 때마다 계약·검증기·테스트를 연쇄로 고침. v0 최종 규모는 제품 코드 약 3,500줄, 테스트 약 9,900줄(`learn-to-tell-PROJECT.md` §6). 2026-10-13에 v0를 폐기하고 다시 작성함 | verified |

## Revisit Condition
형식이 서로 다른 `result.md`가 섞여 있고, 버전 필드가 없어서 `ltt-map check`가 이를 구분하지 못해 map에서 빠지거나 잘못 읽힌 lesson이 실사용에서 1건 이상 나올 때.
