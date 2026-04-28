---
name: Restaurant Management System
version: alpha
description: Premium Glassmorphism design system for high-end restaurant management.
colors:
  primary: "#6366f1"
  secondary: "#a855f7"
  on-primary: "#ffffff"
  bg-main: "#0f172a"
  glass-bg: "rgba(255, 255, 255, 0.05)"
  glass-border: "rgba(255, 255, 255, 0.1)"
  success: "#22c55e"
  error: "#ef4444"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
typography:
  h1:
    fontFamily: "Outfit, sans-serif"
    fontSize: 2.5rem
    fontWeight: 700
  h2:
    fontFamily: "Outfit, sans-serif"
    fontSize: 2rem
    fontWeight: 600
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 1rem
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 12px
  lg: 16px
  xl: 24px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  glass-card:
    backgroundColor: "{colors.glass-bg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input-field:
    backgroundColor: "rgba(0, 0, 0, 0.2)"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
---

## Overview
Architectural Elegance meets Digital Fluidity. The UI is designed to feel like a high-end physical interface made of frosted glass and light.

## Visual Atmosphere
The system relies on depth, translucency, and vibrant light sources. Every element should feel like it's floating above a deep indigo void.

## Colors
The palette is centered around deep slate neutrals with high-energy gradients.
- **Primary & Secondary:** Used together in gradients to define action areas.
- **Glass Surfaces:** Semi-transparent layers that let background colors and blurs bleed through.

## Glassmorphism Effect
To maintain consistency, all glass elements must implement:
- **Backdrop Blur:** `12px` minimum.
- **Saturation:** `180%` to make colors behind more vibrant.
- **Border:** A `1px` solid white stroke at `10%` opacity to define the edge.

## Components
### Buttons
Buttons should use the primary gradient and have a subtle scale-up animation on hover.

### Cards
Cards are the primary container unit. They should always use the `glass-card` token properties and be layered to create a sense of hierarchy.

### Navigation
The sidebar and topbar should be persistent glass elements with a higher blur value (`20px`) to distinguish them from content cards.
