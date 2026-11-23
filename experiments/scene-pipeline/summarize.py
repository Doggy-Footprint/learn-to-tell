import json, sys, re
from pathlib import Path
E = Path(__file__).resolve().parent
def summ(run):
    d = E/"gallery/runs"/run; tools = []; res = None
    for line in open(d/"stream.jsonl"):
        try: r = json.loads(line)
        except: continue
        if r.get("type") == "assistant":
            for c in r["message"].get("content", []):
                if c.get("type") == "tool_use":
                    i = c["input"]; tools.append((c["name"], i.get("file_path") or i.get("command") or ""))
        if r.get("type") == "result": res = r
    audits = sum(1 for n, a in tools if n == "Bash" and "audit.mjs" in a)
    outside = [a for n, a in tools if n in ("Read",) and "/refs/" not in a and not a.startswith("refs/")]
    return {"run": run, "cost": round(res["total_cost_usd"], 4) if res else None, "turns": res and res.get("num_turns"),
            "wall_s": res and round(res["duration_ms"]/1000), "out_tok": res and res["usage"]["output_tokens"],
            "tools": len(tools), "reads": sum(n=="Read" for n,_ in tools), "edits": sum(n=="Edit" for n,_ in tools),
            "writes": sum(n=="Write" for n,_ in tools), "audits": audits, "outside_reads": outside,
            "subtype": res and res.get("subtype"), "result": (res or {}).get("result", "")[:160]}
if __name__ == "__main__":
    for r in sys.argv[1:]: print(json.dumps(summ(r), ensure_ascii=False))
