# Footer Social Icons - Quick Reference

## TL;DR - What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Networks** | Twitter, Instagram, LinkedIn, GitHub | Instagram, X, Telegram only |
| **Icon Color** | `text-platinum` | `text-muted-gold` |
| **Button Shape** | Rounded square (9px) | Perfect circle (rounded-full) |
| **Button Size** | 9px × 9px | 40px × 40px |
| **Spacing** | 12px gap | 8px gap |
| **Hover Effect** | Basic scale 1.1 | Soft lift (-2px) + gold glow + sheen |
| **Links** | Same tab | New tab (target="_blank") |
| **URLs** | Hardcoded `#` | Environment variables |
| **Visibility** | Always shown | Conditional (only if URL configured) |

## Implementation at a Glance

### 1. Set Your URLs

```bash
# In Vercel Settings → Environment Variables:
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourhandle
NEXT_PUBLIC_X_URL=https://x.com/yourhandle
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/yourchannel
```

### 2. Deploy

Redeploy and icons automatically appear! No code changes needed.

### 3. Customize (Optional)

Edit `components/landing/footer.tsx` if you need to:
- Change button size: Update `w-10 h-10` to `w-12 h-12` etc.
- Change spacing: Update `gap-2` to `gap-3` or `gap-4`
- Change hover glow: Modify `rgba(199, 163, 106, 0.12)` brightness

## Style Specifications

### Colors
- **Icon (default)**: `text-muted-gold` (#8B7D6B)
- **Icon (hover)**: `text-gold` (#C7A36A)
- **Background**: `bg-slate/30` (dark, transparent)
- **Border**: `border-glass-border` (subtle white overlay)

### Animations
| State | Animation | Duration |
|-------|-----------|----------|
| Load | Fade in + 8px lift | 300ms (springs.gentle) |
| Hover | -2px lift + gold glow | 300ms |
| Click | Scale to 0.96 | 150ms |

### Layout
- **Button**: 40×40px circular
- **Gap**: 8px between icons
- **Container**: Flex row, left-aligned
- **Mobile**: Same layout, responsive text sizing

## Before & After Code

### Before (Broken)
```tsx
const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
]

// All buttons shown, links don't work
<div className="flex items-center gap-3">
  {socialLinks.map((social) => (
    <motion.a href={social.href}>
      <social.icon className="w-4 h-4" />
    </motion.a>
  ))}
</div>
```

### After (Premium)
```tsx
const socialLinks = [
  { icon: Instagram, href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '', label: 'Instagram' },
  { icon: Twitter, href: process.env.NEXT_PUBLIC_X_URL || '', label: 'X' },
  { icon: Send, href: process.env.NEXT_PUBLIC_TELEGRAM_URL || '', label: 'Telegram' },
].filter(social => social.href)

// Only LinkedIn & GitHub removed
// Env-driven URLs
// Luxury animations
{socialLinks.length > 0 && (
  <div className="flex items-center gap-2">
    {socialLinks.map((social) => (
      <motion.a 
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(199, 163, 106, 0.12)' }}
        whileTap={{ scale: 0.96 }}
        className="w-10 h-10 rounded-full bg-slate/30 border border-glass-border text-muted-gold hover:text-gold"
      >
        <social.icon className="w-4 h-4" />
      </motion.a>
    ))}
  </div>
)}
```

## Verification Checklist

After deployment:

- [ ] **Visibility**: All three social icons appear in footer
- [ ] **Links Work**: Click each icon → opens in new tab
- [ ] **Hover Motion**: Icons lift slightly with gold glow
- [ ] **Tap Feedback**: Clicking icon shows scale 0.96 effect
- [ ] **Accessibility**: Tab through icons, Enter to open (keyboard nav works)
- [ ] **Missing URL Test**: Remove one env var, restart → that icon disappears
- [ ] **Mobile**: Icons look good and are clickable on small screens
- [ ] **Dark Mode**: Icons visible and colors correct
- [ ] **No Console Errors**: Browser DevTools → Console has no errors
- [ ] **New Tab**: Clicking icon opens link in new tab/window

## Common Issues

| Problem | Solution |
|---------|----------|
| Icons don't appear | Check env vars in Vercel Settings (not local .env.local) |
| Icons appear but don't work | Verify URLs start with `https://` and are valid |
| Styling looks wrong | Clear cache: Ctrl+Shift+R or Cmd+Shift+R |
| Hover effect not smooth | Check browser GPU acceleration enabled |
| Icons too bright | They're correct! (muted-gold is intentionally restrained) |

## Files Changed

1. `components/landing/footer.tsx` - Main component refactor
2. `app/globals.css` - Added muted-gold color token
3. `FOOTER_SOCIAL_CONFIG.md` - Setup documentation
4. This file - Quick reference

## Get Help

See `FOOTER_SOCIAL_CONFIG.md` for:
- Detailed setup instructions
- Troubleshooting guide
- Accessibility compliance details
- URL format examples

---

**Status**: ✅ Production Ready | Ready to Deploy
