// Standalone fixture model F2: one input, one output. twice = 2 * speed.
export const model = {
  modelId: 'minimal-double',
  modelRevision: 1,
  inputIds: ['speed'],
  outputIds: ['twice'],
  calculate(values) {
    const s = values.speed;
    if (typeof s !== 'number' || !(s >= 0 && s <= 10)) return {ok: false, errors: [{code: 'RANGE', path: '/speed'}]};
    return {ok: true, value: {twice: 2 * s}};
  },
};
