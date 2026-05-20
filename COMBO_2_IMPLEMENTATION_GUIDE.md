# Combo 2: Renewly Account, Region/Currency, Avatar, Settings, and Premium UI Polish

**Status**: Foundation committed (lib/renewly-pricing.ts). Ready for screen-by-screen implementation.

## Summary

Combo 2 is a controlled polish and stabilization batch focused on consistent currency display, avatar resolution, account settings copy, and premium theming. It preserves all working Family, Dashboard, Calendar, Notifications, and Razorpay logic.

## Part A: Centralized Renewly Plan Pricing Resolver (COMMITTED)

**File**: `lib/renewly-pricing.ts` (206 lines)

Single source of truth for Renewly Pro/Family/Extra pricing with currency handling.

### Pricing Structure
- Renewly Pro: ₹149/month (INR) | $4.99/month (USD)
- Renewly Family: ₹299/month (INR) | $8.99/month (USD)
- Extra member: ₹99/month (INR) | $1.49/month (USD)

### Key Functions
- `getRenewlyPlanPrice(plan, currency)` — Base price
- `getExtraMemberPrice(currency)` — Extra price
- `getRenewlyFamilyTotal({...})` — Total with extras (max 4 clamped)
- `formatRenewlyPlanPrice/formatExtraMemberPrice/formatRenewlyFamilyTotal()` — Display formatting
- `getUserCurrencyPreference({...})` — Currency resolution
- `isManagedRenewlyPlan(subscription)` — Detect managed rows
- `getFamilyMemberStatusCopy/getRenewlyPlanCopy()` — Copy helpers

### Currency Resolution Priority
1. User profile currency
2. Active subscription currency
3. Locale hint (en-IN → INR, de/fr/es → EUR, → USD)
4. Fallback: INR (QA)

**No mixed currencies per screen.**

## Part B: Existing Infrastructure Verified

- **Avatar**: `lib/profile/avatar-source.ts` — Priority: custom > Google > Apple > generated > initials. Deterministic, stable.
- **Currency**: `lib/currency.ts` — 9 currencies, exchange rates, formatting. Already comprehensive.
- **Pricing Display**: `lib/pricing-display.ts` — Paywall integration with plans.ts.

## Part C: Implementation Tasks

### C.1: Email Verification Banner
- Show non-intrusive banner for unverified emails
- CTA: "Send verification link" + "Remind me later"
- Hide for verified users
- Support email: contact@renewly.in

### C.2: Settings Copy Polish
- Free: "Start your plan"
- Pro: Use `formatRenewlyPlanPrice('pro', currency)` for display
- Family Owner: Base + add-ons breakdown (use `getRenewlyFamilyTotal()`)
- Family Member: "Renewly Family Member / Covered by Family / ₹0/month"
- Family Member CTA: "Start your own plan" (premium gold button)
- Removed: "Family Access Ended / Start your plan"

### C.3: Avatar Consistency Audit
- Homepage, Dashboard, Settings, Sidebar, Mobile: Use `getStableProfileAvatar()`
- Same avatar everywhere for same user
- Verify all components use this function

### C.4: Currency Display Across Screens
- **Upgrade page**: `formatRenewlyPlanPrice()` for Pro/Family
- **Dashboard**: `formatRenewlyFamilyTotal()` for Renewly managed card
- **Calendar**: Renewly renewal display with currency
- **Family page**: Extra-seat price display
- **Notifications**: Billing amounts with currency
- **Settings**: All plan prices with currency

### C.5: Theme Polish (Glass/Dark/Light)
- Buttons: Apple-style glass (translucent, blur, soft border)
- CTA: Pearl/gold accent, premium hover/focus
- Destructive: Glass-red, not harsh
- Apply to: Settings, Plan & Billing, Family, Notifications, Upgrade, "Start your plan/own plan"

### C.6: Session/Account Consistency
- On app load: Verify profile email matches Supabase session email
- If mismatch: Clear stale state, refetch
- Handle account switching in multiple tabs gracefully

### C.7: Loading & Skeleton States
- Family page: Smooth loading, no broken state flashes
- Plan & Billing: Skeleton for add-on breakdown
- Dashboard: No layout jump after billing loads
- Notifications: Clean loading state

## Part D: Guardrails (Do NOT Touch)

- Family capacity rules (owner + 4 included + up to 4 extra)
- Extra-seat lifecycle processor
- Period-end processor
- Core subscription sync
- Notification architecture
- Razorpay production flow
- Auth/middleware broadly
- Conditional React hooks

## Part E: QA Checklist (13 items)

1. Free: "Start your plan" CTA works
2. Pro: Correct currency billing display
3. Family owner: Plan & Billing breakdown correct
4. Family member: "Covered by Family" visible, "Start your own plan" button visible
5. Removed: "Family Access Ended", "Start your plan", locked features
6. Avatar: Same across homepage/dashboard/settings/sidebar
7. Email verification: Unverified see banner, verified do not
8. Currency: INR users see ₹, USD users see $, no mixed
9. Themes: Dark/Light/Glass buttons look premium
10. Notifications: `/api/notifications` returns 200, not broken
11. Family regression: Owner blocking, Pro allowed, max 4 extra, no +5/₹794
12. Session: Account switching works, no stale state
13. Loading: Smooth transitions, no wrong state flashes

## Files Modified

**Created**:
- `lib/renewly-pricing.ts` ✓ (committed)

**To Modify**:
- `components/screens/settings.tsx` — Copy, currency display
- `components/screens/family-members.tsx` — Copy, button styling
- `app/app/dashboard/page.tsx` — Renewly card currency
- `app/app/calendar/page.tsx` — Renewly renewal display
- `app/app/upgrade/page.tsx` — Currency-aware pricing
- Avatar components (header, sidebar, profile, settings)
- Auth provider — Session consistency check

**New** (if needed):
- `components/email-verification-banner.tsx`

## Implementation Notes

- No breaking changes to API responses
- No changes to Family lifecycle (F7.3), extra-seat processing, Razorpay
- Currency defaults to INR for QA
- Avatar generation is deterministic (same user = same avatar)
- Managed Renewly rows not editable by normal subscription UI
- Themes preserve premium Renewly brand feel
- Use existing single-flight deduping from Combo 5 if available
