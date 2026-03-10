export function formatCost(n: number) {
  if (n < 0) {
    return `+$${(-n / 100).toFixed(2)}`;
  } else {
    return `$${(n / 100).toFixed(2)}`;
  }
}
