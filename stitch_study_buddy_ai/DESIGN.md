---
name: Academic Intelligence System
colors:
  surface: '#fcf8fb'
  surface-dim: '#dcd9dc'
  surface-bright: '#fcf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#414751'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#717782'
  outline-variant: '#c1c7d2'
  surface-tint: '#0061a5'
  primary: '#005ea1'
  on-primary: '#ffffff'
  primary-container: '#2b78bf'
  on-primary-container: '#fdfcff'
  inverse-primary: '#a0caff'
  secondary: '#5f3add'
  on-secondary: '#ffffff'
  secondary-container: '#7857f8'
  on-secondary-container: '#fffbff'
  tertiary: '#7b5500'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6c00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0caff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#00497e'
  secondary-fixed: '#e6deff'
  secondary-fixed-dim: '#cabeff'
  on-secondary-fixed: '#1c0062'
  on-secondary-fixed-variant: '#4918c8'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#fbbb45'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#fcf8fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 41px
    letterSpacing: -0.4px
  headline-md:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0px
  headline-sm:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 25px
    letterSpacing: 0px
  body-lg:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.4px
  body-md:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.2px
  label-md:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0px
  caption-sm:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 13px
    letterSpacing: 0.1px
  display-lg-mobile:
    fontFamily: PingFang SC, Microsoft YaHei
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.4px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is rooted in the principles of clarity, deference, and depth, drawing heavily from the Apple Human Interface Guidelines (HIG). It is designed for an AI learning companion that prioritizes focus and intellectual calm. The visual language utilizes a refined **Modern Corporate** style with significant **Glassmorphism** influences to create a sense of lightweight intelligence.

The target audience consists of students and lifelong learners who require a distraction-free environment. The UI evokes a sense of "digital paper"—clean, breathable, and premium. Key characteristics include:
- **High Whitespace:** Generous negative space to reduce cognitive load during study sessions.
- **Translucency:** Use of background blurs to maintain context and hierarchy without heavy visual weight.
- **Soft Geometry:** A consistent use of large corner radii to feel approachable yet structured.

## Colors

This design system utilizes a palette that balances "Warm Blue" (Academic Reliability) with "Soft Purple" (AI Intelligence). 

- **Primary (#4A90D9):** Used for main actions, active states, and progress indicators.
- **Secondary (#7C5CFC):** Reserved for AI-specific features, "Study Buddy" insights, and celebratory highlights.
- **Background:** A subtle vertical gradient starting from pure white to a very light cool grey, mimicking the depth of high-end glass hardware.
- **Neutral:** We follow the HIG standard for text contrast, using `#1D1D1F` for primary labels to ensure maximum legibility against the light background.

## Typography

The typography system relies on the device's native Chinese system fonts (PingFang SC for iOS/macOS, Microsoft YaHei for Windows) to ensure a seamless, "system-integrated" feel. 

- **Language:** All micro-copy and content should be in Simplified Chinese.
- **Hierarchy:** Use font weight rather than size to denote hierarchy where possible, keeping the layout clean.
- **Spacing:** Letter spacing is slightly tight on display sizes (SF-style) to maintain a modern, compact look.
- **Line Height:** Increased line height for body text (1.4x - 1.5x) is required to ensure comfortable reading during long study sessions.

## Layout & Spacing

This design system uses a **Fluid Grid** approach based on a 4px baseline unit. 

- **Desktop:** 12-column grid with 24px gutters. Content should be centered with a max-width of 1200px to prevent excessive line lengths.
- **Mobile:** 4-column grid with 16px gutters and 20px side margins. 
- **Reflow:** Elements should stack vertically on mobile. Navigation bars should transition from a sidebar (desktop) to a bottom tab bar (mobile).
- **Rhythm:** Use "md" (16px) for standard padding within cards and "lg" (24px) for spacing between major sections.

## Elevation & Depth

Visual hierarchy is established through **Backdrop Blurs** and **Tonal Layering** rather than heavy shadows.

- **Surface Levels:** 
  - **Level 0 (Background):** The primary light-grey gradient.
  - **Level 1 (Cards/Containers):** Pure white with a 1px stroke (#E5E5E5) and a very soft 4px blur shadow at 5% opacity.
  - **Level 2 (Modals/Overlays):** White with 80% opacity and a 20px backdrop-blur. These should have a subtle inner glow (white) to define the edge.
- **Shadows:** Use "Shadow-sm" (0 2px 8px rgba(0,0,0,0.05)) for clickable elements like buttons to give them a tactile, "lifted" feel without looking heavy.

## Shapes

The design system embraces a very rounded, organic aesthetic to remain friendly and modern.

- **Containers & Cards:** Use `rounded-2xl` (16px) as the standard.
- **Buttons:** Use fully rounded (pill-shaped) ends for primary actions to distinguish them from content cards.
- **Inputs:** Use `rounded-lg` (8px) for form fields to maintain a slightly more formal, structured look within the rounded environment.
- **Visual Continuity:** Nested elements should have a radius that is 4-8px smaller than their parent container to maintain concentric visual harmony.

## Components

### Buttons
- **Primary:** Filled with the Warm Blue (#4A90D9). Text is white. High-rounded (pill).
- **AI Action:** Gradient fill (Primary to Secondary) with a subtle "shimmer" animation to denote AI processing.
- **Ghost:** No fill, Primary color border (1px) and text.

### Input Fields
- **Search/Chat:** White background with a 1px light grey border. Upon focus, the border transitions to Primary Blue with a 3px soft outer glow.
- **AI Suggestion Chips:** Light purple background (10% opacity of Secondary) with Soft Purple text.

### Cards
- **Study Materials:** White base, 16px corner radius, 1px subtle stroke. No shadow except on hover.
- **AI Insight Card:** Uses a backdrop-blur (Glassmorphism) with a 2px purple-tinted left border to indicate AI-generated content.

### Lists
- Clean rows with 1px horizontal separators (#F2F2F7). Use "Chevron-right" icons (SF Symbols style) to indicate drill-down actions.

### Checkboxes & Radios
- Circular checkboxes (Apple style). When checked, they fill with the Primary Blue and a white checkmark.