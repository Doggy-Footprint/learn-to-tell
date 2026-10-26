---
commit: 5f34dde236295a3018f23847db292d70bf495c2b
---

# 수업 화면 제작과 결과 전달 방식

## Goal
agent가 수업 화면을 만들고, 브라우저에서 생긴 결과를 agent에 돌려준다.

## Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| v0: 표현 엔진으로 Observable Framework 1.13.4를 쓰고, 수업마다 Framework 프로젝트를 빌드해 런타임으로 화면을 띄움 | 2026-10-13 재작성에서 빌드 없는 kit + 수업 HTML 파일 하나로 바꿈 | verified: 수업마다 빌드가 필요했고 런타임이 무거웠다 |
| v0: 학습 화면이 결과 JSON 파일을 내려받게 하고, 사용자가 저장한 파일 경로를 agent에 전달함 | v0 말기에 서버가 결과를 직접 받도록 바꿈. 지금은 `server/server.mjs`가 `events.jsonl`에 쌓음 | verified: 사용자 조작 부담이 컸다 |
| agent가 `ltt-meta`로 가장 비슷한 gallery 페이지를 골라 복사한 뒤 장면 데이터만 고침(SKILL.md 3단계, c7904b7–b6a39a7, 2026-10-14) | 이후 빈 파일에서 kit 부품을 조합하는 방식으로 바꿈(`learn-to-tell-PROJECT.md` §4) | user rejected: "하나의 html 탬플릿을 복사해서 쓰는 건 내가 원하는 방향이 아니야. 내가 원한 건 라이브러리를 제공하는 거야" |

## Revisit Condition
- Framework 빌드: kit 수업에 수업별 빌드 단계가 생길 때, 또는 Observable Framework가 수업별 빌드 없이 단일 HTML 파일로 동작하게 될 때.
- JSON 내려받기: 로컬 서버를 실행할 수 없는 호스트를 지원해야 하는데 standalone 방식(artifact 안에 결과를 넣고 Claude Code에서 `import`)도 쓸 수 없을 때.
- gallery 복사: kit 조합으로 만든 수업들이 반복해서 같은 구조로 수렴해, 조합 비용만 늘고 차이가 없다고 확인될 때.
