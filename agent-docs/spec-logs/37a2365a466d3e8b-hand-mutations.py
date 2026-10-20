import subprocess, sys, json, re
D='skills/learn-to-tell/kit/ltt-deck.js'; J='skills/learn-to-tell/kit/ltt.js'; A='skills/learn-to-tell/server/audit.mjs'
T=['tests/absorb.test.mjs','tests/audit-report.test.mjs','tests/kit.test.mjs','tests/scene-types.test.mjs','tests/api-docs.test.mjs']
M=[
 ('HM-1','trial cap written before the fits-at-1 check (D-2 class)',D,'        if (hhi <= avail + 1 || LTT.mobile() || !visuals().length) {','        height(ABSORB_MIN); cap(1);\n        if (hhi <= avail + 1 || LTT.mobile() || !visuals().length) {',T+['tests/motion-verbs.test.mjs']),
 ('HM-2','absorb floor 0.65 -> 0.60',D,'var ABSORB_MIN = 0.65;','var ABSORB_MIN = 0.60;',T),
 ('HM-3','each step drawn twice in pre-draw (D-1 class)',D,'            o.draw(k);\n            var p0 = pic.offsetHeight;','            o.draw(k); o.draw(k);\n            var p0 = pic.offsetHeight;',T+['tests/motion-verbs.test.mjs']),
 ('HM-4','visualRatio/figRatio measured after absorb',D,'put = ctx && ctx.ab ? ctx.ab.lift() : function () {};','put = function () {};',T),
 ('HM-5','author inline style not restored on release',D,'if (r.orig == null) e.removeAttribute("style"); else e.setAttribute("style", r.orig);','e.removeAttribute("style");',T),
 ('HM-6','zoomBy for steps dropped',D,'if (probed) ctx.zoomBy = free != null && z < free - 0.004 && widest[mode] >= 0 ? "단계 " + (widest[mode] + 1) : null;','if (probed) ctx.zoomBy = null;',T),
 ('HM-7','floor flag threshold 0.781 -> 0.80',D,'floor: zoom <= 0.781,','floor: zoom <= 0.80,',T),
 ('HM-8','exitCode counts advisory as failure',A,'const fix = (w) => w.severity !== "advise";','const fix = (w) => true;',T),
 ('HM-9','still-visual graded fix',J,'"still-visual": 1, ','',T),
 ('HM-10','report merges different msgs of same scene/rule',A,'const key = JSON.stringify([w.scene, w.rule, w.msg]);','const key = JSON.stringify([w.scene, w.rule]);',T),
 ('HM-11','absorb failure swallowed without warn',D,'        LTT.warn("장면 " + (ctx.index + 1) + ": 그림 높이를 맞추다 실패해 배율로만 맞춘다 (" + e.message + ")");\n','',T),
]
out=[]
for hid,desc,f,old,new,tests in M:
    s=open(f).read()
    if s.count(old)!=1: out.append((hid,desc,'NOT-APPLIED count=%d'%s.count(old),'')); continue
    subprocess.run(['python3','.harness/bin/seed.py','backup',f],check=True,capture_output=True)
    open(f,'w').write(s.replace(old,new))
    try:
        r=subprocess.run(['node','--test',*tests],capture_output=True,text=True,timeout=900)
        fails=[l for l in r.stdout.splitlines() if l.startswith('✖') and 'failing tests' not in l]
        fails=sorted(set(re.sub(r' \([\d.]+ms\)$','',l) for l in fails))
        res='KILLED' if r.returncode!=0 and fails else ('SURVIVED' if r.returncode==0 else 'INCONCLUSIVE')
        out.append((hid,desc,res,fails[:4]))
    finally:
        subprocess.run(['python3','.harness/bin/seed.py','restore'],check=True,capture_output=True)
    print(hid,out[-1][2],flush=True)
json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
