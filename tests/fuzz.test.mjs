import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findChrome } from "../skills/learn-to-tell/server/cdp.mjs";
import { check } from "../skills/learn-to-tell/server/check.mjs";
import { fuzzDeck } from "./fuzz-deck.mjs";

const chrome = findChrome();

// Static (S) scenes are the ones nobody looks at, so every text field at its cap must still fit in both sizes.
test("static scenes with every field at its cap have nothing to fix on desktop and phone", { skip: !chrome && "Chrome이 없다", timeout: 240000 }, async () => {
  const home = await mkdtemp(join(tmpdir(), "ltt-fuzz-"));
  try {
    const ids = [];
    for (const seed of [11, 12, 13]) {
      const id = "fz" + seed;
      await mkdir(join(home, "lessons", id), { recursive: true });
      await writeFile(join(home, "lessons", id, "lesson.html"), fuzzDeck(seed));
      ids.push(id);
    }
    const results = await check({ targets: ids, home, chrome, sheets: false });
    const found = [];
    for (const r of results) {
      assert.deepEqual(r.errors, [], r.target);
      for (const m of ["desktop", "mobile"]) {
        assert.deepEqual(r.modes[m].console, [], `${r.target} ${m}`);
        for (const s of r.modes[m].scenes) if (s.tier === "S") s.issues.forEach((x) => found.push(`${r.target} ${m} 장면 ${s.i + 1} ${s.type} ${x.rule}: ${x.msg}`));
      }
      assert.ok(r.modes.desktop.scenes.filter((s) => s.tier === "S").length >= 12);
    }
    assert.deepEqual(found, []);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
