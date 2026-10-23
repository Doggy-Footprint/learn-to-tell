import type { Model, Expect } from "./lesson.js";

export type Widen<P> = { [K in keyof P]: P[K] extends boolean ? boolean : P[K] extends number ? number : P[K] extends string ? string : P[K] };
export type OutOf<X> = X extends Model<any, infer O> ? O : never;
export type ParOf<X> = X extends Model<infer P, any> ? P : never;
export type OutputsOf<M> = { [K in keyof M]: OutOf<M[K]> };

type NonNumber = Exclude<Expect, number>;
type CheckBase<K, P, O> = {
  id?: string;
  model: K;
  at?: Partial<P>;
  value?: (o: O, run: (at: Partial<P>) => O) => number | boolean;
  limit?: string;
  source?: string;
};
type CheckOf<K, P, O> = CheckBase<K, P, O> &
  (
    | { expect: number; tol: number; rel?: number }
    | { expect: number; rel: number; tol?: number }
    | { expect: NonNumber | Partial<Record<keyof O, Expect>>; tol?: number; rel?: number }
  );
export type CheckFor<M> = { [K in keyof M & string]: CheckOf<K, ParOf<M[K]>, OutOf<M[K]>> }[keyof M & string];
