export function currencySymbol(currency?: string): string {
  return currency === 'INR' ? '₹' : '$'
}

export function formatMoney(amount: number, currency?: string): string {
  const symbol = currencySymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}
