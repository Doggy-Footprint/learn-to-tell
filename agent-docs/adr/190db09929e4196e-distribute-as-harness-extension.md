# learn-to-tell을 harness 확장으로 배포한다

- Status: Accepted (2026-10-13)

## Context

learn-to-tell skill은 `SKILL.md`와 함께 kit(`kit/ltt.js`), 로컬 서버(`server/server.mjs`), vendor 차트 라이브러리(Observable Plot 0.6.17 + d3 7.9.0, 약 0.5MB)를 같이 설치해야 한다. 사용자는 `~/tools/harness`로 저장소마다 skill, agent, hook을 설치·갱신·점검한다.

## Decision

learn-to-tell은 `~/tools/harness`의 확장으로 배포한다. 선택 설치 여부와 설치 위치 같은 구체적인 방식은 harness 쪽 작업에서 정한다.

그 전까지 다음을 지킨다.

1. 원본은 이 저장소의 `skills/learn-to-tell/`이다.
2. `SKILL.md`는 kit, server, gallery를 skill base directory 기준 상대 경로로만 참조한다. 설치 위치가 바뀌어도 동작해야 하기 때문이다.
3. 개발 중 시험은 `.claude/skills/learn-to-tell → ../../skills/learn-to-tell` 링크로 한다.

## Alternatives

- `~/.claude/skills`에 전역 링크를 걸거나 Claude Code plugin으로 배포하는 방식은 기각했다. learn-to-tell은 harness 기능과 연계해야 하므로 같은 배포물 안에 있어야 한다.

## Consequences

- Positive: harness의 install, update, doctor, import 흐름을 그대로 쓴다.
- Negative: 설치 방식이 정해지기 전에는 이 저장소 밖에서 쓰려면 수동으로 연결해야 한다. harness가 저장소마다 복사하는 방식을 택하면 vendor 0.5MB가 저장소마다 생긴다.
