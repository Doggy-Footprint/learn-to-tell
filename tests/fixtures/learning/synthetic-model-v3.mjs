// Standalone fixture model F1 (domain-neutral): two inputs, five outputs in two units, margin undefined for 16 < load-b < 19.
// Closed form: part-a = 3a, part-b = 2b, total = 3a + 2b, fill-b = b / 50, margin = 1 - b / 50.
export const model = {
  modelId: 'load-balance',
  modelRevision: 1,
  inputIds: ['load-a', 'load-b'],
  outputIds: ['part-a', 'part-b', 'total', 'fill-b', 'margin'],
  calculate(values) {
    const a = values['load-a'], b = values['load-b'];
    if (typeof a !== 'number' || !(a >= 0 && a <= 100)) return {ok: false, errors: [{code: 'RANGE', path: '/load-a'}]};
    if (typeof b !== 'number' || !(b >= 0 && b <= 50)) return {ok: false, errors: [{code: 'RANGE', path: '/load-b'}]};
    return {ok: true, value: {'part-a': 3 * a, 'part-b': 2 * b, total: 3 * a + 2 * b, 'fill-b': b / 50, margin: b > 16 && b < 19 ? null : 1 - b / 50}};
  },
};
