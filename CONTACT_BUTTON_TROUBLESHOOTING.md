# Contact Support Button - Troubleshooting & Fix Guide

## Root Cause Analysis

The "Contact Support" button in `components/landing/faq.tsx` is **non-functional** due to:

### Primary Issue: Missing onClick Handler
```tsx
// BROKEN - Button has NO onClick handler
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="px-6 py-3 rounded-xl border border-gold/30 text-gold font-medium hover:bg-gold/10 transition-colors"
>
  Contact support
</motion.button>
```

The button has animations and styling but **no onClick callback**, so clicking does nothing.

---

## Comprehensive Troubleshooting Checklist

### 1. Event Handler Issues
- **Missing onClick**: Button lacks `onClick` handler ❌
- **No navigation logic**: No Link wrapper or `useRouter` hook ❌
- **Handler not wired**: Even if handler exists, it's not connected to button ❌
- **Event propagation**: Event might be stopped by parent (low likelihood with current structure)

### 2. Button Configuration Issues
- **Button type**: Should be `type="button"` to prevent form submission ✓ (implicit)
- **Disabled state**: No `disabled` attribute present ✓ (good)
- **Accessibility**: Missing `aria-label` for screen readers ❌
- **CSS class conflicts**: No conflicting `pointer-events-none` classes ✓ (good)

### 3. JavaScript/React Issues
- **Module not loading**: `faq.tsx` is properly imported in landing page ✓
- **Framer Motion interference**: Motion library doesn't block clicks ✓
- **Browser console errors**: Check DevTools → Console tab for JavaScript errors
- **React hydration mismatch**: Unlikely, component is `'use client'` ✓

### 4. Navigation Architecture
- **No routing implementation**: Component doesn't use Next.js Link or useRouter ❌
- **Contact page exists**: `/contact` page is fully implemented ✓
- **URL path correct**: Should navigate to `/contact` ✓

### 5. Bundle & Script Loading
- **Lucide icons loaded**: Icon libraries working (ChevronDown renders) ✓
- **Motion library loaded**: Framer Motion animations work ✓
- **Client component hydration**: Component is marked `'use client'` ✓

---

## Solutions Provided

### Solution 1: Add Navigation Handler (RECOMMENDED)
**File**: `components/landing/faq.tsx`

```tsx
import { useRouter } from 'next/navigation'

export function FAQ() {
  const router = useRouter()
  
  const handleContactSupport = () => {
    router.push('/contact')
  }
  
  return (
    // ...
    <motion.button
      onClick={handleContactSupport}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-6 py-3 rounded-xl border border-gold/30 text-gold font-medium hover:bg-gold/10 transition-colors cursor-pointer"
      type="button"
      aria-label="Go to contact support page"
    >
      Contact support
    </motion.button>
    // ...
  )
}
```

### Solution 2: Link Wrapper Approach (ALTERNATIVE)
```tsx
import Link from 'next/link'

<Link href="/contact">
  <motion.button
    as="button"
    type="button"
    className="px-6 py-3 rounded-xl border border-gold/30 text-gold font-medium hover:bg-gold/10 transition-colors cursor-pointer"
    aria-label="Go to contact support page"
  >
    Contact support
  </motion.button>
</Link>
```

### Solution 3: Email Fallback (if no contact page)
```tsx
const handleContactSupport = () => {
  window.location.href = 'mailto:support@renewly.app'
}
```

---

## Testing Procedures

### Step 1: Browser Console Check
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Check for any JavaScript errors (red text)
4. Common errors to look for:
   - `Cannot read property 'push' of undefined` → Router not imported
   - `motion.button is not a function` → Framer Motion issue
   - `Contact is not defined` → Component import issue

### Step 2: Click Behavior Testing
1. Click the "Contact support" button
2. Should navigate to `/contact` page
3. If nothing happens:
   - Check console for errors
   - Verify button has proper `onClick` handler in DevTools Inspector
   - Check Network tab to see if page is loading

### Step 3: Accessibility Verification
1. Open DevTools → Accessibility Inspector
2. Select button element
3. Verify `aria-label` or accessible name exists
4. Test keyboard navigation (Tab key should focus button)
5. Test Enter/Space keys should activate button

### Step 4: Mobile Testing
1. Test on mobile device or responsive mode (DevTools)
2. Button should remain clickable with touch
3. Hover effects gracefully degrade on mobile

### Step 5: Network Check
1. DevTools → Network tab
2. Click button
3. Should see navigation request
4. Status should be 200 (successful)

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot read property 'push' of undefined` | `useRouter` not imported | Add `import { useRouter } from 'next/navigation'` |
| `Router is not defined` | Using wrong router import | Use `'next/navigation'` not `'next/router'` |
| `Contact support is not defined` | Missing component export | Check faq.tsx exports |
| Button doesn't respond to clicks | Missing `onClick` handler | Add `onClick={handleContactSupport}` |
| Page loads but button still broken | Stale cache | Hard refresh (Ctrl+Shift+R) |
| `pointer-events: none` in console | CSS blocking clicks | Check parent elements for `pointer-events-none` |

---

## Verification Checklist After Fix

- [ ] Button has `onClick` handler connected
- [ ] Handler navigates to `/contact` page
- [ ] Console shows no errors when clicking
- [ ] Button is visible and properly styled
- [ ] Hover animation works (scale 1.02)
- [ ] Tap animation works (scale 0.98)
- [ ] Mobile click works without desktop hover
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] `aria-label` provides accessibility context
- [ ] Page loads correctly after navigation

---

## Performance Considerations

- Using `useRouter` is more performant than `<Link>` for simple navigation
- Navigation should be instant (~100ms response time)
- No unnecessary re-renders triggered by click
- Motion animations don't block interaction

---

## Future Enhancements

1. **Add loading state**: Show spinner during navigation
2. **Analytics tracking**: Log when users click Contact Support
3. **Email fallback**: For users who can't navigate (offline)
4. **Success toast**: Confirm navigation with toast notification
5. **Form prefill**: Pass query params to contact page

---

## Deployment Notes

- This fix requires no database changes
- No new environment variables needed
- Backward compatible with existing styles
- No external dependencies added
- Ready for immediate deployment
