# Observable Framework 빌드로 수업 화면 만들기

## Context
v0 계획 단계에서 표현 엔진으로 Observable Framework 1.13.4를 채택했고, 수업마다 Framework 빌드와 로컬 서버 실행이 필요했다. 2026-10-13 설계도 로컬 서버(`skills/learn-to-tell/server/server.mjs`)를 쓴다. 이 서버는 빌드 없이 수업 HTML과 kit을 제공하고 브라우저 결과를 받기만 한다. 그래서 남는 기각 이유는 수업별 빌드와 무거운 런타임 두 가지다. `scripts/build.mjs`의 `css` 생성은 kit을 고칠 때 도는 단계이며, 수업별 빌드가 아니다. 이 기록은 `learn-to-tell-PROJECT.md`의 옛 7장 "폐기한 설계와 이유"(commit `b7ded9d`)에서 옮겼다.

## Rejected Alternative
수업마다 Observable Framework 프로젝트를 빌드하고 Framework 런타임으로 화면을 띄운다.

## Reason
- 수업마다 빌드가 필요했다.
- 런타임이 무거웠다.

## Revisit Condition
kit 수업에 수업별 빌드 단계가 생길 때. 또는 Observable Framework가 수업별 빌드 없이 단일 HTML 파일로 동작하게 될 때.

## Chosen Instead
skills/learn-to-tell/kit/ (빌드 없는 JS 모듈 + vendor한 Observable Plot 0.6.17·d3 7.9.0, 수업 = HTML 파일 하나), skills/learn-to-tell/server/server.mjs
