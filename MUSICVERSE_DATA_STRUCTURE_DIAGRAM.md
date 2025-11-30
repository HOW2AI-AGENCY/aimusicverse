# 🎵 MusicVerse AI - Comprehensive Data Structure Diagram

## 📊 Overview

MusicVerse AI is a sophisticated music generation platform built with React, TypeScript, and PostgreSQL. The application integrates with Suno AI for music generation and Telegram Mini App for user interaction.

## 🏗️ Core Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Telegram Web App + Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components

### Backend Stack
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with Telegram integration
- **Storage**: Supabase Storage for audio files
- **Functions**: Edge functions for processing

## 📈 Database Schema & Entity Relationships

```mermaid
erDiagram
    users ||--o{ profiles : "has profile"
    users ||--o{ tracks : "creates tracks"
    users ||--o{ music_projects : "manages projects"
    users ||--o{ tasks : "creates tasks"
    users ||--o{ user_tag_preferences : "sets preferences"
    users ||--o{ prompt_templates : "saves templates"
    
    music_projects ||--o{ tracks : "contains tracks"
    music_projects ||--o{ project_assets : "has assets"
    music_projects ||--o{ music_project_artists : "has artists"
    
    tracks ||--o{ track_analytics : "generates analytics"
    tracks ||--o{ track_likes : "receives likes"
    tracks ||--o{ track_versions : "has versions"
    tracks ||--o{ stem_tracks : "has stems"
    tracks ||--o{ stems : "has stem files"
    tracks ||--o{ generation_tag_usage : "uses tags"
    
    suno_meta_tags ||--o{ tag_relationships : "relates to"
    suno_meta_tags ||--o{ style_tag_mappings : "mapped to styles"
    suno_meta_tags ||--o{ user_tag_preferences : "preferred by"
    suno_meta_tags ||--o{ generation_tag_usage : "used in"
    
    music_styles ||--o{ style_tag_mappings : "has recommended tags"
    music_styles ||--o{ user_tag_preferences : "preferred by"
    music_styles ||--o{ generation_tag_usage : "used in"
    music_styles ||--o{ prompt_templates : "uses as template"
    
    tasks ||--o{ task_categories : "categorized by"
    
    profiles {
        UUID id PK
        UUID user_id FK
        text telegram_username
        text telegram_first_name
        text telegram_last_name
        text phone_number
        text avatar_url
        json telegram_data
        text referral_code
        UUID referred_by
        boolean is_premium
        text app_role
        integer credits
        numeric daily_usage
        json analytics
        timestamp created_at
        timestamp updated_at
    }
    
    tracks {
        UUID id PK
        UUID user_id FK
        UUID project_id FK
        text title
        text prompt
        text lyrics
        text style
        text tags
        text audio_url
        text cover_url
        text streaming_url
        text local_audio_url
        text local_cover_url
        text status
        text provider
        text model_name
        text suno_model
        text generation_mode
        text vocal_gender
        numeric style_weight
        text negative_tags
        boolean has_vocals
        boolean is_public
        integer play_count
        integer duration_seconds
        text suno_id
        text suno_task_id
        text error_message
        timestamp created_at
        timestamp updated_at
    }
    
    music_projects {
        UUID id PK
        UUID user_id FK
        text title
        text project_type
        text genre
        text mood
        text status
        text description
        text concept
        timestamp release_date
        text target_audience
        text[] reference_artists
        text[] reference_tracks
        json bpm_range
        text key_signature
        UUID primary_artist_id
        text label_name
        text copyright_info
        boolean is_commercial
        boolean is_public
        text language
        json ai_context
        text cover_url
        timestamp created_at
        timestamp updated_at
    }
    
    tasks {
        UUID id PK
        UUID user_id FK
        UUID category_id FK
        text title
        text description
        text status
        integer position
        integer priority
        date due_date
        timestamp reminder_at
        text[] tags
        text[] attachments
        UUID parent_task_id
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    suno_meta_tags {
        UUID id PK
        text tag_name
        text category
        text description
        text syntax_format
        boolean is_explicit_format
        text[] compatible_models
        text[] usage_examples
        timestamp created_at
        timestamp updated_at
    }
    
    music_styles {
        UUID id PK
        text style_name
        text primary_genre
        text[] geographic_influence
        text[] mood_atmosphere
        boolean is_fusion
        integer component_count
        integer popularity_score
        text description
        timestamp created_at
        timestamp updated_at
    }
```

## 🔗 Key Relationships & Dependencies

### User Management
- **Telegram Integration**: Users authenticate via Telegram Web App
- **Profiles**: Each user has a profile with subscription status and credits
- **Role System**: Admin, Moderator, User roles with different permissions

### Music Generation Pipeline
1. **Input Processing**: User provides prompt + optional tags + style preferences
2. **Tag System**: 174+ meta-tags categorized into 10 categories
3. **Style System**: 277+ music styles with geographic/mood influences
4. **AI Integration**: Suno API v5 for music generation
5. **Track Management**: Generated tracks stored with analytics

### Project Organization
- **Music Projects**: Groups tracks into albums/EPs
- **Task Management**: Kanban-style task system for project management
- **Asset Management**: Cover art, stems, and project files

## 🎯 Core Data Models

### Track Model
```typescript
interface Track {
  id: string;
  user_id: string;
  project_id?: string;
  title?: string;
  prompt: string;
  lyrics?: string;
  style?: string;
  tags?: string;
  audio_url?: string;
  cover_url?: string;
  status: string; // 'generating' | 'completed' | 'failed'
  provider?: string; // 'suno'
  model_name?: string; // 'chirp-v4', 'chirp-crow', etc.
  duration_seconds?: number;
  suno_task_id?: string;
  is_public?: boolean;
  play_count?: number;
  created_at: string;
}
```

### Project Model
```typescript
interface Project {
  id: string;
  user_id: string;
  title: string;
  project_type: 'single' | 'ep' | 'album' | 'ost' | 'background_music' | 'jingle' | 'compilation' | 'mixtape';
  genre?: string;
  mood?: string;
  status?: string;
  description?: string;
  concept?: string;
  release_date?: string;
  reference_artists?: string[];
  reference_tracks?: string[];
  bpm_range?: any;
  key_signature?: string;
  cover_url?: string;
  is_public?: boolean;
  is_commercial?: boolean;
}
```

### User Preferences Model
```typescript
interface UserPreferences {
  tag_id: string;
  style_id?: string;
  usage_count: number;
  is_favorite: boolean;
  last_used_at?: string;
}
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant TG as Telegram
    participant App as MusicVerse App
    participant SB as Supabase
    participant Suno as Suno AI
    
    U->>TG: Open Mini App
    TG->>App: Launch with auth data
    App->>SB: Validate Telegram initData
    SB->>SB: Create/Update user profile
    SB->>App: Return user data + preferences
    
    U->>App: Submit music prompt
    App->>SB: Save generation request
    SB->>App: Return task ID
    App->>Suno: Send generation request
    Suno->>App: Return Suno task ID
    App->>SB: Update task with Suno ID
    
    loop Polling
        App->>Suno: Check task status
        Suno->>App: Return progress
        App->>SB: Update task progress
    end
    
    Suno->>App: Generated track ready
    App->>SB: Create track record
    App->>U: Notify completion
    
    U->>App: Click play
    App->>SB: Log play event
    App->>U: Stream audio
```

## 📊 Analytics & Insights

### Track Analytics
- Play counts, likes, and user engagement
- Tag usage patterns and preferences
- Generation success rates by model/style

### User Analytics
- Daily usage tracking
- Credit consumption patterns
- Feature adoption rates

### System Analytics
- API usage and response times
- Error rates and retry patterns
- Resource utilization

## 🔐 Security & Access Control

### Row Level Security (RLS)
- User data isolation
- Public vs private content management
- Admin role-based access

### Authentication
- Telegram Web App validation
- Session management
- Secure API access

## 🚀 Performance Optimizations

### Database Indexes
- User-specific queries
- Tag and style filtering
- Analytics aggregations

### Caching Strategy
- User preferences caching
- Public content caching
- API response caching

### Query Optimization
- TanStack Query stale time: 5 minutes
- Pagination for large datasets
- Selective revalidation

## 📁 File Structure Integration

### Key Directories
- `src/hooks/`: Data fetching and state management
- `src/services/`: External service integrations
- `src/components/`: Reusable UI components
- `src/pages/`: Main application pages
- `src/integrations/`: Third-party integrations
- `src/types/`: TypeScript type definitions

### Database Migrations
- `supabase/migrations/`: Schema evolution
- `supabase/functions/`: Edge functions
- `public/`: Static assets and images

This comprehensive data structure provides the foundation for MusicVerse AI's sophisticated music generation and management capabilities, supporting both individual user experiences and collaborative music creation workflows.
