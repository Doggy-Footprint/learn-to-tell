const count = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 3});

export function formatCount(n) {
  return count.format(n === 0 ? 0 : n);
}

export function formatRatio(r) {
  if (r === null) return '정의되지 않음(양성 0)';
  return `${(r * 100).toFixed(2)}%`;
}
