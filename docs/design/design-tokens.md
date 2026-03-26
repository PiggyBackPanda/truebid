# TrueBid — Design Tokens Reference

## Overview

This document defines all visual design tokens for TrueBid. Claude Code must reference this when building any UI component. All values should be configured in `tailwind.config.ts` as custom extensions.

---

## Colour Palette

### Primary Colours

```
navy:           #0f1a2e    — Primary brand, nav background, dark sections, headings
navy-light:     #1a2a45    — Card backgrounds on dark sections, image placeholders
navy-mid:       #243656    — Secondary dark backgrounds, timer section, hover states on dark
slate:          #334766    — Borders on dark backgrounds, subtle dark dividers
```

### Accent Colours

```
amber:          #e8a838    — Primary CTA buttons, rank 1 badge, highlights, brand accent
amber-light:    #f5c563    — Live badge text, secondary amber emphasis
amber-glow:     rgba(232, 168, 56, 0.15)  — Amber tint backgrounds (selected states, top offer row)
```

### Semantic Colours

```
green:          #3db87a    — Success, verified badge, accept buttons, publish button
green-bg:       #e8f5e9    — Green tint background (verified seller badge, unconditional offer)
red:            #e05252    — Error states, closing soon indicator, destructive actions
sky:            #4a90d9    — Links, secondary actions, info badges, unread indicators
```

### Neutrals

```
bg:             #f7f5f0    — Page background (warm off-white, NOT pure white)
bg-card:        #ffffff    — Card backgrounds
text:           #1a1a1a    — Primary text
text-muted:     #6b7280    — Secondary text, descriptions, metadata
text-light:     #9ca3af    — Tertiary text, placeholders, timestamps
border:         #e5e2db    — Card borders, dividers (warm tone, not cold grey)
```

### Condition Badge Colours

```
unconditional:  bg: #e8f5e9   text: #2e7d32   dot: #4caf50
finance:        bg: #fff3e0   text: #e65100   dot: #ff9800
building:       bg: #e3f2fd   text: #1565c0   dot: #2196f3
other:          bg: #f5f5f5   text: #616161   dot: #9e9e9e
```

---

## Typography

### Font Families

```
serif:    'DM Serif Display', Georgia, serif       — Headings, prices, brand name
sans:     'Outfit', -apple-system, sans-serif      — Body text, UI elements, buttons
```

Import via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

BANNED FONTS: Inter, Roboto, Arial, system-ui as primary. These make the platform look generic.

### Type Scale

```
hero:       56px / 1.1 line-height / -0.03em tracking / serif / font-weight: 400
h1:         32px / 1.2 / -0.02em / serif / 400
h2:         28px / 1.3 / -0.02em / serif / 400
h3:         20px / 1.4 / -0.01em / serif / 400
h4:         18px / 1.4 / serif / 400
body:       14px / 1.6 / sans / 400
body-lg:    16px / 1.6 / sans / 400
small:      13px / 1.5 / sans / 400
xs:         12px / 1.4 / sans / 400
caption:    11px / 1.3 / sans / 500 / uppercase / 0.05em tracking
overline:   11px / 1.3 / sans / 600 / uppercase / 0.1em tracking
```

### Font Weights

```
light:      300    — Hero subtitle, muted descriptions
regular:    400    — Body text, descriptions
medium:     500    — Nav links, secondary buttons, metadata labels
semibold:   600    — Prices, stats, table headers, card titles
bold:       700    — Primary CTAs, rank badges, hero numbers, countdown digits
```

---

## Spacing

Use Tailwind's default spacing scale. Key values used throughout TrueBid:

```
4px   (1)    — Tight gaps within badge components, dot spacing
8px   (2)    — Gap between icon and text, small internal padding
12px  (3)    — Input padding, small card padding, badge padding
16px  (4)    — Standard gap between elements, card section spacing
20px  (5)    — Card padding (compact), offer row padding
24px  (6)    — Standard card padding, section margins
32px  (8)    — Large section spacing, gap between major sections
40px  (10)   — Card padding (spacious), hero section padding
48px  (12)   — Section vertical padding
80px  (20)   — Hero section vertical padding
```

---

## Border Radius

```
sm:         8px    — Buttons, badges, small cards, inputs
default:    12px   — Standard cards, offer rows, dropdowns
lg:         16px   — Large cards, modals, photo gallery, offer board container
full:       9999px — Circular elements (avatars, dots, pills)
```

---

## Shadows

```
shadow:       0 1px 3px rgba(15, 26, 46, 0.06), 0 4px 12px rgba(15, 26, 46, 0.04)
              — Default card shadow. Subtle and warm.

shadow-lg:    0 4px 6px rgba(15, 26, 46, 0.04), 0 12px 32px rgba(15, 26, 46, 0.08)
              — Elevated cards (offer board, modals, hover states)

shadow-amber: 0 4px 16px rgba(232, 168, 56, 0.3)
              — CTA buttons (amber glow effect)
```

---

## Animations

### Page Load — Staggered Fade In
```css
.fade-in {
  animation: fadeIn 0.4s ease-out both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Stagger children with animation-delay: 0.05s, 0.1s, 0.15s, 0.2s */
```

### Live Indicator — Pulsing Dot
```css
.live-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--green);
  animation: pulseDot 2s infinite;
}
@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
```

### New Offer Highlight
```css
.offer-row-new {
  animation: highlightNew 1.5s ease-out;
}
@keyframes highlightNew {
  0%   { background: rgba(232, 168, 56, 0.15); }
  100% { background: transparent; }
}
```

### Card Hover
```css
.card-hover {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card-hover:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

---

## Component Patterns

### Buttons

Primary (amber):
```
bg: amber | text: navy | font: sans 600 | padding: 14px 32px | radius: 10px | shadow: shadow-amber
hover: brightness(1.05)
```

Secondary (navy):
```
bg: navy | text: white | font: sans 500 | padding: 12px 24px | radius: 10px
hover: bg navy-light
```

Outline:
```
bg: transparent | border: 1px solid border | text: text | font: sans 500 | padding: 12px 24px | radius: 10px
hover: bg bg
```

Ghost:
```
bg: transparent | text: sky | font: sans 500 | padding: 8px 16px | radius: 8px
hover: bg sky/10
```

### Inputs

```
bg: white | border: 1px solid border | radius: 10px | padding: 12px 16px | font: sans 14px
focus: border-sky, ring-2 ring-sky/20
placeholder: text-light
```

### Cards

```
bg: bg-card | border: 1px solid border | radius: 12px | shadow: shadow | padding: 24px
hover (if clickable): shadow-lg, translateY(-2px)
```

### Badges (Condition Type)

```
bg: conditionColor.bg | text: conditionColor.text | radius: 6px | padding: 4px 10px
font: sans 12px 500
includes: 6px coloured dot before text
```

### Nav Bar

```
bg: navy | height: 64px | padding: 0 24px | sticky top-0 z-100
border-bottom: 1px solid navy-mid
logo: amber square (32px, radius 8px) + serif "TrueBid" in white
links: sans 14px 500, white/65 default, white on active, navy-mid bg on active
```

---

## Responsive Breakpoints

```
mobile:    < 768px     — Single column, full-width cards, bottom sheet offer board
tablet:    768–1023px  — Two-column where appropriate, sidebar collapses
desktop:   ≥ 1024px   — Full layout, side-by-side listing + offer board
```

### Mobile-Specific Patterns

- Navigation collapses to hamburger menu
- Offer board becomes a sticky bottom bar: "4 offers · Highest: $845k · [View ▲]"
  - Tapping expands to full-screen modal with the complete offer board
- Listing creation steps go full-width with larger touch targets (min 44px)
- Dashboard uses horizontal scrolling tab bar instead of sidebar
- Search filters collapse into a "Filters" button that opens a drawer

---

## Logo

The TrueBid logo is a 32×32px amber square with 8px radius containing the letter "T" in navy, DM Serif Display, 16px, bold. Adjacent text: "TrueBid" in DM Serif Display, 20px, white (on navy) or navy (on light backgrounds), -0.02em letter-spacing.

Do not use an image file for the logo — render it as styled HTML/CSS for maximum flexibility.
