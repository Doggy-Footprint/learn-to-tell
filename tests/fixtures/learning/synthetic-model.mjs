// Standalone fixture model: one input, two outputs in different units, no nullable output (spec C7).
// Closed form: after 10 minutes the tank holds rate * 10 liters; capacity is 2000 liters.
export const model = {
  modelId: 'water-tank',
  modelRevision: 1,
  inputIds: ['flow-rate'],
  outputIds: ['filled-volume', 'fill-ratio'],
  calculate(values) {
    const rate = values['flow-rate'];
    if (typeof rate !== 'number' || !(rate >= 0 && rate <= 100)) return {ok: false, errors: [{code: 'RANGE', path: '/flow-rate'}]};
    const volume = rate * 10;
    return {ok: true, value: {'filled-volume': volume, 'fill-ratio': volume / 2000}};
  },
};
