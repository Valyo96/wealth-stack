export function formatMoney(value: string, currency = "USD"): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(n);
}
