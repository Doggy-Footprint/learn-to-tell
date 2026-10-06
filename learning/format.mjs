const count = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 3});

export function formatCount(n) {
  return count.format(n === 0 ? 0 : n);
}
