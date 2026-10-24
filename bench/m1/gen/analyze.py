import json, sys, os, re
from datetime import datetime

def ts(s): return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()

def tok(u): return u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0) + u.get("output_tokens", 0)

def analyze(d):
    lines = [json.loads(l) for l in open(f"{d}/out.jsonl") if l.strip()]
    rss = [o for o in lines if o.get("type") == "result"]
    res = dict(rss[-1]) if rss else None
    if res: res["duration_ms"] = sum(r.get("duration_ms", 0) for r in rss); res["n_results"] = len(rss)
    seen = {}
    order = []
    tools = []
    for o in lines:
        if o.get("type") != "assistant": continue
        m = o["message"]; mid = m.get("id")
        main = o.get("parent_tool_use_id") is None
        if mid not in seen:
            seen[mid] = {"main": main, "usage": m.get("usage", {}), "t": ts(o["timestamp"]), "tools": []}
            order.append(mid)
        else:
            seen[mid]["usage"] = m.get("usage", seen[mid]["usage"])
        for c in m.get("content", []):
            if c.get("type") == "tool_use":
                seen[mid]["tools"].append((c["name"], c.get("input", {})))
                tools.append((main, c["name"], c.get("input", {})))
    phase = "write"; phases = {}; sub = 0; last_main = None
    events = []
    for mid in order:
        r = seen[mid]
        if not r["main"]:
            sub += tok(r["usage"]); continue
        phases.setdefault(phase, {"tok": 0, "out": 0, "turns": 0})
        phases[phase]["tok"] += tok(r["usage"]); phases[phase]["out"] += r["usage"].get("output_tokens", 0); phases[phase]["turns"] += 1
        last_main = r
        for name, inp in r["tools"]:
            cmd = inp.get("command", "") if name == "Bash" else ""
            if "ltt.mjs check" in cmd: phase = "check"; events.append("check")
            elif "ltt.mjs sheet" in cmd: phase = "render"; events.append("sheet")
            elif "ltt.mjs digest" in cmd: phase = "verify"; events.append("digest")
            elif name in ("Agent", "Task"): phase = "verify"; events.append("agent")
            elif name in ("Edit", "Write") and "lesson.js" in inp.get("file_path", ""): events.append(f"{name.lower()}")
    # edits after sheet
    after_sheet = events[events.index("sheet") + 1:] if "sheet" in events else []
    render_edits = sum(1 for e in after_sheet if e in ("edit", "write"))
    log = []
    lp = f"{d}/.ltt/log.jsonl"
    if os.path.exists(lp): log = [json.loads(l) for l in open(lp)]
    tool_counts = {}
    for main, n, _ in tools:
        k = n if main else f"sub:{n}"; tool_counts[k] = tool_counts.get(k, 0) + 1
    size = os.path.getsize(f"{d}/lesson.js") if os.path.exists(f"{d}/lesson.js") else (os.path.getsize(f"{d}/index.html") if os.path.exists(f"{d}/index.html") else 0)
    mu = res.get("modelUsage", {}) if res else {}
    cum = sum(v.get("inputTokens", 0) + v.get("outputTokens", 0) + v.get("cacheReadInputTokens", 0) + v.get("cacheCreationInputTokens", 0) for v in mu.values())
    outt = sum(v.get("outputTokens", 0) for v in mu.values())
    return {
        "dir": os.path.basename(d), "duration_s": round(res["duration_ms"] / 1000) if res else None,
        "cost_usd": round(res.get("total_cost_usd", 0), 2) if res else None, "turns": res.get("num_turns") if res else None,
        "final_context": tok(last_main["usage"]) if last_main else None, "cumulative_tokens": cum, "output_tokens": outt,
        "subagent_tokens_cum": sub, "phases": phases, "events": events, "render_edits": render_edits,
        "ltt_log": [{k: x[k] for k in ("cmd", "ms", "exit", "counts")} for x in log], "tools": tool_counts, "bytes": size,
        "result_text": (res or {}).get("result", "")[-3000:],
    }

if __name__ == "__main__":
    out = [analyze(d) for d in sys.argv[1:]]
    print(json.dumps(out, ensure_ascii=False, indent=1))
