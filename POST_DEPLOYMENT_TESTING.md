# Renewly - Post-Deployment Testing Guide

## Quick Status Check (5 minutes)

### Immediate Verification
1. **Deployment Status**
   - Go to Vercel Dashboard
   - Find "renewly" project
   - Check status badge shows "Ready" (green)
   - Note deployment URL (e.g., renewly-production.vercel.app)

2. **Page Load Test**
   - Open deployment URL in browser
   - Should see landing page with hero section
   - Wait for full page load (animations should render)
   - Check browser console (F12) - no errors

3. **Basic Navigation**
   - Click "Start for free" button
   - Should navigate to /app (may redirect to login)
   - Verify URL in address bar
   - No broken links or 404 errors

## Detailed Testing Protocol

### Phase 1: Frontend Verification (5-10 minutes)

#### Landing Page
```
Test: Homepage Rendering
□ Page loads without errors
□ Hero section displays correctly
□ Background animations render smoothly
□ "Own every renewal" text visible
□ App preview mockup shows
□ CTA buttons visible and interactive

Test: Navigation
□ Logo/home link clickable
□ "Start for free" button works
□ "Watch demo" button works (or gracefully fails)
□ Navigation items clickable
□ Mobile menu opens/closes

Test: Sections
□ Pricing section loads with 4 plan cards
□ Each plan shows price, features, CTA
□ Plan cards have hover effects
□ FAQ section expands/collapses
□ All sections scroll smoothly
```

#### Animation Quality
```
Check Browser Performance (F12 → Performance tab)
□ Animations are smooth (60fps if possible)
□ No stuttering during scroll
□ No animation lag on transitions
□ Mobile animations perform well
□ No dropped frames
```

#### Responsive Design
```
Test on Viewport Sizes:
□ Mobile (375px width)
  - Text readable
  - Buttons accessible
  - Layout adapts
  
□ Tablet (768px width)
  - 2-column layouts work
  - Content properly spaced
  - Images scale correctly
  
□ Desktop (1024px+)
  - 3-4 column layouts work
  - Spacing optimal
  - All features visible
```

### Phase 2: Authentication Testing (10-15 minutes)

#### Sign Up Flow
```
Test: Create New Account
1. Click "Start for free" → Navigate to /app
2. Click "Sign up" or "Create account"
3. Enter valid email (e.g., test@example.com)
4. Enter strong password
5. Click "Sign up" button
6. Check for confirmation message
7. Check email for verification link
   □ Confirmation email received
   □ Link valid and clickable
8. Click verification link
   □ Redirects to app or confirmation page
9. Login with verified email
   □ Successfully logs in
   □ Redirects to dashboard
   □ Session persists on refresh
```

#### Sign Up Error Handling
```
Test: Invalid Inputs
□ Email already exists → Error message shows
□ Weak password → Error explains requirements
□ Missing email → Form validation works
□ Missing password → Form validation works
□ Email format invalid → Error displays
```

#### Login Flow
```
Test: Existing User Login
1. Go to /app (if not logged in, redirects to login)
2. Enter email and password
3. Click "Sign in"
   □ Authentication succeeds
   □ Redirects to dashboard
   □ User data loads
4. Refresh page
   □ Still logged in
   □ Session persists
```

#### Logout Flow
```
Test: Session Management
1. Click user menu (top right)
2. Click "Logout"
   □ User session cleared
   □ Redirects to login page
   □ Cannot access /app without login
3. Try directly accessing /app
   □ Redirects to login
   □ Cannot view protected content
```

### Phase 3: Application Features Testing (15-30 minutes)

#### Dashboard Page (/app/dashboard)
```
Test: Page Load
□ Page loads successfully
□ Loading states display (if applicable)
□ User greeting shows name (if available)
□ Dashboard skeleton or real content appears

Test: Metrics Display
□ Monthly recurring amount displays
□ Shows currency symbol (₹)
□ Trend indicator shows (↑ or ↓)
□ Month-over-month comparison works

Test: Subscription List
□ Subscription cards display
□ Each shows: name, price, renewal date
□ Cards have consistent styling
□ Scroll works if many subscriptions
□ Empty state works (if no subscriptions)

Test: Filter Chips
□ "All" filter active by default
□ "Active" shows only active subs
□ "Expiring Soon" shows renewals in 30 days
□ Clicking chip updates list
□ Visual feedback on active filter
```

#### Add Subscription Feature
```
Test: Add Subscription Sheet
1. Click "+ Add Subscription" button
□ Bottom sheet slides up (mobile) or modal opens (desktop)
□ Form fields visible: name, price, category, frequency
□ Cancel button closes without saving

2. Fill form with test data
   Name: "Netflix"
   Price: "649"
   Category: "Entertainment"
   Renewal Date: Next date
   
□ Form fields accept input
□ Validation works (required fields)
□ Date picker functional

3. Click "Add"
□ Sheet closes
□ New subscription appears in list immediately
□ Displays with correct data
□ No console errors
```

#### Subscription Detail/Edit
```
Test: Edit Subscription
1. Click on subscription card
□ Detail view opens or edit sheet appears
□ All current data pre-filled

2. Edit a field (e.g., price)
□ Changes reflect immediately
□ Save button available

3. Click "Save"
□ Updates persist
□ Refresh page - changes still there
□ Correct data in database

4. Click "Delete"
□ Confirmation dialog appears
□ Cancel preserves data
□ Confirm removes subscription
□ Updates reflected in list
```

#### Leak Report Page (/app/leak-report)
```
Test: Page Load
□ Page loads successfully
□ Leak score animates on load
□ Severity indicator displays
□ Score calculation correct

Test: Insights
□ Category breakdown shows
□ Suggested savings display
□ Unused subscriptions list shows
□ Unused amounts calculated correctly

Test: Interactions
□ Click unused item → Details show
□ Action buttons responsive
□ No errors in console
□ Data accurate
```

#### Analytics Page (/app/analytics)
```
Test: Charts
□ Spending trend chart renders
□ Category pie chart displays
□ Month/Year selector works
□ Charts update when date changes

Test: Metrics
□ Current month total shows
□ Average calculation correct
□ Largest expense highlighted
□ Trend indicators display

Test: Export/Share (if available)
□ Export button downloads data
□ Share button works
□ Data format correct
```

#### Family Plan Page (/app/family-plan)
```
Test: Family Data
□ Family members display
□ Member spending shows
□ Shared subscriptions list appears
□ Individual subscriptions marked

Test: Sharing Features
□ Can add family member
□ Member receives invite
□ Family member accepts/declines
□ Member data synchronizes

Test: Permissions
□ Only owner can manage family
□ Members see read-only data (if applicable)
□ Shared subscriptions visible to all
□ No cross-family data leakage
```

#### Settings Page (/app/settings)
```
Test: Profile Settings
□ User email displays
□ Name field editable
□ Changes persist after save
□ Refresh retains changes

Test: Preferences
□ Theme toggle works (light/dark)
□ Preference saves
□ Site updates on theme change
□ Mobile theme respects system preference

Test: Session Management
□ "Sign Out" button visible
□ Click logs out
□ Redirects to login
□ Session cleared
```

### Phase 4: Error Handling & Edge Cases

#### Network Errors
```
Test: Offline Functionality
1. Open app in online state
2. Go to DevTools → Network tab → Throttling
3. Select "Offline"
4. Try to refresh page
□ Error message displays
□ App gracefully handles
□ "Retry" button available

5. Go back "Online"
□ Data reloads successfully
□ No stale data displayed
```

#### Database Errors
```
Test: Failed Database Query
1. Open DevTools → Network tab
2. Block requests to Supabase API
3. Trigger data-fetching action
□ Error message shows
□ User notified
□ No crash or blank page
□ Retry option available
```

#### Authentication Errors
```
Test: Invalid Credentials
□ Wrong password → Error message
□ Non-existent email → Error message
□ Expired session → Redirects to login
□ Invalid token → Redirects to login
```

#### Form Validation
```
Test: Required Fields
□ Submit empty form → Validation errors show
□ Required fields highlighted
□ Error messages are helpful
□ Focus moves to first error

Test: Invalid Formats
□ Invalid email → Error shows
□ Non-numeric price → Error shows
□ Future date required → Validation works
□ Field-specific validation clear
```

### Phase 5: Performance Testing

#### Core Web Vitals (Lighthouse)
```
Test: Google Lighthouse
1. DevTools → Lighthouse tab
2. Run audit for desktop
3. Record scores:
   Performance: ___/100 (target: >85)
   Accessibility: ___/100 (target: >90)
   Best Practices: ___/100 (target: >90)
   SEO: ___/100 (target: >90)

4. Run audit for mobile
3. Record scores and compare
□ Mobile scores acceptable
□ Performance regression noted
□ Optimization opportunities listed
```

#### Page Load Time
```
Test: Metrics
1. DevTools → Performance tab
2. Record page load
3. Note metrics:
   First Contentful Paint: ___ms
   Largest Contentful Paint: ___ms
   Time to Interactive: ___ms
   Total Blocking Time: ___ms

□ LCP < 2.5s (good)
□ FID < 100ms (good)
□ CLS < 0.1 (good)
□ No blocking scripts
```

#### Asset Loading
```
Test: Resource Loading
1. DevTools → Network tab
2. Full page load with throttling set to "Fast 3G"
3. Check:
□ JavaScript loaded (one bundle ideally)
□ Fonts loaded correctly
□ Images lazy-load appropriately
□ No failed requests
□ Large files identified for optimization
```

### Phase 6: Browser Compatibility

#### Desktop Browsers
```
Test Each:
□ Chrome (latest)
  - Full functionality
  - Animations smooth
  - No console errors

□ Firefox (latest)
  - Full functionality
  - Animations smooth
  - No console errors

□ Safari (latest)
  - Full functionality
  - Animations smooth
  - No console errors

□ Edge (latest)
  - Full functionality
  - Animations smooth
  - No console errors
```

#### Mobile Browsers
```
Test:
□ Chrome Mobile
  - Responsive layout works
  - Touch interactions responsive
  - No layout shifts

□ Safari Mobile (iOS)
  - Full functionality
  - Touch works smoothly
  - Viewport correct

□ Firefox Mobile
  - Full functionality
  - Performance acceptable
  - Layout correct
```

### Phase 7: Security Verification

#### HTTPS & Certificates
```
Check:
□ URL shows HTTPS (padlock icon)
□ Certificate valid (click padlock)
□ No mixed content warnings
□ No security warnings
```

#### Sensitive Data
```
Verify:
□ API keys not in frontend code
□ Database credentials not exposed
□ User passwords never logged
□ Session tokens secure (HttpOnly cookies)
□ No PII in URLs
```

#### Authentication Security
```
Test:
□ Tokens stored securely
□ CORS headers correct
□ XSS prevention in place
□ CSRF tokens present (if forms submit)
□ Rate limiting on login (if implemented)
```

## Issues Reporting Template

```markdown
## Issue Report

**Date & Time:** [When discovered]
**Severity:** [Critical/High/Medium/Low]
**Affected Feature:** [Which page/feature]
**Environment:** [Desktop/Mobile, Browser, OS]

### Description
[What is the issue?]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen?]

### Actual Behavior
[What actually happens?]

### Console Errors
```
[Paste any console errors here]
```

### Screenshots
[Attach screenshots if helpful]

### Additional Context
[Any other relevant info]
```

## Sign-Off

**Tester Name:** _________________
**Date:** _________________
**Time Started:** _________ **Ended:** _________

**Overall Status:** 
- [ ] ✅ PASS - Ready for production
- [ ] ⚠️ PASS WITH ISSUES - Document issues, plan fixes
- [ ] ❌ FAIL - Do not deploy, fix issues first

**Critical Issues Found:** ___________
**Non-Critical Issues Found:** ___________

**Recommendation:**
[ ] Deploy to production
[ ] Fix issues first, then deploy
[ ] Do not deploy - rollback planned

**Notes:**
___________________________________________________
___________________________________________________
___________________________________________________

**Sign Off:** ______________________
