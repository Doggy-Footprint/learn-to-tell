export function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'testid') element.setAttribute('data-testid', value);
    else if (key === 'text') element.textContent = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value === true ? '' : value);
  }
  element.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
  return element;
}

export function replaceChildren(container, node) {
  container.replaceChildren(...(node ? [node] : []));
}
