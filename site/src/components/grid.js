const SIDE = 100;
const SERIES = [
  ['true-positive', 'truePositive', 'TP', '#0b3d91', 'solid'],
  ['false-positive', 'falsePositive', 'FP', '#8a3b00', 'stripes'],
  ['false-negative', 'falseNegative', 'FN', '#5b2a86', 'cross'],
  ['true-negative', 'trueNegative', 'TN', '#d9dee7', 'dots'],
];

// The HTML parser assigns the SVG namespace, so no namespace URL string ships in the bundle.
function svg(tag, attrs = {}, ...children) {
  const template = document.createElement('template');
  template.innerHTML = `<svg><${tag}></${tag}></svg>`;
  const element = template.content.firstChild.firstChild;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  element.append(...children);
  return element;
}

function patternFor(id, color, kind) {
  const base = svg('rect', {width: 4, height: 4, fill: kind === 'solid' ? color : '#ffffff'});
  const marks = {
    solid: [],
    stripes: [svg('path', {d: 'M-1 1 L1 -1 M0 4 L4 0 M3 5 L5 3', stroke: color, 'stroke-width': 1.4})],
    cross: [svg('path', {d: 'M0 0 L4 4 M4 0 L0 4', stroke: color, 'stroke-width': 0.9})],
    dots: [svg('circle', {cx: 2, cy: 2, r: 0.9, fill: '#3b4658'})],
  };
  return svg('pattern', {id, width: 4, height: 4, patternUnits: 'userSpaceOnUse'}, base, ...marks[kind]);
}

function rectsFor(start, end) {
  if (end <= start) return '';
  const first = Math.floor(start / SIDE);
  const last = Math.floor((end - 1) / SIDE);
  const piece = (x, y, w, rows) => `M${x} ${y}h${w}v${rows}h${-w}z`;
  if (first === last) return piece(start % SIDE, first, end - start, 1);
  let d = piece(start % SIDE, first, SIDE - (start % SIDE), 1);
  if (last > first + 1) d += piece(0, first + 1, SIDE, last - first - 1);
  return d + piece(0, last, ((end - 1) % SIDE) + 1, 1);
}

export function createGrid() {
  const paths = SERIES.map(([name, , , color, kind]) => svg('path', {'data-series': name, fill: `url(#grid-pattern-${name})`, stroke: kind === 'dots' ? '#3b4658' : color, 'stroke-width': 0.15}));
  const root = svg('svg', {viewBox: `0 0 ${SIDE} ${SIDE}`, width: 320, height: 320, role: 'img', 'shape-rendering': 'crispEdges', class: 'grid-svg'},
    svg('defs', {}, ...SERIES.map(([name, , , color, kind]) => patternFor(`grid-pattern-${name}`, color, kind))),
    svg('rect', {width: SIDE, height: SIDE, fill: '#ffffff'}), ...paths);
  root.setAttribute('data-testid', 'output-grid');

  const legend = document.createElement('ul');
  legend.className = 'grid-legend';
  const labels = SERIES.map(([name, , , color, kind]) => {
    const item = document.createElement('li');
    const swatch = svg('svg', {width: 18, height: 18, viewBox: '0 0 4 4', 'aria-hidden': 'true', class: 'swatch'}, svg('rect', {width: 4, height: 4, fill: `url(#grid-pattern-${name})`, stroke: kind === 'dots' ? '#3b4658' : color, 'stroke-width': 0.3}));
    const text = document.createElement('span');
    item.append(swatch, text);
    legend.append(item);
    return [text];
  });

  function update(values, formatCount, labelOf) {
    let cursor = 0;
    SERIES.forEach(([name, field], index) => {
      const next = index === SERIES.length - 1 ? values.sampleSize : Math.min(values.sampleSize, Math.round(SERIES.slice(0, index + 1).reduce((sum, [, key]) => sum + values[key], 0)));
      paths[index].setAttribute('d', rectsFor(cursor, next));
      paths[index].setAttribute('data-cells', String(next - cursor));
      cursor = next;
      root.setAttribute(`data-${name}`, String(values[field]));
      labels[index][0].textContent = `${labelOf(field)}: ${formatCount(values[field])}`;
    });
    root.setAttribute('aria-label', `10,000칸 격자. ${SERIES.map(([, field, symbol]) => `${symbol} ${formatCount(values[field])}`).join(', ')}. 같은 값은 출력 표에 있습니다.`);
  }

  return {root, legend, update};
}
