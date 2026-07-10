```markdown
---
name: MusicVerse AI
description: AI-powered music creation platform
colors:
  primary: "hsl(155 40% 50%)"
  primary-hover: "hsl(155 40% 45%)"
  primary-active: "hsl(155 40% 40%)"
  neutral-50: "hsl(0 0% 98%)"
  neutral-100: "hsl(0 0% 96%)"
  neutral-200: "hsl(0 0% 90%)"
  neutral-300: "hsl(0 0% 80%)"
  neutral-400: "hsl(0 0% 64%)"
  neutral-500: "hsl(0 0% 46%)"
  neutral-600: "hsl(0 0% 32%)"
  neutral-700: "hsl(0 0% 22%)"
  neutral-800: "hsl(0 0% 14%)"
  neutral-900: "hsl(0 0% 9%)"
  success: "hsl(var(--success))"
  warning: "hsl(var(--warning))"
  error: "hsl(var(--destructive))"
  surface-primary: "hsl(var(--surface-1))"
  surface-secondary: "hsl(var(--surface-2))"
  surface-elevated: "hsl(var(--surface-3))"
  text-primary: "hsl(var(--foreground))"
  text-secondary: "hsl(var(--muted-foreground))"
  text-tertiary: "hsl(var(--muted-foreground) / 0.7)"
typography:
  display:
    fontFamily: "Space Grotesk, Unbounded, DM Sans, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Space Grotesk, Unbounded, DM Sans, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Space Grotesk, Unbounded, DM Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, Onest, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, Onest, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-50}"
    rounded: "{rounded.md}"
    padding: "16px 48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  card:
    backgroundColor: "{colors.surface-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"
  input:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.4}"
---

# Design System: MusicVerse AI

## 1. Overview

**Creative North Star: "The Lab Notebook"**

The MusicVerse AI design system embodies the spirit of a professional yet approachable creative workspace. It balances sophistication with accessibility, creating an environment where both amateur and professional musicians can feel at home. Inspired by the professionalism of a lab notebook and the warmth of a creative retreat, this system avoids overly simplistic interfaces and chaotic or amateurish designs. It strives for a polished, high-quality experience that feels both professional and inviting.

**Key Characteristics:**

- Professional yet approachable
- Balanced sophistication and accessibility
- Avoids overly simplistic or chaotic designs
- Polished and high-quality
- Inviting and welcoming

## 2. Colors

The palette is designed to be sophisticated and muted, with a primary color that evokes a deep, muted teal-navy hue.

### Primary

- **Deep Muted Teal-Navy** (hsl(155 40% 50%)): The primary accent color used for interactive elements, buttons, and key actions. Its muted nature ensures it remains the focal point without overwhelming the interface.

### Neutral

- **Cool Paper** (hsl(0 0% 98%)): The base background color, providing a clean and crisp canvas for the interface.
- **Cool Paper** (hsl(0 0% 96%)): Used for subtle divisions and secondary backgrounds.
- **Cool Paper** (hsl(0 0% 90%)): Used for borders and dividers, creating a sense of structure without being too heavy.
- **Cool Paper** (hsl(0 0% 80%)): Used for disabled states and inactive elements, maintaining a consistent visual hierarchy.
- **Cool Paper** (hsl(0 0% 64%)): Used for secondary text and icons, providing a clear contrast against the primary background.
- **Cool Paper** (hsl(0 0% 46%)): Used for primary text, ensuring readability and a professional appearance.
- **Cool Paper** (hsl(0 0% 32%)): Used for headings and important labels, adding emphasis and structure.
- **Cool Paper** (hsl(0 0% 22%)): Used for hover states and interactive elements, providing a clear visual cue for user interaction.
- **Cool Paper** (hsl(0 0% 14%)): Used for active states and selected elements, reinforcing user actions.
- **Cool Paper** (hsl(0 0% 9%)): Used for the darkest elements, such as the main navigation and footer, providing a strong contrast and a sense of depth.

### Named Rules

**The One Voice Rule.** The primary accent is used on ≤10% of any given screen. Its rarity is the point.

## 3. Typography

**Display Font:** Space Grotesk (with Unbounded, DM Sans, system-ui, sans-serif)
**Body Font:** DM Sans (with Onest, system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with Roboto Mono, ui-monospace, monospace)

**Character:** The typography system is designed to be clean, modern, and easy to read. The display font is used for headings and titles, while the body font is used for paragraphs and body text. The label/mono font is used for code and other technical elements.

### Hierarchy

- **Display** (700, clamp(2.5rem, 7vw, 4.5rem), 1.2): Hero headlines only.
- **Headline** (600, 2rem, 1.25): Section headings and important labels.
- **Title** (600, 1.5rem, 1.3): Subsection headings and important labels.
- **Body** (400, 1rem, 1.6): Paragraph text and body content. Max line length: 65–75ch.
- **Label** (500, 0.875rem, 1.5): UI labels, form inputs, and small text.

### Named Rules

**The Line Length Rule.** Body text is limited to 65–75 characters per line to ensure readability and a clean, professional appearance.

## 4. Elevation

The elevation system uses structural shadows to convey depth and hierarchy. Shadows are used to indicate interactive elements, such as buttons and cards, and to create a sense of depth and structure in the interface.

### Shadow Vocabulary

- **Elevation 1** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Subtle shadow used for small interactive elements, such as buttons and cards.
- **Elevation 2** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): Medium shadow used for larger interactive elements, such as modals and dialogs.
- **Elevation 3** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Strong shadow used for floating elements, such as tooltips and notifications.
- **Elevation 4** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Very strong shadow used for prominent elements, such as the main navigation and footer.
- **Elevation 5** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): The strongest shadow used for the most prominent elements, such as the main header and hero sections.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus).

## 5. Components

### Buttons

- **Shape:** Gently curved edges (8px radius)
- **Primary:** Deep Muted Teal-Navy background with Cool Paper text, 16px 48px padding
- **Hover / Focus:** Slightly darker teal-navy background
- **Secondary / Ghost / Tertiary:** Not applicable

### Cards

- **Corner Style:** Rounded corners (12px radius)
- **Background:** Cool Paper surface
- **Shadow Strategy:** Elevation 1 shadow
- **Border:** None
- **Internal Padding:** 24px

### Inputs / Fields

- **Style:** Cool Paper background with Deep Muted Teal-Navy border, 8px radius, 16px padding
- **Focus:** Slightly darker border and subtle glow
- **Error / Disabled:** Not applicable

### Navigation

- **Style:** Deep Muted Teal-Navy background with Cool Paper text, 8px radius, 16px padding
- **Typography:** Label font
- **Default/Hover/Active States:** Deep Muted Teal-Navy background with Cool Paper text, slightly darker teal-navy background on hover, slightly lighter teal-navy background on active
- **Mobile Treatment:** Not applicable

## 6. Do's and Don'ts

### Do:

- **Do** use the Deep Muted Teal-Navy color for primary interactive elements, such as buttons and links.
- **Do** use the Cool Paper color for backgrounds and secondary elements.
- **Do** use the Space Grotesk font for headings and titles.
- **Do** use the DM Sans font for body text.
- **Do** use the JetBrains Mono font for code and other technical elements.
- **Do** limit body text to 65–75 characters per line.
- **Do** use structural shadows to convey depth and hierarchy.
- **Do** use the primary accent color on ≤10% of any given screen.

### Don't:

- **Don't** use overly simplistic or chaotic designs.
- **Don't** use dark mode with purple gradients, neon accents, or glassmorphism.
- **Don't** use border-left greater than 1px as a colored stripe.
- **Don't** use gradient text.
- **Don't** use glassmorphism as default.
- **Don't** use the hero-metric template.
- **Don't** use identical card grids.
- **Don't** use tiny uppercase tracked eyebrow above every section.
- **Don't** use numbered section markers as default scaffolding.
- **Don't** use text that overflows its container.
```
