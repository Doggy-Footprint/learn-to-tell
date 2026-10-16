# gallery 레슨을 1280×800 audit 0건으로 맞추기

## Goal
"1. handoff로 새 세션에서 작업한다." — 1280×800 audit 경고를 기준 변경 없이 gallery 레슨 수정으로 없앤다(선택지 1). audit 크기 구성(1440×900 + 1280×800 유지 여부)은 사용자 확인 중.

## State
- branch `ui/ui-advice`, base commit `07ba567`, 변경은 **미커밋**.
- 변경 파일: `AGENTS.md`, `README.md`, `skills/learn-to-tell/SKILL.md`, `skills/learn-to-tell/kit/API.md`, `skills/learn-to-tell/kit/ltt.js`, `skills/learn-to-tell/kit/ltt-parts.js`.
- 이 변경으로 들어간 것: 분량 기준을 20분 → "결정 변수에 필요한 교과서 기본기(약 한 챕터), 결정 변수마다 예측→조작→확인 파트"로; lint `too-many-terms`·`long-narration`·`many-points`·`many-predicts`·`predict-before-explain` 삭제; `card-monotony` 비율 50%; audit 크기 1440×900 + 1280×800, 지원 폭 1280px 이상; goal 첫 달성 시 pop 애니메이션. 카드 고착 점검 이슈: https://github.com/Doggy-Footprint/learn-to-tell/issues/2
- 1280×800 audit 결과(1440×900은 9개 모두 0건):

| 레슨 | 경고 |
|---|---|
| cache-ttl | 장면4 many-sizes(8단계) |
| finance/diversification | 장면3·5·6 shrunk(81–87%), 장면4 many-sizes |
| gpu/single-gpu-dataflow | 장면5 many-sizes, 장면6·9 shrunk |
| linear-algebra/matrix-as-transform | 장면3 shrunk(87%) |
| pedagogy/retrieval-practice | 장면6 shrunk(82%) |
| physics/projectile-drag | 장면4 many-sizes, 장면5·7 shrunk |
| uiux/visual-hierarchy-spacing | 장면6·10 shrunk |
| cognition/anchoring, uiux/color-contrast | 0건 |

## Failed Attempts
| attempt | failure evidence | cause |
|---|---|---|
| gallery를 1280×800에서 audit | 위 표, 9개 중 7개 경고 | `shrunk`는 높이 800 때문(1280×900에서 대부분 사라짐) — verified. `many-sizes`는 폭에 따라 바뀌는 clamp 글자 크기가 단계 하나를 추가 — hypothesis. 720 시절에는 폭 ≤1000을 compact로 보고 이 검사를 건너뛰어 드러나지 않았음 — verified (`kit/ltt.js` auditScene `m.compact`) |
| 레슨 CSS font-size를 kit 단계로 맞추기(계획) | 4개 many-sizes 장면 모두 kit predict 장면에서 `.ltt-fact .l` clamp가 1280에서 14px, 힌트 15px로 갈라짐 | 레슨 CSS가 아니라 kit `ltt-ui.js` `.ltt-fact .l` — verified, 15px 고정으로 해결 |

## Next Step
1. 서버: `LTT_PORT=47899 LTT_HOME=<scratch> node skills/learn-to-tell/server/server.mjs` (47823은 다른 worktree 서버가 떠 있을 수 있음).
2. audit 실행: `~/Library/Caches/ms-playwright/chromium_headless_shell-1243/*/chrome-headless-shell --headless --window-size=1280,800 --virtual-time-budget=8000 --dump-dom "http://127.0.0.1:47899/gallery/<path>.html?audit"` 후 `data-ltt-audit` 값과 "화면 점검 · 장면 N" 문구 확인.
3. shrunk 장면은 해설·캡션 축소 또는 장면 분할, many-sizes는 페이지 CSS의 font-size를 kit 단계로 맞춘다. 기준(임계값)은 바꾸지 않는다.
4. 1440×900에서도 0건인지 재확인 후 커밋.

## Open Questions
- audit를 1280×800 하나로 줄일지, 1440×900과 둘 다 유지할지.

## Spec
해당 없음(workflow-approach 미사용). 계획: `~/.claude/plans/josh-comeau-bartosz-cozy-moore.md`.

## Execution Ledger
- lint: 결정 변수 2개 테스트 덱에서 predict 2개 경고 없음, 카드 3연속 `card-monotony` 확인. gallery 현행 13개 덱 lint 0건(node vm 스텁으로 실행). 50% 비율 경계는 미검증.
- fuzz·mutation: 없음.
