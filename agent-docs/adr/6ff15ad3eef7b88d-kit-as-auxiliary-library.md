# kit을 보조 라이브러리로 두고 수업 구조는 agent가 정한다

- Status: Accepted (2026-10-21)

## Context

SKILL.md와 `kit/API.md`는 수업 형식(넘김, 스크롤, 한 화면)을 자유로 둔다. 그러나 audit 결과(`#ltt-audit`), lint, `recall`·`lint` 이벤트는 `LTT.deck` 장면 구조에서만 만들어진다(`kit/ltt-deck.js:797, 996, 1195–1208`). deck이 아닌 수업은 `server/audit.mjs:125`에서 실패한다. 결과적으로 kit이 수업 형식을 정하고 있다.

## Decision

- agent가 수업 구조를 먼저 정하고, 같은 구조가 kit에 있을 때만 그 파트를 쓴다.
- kit 파트는 여러 축(설명 대상, 설명 방식, 그림 종류)의 키워드로 검색해 고른다. agent는 kit 전체를 읽지 않는다.
- theme 등 일부 파트는 필수로 둔다.
- audit을 없앤다. 결정적으로 고칠 수 있는 레이아웃 결함(예: 글자가 너무 작음)은 kit이 자동 보정한다. 나머지 점검은 렌더링 스크린샷(움직이는 그림은 idle 또는 마지막 단계)을 생성 전에 쓴 검증표와 대조하는 것으로 대체한다.

## Alternatives

- 형식을 `LTT.deck`으로 한정: 기각. kit이 설명 구조를 제약하고, 주제에 맞는 구조를 고를 수 없다.
- deck이 아닌 페이지에도 장면 단위 audit 구현: 기각. kit이 형식을 정하는 문제가 남고, 새 형식마다 측정 단위를 다시 정의해야 한다.

## Consequences

- Positive: 주제에 맞는 수업 구조를 쓸 수 있고, kit 전체를 context에 올리지 않는다.
- Negative: deck 장면 lint가 보장하던 수업 순서 규칙(hook 처음, keywords 마지막 등)을 검증표가 대신 맡아야 하며, 자동 보정 범위 밖의 결함은 검증자의 판단에 의존한다.
