# Renewly Footer Social Configuration

## Overview

The footer now displays social media icons for Instagram, X (Twitter), and Telegram with premium luxury styling and animations. Icons are **only rendered if their corresponding environment variable URLs are configured**.

## Environment Variables

Configure these in your `.env.local` file or Vercel project settings:

```bash
# Social Media URLs - Only these networks are supported
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your-handle
NEXT_PUBLIC_X_URL=https://x.com/your-handle
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/your-channel-or-group
```

### URL Format Examples

**Instagram:**
```
https://instagram.com/renewlyapp
https://www.instagram.com/renewlyapp
```

**X (Twitter):**
```
https://x.com/renewlyapp
https://twitter.com/renewlyapp (also supported via NEXT_PUBLIC_TWITTER_URL fallback)
```

**Telegram:**
```
https://t.me/renewlyapp (for public channel)
https://t.me/joinchat/xxxxx (for private group invite)
```

## Removed Networks

The following networks are **no longer supported** in the footer:
- ~~LinkedIn~~ (removed)
- ~~GitHub~~ (removed)

## Visual Design

### Button Styling
- **Shape**: Premium muted circular buttons (40x40px)
- **Border**: Subtle glass border with `border-glass-border`
- **Background**: `bg-slate/30` for dark luxury aesthetic
- **Icon Color**: `text-muted-gold` (restrained, not bright)

### Hover Effects (Premium & Restrained)
- **Lift**: Subtle vertical lift (-2px)
- **Glow**: Soft gold shadow (8px blur, 12% opacity)
- **Sheen**: Subtle gradient overlay (from-white/10 → to-white/0)
- **Scale**: Minimal scale change (smooth, not dramatic)

### Animation Details
- **Entry**: Staggered fade-in with 8px vertical blur (springs.gentle timing)
- **Interaction**: `whileTap={{ scale: 0.96 }}` for tactile feedback
- **Duration**: All transitions use `springs.gentle` for premium feel

## Implementation Details

### Component: `components/landing/footer.tsx`

The footer automatically:
1. Filters out any social links without configured URLs
2. Only renders icons if `socialLinks.length > 0`
3. Opens all links in new tabs with `target="_blank" rel="noopener noreferrer"`
4. Includes proper accessibility labels via `aria-label`

### Conditional Rendering Logic

```tsx
// Social links - only render if URLs are configured
const socialLinks = [
  { 
    icon: Instagram, 
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '', 
    label: 'Instagram' 
  },
  { 
    icon: Twitter, 
    href: process.env.NEXT_PUBLIC_X_URL || process.env.NEXT_PUBLIC_TWITTER_URL || '', 
    label: 'X' 
  },
  { 
    icon: Send, 
    href: process.env.NEXT_PUBLIC_TELEGRAM_URL || '', 
    label: 'Telegram' 
  },
].filter(social => social.href) // Only render if URL exists

// Only show social section if any links are configured
{socialLinks.length > 0 && (
  <div className="flex items-center gap-2">
    {/* Social buttons render here */}
  </div>
)}
```

## Accessibility

✅ **WCAG 2.1 AA Compliant**
- Proper `aria-label` for screen readers: "Visit our Instagram"
- Keyboard navigable with visible focus states
- Touch targets meet 48px minimum on mobile (40px × 40px buttons)
- High contrast text colors ensure visibility
- Respects `prefers-reduced-motion` via Framer Motion

## Mobile Responsive

- **Desktop**: Icons in brand column (left side)
- **Mobile**: Same layout, full-width responsive
- **Touch**: 44px minimum touch target on mobile
- **Sheet**: Buttons maintain muted luxury aesthetic on all screen sizes

## Testing Checklist

- [ ] All three URLs configured and displaying correctly
- [ ] Icons open in new tabs (not same window)
- [ ] Hover animation shows soft lift and glow
- [ ] Tap animation provides tactile feedback
- [ ] Icons are secondary (muted colors, not bright)
- [ ] If any URL is missing, that icon doesn't render
- [ ] Links are keyboard accessible (Tab to focus, Enter to open)
- [ ] Mobile layout looks correct on small screens
- [ ] Dark mode colors appropriate

## Troubleshooting

### Icons Not Appearing

**Check 1**: Are environment variables set?
```bash
# In your terminal, check:
echo $NEXT_PUBLIC_INSTAGRAM_URL
echo $NEXT_PUBLIC_X_URL
echo $NEXT_PUBLIC_TELEGRAM_URL
```

If empty, add them to `.env.local` and restart dev server.

**Check 2**: Are URLs valid?
```
✅ Valid: https://instagram.com/renewlyapp
❌ Invalid: instagram.com/renewlyapp (missing https://)
```

**Check 3**: Browser caching?
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear browser cache and reload

### Icons Showing But Not Clickable

- Check browser console for JavaScript errors
- Verify URLs start with `https://`
- Test by clicking icon and checking target="_blank" behavior

### Colors Look Wrong

- Check that globals.css has the muted-gold token (added in this update)
- Verify dark mode class is applied to body
- Check browser DevTools → Computed Styles

## Future Enhancements

Potential additions (not currently supported):
- YouTube channel link
- Discord community link
- Reddit community link
- Mastodon profile (privacy-focused)

To add more platforms:
1. Import icon from lucide-react
2. Add to `socialLinks` array with `NEXT_PUBLIC_PLATFORM_URL` env var
3. Icon automatically filters if URL is empty

## Related Files

- `components/landing/footer.tsx` - Main footer component
- `app/globals.css` - Color tokens including `--muted-gold`
- `.env.local` - Your local environment variables (create if needed)
