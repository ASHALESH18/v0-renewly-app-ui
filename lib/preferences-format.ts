import type { ExchangeRates } from '@/lib/currency'
import {
  FALLBACK_INR_RATES,
  convertCurrency,
  formatConvertedMoney,
  formatCurrencyAmount,
  formatSubscriptionAmount,
  getCurrencySymbol as getSymbol,
  getLocaleForCurrency,
  normalizeCurrencyCode,
} from '@/lib/currency'
import type { Subscription } from '@/lib/types'

export function getLocaleFromLanguage(language?: string) {
  switch (language) {
    case 'hi':
      return 'hi-IN'
    case 'fr':
      return 'fr-FR'
    case 'es':
      return 'es-ES'
    case 'en':
    default:
      return 'en-US'
  }
}

export function formatNumberForLocale(value: number, language = 'en') {
  return new Intl.NumberFormat(getLocaleFromLanguage(language), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function getCurrencySymbol(currency = 'INR', language = 'en') {
  return getSymbol(currency)
}

export function formatMoney(value: number, currency = 'INR', language = 'en') {
  return formatCurrencyAmount(value, currency, language)
}

export function formatMoneyFromCurrency(
  value: number,
  fromCurrency = 'INR',
  toCurrency = 'INR',
  language = 'en',
  rates: ExchangeRates = FALLBACK_INR_RATES
) {
  return formatConvertedMoney(value, fromCurrency, toCurrency, language, rates)
}

export function convertMoney(
  value: number,
  fromCurrency = 'INR',
  toCurrency = 'INR',
  rates: ExchangeRates = FALLBACK_INR_RATES
) {
  return convertCurrency(value, fromCurrency, toCurrency, rates)
}

export function formatSubscriptionMoney(
  subscription: Pick<Subscription, 'amount' | 'currency'>,
  displayCurrency = 'INR',
  language = 'en',
  rates: ExchangeRates = FALLBACK_INR_RATES
) {
  return formatSubscriptionAmount(subscription, displayCurrency, language, rates)
}

export { FALLBACK_INR_RATES, getLocaleForCurrency, normalizeCurrencyCode }
export type { ExchangeRates }
