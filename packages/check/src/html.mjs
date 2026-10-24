import { parse } from 'parse5';

export function getAttr(node, name) {
  const attr = node.attrs.find((a) => a.name === name);
  return attr === undefined ? undefined : attr.value;
}

function hasAttr(node, name) {
  return node.attrs.some((a) => a.name === name);
}

export function scanDocument(html) {
  const doc = parse(html);
  const scripts = [];
  const charts = [];
  const quizzes = [];

  const walk = (node, quiz) => {
    let current = quiz;
    if (node.attrs) {
      if (node.tagName === 'script') {
        const src = getAttr(node, 'src');
        if (src !== undefined) scripts.push(src);
      }
      if (hasAttr(node, 'data-ltt-chart')) {
        const text = node.childNodes
          .filter((c) => c.nodeName === '#text')
          .map((c) => c.value)
          .join('');
        charts.push({
          id: getAttr(node, 'data-ltt-chart'),
          isJsonScript:
            node.tagName === 'script' && (getAttr(node, 'type') ?? '').toLowerCase() === 'application/json',
          text,
        });
      }
      if (hasAttr(node, 'data-ltt-option') && quiz) {
        quiz.options += 1;
        if (hasAttr(node, 'data-correct')) quiz.correct += 1;
      }
      if (hasAttr(node, 'data-ltt-quiz')) {
        current = {
          id: getAttr(node, 'data-ltt-quiz'),
          kind: getAttr(node, 'data-kind'),
          answer: getAttr(node, 'data-answer'),
          tol: getAttr(node, 'data-tol'),
          from: getAttr(node, 'data-from'),
          options: 0,
          correct: 0,
        };
        quizzes.push(current);
      }
    }
    for (const child of node.childNodes ?? []) walk(child, current);
  };
  walk(doc, null);
  return { scripts, charts, quizzes };
}
