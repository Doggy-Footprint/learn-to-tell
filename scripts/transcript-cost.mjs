#!/usr/bin/env node
// Usage: node scripts/transcript-cost.mjs <session.jsonl>... [--json]
// Subagent transcripts are picked up from <session>/subagents/agent-*.jsonl next to each file.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const WEIGHTS = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 };
// Measured on compare1 lesson Writes: context growth across the Write divided by its input length.
const CHARS_PER_TOKEN = 1.6;

function parse(file) {
  const messages = new Map();
  const tools = new Map();
  const seen = new Set();
  const stamps = [];
  let images = 0;
  let audits = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    // Tool calls are mirrored in api-request-blob records; counting them doubles every tally.
    if (rec.type !== "assistant" && rec.type !== "user") continue;
    if (rec.uuid) {
      if (seen.has(rec.uuid)) continue;
      seen.add(rec.uuid);
    }
    const ts = rec.timestamp ? Date.parse(rec.timestamp) : NaN;
    if (Number.isFinite(ts)) stamps.push(ts);
    const content = Array.isArray(rec.message?.content) ? rec.message.content : [];
    if (rec.type === "assistant") {
      const id = rec.message?.id ?? rec.uuid;
      const msg = messages.get(id) ?? { usage: null, chars: 0 };
      if (rec.message?.usage) msg.usage = rec.message.usage;
      for (const block of content) {
        if (block.type === "text") msg.chars += block.text?.length ?? 0;
        else if (block.type === "thinking") msg.chars += block.thinking?.length ?? 0;
        else if (block.type === "tool_use") {
          msg.chars += JSON.stringify(block.input ?? {}).length;
          tools.set(block.id, { name: block.name, start: ts, end: NaN });
          if (block.name === "Bash" && /node\s+\S*(audit|check)\.mjs/.test(block.input?.command ?? "")) audits += 1;
        }
      }
      messages.set(id, msg);
    } else {
      for (const block of content) {
        if (block.type !== "tool_result") continue;
        const tool = tools.get(block.tool_use_id);
        if (tool) tool.end = ts;
        if (Array.isArray(block.content)) images += block.content.filter((c) => c.type === "image").length;
      }
    }
  }
  return summarize(file, messages, tools, stamps, images, audits);
}

function summarize(file, messages, tools, stamps, images, audits) {
  const s = {
    file, calls: messages.size, maxContext: 0,
    input: 0, cacheWrite: 0, cacheRead: 0, outputReported: 0, outputChars: 0, outputEst: 0,
    images, audits, tools: {}, wallSec: 0, weighted: 0,
  };
  for (const { usage, chars } of messages.values()) {
    s.outputChars += chars;
    if (!usage) continue;
    const input = usage.input_tokens ?? 0;
    const write = usage.cache_creation_input_tokens ?? 0;
    const read = usage.cache_read_input_tokens ?? 0;
    const out = usage.output_tokens ?? 0;
    s.input += input; s.cacheWrite += write; s.cacheRead += read; s.outputReported += out;
    // output_tokens is under-reported for large Writes (26-46K chars logged as 3-35 tokens), and
    // redacted thinking leaves no chars, so neither source alone is a floor.
    s.outputEst += Math.max(out, Math.round(chars / CHARS_PER_TOKEN));
    s.maxContext = Math.max(s.maxContext, input + write + read);
  }
  for (const { name, start, end } of tools.values()) {
    const t = (s.tools[name] ??= { count: 0, sec: 0 });
    t.count += 1;
    if (Number.isFinite(start) && Number.isFinite(end)) t.sec += Math.max(0, end - start) / 1000;
  }
  if (stamps.length) s.wallSec = (Math.max(...stamps) - Math.min(...stamps)) / 1000;
  s.weighted = Math.round(
    s.input * WEIGHTS.input + s.cacheWrite * WEIGHTS.cacheWrite +
    s.cacheRead * WEIGHTS.cacheRead + s.outputEst * WEIGHTS.output,
  );
  return s;
}

function subagentFiles(file) {
  const dir = join(dirname(file), basename(file, ".jsonl"), "subagents");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /^agent-.*\.jsonl$/.test(f)).sort().map((f) => join(dir, f));
}

function total(parts) {
  const t = { file: "total", calls: 0, maxContext: 0, input: 0, cacheWrite: 0, cacheRead: 0,
    outputReported: 0, outputChars: 0, outputEst: 0, images: 0, audits: 0, tools: {}, wallSec: 0, weighted: 0 };
  for (const p of parts) {
    for (const k of ["calls", "input", "cacheWrite", "cacheRead", "outputReported", "outputChars", "outputEst", "images", "audits", "weighted"]) t[k] += p[k];
    t.maxContext = Math.max(t.maxContext, p.maxContext);
    for (const [name, v] of Object.entries(p.tools)) {
      const x = (t.tools[name] ??= { count: 0, sec: 0 });
      x.count += v.count; x.sec += v.sec;
    }
  }
  t.wallSec = parts[0]?.wallSec ?? 0;
  return t;
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");

function row(label, s) {
  const tools = Object.entries(s.tools).sort((a, b) => b[1].sec - a[1].sec)
    .map(([n, v]) => `${n} ${v.count}/${Math.round(v.sec)}s`).join(", ");
  return [
    `${label}`,
    `  calls ${s.calls} · max context ${fmt(s.maxContext)} · wall ${Math.round(s.wallSec)}s`,
    `  input ${fmt(s.input)} · cache write ${fmt(s.cacheWrite)} · cache read ${fmt(s.cacheRead)}`,
    `  output reported ${fmt(s.outputReported)} · chars ${fmt(s.outputChars)} · est ${fmt(s.outputEst)}`,
    `  weighted ${fmt(s.weighted)} · images ${s.images} · audit runs ${s.audits}`,
    `  tools ${tools || "-"}`,
  ].join("\n");
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error("usage: node scripts/transcript-cost.mjs <session.jsonl>... [--json]");
  process.exit(2);
}
const reports = files.map((file) => {
  const main = parse(file);
  const subs = subagentFiles(file).map(parse);
  return { main, subagents: subs, total: total([main, ...subs]) };
});
if (json) console.log(JSON.stringify(reports, null, 2));
else {
  for (const r of reports) {
    console.log(row(`main ${r.main.file}`, r.main));
    for (const s of r.subagents) console.log(row(`subagent ${basename(s.file)}`, s));
    if (r.subagents.length) console.log(row("total (wall = main)", r.total));
    console.log(`weights: input ${WEIGHTS.input}, cache write ${WEIGHTS.cacheWrite}, cache read ${WEIGHTS.cacheRead}, output est ${WEIGHTS.output}`);
  }
}
