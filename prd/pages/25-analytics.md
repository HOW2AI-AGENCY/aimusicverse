# Analytics Page

> **Route:** `/analytics`  
> **Module:** Analytics  
> **Generated:** 2026-06-26

## Overview

Analytics Page provides detailed statistics and insights about user's music creation activity. Features generation metrics, play counts, popular tracks, usage trends, and export capabilities.

**Primary Use Cases:**

- View generation statistics
- Track most popular content
- Analyze usage trends over time
- Export analytics data

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Back + "Analytics"                │
├─────────────────────────────────────────┤
│ Stats Cards (Row)                           │
│ ┌─────┬─────┬─────┬─────┐                │
│ │Gen  │Play │Like │Exp │                │
│ │125  │1.2K │89  │45  │                │
│ └─────┴─────┴─────┴─────┘                │
├─────────────────────────────────────────┤
│ Time Range Selector                         │
│ [7D][30D][90D][All]                    │
├─────────────────────────────────────────┤
│ Charts and Graphs                            │
│ • Generations over time (line chart)      │
│ • Popular tracks (bar chart)              │
│ • Credits usage (donut chart)              │
├─────────────────────────────────────────┤
│ Export Button                               │
│ [Download CSV] [Download PDF]            │
└─────────────────────────────────────────┘
```

## Fields

### Stats Cards

| Stat        | Icon          | Source                 | Notes         |
| ----------- | ------------- | ---------------------- | ------------- |
| Generations | Sparkles icon | Total generation count | All time      |
| Plays       | Play icon     | Total play count       | All tracks    |
| Likes       | Heart icon    | Total likes received   | All tracks    |
| Exports     | Download icon | Total exports          | Files/CSV/PDF |

### Charts

| Chart                | Type        | Data Source                   | Notes               |
| -------------------- | ----------- | ----------------------------- | ------------------- |
| Generations Timeline | Line chart  | Daily generation count        | Time range selected |
| Top Tracks           | Bar chart   | Play counts by track          | Top 10 tracks       |
| Credits Usage        | Donut chart | Credits consumed vs remaining | Current period      |

---

## Interactions

### Page Load

**API Calls:**

- `GET /api/analytics/summary` — Overall statistics
- `GET /api/analytics/generations?range=7d` — Generation trends
- `GET /api/analytics/tracks?range=7d` — Top tracks

### Time Range Change

**Trigger:** Click time range button (7D, 30D, 90D, All)

**Behavior:**

1. Update `timeRange` state
2. Refetch analytics with new range
3. Update all charts
4. Show "Data updated" toast

### Export Data

**CSV Export:**

- **Trigger:** Click "Download CSV"
- **Behavior:** Download CSV file of analytics data

**PDF Export:**

- **Trigger:** Click "Download PDF"
- **Behavior:** Download PDF report with charts

## API Dependencies

| API             | Method | Path                                     | Trigger           | Notes             |
| --------------- | ------ | ---------------------------------------- | ----------------- | ----------------- |
| Get Summary     | GET    | /api/analytics/summary                   | Page load         | Overall stats     |
| Get Generations | GET    | /api/analytics/generations?range={range} | Time range change | Generation trends |
| Get Tracks      | GET    | /api/analytics/tracks?range={range}      | Time range change | Top tracks        |
| Export CSV      | GET    | /api/analytics/export?format=csv         | Export action     | CSV file          |
| Export PDF      | GET    | /api/analytics/export?format=pdf         | Export action     | PDF report        |

## Page Relationships

**From:** `/profile` → Click "Analytics" menu item
**To:** Back button → Previous page

## Business Rules

1. **Time Ranges:**
   - 7D: Last 7 days
   - 30D: Last 30 days
   - 90D: Last 90 days
   - All: All time (since account creation)

2. **Data Refresh:**
   - Manual: Click time range button
   - Auto: No auto-refresh (user must trigger)
   - Cache: 5-minute cache for performance

3. **Export Formats:**
   - CSV: Raw data for spreadsheet analysis
   - PDF: Formatted report with charts
   - Schedule: No scheduled exports (manual only)

---

**Next:** [Auth Page](./26-auth.md) → Batch 7 continues
