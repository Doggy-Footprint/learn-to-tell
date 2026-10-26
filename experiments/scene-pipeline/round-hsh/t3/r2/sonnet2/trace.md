# stream.jsonl

- Bash `ls . samples refs refs/api`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/storyboard.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/samples/a.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/samples/b.html`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/samples/a-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/samples/b-audit.txt`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/refs/API.md`
- Read `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/refs/api/diagram.md`
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/direction.md` (+1155자)
- Bash `python3 - <<'EOF'
src=open('samples/a.html',encoding='utf-8').read()
# 1) play(stall)
src=src.replace("const play = async () => {","const play = async (stall = false) => {")
src=src.replace('''        say("② S1이 멈췄다. 생존 신호가 끊기고 팔로워들의 타이머가 돌기 시작한다.");
        setRole("S1", "down", 3);''','''        say(stall ? "② S1에 이어 S4, S5도 멈췄다. 3대가 멈추고 S2, S3만 남는다." : "② S1이 멈췄다. 생존 신호가 끊기고 팔로워들의 타이머가 돌기 시작한다.");
        setRole("S1", "down", 3);
        if (stall) { setRole("S4", "down", 3); setRole("S5", "down", 3); }''')
src=src.replace('''        say("④ 후보는''','''        if (stall) {
          say("④ S3이 투표를 요청한다. 멈춘 S4, S5는 답이 없다.");
          await beats(["S2", "S4", "S5"].map((t) => packet("S3", t, "투표 요청", "rv", 900)));
          await packet("S2", "S3", "표 줌", "vote", 700);
          votes.add("S2"); setRole("S2", "follower", 4); paint(); alive();
          say("⑤ 표는 2/5뿐이다. 과반 3표를 못 채워 리더가 없고, 새 항목도 커밋할 수 없다. 일관성을 지키려고 멈춘다.");
          return;
        }
        say("④ 후보는''')
src=src.replace('''    btn.textContent = "다시 보기";
    wrap.append(cap, btn);''','''    btn.textContent = "다시 보기";
    const btn2 = document.createElement("button");
    btn2.className = "rf-btn";
    btn2.type = "button";
    btn2.textContent = "서버 3대 멈춤";
    btn2.style.marginLeft = "8px";
    wrap.append(cap, btn, btn2);''')
src=src.replace("btn.onclick = () => play();","btn.onclick = () => play();\n    btn2.onclick = () => play(true);")
src=src.replace('''sub: "서버 5대 중 3대가 같은 답을 내야 움직인다. {{리더}} 한 명이 로그를 쓰고, {{과반수}}가 저장한 항목만 {{커밋}}된다.",''','''sub: "가운데 점 5개가 선출 표와 저장 수를 번갈아 센다. {{리더}}가 쓰고 {{과반수}}가 저장한 항목만 {{커밋}}된다.",''')
src=src.replace('<script src="/kit/ltt-deck.js"></script>\n<style>','<script src="/kit/ltt-deck.js"></script>\n<style>')
open('scene.html','w',encoding='utf-8').write(src)
EOF
grep -c "stall" scene.html; node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: This Bash command contains multiple operations. The following part requires approval: python3 -
- 말: `scene.html`을 Write로 직접 쓰는 중이다. 초안 a를 바탕으로 "서버 3대 멈춤" 버튼을 더한다.
- Write `/Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/gallery/hsh/t3/r2/sonnet2/scene.html` (+13312자)
- Bash `node /Users/hwansu/orca/workspaces/learn-to-tell/sample-correct/experiments/scene-pipeline/audit.mjs scene.html`
  - 도구 오류: Exit code 1
## 1440x900
  권고 장면1 shrunk: 화면에 맞추느라 78%로 줄었다. 글을 줄이거나 장면을 나눌 것
  권고 lint no-signature: 그림이 주인공인 장면(figure, contrast, layout:"full", mount)이 없다
  고침 lint overview-order: overview는 summary
- 말: 방향: 초안 a의 오각형 서버 5대와 가운데 과반수 패널 구성을 골랐다. 선출 표와 저장 수를 같은 점 5개가 번갈아 센다. 여기에 "서버 3대 멈춤" 버튼을 더해, S1·S4·S5가 멈추면 표가 2/5에 그쳐 리더도 커밋도 없는 장면을 보이게 했다.
초안에서 가져온 것: a의 SVG 구조 전체(서버 상자와 로그 칸, 패킷 이동, 재생을 끊는 run 토큰, 미커밋에서 커밋으로의 순서, 팔로워가 한 박자 늦게 커밋하는 흐름). b는 그림이 작고 투표 전에 term이 미리 바뀌어 있어서 쓰지 않았다.

audit은 1회 실행했다. 남은 "고침" 2건(1440×900, 1280×800 각 1건)은 둘 다 `overview-order`(덱 순서 lint)라 브리프대로 무시했다. 그래서 "고침 0건"에는 이르지 못했
- 결과: success $0.3156 13턴 83s
