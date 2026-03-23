# Demo Modal - Visual & Technical Reference

## Component Hierarchy

```
Hero
├── State Management
│   └── isDemoOpen: boolean
│
├── Event Handlers
│   └── onClick: () => setIsDemoOpen(true)
│
└── Child: DemoModal
    ├── Props
    │   ├── isOpen: boolean
    │   ├── onClose: () => void
    │   ├── videoUrl?: string
    │   ├── title?: string
    │   └── subtitle?: string
    │
    ├── State
    │   ├── isVideoReady: boolean
    │   └── hasPlayedVideo: boolean
    │
    ├── Effects
    │   ├── Reset state when modal closes
    │   └── ESC key listener
    │
    └── Render
        ├── AnimatePresence
        │   ├── Backdrop (premiumBackdropVariants)
        │   └── Modal
        │       ├── Header
        │       │   ├── Close Button (X icon)
        │       │   └── Positioning (top-right, z-10)
        │       │
        │       ├── Video Area
        │       │   ├── Poster State
        │       │   │   ├── Radial glow (animated)
        │       │   │   ├── Play button (gold, 20px)
        │       │   │   └── "Click to play" text
        │       │   │
        │       │   ├── Video State
        │       │   │   └── YouTube iframe (lazy-mounted)
        │       │   │
        │       │   └── Coming Soon State
        │       │       ├── Play icon
        │       │       └── "Coming soon" message
        │       │
        │       └── Content Area
        │           ├── Title (h2, text-2xl)
        │           ├── Subtitle (small, platinum)
        │           ├── Capability Chips
        │           │   ├── Chip 1: 📊 Leak Report
        │           │   ├── Chip 2: 🔔 Renewal Reminders
        │           │   └── Chip 3: 💱 Multi-Currency
        │           │
        │           └── Action Buttons
        │               ├── Close (secondary)
        │               └── Watch on YouTube (primary, conditional)
```

## Animation Sequences

### Modal Entrance
```
t=0ms:    opacity: 0, scale: 0.95, blur: 12px, y: 20px
t=0-500ms: SPRING ANIMATION (cinematic physics)
t=500ms:  opacity: 1, scale: 1, blur: 0px, y: 0px

Backdrop:
t=0ms:    opacity: 0
t=0-300ms: FADE IN
t=300ms:  opacity: 1

Content Cascade:
t=200ms:  Title fades in
t=300ms:  Subtitle fades in
t=300ms:  Video area fades in
t=400ms:  Capability chips cascade (+ 100ms each)
```

### Modal Exit
```
Reverse of entrance
t=0-500ms: SPRING ANIMATION (reverse)
t=500ms:  Component unmounts (cleanup)
```

### Play Button Interaction
```
Hover:
- scale: 1.1
- shadow: 0_0_40px_rgba(199,163,106,0.4)

Tap:
- scale: 0.95

Click:
- setIsVideoReady(true)
- YouTube iframe mounts
- Video autoplays
```

## Color Palette (Obsidian Reserve)

| Element | Color | CSS |
|---------|-------|-----|
| Modal Background | Slate 80% + Graphite + Slate 80% | `from-slate/80 via-graphite to-slate/80` |
| Border | Gold 20% | `border-gold/20` |
| Backdrop | Black 50% | `bg-black/50` |
| Play Button | Gold gradient | `from-gold to-gold/80` |
| Text (Primary) | Ivory | `text-ivory` |
| Text (Secondary) | Platinum | `text-platinum` |
| Text (Accent) | Gold | `text-gold` |
| Chip Background | Gold 10% | `bg-gold/10` |
| Chip Border | Gold 20% | `border-gold/20` |
| Close Hover | Black 40% | `bg-black/40` |

## Sizing

| Element | Desktop | Mobile |
|---------|---------|--------|
| Modal Width | max-w-4xl (56rem) | 100% - 32px |
| Modal Max Height | 90vh | 90vh |
| Video Aspect Ratio | 16:9 | 16:9 |
| Close Button | 20px × 20px icon | 20px × 20px icon |
| Play Button | 80px circle | 80px circle |
| Content Padding | 32px (p-8) | 32px (p-8) |
| Capability Gap | 12px (gap-3) | 12px (gap-3) |

## Typography

| Element | Style | CSS |
|---------|-------|-----|
| Title | 24px semibold | `text-2xl font-semibold` |
| Subtitle | 14px text (platinum) | `text-sm text-platinum` |
| Button text | 16px medium | `font-medium` |
| Capability label | 14px medium gold | `text-sm text-gold font-medium` |
| "Features included" label | 12px uppercase, tracked | `text-xs uppercase tracking-wider` |

## Interaction States

### Play Button
```
State: Initial (Poster)
├── Background: gold-gradient
├── Icon: white play icon
├── Shadow: none
└── Cursor: pointer

State: Hover (on poster)
├── Scale: 1.1
└── Shadow: 40px gold glow

State: Active (after click)
└── → Video mounts & plays
```

### Close Button
```
State: Default
├── Background: black/20
├── Opacity: normal
└── Cursor: pointer

State: Hover
├── Background: black/40
└── Scale: 1.1

State: Tap
├── Scale: 0.95
└── Instant feedback
```

### "Watch on YouTube" Button
```
State: Hidden (poster state)
State: Visible (after video plays)
├── Background: gold/10
├── Border: gold/30
├── Text: gold
└── Only appears when hasPlayedVideo: true
```

## Responsive Breakpoints

```
Mobile (<640px):
├── Modal: w-full - 32px padding
├── Content: p-8 (no change)
├── Video: Full width, 16:9 aspect
├── Buttons: flex-col (stack vertically)
└── Close button: Prominent and tappable

Tablet (640px-1024px):
├── Modal: max-w-2xl
├── Layout: Flexbox row
└── All elements: Standard sizing

Desktop (>1024px):
├── Modal: max-w-4xl
├── Layout: Flexbox row
└── All elements: Full sizing
```

## State Diagram

```
┌─────────────┐
│   CLOSED    │
│ isDemoOpen: │
│   false     │
└──────┬──────┘
       │ User clicks "Watch demo" button
       │ setIsDemoOpen(true)
       ↓
┌─────────────────────┐
│   OPENING           │
│ Modal animates in   │
│ Poster visible      │
└────────┬────────────┘
         │ 500ms animation
         ↓
┌──────────────────────┐
│   OPEN (POSTER)      │
│ isVideoReady: false  │
│ User sees poster     │
└───────┬──────────────┘
        │
        ├─→ ESC key pressed / Close clicked / Backdrop clicked
        │   └─→ onClose() → setIsDemoOpen(false)
        │
        └─→ User clicks play button
            setIsVideoReady(true)
            setHasPlayedVideo(true)
            ↓
            ┌──────────────────────┐
            │   OPEN (VIDEO)       │
            │ isVideoReady: true   │
            │ Video autoplays      │
            │ "Watch on YouTube"   │
            │ button visible       │
            └───────┬──────────────┘
                    │
                    ├─→ ESC / Close / Backdrop
                    │   └─→ onClose()
                    │
                    └─→ "Watch on YouTube" clicked
                        └─→ window.open(videoUrl)

┌──────────────────────┐
│   CLOSING            │
│ Modal animates out   │
│ Content fades away   │
└───────┬──────────────┘
        │ 500ms animation
        ↓
┌─────────────┐
│   CLOSED    │
│ isDemoOpen: │
│   false     │
│ State reset │
└─────────────┘
```

## CSS Classes Used

### Layout
```
fixed inset-0 z-50 flex items-center justify-center
relative rounded-3xl p-8
w-full max-w-4xl max-h-[90vh] overflow-hidden
```

### Colors
```
bg-gradient-to-br from-slate/80 via-graphite to-slate/80
border border-gold/20 border-gold/30 border-glass-border
text-ivory text-platinum text-gold
bg-black/20 bg-black/40 bg-gold/10 bg-gold/20
shadow-2xl shadow-luxury
```

### Motion (Tailwind + Framer)
```
transition-colors transition-all
hover:scale-1.1 hover:bg-gold/20
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.95 }}
animate={{ opacity, scale, filter }}
```

## Event Handlers

```tsx
// Button clicks
onClick={onClose}              // Close button
onClick={handlePlayClick}      // Play button/poster
onClick={(e) => e.stopPropagation()}  // Modal (prevent backdrop close)
onClick={onClose}              // Backdrop (close modal)

// Keyboard
onKeyDown={(e) => {
  if (e.key === 'Escape' && isOpen) {
    onClose()
  }
}}

// Mouse
whileHover={{ ... }}           // Hover states
whileTap={{ ... }}             // Tap states
```

## Props Interface

```tsx
interface DemoModalProps {
  isOpen: boolean           // Is modal visible
  onClose: () => void       // Callback to close
  videoUrl?: string         // YouTube embed URL (optional)
  title?: string            // Modal title
  subtitle?: string         // Modal subtitle
}
```

## YouTube Embed URL Format

```
Correct Format (USE THIS):
https://www.youtube.com/embed/dQw4w9WgXcQ

Wrong Formats (DO NOT USE):
https://www.youtube.com/watch?v=dQw4w9WgXcQ  (Watch URL)
https://youtu.be/dQw4w9WgXcQ                 (Short URL)

With Parameters (OPTIONAL):
https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1

Parameters Used:
- autoplay=1        : Start playing immediately
- modestbranding=1  : Hide YouTube logo
- controls=1        : Show video controls (default)
- rel=0             : Don't show related videos (optional)
```

## Performance Budget

```
Component Size:     ~4KB gzipped
Animation Cost:     GPU-accelerated (60fps)
Video Load:         Deferred until needed (~2s)
Modal Mount Time:   <100ms
First Paint Impact: None (lazy)
SEO Impact:         None (modal content not crawled)
```

## Testing Checklist

- [ ] Modal opens on button click
- [ ] Modal closes on ESC key
- [ ] Modal closes on backdrop click
- [ ] Modal closes on close button click
- [ ] Poster displays correctly
- [ ] Play button is clickable
- [ ] Video autoplays when ready
- [ ] "Watch on YouTube" appears after playing
- [ ] "Watch on YouTube" opens in new tab
- [ ] Capability chips display correctly
- [ ] Animation is smooth (60fps)
- [ ] Mobile layout is responsive
- [ ] Mobile sheet feels native
- [ ] Touch targets are adequate (48px+)
- [ ] Focus trapping works
- [ ] Keyboard navigation works
- [ ] Screen reader reads all content

---

**Visual Status**: ✅ Complete | **Technical Status**: ✅ Complete | **Documentation**: ✅ Complete
