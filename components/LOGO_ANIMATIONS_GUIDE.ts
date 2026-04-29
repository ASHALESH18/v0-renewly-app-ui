/**
 * RENEWLY LOGO ANIMATIONS - IMPLEMENTATION GUIDE
 * 
 * This file documents how to use the Renewly logo animations across the site.
 * All animations are optimized for performance, responsive design, and accessibility.
 */

// ============================================================================
// BASIC USAGE - Default animation
// ============================================================================

import { RenewlyLogo, RenewlyIcon } from '@/components/renewly-logo'

// Default behavior - uses 'fade-in-scale' animation
export function Header() {
  return (
    <header>
      <RenewlyLogo size="lg" />
    </header>
  )
}

// ============================================================================
// ANIMATION TYPES - Choose the animation that fits your context
// ============================================================================

// 1. FADE-IN-SCALE (Default) - Subtle entrance animation
// Best for: Headers, prominent placements
<RenewlyLogo animation="fade-in-scale" />

// 2. PULSE - Continuous gentle pulse (breathing effect)
// Best for: Hero sections, attention-grabbing areas
<RenewlyLogo animation="pulse" />

// 3. FADE-IN - Simple opacity fade
// Best for: Secondary placements, minimal animation contexts
<RenewlyLogo animation="fade-in" />

// 4. FLOAT - Subtle floating motion
// Best for: Landing page features, ambient animations
<RenewlyLogo animation="float" />

// 5. GLOW - Breathing opacity effect
// Best for: Premium sections, special emphasis
<RenewlyLogo animation="glow" />

// 6. ENTRANCE-WITH-PULSE - Combined entrance and subtle pulse
// Best for: Featured sections, prominent placements
<RenewlyLogo animation="entrance-with-pulse" />

// 7. HOVER-ONLY - Animation only on hover
// Best for: Interactive contexts where animation should be triggered by user
<RenewlyLogo animation="hover-only" />

// 8. NONE - No animation
// Best for: Contexts where animation is not desired
<RenewlyLogo animation="none" />

// ============================================================================
// COMMON SCENARIOS & RECOMMENDATIONS
// ============================================================================

// LANDING PAGE HERO
// Use pulse or float for prominent visibility without distraction
export function LandingHero() {
  return <RenewlyLogo size="2xl" animation="pulse" showWordmark />
}

// APP HEADER
// Use fade-in-scale for subtle entrance
export function AppHeader() {
  return <RenewlyLogo size="md" animation="fade-in-scale" />
}

// FAVICON/ICON PLACEMENT
// Use RenewlyIcon for compact icon-only usage
export function Favicon() {
  return <RenewlyIcon size="sm" animation="fade-in" />
}

// FOOTER
// Fade-in or no animation for secondary placement
export function Footer() {
  return <RenewlyLogo animation="fade-in" size="sm" />
}

// INTERACTIVE LINK
// Use hover-only for mouse/touch interactions
export function InteractiveBrandLink() {
  return <RenewlyLogo animation="hover-only" linkToHome />
}

// ============================================================================
// CUSTOMIZATION OPTIONS
// ============================================================================

// Size variants (responsive)
<RenewlyLogo size="sm" />     // 20px icon
<RenewlyLogo size="md" />     // 26px icon (default)
<RenewlyLogo size="lg" />     // 32px icon
<RenewlyLogo size="xl" />     // 38px icon
<RenewlyLogo size="2xl" />    // 44px icon

// Show or hide wordmark
<RenewlyLogo showWordmark={true} />   // Full logo with text
<RenewlyLogo showWordmark={false} />  // Icon only

// Theme override
<RenewlyLogo theme="light" />  // Light mode (bronze)
<RenewlyLogo theme="dark" />   // Dark mode (gold)
<RenewlyLogo theme="auto" />   // Auto-detect (default)

// Control animation
<RenewlyLogo animation="pulse" enableAnimation={true} />
<RenewlyLogo enableAnimation={false} />  // Disable all animations

// CSS Classes
<RenewlyLogo className="custom-class" />

// ============================================================================
// RESPONSIVE BEHAVIOR
// ============================================================================

// The animations automatically adjust based on:
// 1. Screen size (mobile gets lighter animations)
// 2. User's motion preferences (prefers-reduced-motion)
// 3. Device capabilities

// Mobile (< 768px):
// - Heavy animations (pulse, float) downgrade to fade-in
// - Entrance animations remain but are lighter
// - Performance optimized for mobile devices

// User with prefers-reduced-motion:
// - All animations default to simple fade-in
// - Respects user's accessibility preferences
// - Never forces animation on users who prefer reduced motion

// ============================================================================
// ANIMATION PERFORMANCE NOTES
// ============================================================================

// All animations are GPU-accelerated and optimized:
// - Use transform and opacity only (no color/size changes)
// - Respects will-change and backface-visibility for performance
// - Mobile-aware with reduced frame rates on lower-end devices
// - No blur/filter effects that impact performance
// - SSR-safe (no window-dependent code at render time)

// ============================================================================
// INTEGRATION WITH MOTION LIBRARY
// ============================================================================

// The logo animations are built on Framer Motion and use:
// - Premium easing curves (quiet, silk, luxury)
// - Harmonic timing (base, reveal, hero durations)
// - Spring-based transitions for natural feel
// - Consistent delay choreography

// All animations follow the Renewly motion language:
import { easings, durations, delays, springs } from '@/components/motion'

// Import logo animations for advanced customization:
import { 
  logoPulse, 
  logoFadeIn, 
  logoAnimationMap,
  getResponsiveLogoAnimation 
} from '@/components/logo-animations'

// ============================================================================
// TESTING & ACCESSIBILITY
// ============================================================================

// Test animations with different preferences:
// 1. Open DevTools → More tools → Rendering
// 2. Check "Emulate CSS media feature prefers-reduced-motion"
// 3. Animations should fall back to fade-in

// Test on different screen sizes:
// - Desktop: Full animations
// - Tablet: Slightly reduced
// - Mobile: Lighter animations

// Test with screen readers:
// - Animations don't interfere with navigation
// - Links remain fully accessible
// - No animation relies on JavaScript to function

// ============================================================================
// EXAMPLES
// ============================================================================

// Example 1: Landing Page with Multiple Animations
export function LandingPage() {
  return (
    <>
      {/* Hero - prominent pulse */}
      <section className="hero">
        <RenewlyLogo size="2xl" animation="pulse" />
      </section>

      {/* Features - subtle float */}
      <section className="features">
        <RenewlyIcon animation="float" />
      </section>

      {/* Header - fade-in-scale */}
      <header>
        <RenewlyLogo animation="fade-in-scale" />
      </header>

      {/* Footer - simple fade */}
      <footer>
        <RenewlyLogo size="sm" animation="fade-in" />
      </footer>
    </>
  )
}

// Example 2: App Dashboard
export function DashboardHeader() {
  return (
    <header className="flex items-center gap-4">
      {/* Icon link with fade-in-scale */}
      <RenewlyIcon animation="fade-in-scale" size="md" linkToHome />
      
      {/* User greeting or other content */}
      <div className="flex-1">
        <h1>Dashboard</h1>
      </div>
    </header>
  )
}

// Example 3: Interactive Component
export function InteractiveLogo() {
  return (
    <motion.div
      className="cursor-pointer"
      whileHover={{ scale: 1.05 }}
    >
      <RenewlyLogo animation="hover-only" size="lg" />
    </motion.div>
  )
}

// ============================================================================
// MIGRATION GUIDE - From old logo to animated logo
// ============================================================================

// OLD:
import { RenewlyLogo } from '@/components/renewly-logo'
<RenewlyLogo />

// NEW - No changes needed! Default animation is applied automatically
// To customize:
<RenewlyLogo animation="fade-in" />  // Use specific animation
<RenewlyLogo animation="none" />     // Disable animation if needed

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

// Q: Animation not showing on mobile?
// A: This is intentional - mobile uses lighter animations for performance
//    Set animation="fade-in" or animation="fade-in-scale" for consistent behavior

// Q: Animation jumpy or stuttering?
// A: Ensure Framer Motion is properly imported
//    Check for CPU-intensive tasks on the main thread
//    Use animation="none" temporarily to isolate issue

// Q: Animation conflicts with other interactions?
// A: Use animation="hover-only" for interactive elements
//    Use animation="none" if conflicts persist
//    Ensure z-index and event handlers are correct

// Q: Need to disable animations for specific user?
// A: Use enableAnimation={false} prop
//    Or use animation="none" for that instance

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

// Potential additions:
// - Custom animation presets per brand section
// - A/B testing animations for conversion optimization
// - User preference persistence (remember animation choice)
// - Advanced animations for specific contexts (loading states, etc.)
// - Color animation for special promotions or events
