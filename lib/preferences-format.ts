export function getLocaleFromLanguage(language?: string) {
  switch (language) {
    case 'hi':
      return 'hi-IN'
    case 'en':
    default:
      return 'en-IN'
  }
}

export function formatNumberForLocale(value: number, language = 'en') {
  return new Intl.NumberFormat(getLocaleFromLanguage(language), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function getCurrencySymbol(currency = 'INR', language = 'en') {
  const parts = new Intl.NumberFormat(getLocaleFromLanguage(language), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0)

  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

export function formatMoney(value: number, currency = 'INR', language = 'en') {
  return new Intl.NumberFormat(getLocaleFromLanguage(language), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}