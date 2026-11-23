# stream.jsonl

- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/refs/api/controls.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/refs/api/charts.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html` (+8073자)
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
## 1280x800
  고침 장면1 overflow: 한 화면에 안 들어간다 (78%로 줄여도 넘친다). 해설·캡션을 줄이거나 장면을 나눌 것
고침 1건
- Bash `f=scene.html
sed -i '' -e 's/190 - (v \/ YMAX) \* 160/150 - (v \/ YMAX) * 120/' \
 -e 's/380 - (v \/ 100) \* 100/290 - (v \/ 100) * 80/' \
 -e 's/height="\${190 - yc(c)}"/height="${150 - yc(c)}"/' \
 -e 's/y1="190" y2="190"/y1="150" y2="150"/' \
 -e 's/y="238"/y="190"/' \
 -e 's/\${380 - yb(res)}/${290 - yb(res)}/' \
 -e 's/y="397"/y="306"/g' \
 -e 's/viewBox="0 0 740 410"/viewBox="0 0 740 316"/' \
 -e 's/ 라운드마다 대출금이 다른 은행의 새 예금이 된다. 막대 아래쪽은 준비금, 위쪽은 다음 라운드로 넘어가는 대출이다./ 아래쪽 막대는 준비금, 위쪽은 다음 라운드의 예금이 되는 대출이다./' $f
grep -c "380\|397\|190" $f; node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: sed in '/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html' needs approval. The path is inside the working directories for this ses
- 말: audit에서 화면 넘침 지적이 나와서, 그림 높이를 줄이는 Edit을 하나씩 적용하고 있습니다.
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Edit `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t5/r1/zero/scene.html`
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
- 말: `scene.html`을 만들었고, audit은 두 번 돌려 "고침" 0건으로 끝났습니다. 남은 "권고"는 장면이 화면에 맞추느라 78%로 줄었다는 것 하나라 그대로 뒀습니다. 스크린샷은 찍지 않았고, 움직임과 손잡이는 브라우저에서 직접 확인하지 않았습니다.

그린 것은 지급준비율 손잡이(5·10·15·20·25%)와 라운드 슬라이더로 움직이는 신용 창조 차트입니다.
- **아래 패널:** 라운드별 새 예금 막대를 준비금(아래)과 대출(위)로 나눠 보여 줍니다. 라운드가 자동 재생되면서 막대가 하나씩 자라고, 대출이 다음 라운드의 예금이 되는 순서를 따릅니다.
- **위 패널:** 누적 예금 막대가 쌓이고, 상한선(100÷r)이 처음부터 점선으로 깔려 있습니다.
- **수치와 목표:** 큰 숫자로 새 예금·
- 결과: success $0.2302 18턴 78s
