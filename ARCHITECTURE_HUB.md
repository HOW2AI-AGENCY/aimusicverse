<div align="center">

# 🏛 Architecture Hub

**Canonical entry point for everything architecture-related in MusicVerse AI.**

<p>
  <img alt="Stack" src="https://img.shields.io/badge/stack-React_19_+_Supabase-9333EA?style=for-the-badge"/>
  <img alt="ADRs" src="https://img.shields.io/badge/ADRs-12-26A5E4?style=for-the-badge"/>
  <img alt="Status" src="https://img.shields.io/badge/status-living_document-10B981?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Home</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Docs</a> ·
  <a href="REPOSITORY_STRUCTURE.md">🗂 Structure</a> ·
  <a href="ROADMAP.md">🗺 Roadmap</a>
</p>

</div>

---

> [!TIP]
> Start here, then drill into the specialised docs linked at the bottom of each section.

## 1. High-level system

> **Verified:** 2026-07-24 (counts from `find`/`wc` against `src/` and `supabase/functions/`)

```mermaid
flowchart TB
    subgraph Client["📱 Telegram Mini App"]
        Pages[Pages · React Router]
        Comps[1044 Components]
        Hooks[444 Hooks]
        State[Zustand · TanStack Query]
        Audio[GlobalAudioProvider]
        Tests[1810 unit tests]
    end
    subgraph Backend["☁️ Lovable Cloud (Supabase)"]
        Auth[Auth · JWT + RLS]
        DB[(PostgreSQL)]
        Edge[135 Edge Functions]
        Storage[Object Storage]
        Realtime[Realtime channels]
    end
    subgraph External["🌐 External"]
        Suno[Suno AI v5]
        Klang[Klang.io]
        Gateway[Lovable AI Gateway]
        Bot[Telegram Bot]
        TG[Telegram Web App SDK]
    end
    Client --> Auth
    Client --> Edge
    Client --> Realtime
    Client --> Storage
    Edge --> DB
    Edge --> Suno
    Edge --> Klang
    Edge --> Gateway
    Edge --> Bot
    Bot --> TG
    TG --> Client
```

## 2. Layered architecture

```mermaid
flowchart TD
    P[Pages] --> C[Components]
    C --> H[Hooks]
    H --> Sv[Services]
    Sv --> API[API layer]
    API --> Edge[Edge Functions / Supabase]
```

| Layer      | Path                  | Responsibility           |
| ---------- | --------------------- | ------------------------ |
| Pages      | `src/pages/`          | Route-level, lazy-loaded |
| Components | `src/components/`     | Presentation             |
| Hooks      | `src/hooks/`          | React Query + state      |
| Services   | `src/services/`       | Business logic           |
| API        | `src/api/`            | Typed Supabase queries   |
| Edge       | `supabase/functions/` | Server-side jobs         |

## 3. State strategy

| Use case                                    | Tool                  |
| ------------------------------------------- | --------------------- |
| Global player, studio, lyrics, mixer        | Zustand               |
| Server state (queries, caching, optimistic) | TanStack Query        |
| Forms                                       | React Hook Form + Zod |
| Local UI                                    | React hooks           |

## 4. Audio architecture

> [!IMPORTANT]
> The entire app uses **one** `<audio>` element managed by `GlobalAudioProvider`. Never instantiate additional audio elements outside the pool.

See [`docs/PLAYER_ARCHITECTURE.md`](docs/PLAYER_ARCHITECTURE.md) · [`docs/AUDIO_ARCHITECTURE_DIAGRAM.md`](docs/AUDIO_ARCHITECTURE_DIAGRAM.md).

## 5. Generation pipeline

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Mini App
  participant EF as Edge Function
  participant SA as Suno API
  participant DB as Postgres
  U->>FE: Submit generation form
  FE->>EF: POST suno-music-generate
  EF->>DB: insert generation_tasks
  EF->>SA: create job
  SA-->>EF: task_id
  loop polling (3s)
    FE->>EF: poll task
    EF->>SA: status
    SA-->>EF: status + clips
  end
  EF->>DB: insert tracks + track_versions (A,B)
  EF-->>FE: ready
  FE-->>U: GenerationResultSheet
```

Detail: [`docs/GENERATION_SYSTEM.md`](docs/GENERATION_SYSTEM.md) · [`docs/SUNO_API.md`](docs/SUNO_API.md).

## 6. Database

```mermaid
erDiagram
    profiles ||--o{ tracks : owns
    tracks ||--o{ track_versions : has
    tracks ||--o{ track_stems : has
    profiles ||--o{ user_credits : has
    profiles ||--o{ user_roles : has
    tracks ||--o{ comments : has
    tracks ||--o{ track_likes : has
    music_projects ||--o{ project_tracks : groups
    playlists ||--o{ playlist_tracks : groups
```

Full schema: [`docs/DATABASE.md`](docs/DATABASE.md).

## 7. Telegram integration

- Native SDK via `@twa-dev/sdk` 8.0.
- MainButton/BackButton proxies, haptic system, Stories share.
- Deep link format: `t.me/AIMusicVerseBot/app?startapp=PARAM`.

See [`docs/TELEGRAM_BOT_ARCHITECTURE.md`](docs/TELEGRAM_BOT_ARCHITECTURE.md) · [`docs/TELEGRAM_MINI_APP_FEATURES.md`](docs/TELEGRAM_MINI_APP_FEATURES.md).

## 8. ADRs

Architecture Decision Records under [`ADR/`](ADR/). Notable:

| ADR | Title                       |
| --- | --------------------------- |
| 001 | Technology stack choice     |
| 002 | Frontend architecture       |
| 003 | Performance optimisation    |
| 004 | Audio playback optimisation |
| 005 | State machine architecture  |
| 006 | Type-safe audio context     |
| 012 | Generation form compact UI  |

---

<div align="center">

### 🔗 Related Documentation

|            📚 Index             |             🗂 Structure              |       🗺 Roadmap       |         🧩 KB          |       📝 Changelog        |
| :-----------------------------: | :----------------------------------: | :-------------------: | :--------------------: | :-----------------------: |
| [Index](DOCUMENTATION_INDEX.md) | [Structure](REPOSITORY_STRUCTURE.md) | [Roadmap](ROADMAP.md) | [CLAUDE.md](CLAUDE.md) | [Changelog](CHANGELOG.md) |

---

<div align="center">

[← REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) · [↑ К индексу](./DOCUMENTATION_INDEX.md) · [ROADMAP.md →](./ROADMAP.md)

<sub>Обновлено: 24.07.2026</sub>

</div>
