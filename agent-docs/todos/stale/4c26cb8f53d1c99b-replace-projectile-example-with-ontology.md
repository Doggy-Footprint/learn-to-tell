# gallery 예시 교체: projectile-drag를 ontology 기본 수업으로

## Goal

"그럼 예시에서 공 던지는 거 빼고 ontology 기본으로 하자. 내용은 `(worktree)/tmp/standalone.html`참고"
"예시 교체는 handoff만 넣어줘."

## State

- branch: `feat/catalog`, commit `7ca931b` 위. 같은 작업 트리에 API.md·kit 정합성 수정이 미커밋으로 있다(`skills/learn-to-tell/kit/API.md`, `ltt-parts.js`, `ltt-ui.js`, `ltt.js`, `tests/kit.test.mjs`). 이 교체 작업은 아직 손대지 않았다.
- 교체 대상 `skills/learn-to-tell/gallery/physics/projectile-drag.html`(lab 테마·궤적 플롯 시뮬레이션)을 참조하는 곳:
  - `skills/learn-to-tell/SKILL.md:62` 예시 수업 목록
  - `skills/learn-to-tell/gallery/index.html:186` 카드
- 참고 자료 `/tmp/standalone.html`은 `/tmp`와 `/private/tmp` 모두에 없다(2026-10-17 확인).
- 지금 예시 수업 중 `LTT.autoLayout`·`LTT.state`(elk)를 쓰는 것은 없다. elk를 쓰는 곳은 `gallery/catalog.html`과 `gallery/index.html`뿐이다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| `/tmp/standalone.html` 읽기 | `No such file or directory` (Bash, Read 둘 다) | 파일이 그 경로에 없다 (verified) |

## Next Step

1. 사용자에게 `standalone.html`의 실제 경로를 받아 읽는다.
2. `gallery/<domain>/<name>.html`에 ontology 기본 수업을 빈 페이지에서 새로 짠다(SKILL.md §3). 페이지를 복사하지 않는다. 개념 계층·관계 그래프는 `LTT.autoLayout`(elk)으로 그린다. 그러면 이 수업이 elk 예시 역할도 한다.
3. head의 `ltt-meta`(audience, pattern, theme, medium, mode, decision)를 채운다. `?audit` 검사는 1440×900과 1280×800 두 크기 모두에서 0건이어야 한다.
4. `physics/projectile-drag.html`을 지우거나 `gallery/stale/`로 옮긴다. 그다음 `SKILL.md:62`의 예시 목록과 `gallery/index.html` 카드를 새 수업으로 바꾼다.
5. `node --test tests/`가 통과해야 한다. 특히 `tests/gallery.test.mjs`의 부품 사용 ↔ vendor 로드 규칙에 따라 `elk.bundled.js`를 불러와야 한다.

## Open Questions

- "ontology 기본"의 범위: 클래스·인스턴스·관계(is-a, part-of)와 계층 같은 지식 표현 기초를 뜻하는지, 철학의 존재론을 뜻하는지. `standalone.html` 내용을 보고 정한다.
- 테마·매체: lab이 빠지면 lab 테마 예시가 없어진다. 새 수업에 맞는 테마(예: paper 또는 sketch)를 고르고, lab 예시가 없어져도 되는지 사용자에게 확인한다.
- projectile-drag를 삭제할지, `stale/`로 보관할지.

## Spec

none. workflow-approach run 없음(착수 전).

## Execution Ledger

없음. 착수 전이다.
