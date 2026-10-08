// Standalone fixture model F3: one input, three outputs whose units interleave (X, Y, X). x-first = level, y-only = 2 * level, x-second = level + 5.
export const model = {
  modelId: 'unit-grouping',
  modelRevision: 1,
  inputIds: ['level'],
  outputIds: ['x-first', 'y-only', 'x-second'],
  calculate(values) {
    const v = values.level;
    if (typeof v !== 'number' || !(v >= 0 && v <= 10)) return {ok: false, errors: [{code: 'RANGE', path: '/level'}]};
    return {ok: true, value: {'x-first': v, 'y-only': 2 * v, 'x-second': v + 5}};
  },
};
