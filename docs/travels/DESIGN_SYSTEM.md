# AJ Holidays - Premium Design System

## Design Philosophy

This design system follows modern SaaS design principles inspired by Linear, Stripe, and Vercel. The focus is on:

- **Simplicity over clutter** - Clean, uncluttered interfaces with clear visual hierarchy
- **Premium over generic** - Sophisticated color schemes, elegant typography, and refined interactions
- **Elegant over flashy** - Subtle animations and transitions that enhance rather than distract
- **Fast over heavy** - Optimized performance with skeleton screens and lazy loading
- **Consistent over creative chaos** - Systematic approach to spacing, colors, and components

## Color Palette

### Primary Colors

```css
/* Primary - Deep Royal Blue */
--primary: 225 95% 55%;

/* Accent - Vibrant Cyan */
--accent: 190 95% 55%;
```

### Semantic Colors

```css
/* Success */
--success: 155 75% 45%;

/* Warning */
--warning: 35 95% 55%;

/* Info */
--info: 200 85% 50%;

/* Destructive */
--destructive: 0 85% 55%;
```

### Neutral Colors

```css
/* Background */
--background: 0 0% 100%;  /* Light mode */
--background: 225 20% 8%;  /* Dark mode */

/* Foreground */
--foreground: 230 10% 8%;   /* Light mode */
--foreground: 220 15% 95%;  /* Dark mode */

/* Muted */
--muted: 220 15% 96%;
--muted-foreground: 220 10% 45%;
```

## Typography Scale

### Font Families

- **Sans**: Inter, system-ui, -apple-system
- **Display**: Cal, Inter, system-ui

### Type Scale

| Size | Usage | Line Height |
|------|-------|-------------|
| 9xl (8rem) | Hero titles | 1 |
| 8xl (6rem) | Page titles | 1 |
| 7xl (4.5rem) | Large headings | 1 |
| 6xl (3.75rem) | Section titles | 1 |
| 5xl (3rem) | Large headings | 1 |
| 4xl (2.25rem) | Main headings | 2.5rem |
| 3xl (1.875rem) | Section headings | 2.25rem |
| 2xl (1.5rem) | Card titles | 2rem |
| xl (1.25rem) | Subheadings | 1.75rem |
| lg (1.125rem) | Body large | 1.75rem |
| base (1rem) | Body text | 1.5rem |
| sm (0.875rem) | Body small | 1.25rem |
| xs (0.75rem) | Caption | 1rem |

## Spacing System

Based on a 4px base unit:

- **4px** - xs (0.25rem)
- **8px** - sm (0.5rem)
- **12px** - md (0.75rem)
- **16px** - lg (1rem)
- **24px** - xl (1.5rem)
- **32px** - 2xl (2rem)
- **48px** - 3xl (3rem)
- **64px** - 4xl (4rem)
- **96px** - 5xl (6rem)

## Border Radius

```css
--radius: 1rem;           /* Default */
--radius-sm: 0.5rem;       /* Small */
--radius-lg: 1.25rem;      /* Large */
--radius-xl: 1.5rem;       /* Extra large */
```

## Shadow System

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-premium: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.1);
--shadow-premium-lg: 0 1px 3px rgba(0, 0, 0, 0.05), 0 20px 60px rgba(0, 0, 0, 0.15);
```

## Animation System

### Duration

- **Fast**: 150ms
- **Normal**: 200ms
- **Slow**: 300ms
- **Slower**: 500ms

### Easing

- **ease-out**: Standard transitions
- **ease-in-out**: Complex animations
- **bounce-in**: Playful interactions
- **ease-out-quint**: Premium feel

### Key Animations

```css
/* Fade In */
.animate-fade-in

/* Fade In Up */
.animate-fade-in-up

/* Scale In */
.animate-scale-in

/* Float */
.animate-float

/* Pulse Soft */
.animate-pulse-soft

/* Shimmer */
.animate-shimmer

/* Spin Slow */
.animate-spin-slow
```

## Components

### Button Variants

- **default** - Primary action button
- **gradient** - Gradient background for emphasis
- **glass** - Glassmorphism effect
- **outline** - Secondary action
- **ghost** - Tertiary action
- **link** - Text-only button

### Card Variants

- **default** - Standard elevated card
- **glass** - Glassmorphism card
- **gradient** - Subtle gradient background
- **elevated** - Higher elevation

### Badge Styles

- **badge-gradient** - Gradient background
- **badge-outline-glow** - Outline with glow effect
- **status-online/offline/busy** - Status indicators

## Glassmorphism

### Light Mode

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### Dark Mode

```css
.glass-dark {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

## Gradients

### Linear Gradients

```css
/* Primary to Accent */
from-primary via-blue-500 to-accent

/* Gold */
from-amber-400 via-yellow-300 to-amber-500

/* Mesh Background */
radial-gradient(at 40% 20%, hsla(var(--primary), 0.3) 0px, transparent 50%),
radial-gradient(at 80% 0%, hsla(var(--accent), 0.25) 0px, transparent 50%),
radial-gradient(at 0% 50%, hsla(var(--primary), 0.2) 0px, transparent 50%),
radial-gradient(at 80% 50%, hsla(var(--accent), 0.15) 0px, transparent 50%),
radial-gradient(at 0% 100%, hsla(var(--primary), 0.2) 0px, transparent 50%),
radial-gradient(at 80% 100%, hsla(var(--accent), 0.15) 0px, transparent 50%);
```

## Patterns

### Grid Pattern

```css
.pattern-grid {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### Dots Pattern

```css
.pattern-dots {
  background-image: radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 10px 10px;
}
```

## Accessibility

### WCAG AA Compliance

- Text contrast ratio ≥ 4.5:1
- Focus indicators on all interactive elements
- Semantic HTML structure
- Keyboard navigation support

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1400px
```

## Dark Mode

The design system includes comprehensive dark mode support with:

- Adjusted color values for reduced eye strain
- Increased contrast for better readability
- Optimized shadows for dark backgrounds
- Glassmorphism effects adapted for dark mode

## Usage Examples

### Premium Card

```tsx
<Card className="group hover:shadow-premium-lg transition-all duration-300 border-border/50 hover:-translate-y-2">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Gradient Button

```tsx
<Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all">
  Click Me
</Button>
```

### Glass Effect

```tsx
<div className="glass-card rounded-2xl p-6">
  {/* Content */}
</div>
```

### Animated Section

```tsx
<div className="animate-fade-in-up">
  {/* Content */}
</div>
```

## Best Practices

1. **Consistent Spacing** - Use the spacing scale for all margins and padding
2. **Visual Hierarchy** - Use typography scale to establish clear hierarchy
3. **Purposeful Animation** - Animate to improve UX, not just for decoration
4. **Performance** - Use skeleton screens for loading states
5. **Accessibility** - Ensure all interactive elements are keyboard accessible
6. **Responsive Design** - Design mobile-first, enhance for larger screens
7. **Semantic Colors** - Use semantic colors for actions and status indicators
8. **Consistent Borders** - Use the border radius scale for rounded corners
