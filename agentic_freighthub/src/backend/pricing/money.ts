// Money utility for precise financial calculations without floating point errors
// Transported as string over API per specification

export function toMoneyString(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return "0.0000";
  return num.toFixed(4);
}

export function parseMoney(val: string | number): number {
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

export function addMoney(a: string | number, b: string | number): string {
  return toMoneyString(parseMoney(a) + parseMoney(b));
}

export function multiplyMoney(a: string | number, factor: number): string {
  return toMoneyString(parseMoney(a) * factor);
}

export function roundCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return Math.round(amount).toFixed(4);
  }
  return amount.toFixed(4);
}
