# 결과 JSON을 내려받아 경로를 agent에 전달하기

## Context
v0 학습 화면은 결과를 JSON 파일로 내려받게 했고, 사용자가 그 파일 경로를 agent에 전달했다. v0 말기에는 서버가 결과를 직접 받도록 바뀌었다. 옮긴 표는 새 설계의 대안을 "대화"로 적었지만 2026-10-13 설계와 다르다. 2026-10-13 설계에서 대화로 처리하는 것은 퀴즈·평가·map 갱신이다. 브라우저에서 생긴 결과(예측, term, recall, goal 등)는 경량 로컬 서버가 받아 `events.jsonl`에 쌓는다. 이 기록은 `learn-to-tell-PROJECT.md`의 옛 7장 "폐기한 설계와 이유"(commit `b7ded9d`)에서 옮겼다.

## Rejected Alternative
브라우저 화면이 결과 JSON 파일을 내려받게 하고, 사용자가 저장한 파일의 경로를 agent에 전달한다.

## Reason
사용자 조작 부담이 컸다.

## Revisit Condition
로컬 서버를 실행할 수 없는 호스트를 지원해야 하는데, standalone 방식(artifact 안에 결과를 넣고 Claude Code에서 `import`)도 쓸 수 없을 때.

## Chosen Instead
skills/learn-to-tell/server/server.mjs (`POST /api/lessons/<id>/events` → `<home>/lessons/<id>/events.jsonl`), skills/learn-to-tell/SKILL.md (§3 7–8번), skills/learn-to-tell/standalone.md
