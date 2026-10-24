import { load, samplesFor } from "../core/model.mjs";
import { numericAnswer, orderShuffle } from "../core/answer.mjs";
import { resolveParams, outputsFor, leavesOf } from "../layout/figure.mjs";

/** @param {number} v */
const num = (v) => (Number.isFinite(v) ? String(Number(v.toPrecision(5))) : String(v));

/** @param {unknown} v @param {number} depth @returns {string} */
function summarize(v, depth = 0) {
  if (typeof v === "number") return num(v);
  if (typeof v === "boolean" || typeof v === "string") return String(v);
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === "number")) return `[${v.slice(0, 8).map(num).join(", ")}${v.length > 8 ? `, ... (${v.length})` : ""}]`;
    return `(${v.length} items)`;
  }
  if (v && typeof v === "object") {
    const o = /** @type {any} */ (v);
    if (Array.isArray(o.points) && typeof o.at === "function") return `series t ${num(o.points[0].t)}..${num(o.end.t)}, end y [${o.end.y.map(num).join(", ")}]`;
    if (depth > 1) return "{...}";
    return `{ ${Object.entries(o)
      .filter(([, x]) => typeof x !== "function")
      .map(([k, x]) => `${k}: ${summarize(x, depth + 1)}`)
      .join(", ")} }`;
  }
  return String(v);
}

/**
 * Markdown for independent answer verification: questions without answers, then the key.
 * @param {import("ltt").LessonFactory} factory
 * @returns {string}
 */
export function digest(factory) {
  const { input: raw } = load(factory);
  /** @type {any} */
  const input = raw;
  const defaults = resolveParams(input, {});
  /** @param {any} params */
  const outs = (params) => outputsFor(input, resolveParams(input, params ?? {}));
  /** @param {any} v @param {any} m */
  const T = (v, m) => (typeof v === "function" ? String(v(m)) : v === undefined || v === null ? "" : String(v));

  /** Model outputs a figure reads at params. @param {string} key @param {any} params */
  const figureModels = (key, params) => {
    if (typeof key !== "string" || !input.figures?.[key]) return [];
    /** @type {Map<string, any>} */
    const used = new Map();
    for (const leaf of leavesOf(input, key, resolveParams(input, params ?? {}))) {
      if (leaf.fig.kind !== "figure") continue;
      const [frame, draw] = leaf.fig.args;
      const m = outputsFor(input, leaf.params);
      const proxy = new Proxy(m, {
        get(target, prop) {
          const name = typeof prop === "string" && leaf.caption ? `${prop} (${leaf.caption})` : prop;
          if (typeof prop === "string" && prop in target && !used.has(/** @type {string} */ (name))) used.set(/** @type {string} */ (name), target[prop]);
          return /** @type {any} */ (target)[prop];
        },
      });
      for (const s of samplesFor(frame, 1)) {
        try {
          draw(proxy, s.t, { step: s.step, params: { ...leaf.params } });
        } catch {
          // a failing figure is reported by ltt check
        }
      }
    }
    return [...used].map(([k, v]) => `  - ${k}: ${summarize(v)}`);
  };

  const q = [];
  const a = [];
  q.push(`# ${input.meta?.title ?? "lesson"}`, "", "## 문항", "");
  a.push("## 정답 키", "");
  let n = 0;

  /** @param {any} item @param {string} label @param {any} m */
  const quizItem = (item, label, m) => {
    q.push(`### ${label} (${item.kind})`, "", `- 문제: ${T(item.prompt, m)}`);
    a.push(`### ${label}`);
    if (item.kind === "choice") {
      item.options.forEach((/** @type {any} */ op, /** @type {number} */ k) => q.push(`  ${k + 1}. ${T(op.text, m)}`));
      item.options.forEach((/** @type {any} */ op, /** @type {number} */ k) => {
        if (op.correct) a.push(`- 정답: ${k + 1}. ${T(op.text, m)}`);
        else a.push(`- ${k + 1}번 오답 설명: ${T(op.feedback, m)}`);
      });
    } else if (item.kind === "numeric") {
      q.push(`- 단위: ${item.unit}`);
      let value;
      try {
        value = num(numericAnswer(input, item.answer));
      } catch (e) {
        value = `(계산 실패: ${e instanceof Error ? e.message : String(e)})`;
      }
      a.push(`- 정답: ${value} ${item.unit} (허용 오차 ±${item.tol})${typeof item.answer === "object" ? ` — check "${item.answer.check}"의 값` : ""}`);
    } else if (item.kind === "order") {
      const perm = orderShuffle(item.items.length);
      q.push("- 순서대로 놓을 항목(뒤섞임):");
      perm.forEach((i, k) => q.push(`  ${String.fromCharCode(65 + k)}. ${T(item.items[i], m)}`));
      a.push(`- 정답 순서: ${item.items.map((/** @type {any} */ _, /** @type {number} */ i) => String.fromCharCode(65 + perm.indexOf(i))).join(" → ")} (${item.items.map((/** @type {any} */ x) => T(x, m)).join(" → ")})`);
    } else if (item.kind === "classify") {
      q.push(`- 분류: ${item.bins.join(", ")}`);
      item.items.forEach((/** @type {any} */ it, /** @type {number} */ k) => q.push(`  ${k + 1}. ${T(it.text, m)}`));
      item.items.forEach((/** @type {any} */ it, /** @type {number} */ k) => a.push(`- ${k + 1}. ${T(it.text, m)} → ${it.bin}`));
    }
    if (item.reveal?.say !== undefined) a.push(`- 공개 설명: ${T(item.reveal.say, outs({ ...(item.params ?? {}), ...(item.reveal.params ?? {}) }))}`);
    const fm = [...figureModels(item.figure, item.params), ...figureModels(item.reveal?.figure, { ...(item.params ?? {}), ...(item.reveal?.params ?? {}) })];
    if (fm.length) q.push("- 그림이 쓰는 model 값:", ...fm);
    q.push("");
    a.push("");
  };

  (input.sections ?? []).forEach((/** @type {any} */ sec, /** @type {number} */ i) => {
    (sec.scenes ?? []).forEach((/** @type {any} */ sc, /** @type {number} */ j) => {
      const at = `장면 ${n} sections[${i}].scenes[${j}]`;
      n++;
      const m = outs(sc.params);
      if (sc.type === "predict") {
        q.push(`### ${at} predict: ${T(sc.title, m)}`, "", `- 질문: ${T(sc.ask, m)}`);
        a.push(`### ${at} predict`);
        const inp = sc.input ?? {};
        if (inp.kind === "choice") {
          inp.options.forEach((/** @type {any} */ op, /** @type {number} */ k) => q.push(`  ${k + 1}. ${T(op.text, m)}`));
          inp.options.forEach((/** @type {any} */ op, /** @type {number} */ k) => {
            if (op.correct) a.push(`- 정답: ${k + 1}. ${T(op.text, m)}`);
            else a.push(`- ${k + 1}번 오답 설명: ${T(op.feedback, m)}`);
          });
        } else if (inp.kind === "drag") {
          q.push(`- 입력: 그림의 "${inp.mark}"를 ${inp.axis}축 방향으로 끌어 놓는다 (허용 오차 ±${inp.tol}, 데이터 단위)`);
          let v;
          try {
            v = num(inp.answer(m));
          } catch (e) {
            v = `(계산 실패: ${e instanceof Error ? e.message : String(e)})`;
          }
          a.push(`- 정답: ${inp.axis} = ${v} (±${inp.tol})`);
        } else if (inp.kind === "draw") {
          q.push(`- 입력: x ${inp.x[0]}..${inp.x[1]} 구간에 곡선을 그린다 (허용 오차 ±${inp.tol}, 데이터 단위)`);
          a.push(`- 정답: 그림의 "${inp.answer}" 곡선`);
        }
        const rm = outs({ ...(sc.params ?? {}), ...(sc.reveal?.params ?? {}) });
        a.push(`- 공개 설명: ${T(sc.reveal?.say, rm)}`, "");
        const fm = figureModels(sc.figure, sc.params);
        if (fm.length) q.push("- 그림이 쓰는 model 값:", ...fm);
        q.push("");
      } else if (sc.type === "quiz") {
        (sc.items ?? []).forEach((/** @type {any} */ it, /** @type {number} */ k) => quizItem(it, `${at}.items[${k}]`, outs(it.params)));
      }
    });
  });
  (input.quiz ?? []).forEach((/** @type {any} */ it, /** @type {number} */ k) => quizItem(it, `장면 ${n} 최종 quiz[${k}]`, outs(it.params)));
  void defaults;
  return `${[...q, ...a].join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}
