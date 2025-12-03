export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_usage_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          estimated_cost: number | null
          id: string
          method: string | null
          request_body: Json | null
          response_body: Json | null
          response_status: number | null
          service: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          estimated_cost?: number | null
          id?: string
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          service: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          estimated_cost?: number | null
          id?: string
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          service?: string
          user_id?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          genre_tags: string[] | null
          id: string
          is_ai_generated: boolean | null
          is_public: boolean | null
          metadata: Json | null
          mood_tags: string[] | null
          name: string
          style_description: string | null
          suno_persona_id: string | null
          updated_at: string | null
          user_id: string
          voice_sample_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          genre_tags?: string[] | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          mood_tags?: string[] | null
          name: string
          style_description?: string | null
          suno_persona_id?: string | null
          updated_at?: string | null
          user_id: string
          voice_sample_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          genre_tags?: string[] | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          mood_tags?: string[] | null
          name?: string
          style_description?: string | null
          suno_persona_id?: string | null
          updated_at?: string | null
          user_id?: string
          voice_sample_url?: string | null
        }
        Relationships: []
      }
      audio_analysis: {
        Row: {
          analysis_metadata: Json | null
          analysis_type: string
          approachability: string | null
          arousal: number | null
          beats_data: Json | null
          bpm: number | null
          created_at: string
          engagement: string | null
          full_response: string | null
          genre: string | null
          id: string
          instruments: string[] | null
          key_signature: string | null
          mood: string | null
          structure: string | null
          style_description: string | null
          tempo: string | null
          track_id: string
          updated_at: string
          user_id: string
          valence: number | null
        }
        Insert: {
          analysis_metadata?: Json | null
          analysis_type: string
          approachability?: string | null
          arousal?: number | null
          beats_data?: Json | null
          bpm?: number | null
          created_at?: string
          engagement?: string | null
          full_response?: string | null
          genre?: string | null
          id?: string
          instruments?: string[] | null
          key_signature?: string | null
          mood?: string | null
          structure?: string | null
          style_description?: string | null
          tempo?: string | null
          track_id: string
          updated_at?: string
          user_id: string
          valence?: number | null
        }
        Update: {
          analysis_metadata?: Json | null
          analysis_type?: string
          approachability?: string | null
          arousal?: number | null
          beats_data?: Json | null
          bpm?: number | null
          created_at?: string
          engagement?: string | null
          full_response?: string | null
          genre?: string | null
          id?: string
          instruments?: string[] | null
          key_signature?: string | null
          mood?: string | null
          structure?: string | null
          style_description?: string | null
          tempo?: string | null
          track_id?: string
          updated_at?: string
          user_id?: string
          valence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_analysis_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_tag_usage: {
        Row: {
          created_at: string
          id: string
          prompt_text: string | null
          style_id: string | null
          success: boolean | null
          tags_used: string[]
          track_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_text?: string | null
          style_id?: string | null
          success?: boolean | null
          tags_used: string[]
          track_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_text?: string | null
          style_id?: string | null
          success?: boolean | null
          tags_used?: string[]
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_tag_usage_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "music_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_tag_usage_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_tasks: {
        Row: {
          audio_clips: Json | null
          callback_received_at: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          expected_clips: number | null
          generation_mode: string | null
          id: string
          model_used: string | null
          prompt: string
          received_clips: number | null
          source: string | null
          status: string
          suno_task_id: string | null
          telegram_chat_id: number | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_clips?: Json | null
          callback_received_at?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expected_clips?: number | null
          generation_mode?: string | null
          id?: string
          model_used?: string | null
          prompt: string
          received_clips?: number | null
          source?: string | null
          status?: string
          suno_task_id?: string | null
          telegram_chat_id?: number | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_clips?: Json | null
          callback_received_at?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expected_clips?: number | null
          generation_mode?: string | null
          id?: string
          model_used?: string | null
          prompt?: string
          received_clips?: number | null
          source?: string | null
          status?: string
          suno_task_id?: string | null
          telegram_chat_id?: number | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      music_projects: {
        Row: {
          ai_context: Json | null
          bpm_range: unknown
          concept: string | null
          context_vector: Json | null
          copyright_info: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_commercial: boolean | null
          is_public: boolean | null
          key_signature: string | null
          label_name: string | null
          language: string | null
          mood: string | null
          primary_artist_id: string | null
          project_type: Database["public"]["Enums"]["project_type"] | null
          reference_artists: string[] | null
          reference_tracks: string[] | null
          release_date: string | null
          status: string | null
          target_audience: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_context?: Json | null
          bpm_range?: unknown
          concept?: string | null
          context_vector?: Json | null
          copyright_info?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_commercial?: boolean | null
          is_public?: boolean | null
          key_signature?: string | null
          label_name?: string | null
          language?: string | null
          mood?: string | null
          primary_artist_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          reference_artists?: string[] | null
          reference_tracks?: string[] | null
          release_date?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_context?: Json | null
          bpm_range?: unknown
          concept?: string | null
          context_vector?: Json | null
          copyright_info?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_commercial?: boolean | null
          is_public?: boolean | null
          key_signature?: string | null
          label_name?: string | null
          language?: string | null
          mood?: string | null
          primary_artist_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          reference_artists?: string[] | null
          reference_tracks?: string[] | null
          release_date?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_projects_primary_artist_id_fkey"
            columns: ["primary_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      music_styles: {
        Row: {
          component_count: number | null
          created_at: string
          description: string | null
          geographic_influence: string[] | null
          id: string
          is_fusion: boolean | null
          mood_atmosphere: string[] | null
          popularity_score: number | null
          primary_genre: string | null
          style_name: string
          updated_at: string
        }
        Insert: {
          component_count?: number | null
          created_at?: string
          description?: string | null
          geographic_influence?: string[] | null
          id?: string
          is_fusion?: boolean | null
          mood_atmosphere?: string[] | null
          popularity_score?: number | null
          primary_genre?: string | null
          style_name: string
          updated_at?: string
        }
        Update: {
          component_count?: number | null
          created_at?: string
          description?: string | null
          geographic_influence?: string[] | null
          id?: string
          is_fusion?: boolean | null
          mood_atmosphere?: string[] | null
          popularity_score?: number | null
          primary_genre?: string | null
          style_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          language_code: string | null
          last_name: string | null
          photo_url: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id: number | null
          telegram_id: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id?: number | null
          telegram_id: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id?: number | null
          telegram_id?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      project_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          height: number | null
          id: string
          is_primary: boolean | null
          metadata: Json | null
          mime_type: string | null
          project_id: string
          width: number | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          project_id: string
          width?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "music_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tracks: {
        Row: {
          collab_artist_id: string | null
          created_at: string | null
          duration_target: number | null
          id: string
          notes: string | null
          position: number
          project_id: string
          recommended_structure: string | null
          recommended_tags: string[] | null
          status: string | null
          style_prompt: string | null
          title: string
          track_id: string | null
          updated_at: string | null
        }
        Insert: {
          collab_artist_id?: string | null
          created_at?: string | null
          duration_target?: number | null
          id?: string
          notes?: string | null
          position: number
          project_id: string
          recommended_structure?: string | null
          recommended_tags?: string[] | null
          status?: string | null
          style_prompt?: string | null
          title: string
          track_id?: string | null
          updated_at?: string | null
        }
        Update: {
          collab_artist_id?: string | null
          created_at?: string | null
          duration_target?: number | null
          id?: string
          notes?: string | null
          position?: number
          project_id?: string
          recommended_structure?: string | null
          recommended_tags?: string[] | null
          status?: string | null
          style_prompt?: string | null
          title?: string
          track_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tracks_collab_artist_id_fkey"
            columns: ["collab_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "music_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          name: string
          style_id: string | null
          tags: string[]
          template_text: string
          updated_at: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name: string
          style_id?: string | null
          tags: string[]
          template_text: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name?: string
          style_id?: string | null
          tags?: string[]
          template_text?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "music_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      stem_separation_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mode: string
          original_audio_id: string
          original_task_id: string
          separation_task_id: string
          status: string
          track_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mode?: string
          original_audio_id: string
          original_task_id: string
          separation_task_id: string
          status?: string
          track_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mode?: string
          original_audio_id?: string
          original_task_id?: string
          separation_task_id?: string
          status?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stem_separation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      style_tag_mappings: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          relevance_score: number | null
          style_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relevance_score?: number | null
          style_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relevance_score?: number | null
          style_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_tag_mappings_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "music_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "suno_meta_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      suno_meta_tags: {
        Row: {
          category: Database["public"]["Enums"]["tag_category"]
          compatible_models: string[] | null
          created_at: string
          description: string | null
          id: string
          is_explicit_format: boolean | null
          syntax_format: string | null
          tag_name: string
          updated_at: string
          usage_examples: string[] | null
        }
        Insert: {
          category: Database["public"]["Enums"]["tag_category"]
          compatible_models?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_explicit_format?: boolean | null
          syntax_format?: string | null
          tag_name: string
          updated_at?: string
          usage_examples?: string[] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["tag_category"]
          compatible_models?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_explicit_format?: boolean | null
          syntax_format?: string | null
          tag_name?: string
          updated_at?: string
          usage_examples?: string[] | null
        }
        Relationships: []
      }
      suno_models: {
        Row: {
          created_at: string
          id: string
          max_prompt_length: number | null
          max_style_length: number | null
          max_title_length: number | null
          model_name: string
          status: Database["public"]["Enums"]["suno_model_status"]
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_prompt_length?: number | null
          max_style_length?: number | null
          max_title_length?: number | null
          model_name: string
          status?: Database["public"]["Enums"]["suno_model_status"]
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          max_prompt_length?: number | null
          max_style_length?: number | null
          max_title_length?: number | null
          model_name?: string
          status?: Database["public"]["Enums"]["suno_model_status"]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      tag_relationships: {
        Row: {
          created_at: string
          description: string | null
          id: string
          related_tag_id: string
          relationship_type: string
          strength: number | null
          tag_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          related_tag_id: string
          relationship_type: string
          strength?: number | null
          tag_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          related_tag_id?: string
          relationship_type?: string
          strength?: number | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_relationships_related_tag_id_fkey"
            columns: ["related_tag_id"]
            isOneToOne: false
            referencedRelation: "suno_meta_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_relationships_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "suno_meta_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      track_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          track_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          track_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          track_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_analytics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_change_log: {
        Row: {
          ai_model_used: string | null
          change_type: string
          changed_by: string
          created_at: string | null
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          prompt_used: string | null
          track_id: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          ai_model_used?: string | null
          change_type: string
          changed_by: string
          created_at?: string | null
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          prompt_used?: string | null
          track_id: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          ai_model_used?: string | null
          change_type?: string
          changed_by?: string
          created_at?: string | null
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          prompt_used?: string | null
          track_id?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_change_log_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_change_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_stems: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          separation_mode: string | null
          stem_type: string
          track_id: string
          version_id: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          separation_mode?: string | null
          stem_type: string
          track_id: string
          version_id?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          separation_mode?: string | null
          stem_type?: string
          track_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_stems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_stems_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      track_versions: {
        Row: {
          audio_url: string
          clip_index: number | null
          cover_url: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_primary: boolean | null
          metadata: Json | null
          parent_version_id: string | null
          track_id: string
          version_label: string | null
          version_type: string | null
        }
        Insert: {
          audio_url: string
          clip_index?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          parent_version_id?: string | null
          track_id: string
          version_label?: string | null
          version_type?: string | null
        }
        Update: {
          audio_url?: string
          clip_index?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          parent_version_id?: string | null
          track_id?: string
          version_label?: string | null
          version_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_versions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          active_version_id: string | null
          artist_avatar_url: string | null
          artist_id: string | null
          artist_name: string | null
          audio_url: string | null
          cover_url: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          generation_mode: string | null
          has_stems: boolean | null
          has_vocals: boolean | null
          id: string
          is_instrumental: boolean | null
          is_public: boolean | null
          local_audio_url: string | null
          local_cover_url: string | null
          lyrics: string | null
          model_name: string | null
          negative_tags: string | null
          play_count: number | null
          project_id: string | null
          prompt: string
          provider: string | null
          status: string | null
          streaming_url: string | null
          style: string | null
          style_weight: number | null
          suno_id: string | null
          suno_model: string | null
          suno_task_id: string | null
          tags: string | null
          telegram_cover_file_id: string | null
          telegram_file_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          vocal_gender: string | null
        }
        Insert: {
          active_version_id?: string | null
          artist_avatar_url?: string | null
          artist_id?: string | null
          artist_name?: string | null
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generation_mode?: string | null
          has_stems?: boolean | null
          has_vocals?: boolean | null
          id?: string
          is_instrumental?: boolean | null
          is_public?: boolean | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          lyrics?: string | null
          model_name?: string | null
          negative_tags?: string | null
          play_count?: number | null
          project_id?: string | null
          prompt: string
          provider?: string | null
          status?: string | null
          streaming_url?: string | null
          style?: string | null
          style_weight?: number | null
          suno_id?: string | null
          suno_model?: string | null
          suno_task_id?: string | null
          tags?: string | null
          telegram_cover_file_id?: string | null
          telegram_file_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          vocal_gender?: string | null
        }
        Update: {
          active_version_id?: string | null
          artist_avatar_url?: string | null
          artist_id?: string | null
          artist_name?: string | null
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generation_mode?: string | null
          has_stems?: boolean | null
          has_vocals?: boolean | null
          id?: string
          is_instrumental?: boolean | null
          is_public?: boolean | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          lyrics?: string | null
          model_name?: string | null
          negative_tags?: string | null
          play_count?: number | null
          project_id?: string | null
          prompt?: string
          provider?: string | null
          status?: string | null
          streaming_url?: string | null
          style?: string | null
          style_weight?: number | null
          suno_id?: string | null
          suno_model?: string | null
          suno_task_id?: string | null
          tags?: string | null
          telegram_cover_file_id?: string | null
          telegram_file_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          vocal_gender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_active_version_id_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "music_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          id: string
          notify_completed: boolean | null
          notify_failed: boolean | null
          notify_progress: boolean | null
          notify_stem_ready: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_completed?: boolean | null
          notify_failed?: boolean | null
          notify_progress?: boolean | null
          notify_stem_ready?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_completed?: boolean | null
          notify_failed?: boolean | null
          notify_progress?: boolean | null
          notify_stem_ready?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          skipped: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          skipped?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          skipped?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tag_preferences: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          style_id: string | null
          tag_id: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          style_id?: string | null
          tag_id: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          style_id?: string | null
          tag_id?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tag_preferences_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "music_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tag_preferences_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "suno_meta_tags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_suno_prompt: {
        Args: { _style_id?: string; _tag_ids: string[] }
        Returns: string
      }
      get_complementary_tags: {
        Args: { _max_depth?: number; _tag_id: string }
        Returns: {
          depth: number
          relationship_type: string
          strength: number
          tag_id: string
          tag_name: string
        }[]
      }
      get_track_analytics_summary: {
        Args: { _time_period?: unknown; _track_id: string }
        Returns: {
          plays_by_day: Json
          total_downloads: number
          total_likes: number
          total_plays: number
          total_shares: number
          unique_listeners: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_track_play_count: {
        Args: { track_id_param: string }
        Returns: undefined
      }
      is_premium_or_admin: { Args: { _user_id: string }; Returns: boolean }
      recommend_styles_for_user: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          recommendation_score: number
          style_id: string
          style_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      project_type:
        | "single"
        | "ep"
        | "album"
        | "ost"
        | "background_music"
        | "jingle"
        | "compilation"
        | "mixtape"
      subscription_tier: "free" | "premium" | "enterprise"
      suno_model_status: "deprecated" | "active" | "latest"
      tag_category:
        | "structure"
        | "vocal"
        | "instrument"
        | "genre_style"
        | "mood_energy"
        | "production_texture"
        | "effect_processing"
        | "special_effects"
        | "transition_dynamics"
        | "format"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "completed" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      project_type: [
        "single",
        "ep",
        "album",
        "ost",
        "background_music",
        "jingle",
        "compilation",
        "mixtape",
      ],
      subscription_tier: ["free", "premium", "enterprise"],
      suno_model_status: ["deprecated", "active", "latest"],
      tag_category: [
        "structure",
        "vocal",
        "instrument",
        "genre_style",
        "mood_energy",
        "production_texture",
        "effect_processing",
        "special_effects",
        "transition_dynamics",
        "format",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "completed", "archived"],
    },
  },
} as const
