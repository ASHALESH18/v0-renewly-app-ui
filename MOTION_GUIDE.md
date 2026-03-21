# Renewly Premium Motion System Guide

This document outlines the premium motion design system implemented across Renewly for cinematic, luxury interactions.

## Core Motion System (`components/motion.tsx`)

### Spring Configurations

All animations use Framer Motion springs tuned for premium, luxury feel:

- **`springs.luxury`** - Smooth, weighted (stiffness: 80, damping: 16)
- **`springs.cinematic`** - Premium, careful (stiffness: 70, damping: 18)
- **`springs.gentle`** - General purpose (stiffness: 120, damping: 14)
- **`springs.snappy`** - Quick interactions (stiffness: 300, damping: 24)
- **`springs.smooth`** - Standard transitions (stiffness: 100, damping: 20)

### Premium Variants

#### Page Transitions
- `cinematicFadeInUp` - Full-screen entrance with blur fade
- `premiumPageTransition` - Route transitions with careful easing
- `CinematicPageTransition` - Component for wrapping route content

#### Card & Content
- `luxuryStaggerItem` - Cards with blur and depth
- `premiumCardHover` - Cards with gold glow on hover
- `staggerContainer` / `staggerItem` - Cascading reveals

#### Loading States
- `SkeletonPulse` - Pulse animation for skeletons
- `PremiumSkeletonShimmer` - Gold sweep shimmer effect

### Accessibility

All motion respects `prefers-reduced-motion`. Use `useMotionPreferences()` hook to check:

```tsx
const { prefersReducedMotion, maybeVariants } = useMotionPreferences()
const variants = maybeVariants(premiumVariant, fallbackVariant)
```

## Component Libraries

### Premium Button (`components/premium-button.tsx`)

Reusable button with luxury hover states and loading animations:

```tsx
import { PremiumButton } from '@/components/premium-button'

<PremiumButton variant="primary" size="md">
  Start Free Trial
</PremiumButton>
```

Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Shimmer Skeletons (`components/shimmer-skeleton.tsx`)

Premium loading states with gold sweep animation:

```tsx
<ShimmerSkeleton height="20px" width="100%" />
<CardLoadingSkeleton />
<MetricLoadingSkeleton />
```

### Leak Report Motion (`components/leak-report-motion.tsx`)

Signature animations for the Leak Report screen:

- **`LeakScoreReveal`** - Cinematic score reveal with radial sweep
- **`InsightCardReveal`** - Cascading insight cards with luxury accents

## Implementation Guide

### Landing Page Hero

The hero uses:
- Animated text reveals with blur fade
- Breathing background glow
- Magnetic button hover states
- Parallax app preview with shimmer effect

**File:** `components/landing/hero.tsx`

### Pricing Cards

Premium card choreography with:
- Staggered reveal animations
- Family Plan signature animation (gold sweep + household emoji)
- Pro Plan rotating badge
- Hover lift with gold glow
- Animated price and feature list reveals

**File:** `components/landing/pricing.tsx`

### App Route Transitions

All app pages automatically get cinematic transitions:

```tsx
// Automatically wrapped in CinematicPageTransition
// in app/app/app-shell.tsx
```

Transitions include:
- Fade + slide + blur combination
- 400ms duration
- Smooth easing

### Dashboard & Metric Cards

Use `AnimatedCard` component for metric reveals:

```tsx
import { AnimatedCard, staggerContainer, staggerItem } from '@/components/motion'

<motion.div variants={staggerContainer} initial="initial" animate="animate">
  <AnimatedCard>Content</AnimatedCard>
</motion.div>
```

### Modals & Sheets

Bottom sheets automatically get luxury animations:

```tsx
const backdropVariants = premiumBackdropVariants // Blur + fade
const sheetVariants = luxurySlideUp // Smooth slide with blur
```

## Performance Considerations

- All animations use `transform` and `opacity` (GPU accelerated)
- No layout thrashing
- Reduced motion support prevents heavy animations
- Mobile optimized spring timings

## Best Practices

1. **Use Spring Animations** - Avoid fixed durations for natural feel
2. **Blur Fade** - Add `filter: 'blur()'` to entrance animations
3. **Stagger Items** - Use `staggerContainer` + `staggerItem` for lists
4. **Gold Accents** - Use `#C7A36A` for premium highlights
5. **Respect Motion Preferences** - Always check `prefers-reduced-motion`

## Color References

- **Gold Accent:** `#C7A36A`
- **Gold Gradient:** `#C7A36A → #D4B87A → #C7A36A`
- **Premium Shadow:** `rgba(199, 163, 106, 0.15)`

## Timing Guidelines

- **Microinteractions:** 160ms–220ms
- **Card/Section:** 260ms–420ms
- **Page Transitions:** 380ms–650ms
- **Ambient Loops:** 8s–18s

All animations feel cinematic, premium, and native—never flashy or game-like.
