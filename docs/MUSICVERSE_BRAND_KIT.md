# MusicVerse AI - Brand Kit 2026

## 🎵 Brand Identity

**MusicVerse AI** — это профессиональная AI музыкальная платформа в Telegram Mini App, объединяющая Suno AI v5 с продвинутыми инструментами редактирования, микширования и коллаборации.

### Brand Essence

**"Create Without Limits"** — Миссия MusicVerse AI заключается в том, чтобы дать каждому человеку возможность создавать профессиональную музыку независимо от музыкального опыта. Мы объединяем мощные AI технологии с интуитивным интерфейсом Telegram.

### Brand Personality

- **Innovative** — Передовые AI технологии, постоянно развиваемся
- **Accessible** — Простота использования без потери профессионализма
- **Creative** — Вдохновляем на творчество и эксперименты
- **Community-Driven** — Социальная платформа для музыкальных collaboration

### Brand Voice

**Tone of Voice:**

- **Encouraging** — Поддерживаем пользователей в их творческом пути
- **Technical but Approachable** — Объясняем сложное просто
- **Enthusiastic** — Делимся энергией и страстью к музыке
- **Professional** — Сохраняем экспертность без заносчивости

## 🎨 Visual Identity

### Color Palette

**Primary Colors:**
\`\`\`
Mint Green (Primary) #4ADE80 rgb(74, 222, 128) hsl(142, 71%, 58%)
Lavender (Secondary) #A78BFA rgb(167, 139, 250) hsl(255, 92%, 76%)
Electric Cyan (Tertiary) #00D2FF rgb(0, 210, 255) hsl(199, 100%, 50%)
\`\`\`

**Neutral Colors:**
\`\`\`
Background (Deep) #0A0C10 hsl(220, 33%, 6%)
Surface 1 #14171D hsl(222, 18%, 9%)
Surface 2 #181B21 hsl(222, 20%, 11%)
Surface 3 #22262E hsl(222, 22%, 16%)
Text Primary #E6EDF3 hsl(206, 25%, 87%)
Text Secondary #8B949E hsl(220, 11%, 58%)
Border #434A54 hsl(214, 11%, 29%)
\`\`\`

**Status Colors:**
\`\`\`
Success #4ADE80 Mint Green
Warning #F4B33C Amber
Error #FF6B6B Coral Red
Info #00D2FF Electric Cyan
\`\`\`

### Gradient System

**Aurora Gradient (Primary):**
\`\`\`css
background: linear-gradient(135deg, #4ADE80 0%, #A78BFA 100%);
\`\`\`

**Aurora Extended:**
\`\`\`css
background: linear-gradient(135deg, #4ADE80 0%, #A78BFA 50%, #00D2FF 100%);
\`\`\`

### Typography

**Font Stack:**
\`\`\`
Primary: Inter (system-ui fallback)
Display: Unbounded (for hero headings)
Body: DM Sans
Mono: JetBrains Mono
\`\`\`

**Typography Scale:**

| Level       | Size | Weight | Line Height | Tracking | Usage           |
| ----------- | ---- | ------ | ----------- | -------- | --------------- |
| Display XL  | 32px | 700    | 1.15        | -0.02em  | Hero titles     |
| Display LG  | 28px | 700    | 1.2         | -0.015em | Section headers |
| Display MD  | 24px | 600    | 1.25        | -0.01em  | Page titles     |
| Headline LG | 20px | 600    | 1.3         | -0.01em  | Card headers    |
| Headline MD | 18px | 600    | 1.35        | normal   | Subheaders      |
| Body LG     | 16px | 400    | 1.6         | normal   | Primary text    |
| Body MD     | 14px | 400    | 1.5         | normal   | Secondary text  |
| Body SM     | 13px | 400    | 1.45        | normal   | Metadata        |
| Label LG    | 12px | 600    | 1           | 0.05em   | Categories      |
| Label MD    | 11px | 600    | 1           | 0.05em   | Tags            |
| Label SM    | 10px | 500    | 1           | 0.08em   | Fine print      |

## 🧩 Components

### Buttons

**Primary Button:**
\`\`\`css
background: linear-gradient(135deg, #4ADE80, #A78BFA);
border: none;
border-radius: 9999px; /* Pill shape */
padding: 12px 24px;
box-shadow: 0 4px 16px hsla(142, 71%, 58%, 0.3);
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
\`\`\`

**Secondary Button:**
\`\`\`css
background: transparent;
border: 1px solid rgba(167, 139, 250, 0.5);
border-radius: 8px;
padding: 12px 24px;
color: #A78BFA;
\`\`\`

### Cards

**Base Card:**
\`\`\`css
background: rgba(20, 23, 29, 0.8);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 12px;
padding: 16px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
\`\`\`

## 📱 Telegram Mini App Integration

### Safe Areas

\`\`\`css
padding-top: max(
var(--tg-safe-area-inset-top),
env(safe-area-inset-top)
) + 12px;

padding-bottom: max(
var(--tg-safe-area-inset-bottom),
env(safe-area-inset-bottom)
) + 16px;
\`\`\`

### Touch Targets

**Minimum Touch Targets:**
\`\`\`css
button, [role="button"], a {
min-height: 44px;
min-width: 44px;
}
\`\`\`

## 🎯 Usage Guidelines

### Do's

✅ Используйте gradients для primary CTAs
✅ Применяйте glassmorphism для карточек и модалов
✅ Добавляйте glow-эффекты для активных состояний
✅ Соблюдайте touch targets минимум 44×44px
✅ Используйте анимации для feedback (150-250ms)
✅ Поддерживайте high contrast для accessibility

### Don'ts

❌ Не перегружайте интерфейс gradients
❌ Не используйте чистый черный (#000000) или белый (#FFFFFF)
❌ Не делайте touch targets меньше 44px
❌ Не используйте jarring animations (>500ms)
❌ Не игнорируйте reduced motion preference

## 📐 Layout System

### Grid

**Mobile Grid (Telegram):**
\`\`\`
Max Width: 390px (iPhone 14 Pro)
Columns: 2 (stats), 1 (content)
Gutter: 12px
Margins: 16px safe areas
\`\`\`

**Spacing Scale:**
\`\`\`
Unit: 4px base
Stack SM: 8px
Stack MD: 16px
Stack LG: 24px
Section: 32px
\`\`\`

## 🔧 Implementation

### CSS Variables

\`\`\`css
:root {
/* Colors */
--primary: #4ADE80;
--secondary: #A78BFA;
--tertiary: #00D2FF;

/* Surfaces */
--bg-deep: #0A0C10;
--surface-1: #14171D;
--surface-2: #181B21;
--surface-3: #22262E;

/* Text */
--text-primary: #E6EDF3;
--text-secondary: #8B949E;

/* Spacing */
--space-unit: 4px;
--page-margin: 16px;
--card-padding: 16px;

/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;

/* Motion */
--duration-fast: 150ms;
--duration-normal: 250ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
\`\`\`

## 🎭 Brand Expression

### Copywriting Guidelines

**Voice & Tone:**

- **Encouraging:** "Создай свой первый трек за минуты!"
- **Technical but Simple:** "AI сгенерирует музыку на основе твоего описания"
- **Enthusiastic:** "🎵 Готово! Твой трек awaiting"
- **Professional:** "Экспортируй в высоком качестве"

**Microcopy Examples:**

- CTA: "Создать трек" / "Generate Music"
- Empty State: "Начни творить — опиши свою музыку"
- Loading: "✨ AI творит магию..."
- Success: "🎉 Трек готов!"

### Marketing Guidelines

**Key Messages:**

- "Professional AI Music Creation in Telegram"
- "Create Studio-Quality Music in Seconds"
- "Join the MusicVerse Community"

**Taglines:**

- "Create Without Limits"
- "Your AI Music Studio"
- "Music for Everyone"

---

**Brand Version:** 2026.1
**Last Updated:** July 6, 2026
**Maintained by:** MusicVerse AI Design Team
