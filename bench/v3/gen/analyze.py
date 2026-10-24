import json, os, sys

def tok(u):
    return sum(u.get(k, 0) for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens"))

def analyze(d):
    lines = [json.loads(l) for l in open(f"{d}/out.jsonl") if l.strip()]
    res = [o for o in lines if o.get("type") == "result"][-1]
    msgs, order = {}, []
    for o in lines:
        if o.get("type") != "assistant":
            continue
        m = o["message"]
        if m["id"] not in msgs:
            order.append(m["id"])
        msgs[m["id"]] = m
    checks, phase, ph = [], "write", {"write": 0, "check": 0}
    results = {}
    for o in lines:
        if o.get("type") == "user":
            for c in o["message"].get("content", []) if isinstance(o["message"].get("content"), list) else []:
                if c.get("type") == "tool_result":
                    results[c["tool_use_id"]] = c.get("content")
    last = None
    for mid in order:
        m = msgs[mid]
        ph[phase] += m.get("usage", {}).get("output_tokens", 0)
        last = m
        for c in m.get("content", []):
            if c.get("type") == "tool_use" and c["name"] == "Bash" and "ltt-check" in c["input"].get("command", ""):
                phase = "check"
                out = results.get(c["id"])
                text = out if isinstance(out, str) else "".join(x.get("text", "") for x in (out or []) if isinstance(x, dict))
                rules = {}
                try:
                    rep = json.loads(text[text.index("{"):text.rindex("}") + 1])
                    for e in rep["errors"]:
                        rules[e["rule"]] = rules.get(e["rule"], 0) + 1
                    checks.append({"ok": rep["ok"], "rules": rules, "unchecked": rep["unchecked"]})
                except Exception:
                    checks.append({"raw": text[:200]})
    mu = res.get("modelUsage", {})
    return {
        "duration_s": round(res["duration_ms"] / 1000),
        "cost_usd": round(res.get("total_cost_usd", 0), 2),
        "turns": res.get("num_turns"),
        "final_context": tok(last.get("usage", {})) if last else 0,
        "cumulative": sum(v.get("inputTokens", 0) + v.get("outputTokens", 0) + v.get("cacheReadInputTokens", 0) + v.get("cacheCreationInputTokens", 0) for v in mu.values()),
        "output_tokens": sum(v.get("outputTokens", 0) for v in mu.values()),
        "html_bytes": os.path.getsize(f"{d}/index.html") if os.path.exists(f"{d}/index.html") else 0,
        "checks": checks,
        "final_message": res.get("result", "")[-1500:],
    }

root = sys.argv[1]
out = {t: {k: analyze(f"{root}/{t}/{k}") for k in ("skill", "baseline")} for t in sorted(os.listdir(root)) if os.path.isdir(f"{root}/{t}")}
print(json.dumps(out, ensure_ascii=False, indent=1))
