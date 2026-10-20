# R-1 장면 2 단계 화면 눈 확인 (spec 5ad829b7137b4d19 v4, v5 R-1 문장 기준으로 재확인)

- 대상: `~/.learn-to-tell/lessons/20261020-ltt-project-structure/lesson.html#2`, 새 kit(작업 트리), 1440×900, 헤드리스 Chrome 가상 시간.
- 단계 시각(머무름 공식): 0 → 7100 → 15100 → 22500ms. 캡처 3500ms(단계 0), 10600ms(단계 1), 26000ms(단계 3).
- step0: SKILL.md·읽기와 `따른다` 엣지가 보이고 강조. kit·Write·검토·audit·server·map은 숨음. outline·Edit은 어떤 단계도 강조하지 않아(엣지 id `outline>review`만 강조) AD-6대로 처음부터 흐리게 보이고, `읽기>outline` 엣지도 두 끝이 보여 보인다. 판정: 규칙과 일치. spec R-1 기대 문장("SKILL.md·읽기와 그 엣지만")은 AD-6 배경 규칙을 빠뜨린 서술이라 이 차이는 결함이 아니다.
- step1: kit·Write와 `조합` 엣지가 새로 나타나 강조, SKILL.md·읽기는 흐리게 남음, `outline>Write` 엣지 보임. 판정: 일치.
- step3: 모든 노드가 보이고 로컬 서버·지식 map만 강조, 나머지 흐림. 판정: 일치.
- 관찰: 작가가 강조하지 않은 노드는 배경으로 처음부터 보이므로, 이 수업처럼 단계가 일부 노드를 빠뜨리면 쌓기가 덜 드러난다. 체크리스트(1)(3)과 outline 흐름 줄이 이를 작가·검토 쪽에서 다룬다.
