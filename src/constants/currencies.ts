export type CurrencyCode = 'USD' | 'INR' | 'LKR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee' },
];

export const DEFAULT_CURRENCY_CODE: CurrencyCode = 'USD';

export const isSupportedCurrencyCode = (value?: string | null): value is CurrencyCode => {
  return currencies.some(function (c) {
    return c.code === value;
  });
};

export const getCurrencyByCode = (value?: string | null): Currency => {
  const found = currencies.find(function (c) {
    return c.code === value;
  });

  if (found) {
    return found;
  }

  return currencies.find(function (c) {
    return c.code === DEFAULT_CURRENCY_CODE;
  }) as Currency;
};