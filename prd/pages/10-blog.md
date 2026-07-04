# Blog Page

> **Route:** `/blog`  
> **Module:** Content Discovery  
> **Generated:** 2026-06-26

## Overview

The Blog Page displays articles, tutorials, and news about MusicVerse AI. Features article list with categories, search, and article detail views.

**Primary Use Cases:**

- Read platform news and updates
- Access tutorials and guides
- Learn about music generation tips

## Layout

### Mobile Layout (List)

```
┌──────────────────────────┐
│ HEADER: Back + "Blog"    │
├──────────────────────────┤
│ Category Filters         │
│ [All][News][Tutorials]...│
├──────────────────────────┤
│ Article List             │
│ ┌──────────────────────┐ │
│ │ [Image] Title        │ │
│ │ Summary • 5 min read │ │
│ ├──────────────────────┤ │
│ │ [Image] Title        │ │
│ │ Summary • 3 min read │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Grid)

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Blog"                                 │
├─────────────────────────────────────────────────┤
│ Category Filters + Search                        │
│ Article Grid (3 columns)                         │
│ ┌──────────┬──────────┬──────────┐             │
│ │[Image]   │[Image]   │[Image]   │             │
│ │Title     │Title     │Title     │             │
│ │Summary   │Summary   │Summary   │             │
│ └──────────┴──────────┴──────────┘             │
└─────────────────────────────────────────────────┘
```

## Fields

### Article Card

| Field        | Format            | Notes                |
| ------------ | ----------------- | -------------------- |
| Cover Image  | Image (400×250px) | Article thumbnail    |
| Title        | Text (H3)         | Article headline     |
| Summary      | Text (truncated)  | First 2 lines        |
| Category     | Badge             | News, Tutorial, Tips |
| Read Time    | Text              | "5 min read"         |
| Publish Date | Date              | "Jan 15, 2026"       |

---

## Interactions

### Page Load

**Behavior:**

1. Fetch articles via API
2. Setup Telegram Back Button
3. Render article grid

**API Calls:**

- `GET /api/blog?limit=20` — Published articles

### Category Filter

**Trigger:** Click category chip

**Behavior:**

1. Update `category` state
2. Filter articles by category
3. Update grid

### Article Click

**Trigger:** Click article card

**Behavior:**

1. Navigate to article detail view (modal or separate page)
2. Display full article content

## API Dependencies

| API          | Method | Path               | Trigger       | Notes                |
| ------------ | ------ | ------------------ | ------------- | -------------------- |
| Get Articles | GET    | /api/blog?limit=20 | Page load     | Published articles   |
| Get Article  | GET    | /api/blog/{id}     | Article click | Full article content |

## Page Relationships

**From:**

- `/` (Home) → Click "Blog" in navigation
- Deep link → Direct article link

**To:**

- Article detail view
- `/` (Home) → Back button

## Business Rules

1. **Article Categories:**
   - News: Platform updates and announcements
   - Tutorials: How-to guides
   - Tips: Music generation tips
   - Community: User stories and spotlights

2. **Article Publishing:**
   - Admin-only: Only admins can publish articles
   - Draft mode: Articles saved as draft before publishing
   - Rich text: Markdown support for formatting
   - Images: Max 10 images per article

---

**Next:** [Community Page](./11-community.md)
