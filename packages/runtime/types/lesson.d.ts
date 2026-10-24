import type { CheckFor, OutputsOf, Widen } from "./internal.js";
import type { Space3dOpts } from "./ext/space3d.js";
import type { GeoOpts } from "./ext/geo.js";

declare const brand: unique symbol;

/** Point in the frame's data units, not pixels. */
export type P = [x: number, y: number];
export type Axis = [min: number, max: number, unit: string];
/** Keys in any scene, item, option, reveal or compare params are declared view params; that params value is the start value. */
/** Precedence, later wins: model defaults, scene/item params, explore knob/handle, committed Option params, reveal.params, compare a/b, multiples over. Split children get the same resolved params. */
export type Params = Record<string, number | string | boolean>;
/** Model name to its output. Inside figure draw it is untyped. */
export type Outputs = Record<string, any>;
/** Functions are re-evaluated with current model outputs. */
export type Text<O = Outputs> = string | ((m: O) => string);
/** Runtime picks colors. focus is the accent; good, warn, bad are semantic. */
export type Tone =
  | "focus" | "ref" | "muted" | "good" | "warn" | "bad"
  /** series1–6 are mutually distinguishable and colorblind-safe, but unordered categories. */
  | "series1" | "series2" | "series3" | "series4" | "series5" | "series6";
/** Later marks in MarkTree paint on top; marks are clipped to the frame, except text. */
export type MarkOpts = {
  /** Target for scene focus and reveal lists. */
  id?: string;
  /** Within one tone, contrast vs background rises with fill none < soft < solid and with opacity. */
  tone?: Tone;
  /** Text beside the mark; runtime chooses its position, avoiding other text and frame edges. */
  label?: Text;
  /** Drawn fraction 0–1, by arc length from the path start. */
  reveal?: number;
  /** Mark id this mark animates out of. */
  from?: string;
  weight?: "thin" | "normal" | "bold";
  size?: "s" | "m" | "l";
  /** Defaults: area soft, dot solid, rect, circle, arc, path none (outline). Not a physical lightness guarantee. */
  fill?: "none" | "soft" | "solid";
  /** 0–1. */
  opacity?: number;
  /** Draw the outline or line dashed. */
  dash?: boolean;
};

export interface Mark { readonly [brand]: "mark" }
export type MarkTree = Mark | false | null | undefined | MarkTree[];
export interface Frame { readonly [brand]: "frame" }
export interface Figure { readonly [brand]: "figure" }
export interface LessonSpec { readonly [brand]: "lesson" }
export interface VNode { readonly [brand]: "vnode" }
export interface Model<P extends Params = Params, O = unknown> { readonly [brand]: { p: P; o: O } }
export type H = (tag: string, attrs?: Record<string, string | number>, ...children: (VNode | string)[]) => VNode;
export type FigKey = string;

/** Exactly one. loop maps span linearly onto ms; steps: t is step index; idle: t cycles 0–1; static: alt text. */
export type TimeSpec =
  | { loop: Loop; steps?: never; idle?: never; static?: never }
  | { steps: string[]; loop?: never; idle?: never; static?: never }
  | { idle: { ms: number }; loop?: never; steps?: never; static?: never }
  | { static: string; loop?: never; steps?: never; idle?: never };

export type Loop = {
  ms: number;
  span: [number, number];
  /** Play once, then hold the end state. */
  once?: boolean;
  /** Monotone piecewise map (modelT, wall 0–1) from (span[0],0) to (span[1],1); repeated modelT holds; slower parts are marked slow-motion. */
  warp?: [modelT: number, wall: number][];
};

export type Expect = number | boolean | [lo: number, hi: number] | { lt: number } | { gt: number } | { lt: number; gt: number };
/** Check for one model. Number expect needs tol or rel; ranges are inclusive, lt and gt strict. */
export type Check<M = Record<string, Model<any, any>>> = CheckFor<M>;

export type Objective = { id: string; text: string };
export type Meta = {
  title: string;
  objectives: [Objective, ...Objective[]];
  learner: { knows: string[]; misconceptions: string[]; review?: string[] };
  domains: [string, ...string[]];
};

/** params apply only after the choice is committed; no preview while selecting. */
export type Option<O = Outputs> = { text: Text<O>; correct: true; params?: Params } | { text: Text<O>; feedback: Text<O>; params?: Params };
export type ChoiceInput<O = Outputs> = { kind: "choice"; options: Option<O>[] };
/** Learner drags mark along axis; correct within tol data units. The learner's answer is drawn as mark id "guess". */
export type DragInput<O = Outputs> = { kind: "drag"; mark: string; axis: "x" | "y"; answer: (m: O) => number; tol: number };
/** Learner sketches over x range, drawn as mark id "guess"; answer is the correct curve's mark id; tol in data units. */
export type DrawInput = { kind: "draw"; x: [number, number]; answer: string; tol: number };

/** Focus lists: runtime emphasizes listed marks and draws others at lower contrast, tone unchanged. No focus list, no emphasis: quiz item figure, summary, reveal.figure. */
export type Hook<O = Outputs, F = FigKey> = { type: "hook"; title: Text<O>; say: Text<O>; figure: F; focus: string[]; params?: Params };
/** Ask before explaining. reveal.marks stay hidden until answered; reveal.figure and reveal.params show after. targets names a misconception. */
export type Predict<O = Outputs, F = FigKey> = {
  type: "predict";
  title: Text<O>;
  ask: Text<O>;
  figure: F;
  focus: string[];
  params?: Params;
  input: ChoiceInput<O> | DragInput<O> | DrawInput;
  reveal: { say: Text<O>; marks?: string[]; figure?: F; params?: Params };
  targets?: string;
};
export type Explain<O = Outputs, F = FigKey> = { type: "explain"; title: Text<O>; say: Text<O>; figure: F; focus: string[]; params?: Params };
export type Define<O = Outputs, F = FigKey> = { type: "define"; term: string; definition: Text<O>; figure?: F; focus: string[] };
/** Each step advances the figure's steps index. */
export type Steps<O = Outputs, F = FigKey> = { type: "steps"; title: Text<O>; figure: F; steps: { say: Text<O>; focus: string[] }[] };
/** knobs: declared params (model defaults or view params) as slider, choices or toggle. A dragged handle sets params x, y to its data coordinates, clamped. */
export type Explore<O = Outputs, F = FigKey> = {
  type: "explore";
  title: Text<O>;
  say: Text<O>;
  figure: F;
  focus: string[];
  params?: Params;
  knobs: Record<string, [min: number, max: number, step?: number] | { range: [number, number]; step?: number; log?: true } | string[] | boolean>;
  handles?: { mark: string; x?: string; y?: string }[];
  goal?: { say: Text<O>; done: (m: O) => boolean };
};
/** Same figure under params a and b, side by side. */
export type Compare<O = Outputs, F = FigKey> = { type: "compare"; title: Text<O>; say: Text<O>; figure: F; focus: string[]; a: Params; b: Params; labels: [Text<O>, Text<O>] };
export type QuizScene<O = Outputs, F = FigKey> = { type: "quiz"; items: [QuizItem<O, F>, ...QuizItem<O, F>[]] };
export type Scene<O = Outputs, F = FigKey> = Hook<O, F> | Predict<O, F> | Define<O, F> | Explain<O, F> | Steps<O, F> | Explore<O, F> | Compare<O, F> | QuizScene<O, F>;

/** objective is an Objective id; transfer marks a new situation. numeric answer may name a check id. */
export type QuizItem<O = Outputs, F = FigKey> =
  | { kind: "choice"; prompt: Text<O>; options: Option<O>[]; objective: string; transfer?: true; figure?: F; params?: Params; reveal?: QuizReveal<O, F> }
  | { kind: "numeric"; prompt: Text<O>; answer: number | { check: string }; tol: number; unit: string; objective: string; transfer?: true; figure?: F; params?: Params; reveal?: QuizReveal<O, F> }
  | { kind: "order"; prompt: Text<O>; items: Text<O>[]; objective: string; transfer?: true }
  | { kind: "classify"; prompt: Text<O>; bins: string[]; items: { text: Text<O>; bin: string }[]; objective: string; transfer?: true };

/** Shown after a choice or numeric answer is submitted, correct or not; marks are not drawn before. Item figure uses item params before submission. */
export type QuizReveal<O = Outputs, F = FigKey> = { say?: Text<O>; marks?: string[]; figure?: F; params?: Params };

/** level: 1 basic to 5 advanced. requires and leadsTo are concept ids. */
export type Concept = { id: string; title: string; definition: string; level: 1 | 2 | 3 | 4 | 5; requires?: string[]; leadsTo?: string[] };
export type Section<O = Outputs, F = FigKey> = { concept: Concept; scenes: Scene<O, F>[] };

export type LessonInput<M = Record<string, Model<any, any>>, F extends string = string, O = OutputsOf<M>> = {
  meta: Meta;
  /** Term to short definition. Every define-scene term must be a key here (rule term-unknown). */
  glossary?: Record<string, string>;
  checks: NoInfer<Check<M>>[];
  models: M;
  figures: Record<F, Figure>;
  sections: NoInfer<Section<O, F>>[];
  quiz: NoInfer<QuizItem<O, F>>[];
  summary: { figures: NoInfer<F>[]; say?: NoInfer<Text<O>> };
};

export type Series = {
  points: { t: number; y: number[] }[];
  /** Linear interpolation; clamps outside the range. */
  at(t: number): number[];
  /** Points up to t plus the interpolated point at t. */
  until(t: number): { t: number; y: number[] }[];
  end: { t: number; y: number[] };
  /** State components i and j as points, up to time upTo. */
  xy(i?: number, j?: number, upTo?: number): P[];
};

export type PathCmd =
  | ["M", x: number, y: number]
  | ["L", x: number, y: number]
  | ["Q", cx: number, cy: number, x: number, y: number]
  | ["C", c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number]
  | ["A", rx: number, ry: number, rotationDeg: number, largeArc: 0 | 1, sweep: 0 | 1, x: number, y: number]
  | ["Z"];

/** Preferred side of the text. Text is never clipped, an exception to mark clipping; size, wrap and offset are runtime constants. */
type Anchor = "c" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Lesson files default-export this; the runtime injects api. No imports, no DOM. */
export type LessonFactory = (api: Api) => LessonSpec;

export interface Api {
  /** Checks run against models before rendering. Text functions receive model outputs at current params. */
  lesson<M extends Record<string, Model<any, any>>, F extends string>(input: LessonInput<M, F>): LessonSpec;
  /** fn must be pure and deterministic. src cites the formula or source; illustrative marks made-up numbers. */
  model<P extends Params, O>(defaults: P, fn: (p: Widen<P>) => O, src: string | { illustrative: true }): Model<Widen<P>, O>;
  /** draw is sampled over the frame's time; ctx.params is the resolved params, view params included. */
  figure(frame: Frame, draw: (m: Outputs, t: number, ctx: { step: number; params: Params }) => MarkTree): Figure;
  /** Escape hatch; check rule custom-why. bounds is its data-space box. */
  custom(opts: { id: string; why: string; bounds: [P, P] }, render: (ctx: { h: H; m: Outputs; t: number }) => VNode | VNode[]): Mark;

  /** camera returns the visible data window over time. */
  cartesian(o: { x: Axis; y: Axis; aspect?: "equal"; log?: "x" | "y" | "xy"; camera?: (m: Outputs, t: number) => { x: [number, number]; y: [number, number] } } & TimeSpec): Frame;
  /** Points are [r, theta degrees]. ring draws a donut. */
  polar(o: { r: Axis; theta?: [number, number]; ring?: boolean } & TimeSpec): Frame;
  /** Points are [time, lane index]. */
  lanes(o: { time: Axis; lanes: string[] } & TimeSpec): Frame;
  /** Window [0,1]² maps to the node bounding box; ELK places the union of all samples once, so nodes stay fixed over t and step. */
  graph(o: { layout: "tree" | "layered" | "force" | "sankey"; direction?: "down" | "right" } & TimeSpec): Frame;
  /** Points are [col, row]; row 0 is the top row and rows grow downward. */
  cells(o: { cols: number; rows: number } & TimeSpec): Frame;
  space3d(o: Space3dOpts & TimeSpec): Frame;
  /** Points are [lon, lat] degrees; region fits a named area; line, path and arrow follow great circles. */
  geo(o: GeoOpts & TimeSpec): Frame;

  /** Runtime chooses tick count and number format, and appends the axis unit. */
  axis(which: "x" | "y" | "r" | "theta" | "time", o?: { label?: Text; ticks?: number | number[] } & MarkOpts): Mark;
  /** Grid lines at spacing or positions. */
  grid(o?: { x?: number | number[]; y?: number | number[] } & MarkOpts): Mark;
  line(pts: P[], o?: { curve?: "linear" | "smooth" | "step" } & MarkOpts): Mark;
  /** Filled between pts and y = base (default 0). */
  area(pts: P[], o?: { base?: number } & MarkOpts): Mark;
  /** tone/text pairs. Without at, placed outside the plot area. */
  legend(entries: { tone: Tone; text: Text }[], o?: { at?: P } & MarkOpts): Mark;
  dot(at: P, o?: MarkOpts): Mark;
  /** radius in x-axis data units. */
  circle(center: P, radius: number, o?: MarkOpts): Mark;
  rect(from: P, to: P, o?: MarkOpts): Mark;
  /** degrees counterclockwise from +x; sector closes to the center. */
  arc(center: P, radius: number, degrees: [start: number, end: number], o?: { sector?: boolean } & MarkOpts): Mark;
  arrow(from: P, to: P, o?: MarkOpts): Mark;
  /** "A" sweep 1 is counterclockwise in data coordinates (y up). */
  path(cmds: PathCmd[], o?: MarkOpts): Mark;
  /** at is the point the text refers to, not a shifted position. Runtime moves text off other text and frame edges, drawing a leader. */
  label(at: P, text: Text, o?: { anchor?: Anchor; /** Always draw a leader line from the label to this point. */ leader?: P } & MarkOpts): Mark;
  /** Dimension line between two points with its measured text; runtime places the text. */
  dim(from: P, to: P, text: Text, o?: MarkOpts): Mark;
  /** Angle arc at vertex between rays to from and to; runtime places text outside the arc. */
  angle(vertex: P, from: P, to: P, o?: { text?: Text } & MarkOpts): Mark;
  /** Runtime places the text outside the brace, centered. */
  brace(from: P, to: P, text: Text, o?: MarkOpts): Mark;
  /** Graph frame node; id is also its mark id. at pins it in the [0,1]² window, overriding layout. */
  node(id: string, text: Text, o?: { at?: P; shape?: "box" | "round" | "circle"; group?: string } & MarkOpts): Mark;
  /** Between node ids; default mark id is "from->to". value sets sankey width. Runtime places text at the line middle. */
  edge(from: string, to: string, o?: { text?: Text; value?: number; directed?: boolean } & MarkOpts): Mark;
  /** value is colored on the runtime's sequential scale. */
  cell(col: number, row: number, o?: { value?: number; text?: Text } & MarkOpts): Mark;
  /** Scalar f is colored; P result is drawn as arrows. */
  field(f: (x: number, y: number) => number | P, o?: { as?: "color" | "arrows"; density?: number } & MarkOpts): Mark;
  /** Named shape from the runtime's glyph set; rotate in degrees. */
  glyph(name: string, at: P, o?: { rotate?: number; scale?: number } & MarkOpts): Mark;
  icon(name: string, at: P, o?: MarkOpts): Mark;
  /** TeX source. */
  math(at: P, tex: string, o?: MarkOpts): Mark;
  /** highlight: 1-based line numbers. */
  code(at: P, source: string, o?: { lang?: string; highlight?: number[] } & MarkOpts): Mark;
  /** box is the content area; the device frame sits outside it. Children use parent data coordinates, clipped to box. */
  mock(kind: "browser" | "phone" | "window", box: [P, P], children: MarkTree, o?: { title?: Text } & MarkOpts): Mark;

  /** Path of series up to model time t; dims picks state components as x and y. */
  trace(s: Series, t: number, o?: { trail?: boolean; head?: boolean; dims?: [number, number] } & MarkOpts): MarkTree;
  /** n particles along pts; rate is the fraction of full path length per unit t; seed fixes offsets. */
  flow(pts: P[], o: { n: number; rate: number; seed: number; t: number } & MarkOpts): MarkTree;
  /** Line across the frame at a data value; width in data units. */
  sweep(axis: "x" | "y", at: number, o?: { width?: number } & MarkOpts): Mark;
  /** With source: magnified source box, connected to its origin. Without: whole figure as thumbnail. Placed at box at. */
  inset(figure: FigKey, o: { source?: [P, P]; at: [P, P] } & MarkOpts): Mark;
  /** Both share t, step, params, knobs, reveal, focus; mark ids unique across both. link: declared param or mark id highlighted in both. */
  split(figures: [FigKey, FigKey], o?: { link?: string }): Figure;
  /** over keys are declared params; one copy per value, sharing frame, axes, t, step, knobs. */
  multiples(figure: FigKey, o: { over: Record<string, Array<number | string | boolean>> }): Figure;

  /** Fixed-step RK4. Stops at the first sign change of event from nonnegative to negative. */
  ode(f: (t: number, y: number[]) => number[], y0: number[], span: [t0: number, t1: number], dt: number, o?: { event?: (t: number, y: number[]) => number }): Series;
  /** mulberry32(seed >>> 0), uniform [0, 1); same sequence in runtime and stub. */
  rng(seed: number): () => number;
  /** f must be unimodal on range. */
  argmax(f: (x: number) => number, range: [number, number], o?: { tol?: number }): { x: number; y: number };
  /** f must change sign on range. */
  root(f: (x: number) => number, range: [number, number], o?: { tol?: number }): number;
  sample(rand: () => number, n: number, dist: { normal: [mu: number, sigma: number] } | { uniform: [a: number, b: number] }): number[];
  /** Values outside range are dropped; last bin includes the upper bound. */
  histogram(values: number[], o: { bins: number; range: [number, number] }): { x0: number; x1: number; count: number }[];
  /** xs ascending; clamps outside. */
  interpolate(xs: number[], ys: number[], x: number): number;
}
