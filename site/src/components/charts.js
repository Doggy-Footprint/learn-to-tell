import {formatCount} from '../learning/format.mjs';
import {h, svg} from './dom.js';

const SERIES = 5;
const DASHES = ['', '7 3', '2 3', '9 3 2 3', '1 4'];
const UNDEFINED_TEXT = '정의되지 않음';
const show = value => value === null ? UNDEFINED_TEXT : formatCount(value);

// Series differ by dash pattern (lines) and fill pattern (segments) so no state relies on color alone.
function patternDefs(prefix) {
  const ink = index => `var(--ltt-series-${index})`;
  const tiles = [
    index => [svg('path', {d: 'M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6', stroke: ink(index), 'stroke-width': 2.5})],
    index => [svg('circle', {cx: 4, cy: 4, r: 2, fill: ink(index)})],
    index => [svg('path', {d: 'M0 0 L8 8 M8 0 L0 8', stroke: ink(index), 'stroke-width': 1.5})],
    index => [svg('path', {d: 'M0 2 H8 M0 6 H8', stroke: ink(index), 'stroke-width': 2})],
    index => [svg('path', {d: 'M2 0 V8 M6 0 V8', stroke: ink(index), 'stroke-width': 2})],
  ];
  return tiles.map((draw, index) => svg('pattern', {id: `${prefix}-${index}`, width: 8, height: 8, patternUnits: 'userSpaceOnUse'},
    svg('rect', {width: 8, height: 8, fill: 'var(--ltt-surface)'}), ...draw(index)));
}

function swatch(prefix, index) {
  return svg('svg', {width: 18, height: 18, 'aria-hidden': 'true', focusable: 'false', class: 'legend-swatch'},
    svg('rect', {x: 1, y: 1, width: 16, height: 16, fill: `url(#${prefix}-${index % SERIES})`, stroke: `var(--ltt-series-${index % SERIES})`, 'stroke-width': 1.5}));
}

export const CHART_WIDTH = 360;
const W = CHART_WIDTH;
const H = 250;
const LEFT = 62;
const RIGHT = 14;
const TOP = 26;
const BOTTOM = 52;

export function sweepChart({visual, input, outputs, points, current, previous}) {
  const low = points[0].x;
  const high = points[points.length - 1].x;
  const all = points.flatMap(point => Object.values(point.values)).filter(value => value !== null);
  let ymin = Math.min(0, ...all);
  let ymax = Math.max(...all);
  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }
  const px = value => LEFT + (value - low) / (high - low) * (W - LEFT - RIGHT);
  const py = value => H - BOTTOM - (value - ymin) / (ymax - ymin) * (H - TOP - BOTTOM);
  const unit = outputs[0].unit;
  const parts = outputs.map((output, index) => {
    const series = index % SERIES;
    let path = '';
    let pen = false;
    for (const point of points) {
      const value = point.values[output.outputId];
      if (value === null) pen = false;
      else {
        path += `${pen ? 'L' : 'M'}${px(point.x).toFixed(2)} ${py(value).toFixed(2)} `;
        pen = true;
      }
    }
    const marks = [svg('path', {d: path.trim(), fill: 'none', 'stroke-width': 2.5, 'stroke-dasharray': DASHES[series], style: `stroke: var(--ltt-series-${series})`, testid: `sweep-line-${visual.visualId}-${output.outputId}`})];
    const now = current.values[output.outputId];
    if (now !== null) marks.push(svg('circle', {cx: px(current.x).toFixed(2), cy: py(now).toFixed(2), r: 5.5, 'data-x': current.x, 'data-y': now, style: `fill: var(--ltt-series-${series})`, stroke: 'var(--ltt-surface)', 'stroke-width': 2, testid: `sweep-point-${visual.visualId}-${output.outputId}`}));
    const before = previous?.values[output.outputId];
    if (before !== undefined && before !== null) {
      const x = Math.min(Math.max(previous.x, low), high);
      marks.push(svg('circle', {cx: px(x).toFixed(2), cy: py(before).toFixed(2), r: 5.5, fill: 'none', 'stroke-width': 2, 'stroke-dasharray': '2 2', style: `stroke: var(--ltt-series-${series})`, 'data-x': previous.x, 'data-y': before, testid: `sweep-previous-${visual.visualId}-${output.outputId}`}));
    }
    return marks;
  });
  const summary = `${visual.caption}. ${input.label}이 ${formatCount(low)}에서 ${formatCount(high)}${input.unit}로 바뀔 때 `
    + outputs.map(output => `${output.label} ${formatCount(ymin)}–${formatCount(ymax)}${output.unit}; 현재 ${formatCount(current.x)}${input.unit}에서 ${show(current.values[output.outputId])}${output.unit}`).join(', ');
  const chart = svg('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': summary, class: 'chart'},
    svg('line', {x1: LEFT, y1: TOP, x2: LEFT, y2: H - BOTTOM, class: 'axis'}),
    svg('line', {x1: LEFT, y1: H - BOTTOM, x2: W - RIGHT, y2: H - BOTTOM, class: 'axis'}),
    svg('text', {x: LEFT - 6, y: TOP + 4, 'text-anchor': 'end', text: formatCount(ymax)}),
    svg('text', {x: LEFT - 6, y: H - BOTTOM, 'text-anchor': 'end', text: formatCount(ymin)}),
    svg('text', {x: LEFT, y: 12, 'text-anchor': 'start', text: `세로: ${unit}`}),
    svg('text', {x: LEFT, y: H - BOTTOM + 16, 'text-anchor': 'start', text: `${formatCount(low)}${input.unit}`}),
    svg('text', {x: W - RIGHT, y: H - BOTTOM + 16, 'text-anchor': 'end', text: `${formatCount(high)}${input.unit}`}),
    svg('text', {x: (LEFT + W - RIGHT) / 2, y: H - 8, 'text-anchor': 'middle', text: `가로: ${input.label} (${input.unit})`}),
    parts.flat());
  const legend = h('ul', {class: 'chart-legend'}, outputs.map((output, index) => h('li', {},
    svg('svg', {width: 40, height: 12, 'aria-hidden': 'true', focusable: 'false'}, svg('line', {x1: 1, y1: 6, x2: 39, y2: 6, 'stroke-width': 2.5, 'stroke-dasharray': DASHES[index % SERIES], style: `stroke: var(--ltt-series-${index % SERIES})`})),
    h('span', {text: `${output.label} (${output.unit})`}))));
  return h('figure', {class: 'visual', testid: `visual-${visual.visualId}`}, h('figcaption', {text: visual.caption}), chart, legend,
    h('p', {class: 'hint-line', text: previous ? '● 채운 점은 현재 입력, 점선 원은 직전 입력입니다.' : '● 채운 점은 현재 입력입니다.'}));
}

export function compositionChart({visual, outputs, shares, previousShares}) {
  const prefix = `ltt-pat-${visual.visualId}`;
  const BAR_X = 44;
  const BAR_W = W - BAR_X - 6;
  const row = (label, list, y, testidFor) => {
    let offset = 0;
    return [
      svg('text', {x: 0, y: y + 17, text: label}),
      svg('svg', {x: BAR_X, y, width: BAR_W, height: 26, overflow: 'hidden'},
        svg('rect', {x: 0, y: 0, width: '100%', height: 26, fill: 'var(--ltt-surface)', stroke: 'var(--ltt-ink)', 'stroke-width': 2}),
        list.map(({outputId, share}, index) => {
          const rect = svg('rect', {x: `${offset}%`, y: 0, width: `${share * 100}%`, height: 26, fill: `url(#${prefix}-${index % SERIES})`, stroke: 'var(--ltt-ink)', 'stroke-width': share === 0 ? 0 : 1.5, 'data-share': share, testid: testidFor(outputId)});
          offset += share * 100;
          return rect;
        })),
    ];
  };
  const legendLines = shares.map(({outputId, value, share}, index) => {
    const output = outputs.find(item => item.outputId === outputId);
    return {index, text: `${output.label}: ${formatCount(value)} ${output.unit} (${formatCount(share * 100)}%)`};
  });
  const chart = svg('svg', {viewBox: `0 0 ${W} ${previousShares ? 78 : 36}`, role: 'img', 'aria-label': `${visual.caption}. ${legendLines.map(line => line.text).join(', ')}`, class: 'chart'},
    svg('defs', {}, patternDefs(prefix)),
    row('현재', shares, 4, outputId => `composition-${visual.visualId}-${outputId}`),
    previousShares ? row('직전', previousShares, 44, outputId => `composition-previous-${visual.visualId}-${outputId}`) : null);
  const legend = h('ul', {class: 'chart-legend', testid: `composition-legend-${visual.visualId}`}, legendLines.map(line => h('li', {}, h('span', {'aria-hidden': 'true'}, swatch(prefix, line.index)), h('span', {text: line.text}))));
  return h('figure', {class: 'visual', testid: `visual-${visual.visualId}`}, h('figcaption', {text: visual.caption}), chart, legend);
}
