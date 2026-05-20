# Combo 2A: Renewly Region/Currency Localization - Implementation Guide

## Overview

Combo 2A centralizes Renewly plan pricing with region-aware currency display:
- **Indian users** see INR: ₹149 (Pro), ₹299 (Family), ₹99 (extra member)
- **Non-Indian users** see USD: $4.99 (Pro), $8.99 (Family), $1.49 (extra member)

**Foundation**: `lib/renewly-pricing.ts` (committed) with pricing constants, currency resolution, and formatting helpers.

## Currency Resolution Priority

1. **Subscription currency** - If displaying existing subscription, use its currency
2. **Profile currency** - User's explicit currency preference
3. **Server country header** - Vercel's x-vercel-ip-country context (most accurate)
4. **Browser locale** - Client-side locale/timezone detection
5. **Safe fallback** - INR for India, USD otherwise

**QA Override** (localhost/preview only): `localStorage.renewly_currency_override = "INR"` or `"USD"`

## Implementation Checklist

### Core Files Already Committed
- [x] `lib/renewly-pricing.ts` - Single source of truth

### Components to Update (Use in Order)

#### 1. **Upgrade Screen** - `/app/app/upgrade/page.tsx`
```typescript
import { getEffectiveRenewlyCurrency, getRenewlyPlanPrice, formatRenewlyMonthly } from '@/lib/renewly-pricing'

// Where pricing displayed:
const currency = getEffectiveRenewlyCurrency({
  subscriptionCurrency: currentSub?.currency,
  profileCurrency: profile?.currency_code,
  countryCode: profile?.country_code,
  locale: navigator.language,
})

// Replace hardcoded ₹149 with:
const proPrice = getRenewlyPlanPrice('pro', currency)
const display = formatRenewlyMonthly(proPrice, currency) // "₹149/month" or "$4.99/month"
```

#### 2. **Dashboard** - `/components/screens/dashboard.tsx`
- Update Renewly managed subscription card billing display
- Use `calculateFamilyTotal(1, extraSeats, currency)` for Family totals
- Replace hardcoded ₹299 + extras breakdown

#### 3. **Family Page** - `/components/screens/family-members.tsx`
- Extra-seat purchase popup pricing
- Replace hardcoded ₹99 with `getExtraSeatPrice(currency)`
- Update Family total display with `formatFamilyTotal(extraSeats, currency)`

#### 4. **Settings** - `/components/screens/settings.tsx`
- Plan & Billing modal pricing display
- Family owner sees: "₹299 base + ₹99 × 2 = ₹497/month"
- Use `formatFamilyTotal(extraSeats, currency, 'full')`

#### 5. **Calendar** - `/app/app/calendar/page.tsx`
- Renewal amount display for Renewly Family
- Use `formatRenewlyMonthly(totalAmount, currency)`

#### 6. **Extra-Seat Checkout** - `/app/api/family/extra-seat/intent/route.ts`
- Payment intent amount calculation
- Use `getExtraSeatPrice(currency)` for checkout amount
- Store currency in payment metadata

#### 7. **Notifications** - If displaying pricing amounts
- Use `formatRenewlyMonthly()` for notification copy
- "Extra seat purchased: ₹99/month" vs "$1.49/month"

#### 8. **Homepage Pricing Block** - `/components/landing/pricing.tsx` (if present)
- Update any hardcoded Renewly plan prices
- Use `getPricingForPaywall()` which already supports INR/USD

### Type-Safe Integration

```typescript
// Always import and use these types
import type { RenewlyCurrency } from '@/lib/renewly-pricing'
import { 
  getEffectiveRenewlyCurrency,
  getRenewlyPlanPrice,
  formatRenewlyMonthly,
  calculateFamilyTotal,
  formatFamilyTotal,
  getExtraSeatPrice,
} from '@/lib/renewly-pricing'

// Examples:
const currency: RenewlyCurrency = getEffectiveRenewlyCurrency({...})
const price: number = getRenewlyPlanPrice('pro', currency)
const display: string = formatRenewlyMonthly(price, currency)
const familyTotal: number = calculateFamilyTotal(1, 2, currency)
const familyDisplay: string = formatFamilyTotal(2, currency, 'full')
```

## Safety Checklist

- [ ] All amounts formatted via `formatRenewlyMoney()` (null-safe)
- [ ] Currency resolved via `getEffectiveRenewlyCurrency()` (never undefined)
- [ ] Extra seats clamped to max 4 per F7.4-S (automatic in helpers)
- [ ] Existing subscriptions keep their currency (no conversion)
- [ ] New managed rows use resolved currency
- [ ] QA override only affects localhost/preview
- [ ] No database mutations (display only)
- [ ] No changes to Family lifecycle
- [ ] No changes to auth/middleware
- [ ] No changes to Razorpay flow

## QA Testing

### INR User Flow
1. Create/login as India-based user
2. Check dashboard billing: should show ₹
3. Check upgrade screen: should show ₹149 Pro, ₹299 Family
4. Check family page: should show ₹99 per extra seat
5. Check settings: should show ₹ throughout

### USD User Flow
1. Create/login as non-India user
2. Check dashboard billing: should show $
3. Check upgrade screen: should show $4.99 Pro, $8.99 Family
4. Check family page: should show $1.49 per extra seat
5. Check settings: should show $ throughout

### QA Override Flow (localhost)
1. Open dev console on localhost
2. Run: `localStorage.setItem('renewly_currency_override', 'USD')`
3. Refresh page
4. All pricing should show USD
5. Run: `localStorage.removeItem('renewly_currency_override')`
6. Refresh page
7. Should return to resolved currency

### Mixed Currency (ensure NOT present)
- [ ] No screen shows both ₹ and $ together
- [ ] Pro always same currency as Family
- [ ] Extra seat always same currency as Family base
- [ ] All billing amounts consistent

## Known Limitations (Out of Scope)

- **Do NOT** convert existing subscription amounts (keep original currency)
- **Do NOT** change Family capacity rules (still 4 included + max 4 extra)
- **Do NOT** create duplicate managed subscription rows
- **Do NOT** alter Family lifecycle processor
- **Do NOT** change invite eligibility rules
- **Do NOT** modify notification service
- **Do NOT** change auth/middleware
- **Do NOT** apply QA override to production domains

## After Implementation

Run acceptance checks:
- [ ] `/app/dashboard` loads with correct currency
- [ ] `/app/family` loads with correct currency
- [ ] `/app/settings` Plan & Billing modal shows correct currency
- [ ] `/app/upgrade` shows correct pricing
- [ ] `/app/calendar` shows correct renewal amounts
- [ ] `/api/notifications` still returns 200
- [ ] INR user sees ₹ consistently
- [ ] USD user sees $ consistently
- [ ] Preview override to USD changes display without breaking state
- [ ] Extra-seat checkout shows correct amount
- [ ] No duplicate Renewly Family managed cards created
- [ ] Build passes: `npm run build && npm run lint`

## Related Documentation

- `lib/renewly-pricing.ts` - Implementation file (222 lines, all helpers)
- `lib/currency.ts` - Currency utilities (existing)
- `lib/pricing-display.ts` - Paywall pricing (existing)
- `lib/plans.ts` - Plan definitions (existing)
- Plan file: `v0_plans/combo-1-f7-3-family-billing-lifecycle.md`

## Support

For issues:
1. Check `lib/renewly-pricing.ts` for available helpers
2. Verify currency resolved correctly via `getEffectiveRenewlyCurrency()`
3. Ensure null-safety on all amount displays
4. Test QA override on localhost before deployment
