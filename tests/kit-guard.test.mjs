import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK = fileURLToPath(new URL("../skills/learn-to-tell/hooks/kit_guard.py", import.meta.url));
const run = (tool_name, tool_input) => execFileSync("python3", [HOOK], { input: JSON.stringify({ tool_name, tool_input }), env: { ...process.env, CLAUDE_PLUGIN_ROOT: "/p/ltt" } }).toString();
const denied = (out) => out.includes('"deny"');

test("the installed kit and server source cannot be read, the docs and running the checker can", () => {
  assert.ok(denied(run("Read", { file_path: "/p/ltt/skills/learn-to-tell/kit/ltt.js" })));
  assert.ok(denied(run("Bash", { command: "sed -n 1,80p /p/ltt/skills/learn-to-tell/kit/ltt.js" })));
  assert.ok(denied(run("Grep", { pattern: "deck", path: "/p/ltt/skills/learn-to-tell/server/check.mjs" })));
  assert.ok(!denied(run("Read", { file_path: "/p/ltt/skills/learn-to-tell/kit/API.md" })));
  assert.ok(!denied(run("Bash", { command: "node /p/ltt/skills/learn-to-tell/server/check.mjs 20261020-x" })));
  assert.ok(!denied(run("Bash", { command: "node /p/ltt/skills/learn-to-tell/server/check.mjs 20261020-x 2>&1 | tail -60" })), "piping the checker's output is running it");
  assert.ok(denied(run("Bash", { command: "node -e \"console.log(require('fs').readFileSync('/p/ltt/skills/learn-to-tell/kit/ltt.js', 'utf8'))\"" })));
  assert.ok(denied(run("Bash", { command: "node /p/ltt/skills/learn-to-tell/server/check.mjs x; cat /p/ltt/skills/learn-to-tell/server/check.mjs" })));
  assert.ok(!denied(run("Read", { file_path: "/repo/skills/learn-to-tell/kit/ltt.js" })), "a development checkout stays readable");
});
