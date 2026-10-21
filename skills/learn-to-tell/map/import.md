# import (standalone 수업 가져오기)

claude.ai에서 만든 수업 artifact(`<skill>/standalone.md`)의 결과를 지식 map에 넣는다. 명령은 `node <skill>/map/ltt-map.mjs <cmd>`다.

1. Artifact 도구 `list`에서 제목이 `LTT · `로 시작하는 artifact를 찾는다. 없으면 사용자에게 artifact 링크나 `result.md` 텍스트를 받는다(텍스트는 임시 파일에 저장한다).
2. 각각 `read`로 받아, 결과가 가리키는 저장 파일 경로로 `ltt-map.mjs import <파일>`을 실행한다. `<home>/lessons/<id>/`에 `result.md`와 `lesson.html`을 쓰고 rebuild한다. `skip ...: already imported`는 이미 들어간 것이다. `exists and differs`면 사용자에게 어느 쪽을 남길지 묻는다. result 블록이 없는 artifact는 이해 확인 전에 멈춘 수업이다. `ltt-meta`의 `lesson`으로 `lesson.html`만 저장하고(`imported <id> (unfinished: no result)`) map에는 넣지 않는다. 나중에 result 블록이 생긴 artifact를 다시 import하면 완료본으로 바뀐다.
3. 가져온 개념마다 SKILL.md §6 "개념을 적기 전에"로 기존 개념과 맞춘다. 같은 개념이면 `result.md`의 id를 기존 id로 고치고 `rebuild`한다(standalone 수업은 map 없이 id를 지었다).
4. SKILL.md §6 연결 점검(sweep)을 하고, `ltt-map.mjs lessons`로 가져온 수업 목록과 상태를 보여 주고, 방금 다룬 개념의 focus URL을 안내한다.
