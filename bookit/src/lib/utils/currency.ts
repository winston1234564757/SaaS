const fmt = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'UAH',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return fmt.format(amount);
}

export function formatPrice(price: number, priceMax?: number | null): string {
  if (priceMax && priceMax > price) {
    return `від ${formatCurrency(price)}`;
  }
  return formatCurrency(price);
}
