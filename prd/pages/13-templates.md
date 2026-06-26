# Templates Page

> **Route:** `/templates`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

The Templates Page allows users to create, manage, and reuse generation prompt templates. Users can save frequently used prompts as templates, search them by name/tags, copy template text to clipboard, and delete unwanted templates. Each template tracks usage count.

**Primary Use Cases:**
- Create new prompt templates
- Browse and search existing templates
- Copy template text to generation form
- Delete unused templates
- Track template usage statistics

## Layout

### Mobile Layout (List View)

```
┌──────────────────────────┐
│ HEADER: Back + "Templates"│
│ [+ New Template] button   │
├──────────────────────────┤
│ Search Bar               │
│ [🔍 Search templates...]│
├──────────────────────────┤
│ Templates List            │
│ ┌──────────────────────┐ │
│ │ Template Name         │ │
│ │ Tags: pop, rock       │ │
│ │ Used 12 times • Copy │ │
│ │ [Delete]              │ │
│ ├──────────────────────┤ │
│ │ Template Name         │ │
│ │ Tags: electronic       │ │
│ │ Used 8 times • Copy  │ │
│ │ [Delete]              │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Grid)

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Templates" [+ New Template]          │
├─────────────────────────────────────────────────┤
│ Search: [🔍 Search templates...]               │
├─────────────────────────────────────────────────┤
│ Templates Grid (3 columns)                        │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ Template 1    │ Template 2    │ Template 3    │  │
│ │ Tags: pop,    │ Tags: rock   │ Tags: elect.. │  │
│ │ Used: 12      │ Used: 8       │ Used: 15      │  │
│ │ [Copy] [Del]  │ [Copy] [Del]  │ [Copy] [Del]  │  │
│ └──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────┘
```

## Fields

### Template Card

| Field | Format | Notes |
|-------|--------|-------|
| Name | Text (H3) | Template name |
| Tags | Chips | Genre/style tags |
| Usage Count | Text | "Used 12 times" |
| Copy Button | Button | Copy template to clipboard |
| Delete Button | Button | Delete template (with confirmation) |

### Template Detail Sheet (Mobile) / Dialog (Desktop)

| Field | Type | Notes |
|-------|------|-------|
| Name | Text display | Template name |
| Template Text | Textarea (read-only) | Full prompt text |
| Tags | Chips | Genre/style tags |
| Usage Count | Text | Total times used |
| Use Button | Button | Copy to generation form |
| Edit Button | Button | Edit template (not implemented) |
| Delete Button | Button | Delete with confirmation |

---

## Interactions

### Page Load

**Behavior:**
1. Check authentication via `useAuth()`
2. Fetch user templates via `useQuery()`
3. Setup Telegram Back Button (returns to home)
4. Render template grid with loading skeletons

**API Calls:**
- `GET /api/prompt_templates?user_id={userId}` — User's templates

### Create Template

**Trigger:** Click "+ New Template" button

**Behavior:**
1. Open create dialog (not implemented in current code - planned feature)
2. User would fill:
   - Template name (required)
   - Template text (prompt)
   - Tags (optional)
3. Call API: `POST /api/prompt_templates`
4. On success: Refresh template list

**Planned API Request:**
```typescript
POST /api/prompt_templates
{
  name: string;
  template_text: string;
  tags?: string[];
}
```

### Search Templates

**Trigger:** Type in search input

**Behavior:**
1. Update `searchQuery` state
2. Filter templates client-side:
   - Search template name (case-insensitive)
   - Search tags (case-insensitive)
3. Update filtered grid immediately

**Filter Logic:**
```typescript
template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
```

### Copy Template to Clipboard

**Trigger:** Click "Copy" button on template

**Behavior:**
1. Copy template text to clipboard via `navigator.clipboard.writeText()`
2. Show "Copied!" feedback (button changes to "Copied!" with checkmark)
3. Set timeout to reset button after 2 seconds
4. Increment usage count via API
5. Haptic feedback (light impact)

**API Call:**
- `PATCH /api/prompt_templates/{id}` — Increment `usage_count`

### View Template Detail

**Mobile:**
- **Trigger:** Click template card
- **Behavior:** Open template detail sheet (bottom)

**Desktop:**
- **Trigger:** Click template card
- **Behavior:** Open template detail dialog

**Detail Content:**
- Full template text (scrollable if long)
- Tags display
- Usage count
- Copy and Delete buttons

### Delete Template

**Trigger:** Click "Delete" button

**Behavior:**
1. Show confirmation dialog:
   - "Delete template '{name}'?"
2. User confirms
3. Call API: `DELETE /api/prompt_templates/{id}`
4. On success:
   - Remove from list
   - Show "Template deleted!" toast
5. On error: Show "Error deleting template!" toast

**API Call:**
- `DELETE /api/prompt_templates/{id}` — Delete template

### Empty State

**No Templates:**
- Display: "No templates yet"
- CTA: "Create your first template" button (opens create dialog)
- Illustration: Empty state icon

### Use Template in Generation

**Trigger:** Copy template text, then navigate to generation form

**Behavior:**
1. Copy template to clipboard
2. Navigate to home page (`/`)
3. Open generation form
4. Paste template text into style field
5. Adjust and generate

**Planned Feature:**
- Direct "Use" button in generation form that opens template selector

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Templates | GET | /api/prompt_templates?user_id={userId} | Page load | User's templates |
| Create Template | POST | /api/prompt_templates | Create dialog | Creates new template |
| Update Usage Count | PATCH | /api/prompt_templates/{id} | Copy action | Increments usage_count |
| Delete Template | DELETE | /api/prompt_templates/{id} | Delete action | Deletes template |

## Page Relationships

**From:**
- `/` (Home) → Click "Templates" in quick actions or navigation
- Generation form → Click "Save as Template" button
- Deep link → `startapp=templates` opens templates

**To:**
- `/` (Home) → After copying template (for use in generation)
- Template creation dialog → (not implemented yet)
- Back button → Returns to previous page

**Data Coupling:**
- Template list: Refreshed when template created/deleted
- Usage count: Updated on every copy action
- Clipboard integration: Uses browser Clipboard API

## Business Rules

1. **Template Creation:**
   - Name required: Max 100 chars
   - Template text required: Max 5000 chars
   - Tags optional: Array of strings (max 10 tags)
   - User-owned: Templates only visible to creator

2. **Template Usage:**
   - Copy-based: Templates copied to clipboard, not auto-filled
   - Usage tracking: Every copy increments usage count
   - Manual paste: User must paste into generation form
   - No limits: Can use template unlimited times

3. **Template Deletion:**
   - Confirmation required: Always show dialog
   - Permanent deletion: No recovery option
   - No dependency check: Can delete even if used in generations (usage history remains)

4. **Search Behavior:**
   - Scope: Searches template name and tags
   - Case-insensitive: "pop" matches "Pop" and "POP"
   - Real-time: Filters as user types
   - Client-side: Filtered in browser (not server query)

5. **Tag System:**
   - Optional: Templates can have no tags
   - Multiple: Can have multiple tags
   - Free-form: No predefined tag list (user enters any text)
   - Searchable: Tags included in search

6. **Usage Statistics:**
   - Count: Total times template copied to clipboard
   - Display: "Used X times" on template card
   - Tracking: Incremented on every copy action
   - No expiry: Usage count persists indefinitely

7. **Template Sharing:**
   - Not implemented: Templates are private to user
   - Planned: Public templates marketplace (future feature)
   - No export: Cannot download/export templates
   - No import: Cannot import templates from others

8. **Template Limits:**
   - Max templates: No hard limit (user can create unlimited)
   - Max length: Template text max 5000 chars
   - Max tags: 10 tags per template
   - Tag length: Each tag max 50 chars

9. **Mobile Optimizations:**
   - Bottom sheet: Template details open from bottom
   - Touch targets: Minimum 44×44px
    - Haptic feedback: On copy and delete
    - Safe areas: Padding for notch/island

10. **Clipboard Integration:**
    - Modern API: Uses `navigator.clipboard.writeText()`
    - Fallback: Not implemented (requires modern browser)
    - Feedback: Button changes to "Copied!" with checkmark
    - Auto-reset: Button resets after 2 seconds

---

**Next:** [Music Lab Page](./14-music-lab.md) → Batch 3 continues
