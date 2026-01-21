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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string | null
          credits_reward: number
          description: string
          experience_reward: number
          icon: string
          id: string
          is_hidden: boolean | null
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          credits_reward?: number
          description: string
          experience_reward?: number
          icon: string
          id?: string
          is_hidden?: boolean | null
          name: string
          requirement_type: string
          requirement_value?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          credits_reward?: number
          description?: string
          experience_reward?: number
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      analytics_aggregates: {
        Row: {
          created_at: string
          dimension: string | null
          dimension_value: string | null
          id: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
          sample_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension?: string | null
          dimension_value?: string | null
          id?: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
          sample_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension?: string | null
          dimension_value?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          period_end?: string
          period_start?: string
          sample_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
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
      api_usage_logs_archive: {
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
          {
            foreignKeyName: "audio_analysis_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_analysis_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          created_at: string
          failed_count: number | null
          id: string
          image_url: string | null
          message: string
          sender_id: string
          sent_count: number | null
          target_type: string | null
          title: string
        }
        Insert: {
          created_at?: string
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message: string
          sender_id: string
          sent_count?: number | null
          target_type?: string | null
          title: string
        }
        Update: {
          created_at?: string
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message?: string
          sender_id?: string
          sent_count?: number | null
          target_type?: string | null
          title?: string
        }
        Relationships: []
      }
      broadcast_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          message: string
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          message: string
          name: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          message?: string
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_moderated: boolean | null
          likes_count: number | null
          parent_id: string | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_audit_log: {
        Row: {
          action_category: string | null
          action_type: string
          actor_type: string
          ai_model_used: string | null
          chain_id: string | null
          content_hash: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          input_data_hash: string | null
          input_metadata: Json | null
          output_metadata: Json | null
          parent_audit_id: string | null
          prompt_hash: string | null
          prompt_used: string | null
          user_id: string
          version_id: string | null
        }
        Insert: {
          action_category?: string | null
          action_type: string
          actor_type: string
          ai_model_used?: string | null
          chain_id?: string | null
          content_hash?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          input_data_hash?: string | null
          input_metadata?: Json | null
          output_metadata?: Json | null
          parent_audit_id?: string | null
          prompt_hash?: string | null
          prompt_used?: string | null
          user_id: string
          version_id?: string | null
        }
        Update: {
          action_category?: string | null
          action_type?: string
          actor_type?: string
          ai_model_used?: string | null
          chain_id?: string | null
          content_hash?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          input_data_hash?: string | null
          input_metadata?: Json | null
          output_metadata?: Json | null
          parent_audit_id?: string | null
          prompt_hash?: string | null
          prompt_used?: string | null
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_audit_log_parent_audit_id_fkey"
            columns: ["parent_audit_id"]
            isOneToOne: false
            referencedRelation: "content_audit_log"
            referencedColumns: ["id"]
          },
        ]
      }
      content_deposits: {
        Row: {
          confirmed_at: string | null
          created_at: string
          deposit_document: Json
          document_hash: string
          entity_id: string
          entity_type: string
          external_deposit_id: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          deposit_document: Json
          document_hash: string
          entity_id: string
          entity_type: string
          external_deposit_id?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          deposit_document?: Json
          document_hash?: string
          entity_id?: string
          entity_type?: string
          external_deposit_id?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cover_thumbnails: {
        Row: {
          blurhash: string | null
          created_at: string | null
          dominant_color: string | null
          error_message: string | null
          id: string
          large_url: string | null
          medium_url: string | null
          original_url: string
          small_url: string | null
          status: string | null
          track_id: string
          updated_at: string | null
        }
        Insert: {
          blurhash?: string | null
          created_at?: string | null
          dominant_color?: string | null
          error_message?: string | null
          id?: string
          large_url?: string | null
          medium_url?: string | null
          original_url: string
          small_url?: string | null
          status?: string | null
          track_id: string
          updated_at?: string | null
        }
        Update: {
          blurhash?: string | null
          created_at?: string | null
          dominant_color?: string | null
          error_message?: string | null
          id?: string
          large_url?: string | null
          medium_url?: string | null
          original_url?: string
          small_url?: string | null
          status?: string | null
          track_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_thumbnails_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_thumbnails_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_thumbnails_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      deeplink_analytics: {
        Row: {
          campaign: string | null
          conversion_type: string | null
          converted: boolean | null
          created_at: string | null
          deeplink_type: string
          deeplink_value: string | null
          id: string
          metadata: Json | null
          referrer: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          campaign?: string | null
          conversion_type?: string | null
          converted?: boolean | null
          created_at?: string | null
          deeplink_type: string
          deeplink_value?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          campaign?: string | null
          conversion_type?: string | null
          converted?: boolean | null
          created_at?: string | null
          deeplink_type?: string
          deeplink_value?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      economy_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          app_version: string | null
          component: string | null
          context: Json | null
          created_at: string
          error_fingerprint: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          platform: string | null
          session_id: string | null
          severity: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string
          error_fingerprint?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          platform?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string
          error_fingerprint?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs_archive: {
        Row: {
          app_version: string | null
          component: string | null
          context: Json | null
          created_at: string
          error_fingerprint: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          platform: string | null
          session_id: string | null
          severity: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string
          error_fingerprint?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          platform?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string
          error_fingerprint?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      failed_telegram_notifications: {
        Row: {
          chat_id: number
          created_at: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number
          method: string
          next_retry_at: string | null
          payload: Json
          retry_count: number
          status: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          method: string
          next_retry_at?: string | null
          payload: Json
          retry_count?: number
          status?: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          method?: string
          next_retry_at?: string | null
          payload?: Json
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          icon: string | null
          id: string
          is_admin_only: boolean | null
          key: string
          metadata: Json | null
          min_tier: string | null
          name: string
          rollout_percentage: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          icon?: string | null
          id?: string
          is_admin_only?: boolean | null
          key: string
          metadata?: Json | null
          min_tier?: string | null
          name: string
          rollout_percentage?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          icon?: string | null
          id?: string
          is_admin_only?: boolean | null
          key?: string
          metadata?: Json | null
          min_tier?: string | null
          name?: string
          rollout_percentage?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feature_permissions: {
        Row: {
          created_at: string | null
          credits_per_use: number | null
          daily_limit: number | null
          description: string | null
          feature_key: string
          id: string
          is_admin_only: boolean | null
          min_tier: string
          name: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_per_use?: number | null
          daily_limit?: number | null
          description?: string | null
          feature_key: string
          id?: string
          is_admin_only?: boolean | null
          min_tier?: string
          name?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_per_use?: number | null
          daily_limit?: number | null
          description?: string | null
          feature_key?: string
          id?: string
          is_admin_only?: boolean | null
          min_tier?: string
          name?: Json
          updated_at?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "generation_tag_usage_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_tag_usage_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
          streaming_ready_at: string | null
          suno_task_id: string | null
          telegram_chat_id: number | null
          telegram_message_id: number | null
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
          streaming_ready_at?: string | null
          suno_task_id?: string | null
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
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
          streaming_ready_at?: string | null
          suno_task_id?: string | null
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
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
          {
            foreignKeyName: "generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      guitar_recordings: {
        Row: {
          analysis_status: Json | null
          audio_url: string
          beats: Json | null
          bpm: number | null
          chords: Json | null
          created_at: string
          downbeats: Json | null
          duration_seconds: number | null
          generated_tags: string[] | null
          gp5_url: string | null
          id: string
          key: string | null
          midi_quant_url: string | null
          midi_url: string | null
          musicxml_url: string | null
          notes: Json | null
          pdf_url: string | null
          strumming: Json | null
          style_analysis: Json | null
          style_description: string | null
          time_signature: string | null
          title: string | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_status?: Json | null
          audio_url: string
          beats?: Json | null
          bpm?: number | null
          chords?: Json | null
          created_at?: string
          downbeats?: Json | null
          duration_seconds?: number | null
          generated_tags?: string[] | null
          gp5_url?: string | null
          id?: string
          key?: string | null
          midi_quant_url?: string | null
          midi_url?: string | null
          musicxml_url?: string | null
          notes?: Json | null
          pdf_url?: string | null
          strumming?: Json | null
          style_analysis?: Json | null
          style_description?: string | null
          time_signature?: string | null
          title?: string | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_status?: Json | null
          audio_url?: string
          beats?: Json | null
          bpm?: number | null
          chords?: Json | null
          created_at?: string
          downbeats?: Json | null
          duration_seconds?: number | null
          generated_tags?: string[] | null
          gp5_url?: string | null
          id?: string
          key?: string | null
          midi_quant_url?: string | null
          midi_url?: string | null
          musicxml_url?: string | null
          notes?: Json | null
          pdf_url?: string | null
          strumming?: Json | null
          style_analysis?: Json | null
          style_description?: string | null
          time_signature?: string | null
          title?: string | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guitar_recordings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guitar_recordings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guitar_recordings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      health_alerts: {
        Row: {
          alert_type: string
          created_at: string
          degraded_services: string[] | null
          id: string
          is_test: boolean | null
          metrics: Json | null
          overall_status: string
          recipients_count: number | null
          resolution_note: string | null
          resolved_at: string | null
          unhealthy_services: string[] | null
        }
        Insert: {
          alert_type?: string
          created_at?: string
          degraded_services?: string[] | null
          id?: string
          is_test?: boolean | null
          metrics?: Json | null
          overall_status: string
          recipients_count?: number | null
          resolution_note?: string | null
          resolved_at?: string | null
          unhealthy_services?: string[] | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          degraded_services?: string[] | null
          id?: string
          is_test?: boolean | null
          metrics?: Json | null
          overall_status?: string
          recipients_count?: number | null
          resolution_note?: string | null
          resolved_at?: string | null
          unhealthy_services?: string[] | null
        }
        Relationships: []
      }
      inline_result_chosen: {
        Row: {
          action_taken: string | null
          created_at: string | null
          id: string
          inline_message_id: string | null
          query: string | null
          result_id: string
          result_type: string | null
          telegram_user_id: number
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          inline_message_id?: string | null
          query?: string | null
          result_id: string
          result_type?: string | null
          telegram_user_id: number
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          inline_message_id?: string | null
          query?: string | null
          result_id?: string
          result_type?: string | null
          telegram_user_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inline_result_chosen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inline_result_chosen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inline_result_chosen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inline_search_history: {
        Row: {
          category: string | null
          created_at: string
          id: string
          query: string | null
          results_count: number | null
          telegram_user_id: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          query?: string | null
          results_count?: number | null
          telegram_user_id?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          query?: string | null
          results_count?: number | null
          telegram_user_id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      klangio_analysis_logs: {
        Row: {
          audio_url: string | null
          beats_count: number | null
          bpm: number | null
          chords_count: number | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          fetch_errors: Json | null
          files: Json | null
          id: string
          job_id: string | null
          key_detected: string | null
          mode: string
          model: string | null
          notes_count: number | null
          raw_request: Json | null
          raw_response: Json | null
          requested_outputs: string[] | null
          status: string
          time_signature: string | null
          upload_errors: Json | null
          user_id: string
          vocabulary: string | null
        }
        Insert: {
          audio_url?: string | null
          beats_count?: number | null
          bpm?: number | null
          chords_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          fetch_errors?: Json | null
          files?: Json | null
          id?: string
          job_id?: string | null
          key_detected?: string | null
          mode: string
          model?: string | null
          notes_count?: number | null
          raw_request?: Json | null
          raw_response?: Json | null
          requested_outputs?: string[] | null
          status?: string
          time_signature?: string | null
          upload_errors?: Json | null
          user_id: string
          vocabulary?: string | null
        }
        Update: {
          audio_url?: string | null
          beats_count?: number | null
          bpm?: number | null
          chords_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          fetch_errors?: Json | null
          files?: Json | null
          id?: string
          job_id?: string | null
          key_detected?: string | null
          mode?: string
          model?: string | null
          notes_count?: number | null
          raw_request?: Json | null
          raw_response?: Json | null
          requested_outputs?: string[] | null
          status?: string
          time_signature?: string | null
          upload_errors?: Json | null
          user_id?: string
          vocabulary?: string | null
        }
        Relationships: []
      }
      lyrics_section_notes: {
        Row: {
          audio_note_url: string | null
          created_at: string | null
          id: string
          lyrics_template_id: string | null
          notes: string | null
          position: number | null
          reference_analysis: Json | null
          reference_audio_url: string | null
          section_id: string
          section_type: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_note_url?: string | null
          created_at?: string | null
          id?: string
          lyrics_template_id?: string | null
          notes?: string | null
          position?: number | null
          reference_analysis?: Json | null
          reference_audio_url?: string | null
          section_id: string
          section_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_note_url?: string | null
          created_at?: string | null
          id?: string
          lyrics_template_id?: string | null
          notes?: string | null
          position?: number | null
          reference_analysis?: Json | null
          reference_audio_url?: string | null
          section_id?: string
          section_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_section_notes_lyrics_template_id_fkey"
            columns: ["lyrics_template_id"]
            isOneToOne: false
            referencedRelation: "lyrics_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lyrics_templates: {
        Row: {
          created_at: string
          genre: string | null
          id: string
          language: string | null
          lyrics: string
          mood: string | null
          name: string
          structure: string | null
          style: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre?: string | null
          id?: string
          language?: string | null
          lyrics: string
          mood?: string | null
          name: string
          structure?: string | null
          style?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre?: string | null
          id?: string
          language?: string | null
          lyrics?: string
          mood?: string | null
          name?: string
          structure?: string | null
          style?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lyrics_versions: {
        Row: {
          ai_model_used: string | null
          ai_prompt_used: string | null
          change_description: string | null
          change_type: string
          created_at: string
          id: string
          is_current: boolean | null
          lyrics: string
          lyrics_template_id: string | null
          project_track_id: string | null
          sections_data: Json | null
          tags: string[] | null
          user_id: string
          version_name: string | null
          version_number: number
        }
        Insert: {
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          change_description?: string | null
          change_type: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          lyrics: string
          lyrics_template_id?: string | null
          project_track_id?: string | null
          sections_data?: Json | null
          tags?: string[] | null
          user_id: string
          version_name?: string | null
          version_number?: number
        }
        Update: {
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          change_description?: string | null
          change_type?: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          lyrics?: string
          lyrics_template_id?: string | null
          project_track_id?: string | null
          sections_data?: Json | null
          tags?: string[] | null
          user_id?: string
          version_name?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_versions_lyrics_template_id_fkey"
            columns: ["lyrics_template_id"]
            isOneToOne: false
            referencedRelation: "lyrics_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lyrics_versions_project_track_id_fkey"
            columns: ["project_track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          created_at: string
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "safe_public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profile_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "safe_public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profile_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "safe_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      music_projects: {
        Row: {
          ai_context: Json | null
          approved_tracks_count: number | null
          banner_prompt: string | null
          banner_url: string | null
          bpm_range: unknown
          color_palette: Json | null
          concept: string | null
          context_vector: Json | null
          copyright_info: string | null
          cover_prompt: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          image_style: string | null
          is_commercial: boolean | null
          is_public: boolean | null
          key_signature: string | null
          label_name: string | null
          language: string | null
          mood: string | null
          primary_artist_id: string | null
          project_type: Database["public"]["Enums"]["project_type"] | null
          published_at: string | null
          published_by: string | null
          reference_artists: string[] | null
          reference_tracks: string[] | null
          release_date: string | null
          status: string | null
          target_audience: string | null
          title: string
          total_tracks_count: number | null
          type: string | null
          typography_style: string | null
          updated_at: string | null
          user_id: string
          visual_aesthetic: string | null
          visual_keywords: string[] | null
        }
        Insert: {
          ai_context?: Json | null
          approved_tracks_count?: number | null
          banner_prompt?: string | null
          banner_url?: string | null
          bpm_range?: unknown
          color_palette?: Json | null
          concept?: string | null
          context_vector?: Json | null
          copyright_info?: string | null
          cover_prompt?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          image_style?: string | null
          is_commercial?: boolean | null
          is_public?: boolean | null
          key_signature?: string | null
          label_name?: string | null
          language?: string | null
          mood?: string | null
          primary_artist_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          published_at?: string | null
          published_by?: string | null
          reference_artists?: string[] | null
          reference_tracks?: string[] | null
          release_date?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          total_tracks_count?: number | null
          type?: string | null
          typography_style?: string | null
          updated_at?: string | null
          user_id: string
          visual_aesthetic?: string | null
          visual_keywords?: string[] | null
        }
        Update: {
          ai_context?: Json | null
          approved_tracks_count?: number | null
          banner_prompt?: string | null
          banner_url?: string | null
          bpm_range?: unknown
          color_palette?: Json | null
          concept?: string | null
          context_vector?: Json | null
          copyright_info?: string | null
          cover_prompt?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          image_style?: string | null
          is_commercial?: boolean | null
          is_public?: boolean | null
          key_signature?: string | null
          label_name?: string | null
          language?: string | null
          mood?: string | null
          primary_artist_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          published_at?: string | null
          published_by?: string | null
          reference_artists?: string[] | null
          reference_tracks?: string[] | null
          release_date?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          total_tracks_count?: number | null
          type?: string | null
          typography_style?: string | null
          updated_at?: string | null
          user_id?: string
          visual_aesthetic?: string | null
          visual_keywords?: string[] | null
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
          expires_at: string | null
          group_key: string | null
          id: string
          message: string
          metadata: Json | null
          priority: number | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          group_key?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: number | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          group_key?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: number | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          completed_transactions: number | null
          conversion_rate: number | null
          created_at: string | null
          credit_package_sales: number | null
          date: string
          failed_transactions: number | null
          id: string
          invoice_created_count: number | null
          new_paying_users: number | null
          repeat_buyers: number | null
          subscription_sales: number | null
          total_credits_granted: number | null
          total_stars_collected: number | null
          total_transactions: number | null
          total_usd_equivalent: number | null
          unique_paying_users: number | null
          updated_at: string | null
        }
        Insert: {
          completed_transactions?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          credit_package_sales?: number | null
          date?: string
          failed_transactions?: number | null
          id?: string
          invoice_created_count?: number | null
          new_paying_users?: number | null
          repeat_buyers?: number | null
          subscription_sales?: number | null
          total_credits_granted?: number | null
          total_stars_collected?: number | null
          total_transactions?: number | null
          total_usd_equivalent?: number | null
          unique_paying_users?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_transactions?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          credit_package_sales?: number | null
          date?: string
          failed_transactions?: number | null
          id?: string
          invoice_created_count?: number | null
          new_paying_users?: number | null
          repeat_buyers?: number | null
          subscription_sales?: number | null
          total_credits_granted?: number | null
          total_stars_collected?: number | null
          total_transactions?: number | null
          total_usd_equivalent?: number | null
          unique_paying_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          credits_granted: number | null
          currency: string
          error_message: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id: string | null
          gateway_payment_url: string | null
          gateway_transaction_id: string | null
          id: string
          ip_address: unknown
          is_recurrent: boolean | null
          metadata: Json | null
          product_code: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_granted: string | null
          subscription_id: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          credits_granted?: number | null
          currency?: string
          error_message?: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_url?: string | null
          gateway_transaction_id?: string | null
          id?: string
          ip_address?: unknown
          is_recurrent?: boolean | null
          metadata?: Json | null
          product_code: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_granted?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          credits_granted?: number | null
          currency?: string
          error_message?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_url?: string | null
          gateway_transaction_id?: string | null
          id?: string
          ip_address?: unknown
          is_recurrent?: boolean | null
          metadata?: Json | null
          product_code?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_granted?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tinkoff_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          branch: string | null
          bundle_size_gzip_kb: number | null
          bundle_size_kb: number | null
          cls: number | null
          commit_sha: string | null
          connection: string | null
          created_at: string
          device: string | null
          fcp_ms: number | null
          fid_ms: number | null
          id: string
          lcp_ms: number | null
          lighthouse_accessibility: number | null
          lighthouse_best_practices: number | null
          lighthouse_performance: number | null
          lighthouse_seo: number | null
          pr_number: number | null
          recorded_at: string
          source: string
          speed_index_ms: number | null
          tbt_ms: number | null
          ttfb_ms: number | null
          tti_ms: number | null
          url: string | null
        }
        Insert: {
          branch?: string | null
          bundle_size_gzip_kb?: number | null
          bundle_size_kb?: number | null
          cls?: number | null
          commit_sha?: string | null
          connection?: string | null
          created_at?: string
          device?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          lighthouse_accessibility?: number | null
          lighthouse_best_practices?: number | null
          lighthouse_performance?: number | null
          lighthouse_seo?: number | null
          pr_number?: number | null
          recorded_at?: string
          source?: string
          speed_index_ms?: number | null
          tbt_ms?: number | null
          ttfb_ms?: number | null
          tti_ms?: number | null
          url?: string | null
        }
        Update: {
          branch?: string | null
          bundle_size_gzip_kb?: number | null
          bundle_size_kb?: number | null
          cls?: number | null
          commit_sha?: string | null
          connection?: string | null
          created_at?: string
          device?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          lighthouse_accessibility?: number | null
          lighthouse_best_practices?: number | null
          lighthouse_performance?: number | null
          lighthouse_seo?: number | null
          pr_number?: number | null
          recorded_at?: string
          source?: string
          speed_index_ms?: number | null
          tbt_ms?: number | null
          ttfb_ms?: number | null
          tti_ms?: number | null
          url?: string | null
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          title: string
          total_duration: number | null
          track_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          total_duration?: number | null
          track_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          total_duration?: number | null
          track_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          first_name: string
          followers_count: number | null
          following_count: number | null
          id: string
          is_public: boolean | null
          language_code: string | null
          last_name: string | null
          photo_url: string | null
          pinned_artists: string[] | null
          pinned_projects: string[] | null
          pinned_tracks: string[] | null
          profile_completeness: number | null
          profile_theme: Json | null
          social_links: Json | null
          subscription_expires_at: string | null
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
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_name: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_public?: boolean | null
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
          pinned_artists?: string[] | null
          pinned_projects?: string[] | null
          pinned_tracks?: string[] | null
          profile_completeness?: number | null
          profile_theme?: Json | null
          social_links?: Json | null
          subscription_expires_at?: string | null
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
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_public?: boolean | null
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
          pinned_artists?: string[] | null
          pinned_projects?: string[] | null
          pinned_tracks?: string[] | null
          profile_completeness?: number | null
          profile_theme?: Json | null
          social_links?: Json | null
          subscription_expires_at?: string | null
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
          bpm_target: number | null
          collab_artist_id: string | null
          created_at: string | null
          duration_target: number | null
          energy_level: number | null
          generation_params: Json | null
          id: string
          instrumental_only: boolean | null
          key_signature: string | null
          lyrics: string | null
          lyrics_status: string | null
          notes: string | null
          position: number
          project_id: string
          recommended_structure: string | null
          recommended_tags: string[] | null
          reference_url: string | null
          status: string | null
          style_prompt: string | null
          title: string
          track_id: string | null
          updated_at: string | null
          vocal_style: string | null
        }
        Insert: {
          bpm_target?: number | null
          collab_artist_id?: string | null
          created_at?: string | null
          duration_target?: number | null
          energy_level?: number | null
          generation_params?: Json | null
          id?: string
          instrumental_only?: boolean | null
          key_signature?: string | null
          lyrics?: string | null
          lyrics_status?: string | null
          notes?: string | null
          position: number
          project_id: string
          recommended_structure?: string | null
          recommended_tags?: string[] | null
          reference_url?: string | null
          status?: string | null
          style_prompt?: string | null
          title: string
          track_id?: string | null
          updated_at?: string | null
          vocal_style?: string | null
        }
        Update: {
          bpm_target?: number | null
          collab_artist_id?: string | null
          created_at?: string | null
          duration_target?: number | null
          energy_level?: number | null
          generation_params?: Json | null
          id?: string
          instrumental_only?: boolean | null
          key_signature?: string | null
          lyrics?: string | null
          lyrics_status?: string | null
          notes?: string | null
          position?: number
          project_id?: string
          recommended_structure?: string | null
          recommended_tags?: string[] | null
          reference_url?: string | null
          status?: string | null
          style_prompt?: string | null
          title?: string
          track_id?: string | null
          updated_at?: string | null
          vocal_style?: string | null
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
          {
            foreignKeyName: "project_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usage: {
        Row: {
          bonus_credits_applied: number | null
          created_at: string | null
          discount_applied: number | null
          id: string
          promo_code_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          bonus_credits_applied?: number | null
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          promo_code_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          bonus_credits_applied?: number | null
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          promo_code_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "stars_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          bonus_credits: number | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          discount_percent: number | null
          discount_stars: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_purchase_stars: number | null
          product_codes: string[] | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          bonus_credits?: number | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_percent?: number | null
          discount_stars?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_stars?: number | null
          product_codes?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          bonus_credits?: number | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_percent?: number | null
          discount_stars?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_stars?: number | null
          product_codes?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
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
      reference_audio: {
        Row: {
          analysis_metadata: Json | null
          analysis_status: string | null
          analyzed_at: string | null
          bass_stem_url: string | null
          bpm: number | null
          created_at: string
          detected_language: string | null
          drums_stem_url: string | null
          duration_seconds: number | null
          energy: string | null
          file_name: string
          file_size: number | null
          file_url: string
          genre: string | null
          has_instrumentals: boolean | null
          has_vocals: boolean | null
          id: string
          instrumental_stem_url: string | null
          instruments: string[] | null
          metadata: Json | null
          mime_type: string | null
          mood: string | null
          other_stem_url: string | null
          processing_time_ms: number | null
          source: string
          stems_status: string | null
          style_description: string | null
          telegram_file_id: string | null
          tempo: string | null
          transcription: string | null
          transcription_method: string | null
          user_id: string
          vocal_stem_url: string | null
          vocal_style: string | null
        }
        Insert: {
          analysis_metadata?: Json | null
          analysis_status?: string | null
          analyzed_at?: string | null
          bass_stem_url?: string | null
          bpm?: number | null
          created_at?: string
          detected_language?: string | null
          drums_stem_url?: string | null
          duration_seconds?: number | null
          energy?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          genre?: string | null
          has_instrumentals?: boolean | null
          has_vocals?: boolean | null
          id?: string
          instrumental_stem_url?: string | null
          instruments?: string[] | null
          metadata?: Json | null
          mime_type?: string | null
          mood?: string | null
          other_stem_url?: string | null
          processing_time_ms?: number | null
          source?: string
          stems_status?: string | null
          style_description?: string | null
          telegram_file_id?: string | null
          tempo?: string | null
          transcription?: string | null
          transcription_method?: string | null
          user_id: string
          vocal_stem_url?: string | null
          vocal_style?: string | null
        }
        Update: {
          analysis_metadata?: Json | null
          analysis_status?: string | null
          analyzed_at?: string | null
          bass_stem_url?: string | null
          bpm?: number | null
          created_at?: string
          detected_language?: string | null
          drums_stem_url?: string | null
          duration_seconds?: number | null
          energy?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          genre?: string | null
          has_instrumentals?: boolean | null
          has_vocals?: boolean | null
          id?: string
          instrumental_stem_url?: string | null
          instruments?: string[] | null
          metadata?: Json | null
          mime_type?: string | null
          mood?: string | null
          other_stem_url?: string | null
          processing_time_ms?: number | null
          source?: string
          stems_status?: string | null
          style_description?: string | null
          telegram_file_id?: string | null
          tempo?: string | null
          transcription?: string | null
          transcription_method?: string | null
          user_id?: string
          vocal_stem_url?: string | null
          vocal_style?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          credited_at: string | null
          credits_reward: number
          id: string
          referred_id: string
          referrer_id: string
          reward_percent: number | null
          stars_amount: number
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          credited_at?: string | null
          credits_reward: number
          id?: string
          referred_id: string
          referrer_id: string
          reward_percent?: number | null
          stars_amount: number
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          credited_at?: string | null
          credits_reward?: number
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_percent?: number | null
          stars_amount?: number
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "stars_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rum_metrics: {
        Row: {
          cls: number | null
          connection_type: string | null
          created_at: string
          device_type: string | null
          fcp_ms: number | null
          fid_ms: number | null
          id: string
          inp_ms: number | null
          lcp_ms: number | null
          page_path: string | null
          session_id: string
          ttfb_ms: number | null
          user_agent: string | null
          user_id: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          cls?: number | null
          connection_type?: string | null
          created_at?: string
          device_type?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          page_path?: string | null
          session_id: string
          ttfb_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          cls?: number | null
          connection_type?: string | null
          created_at?: string
          device_type?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          page_path?: string | null
          session_id?: string
          ttfb_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rum_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rum_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rum_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stars_products: {
        Row: {
          created_at: string | null
          credits_amount: number | null
          description: string | null
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          price_rub_cents: number | null
          product_code: string
          product_type: string
          sort_order: number | null
          stars_price: number
          status: string | null
          subscription_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          price_rub_cents?: number | null
          product_code: string
          product_type?: string
          sort_order?: number | null
          stars_price: number
          status?: string | null
          subscription_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          price_rub_cents?: number | null
          product_code?: string
          product_type?: string
          sort_order?: number | null
          stars_price?: number
          status?: string | null
          subscription_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stars_transactions: {
        Row: {
          created_at: string | null
          credits_granted: number | null
          error_message: string | null
          id: string
          processed_at: string | null
          product_code: string
          stars_amount: number
          status: string
          subscription_granted: string | null
          telegram_payment_charge_id: string | null
          telegram_provider_charge_id: string | null
          telegram_user_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_granted?: number | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          product_code: string
          stars_amount: number
          status?: string
          subscription_granted?: string | null
          telegram_payment_charge_id?: string | null
          telegram_provider_charge_id?: string | null
          telegram_user_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_granted?: number | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          product_code?: string
          stars_amount?: number
          status?: string
          subscription_granted?: string | null
          telegram_payment_charge_id?: string | null
          telegram_provider_charge_id?: string | null
          telegram_user_id?: number
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "stem_separation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_separation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      stem_transcriptions: {
        Row: {
          bpm: number | null
          created_at: string | null
          duration_seconds: number | null
          gp5_url: string | null
          id: string
          key_detected: string | null
          klangio_log_id: string | null
          midi_quant_url: string | null
          midi_url: string | null
          model: string
          mxml_url: string | null
          notes: Json | null
          notes_count: number | null
          pdf_url: string | null
          stem_id: string
          time_signature: string | null
          track_id: string
          updated_at: string | null
          user_id: string
          version_id: string | null
        }
        Insert: {
          bpm?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          gp5_url?: string | null
          id?: string
          key_detected?: string | null
          klangio_log_id?: string | null
          midi_quant_url?: string | null
          midi_url?: string | null
          model: string
          mxml_url?: string | null
          notes?: Json | null
          notes_count?: number | null
          pdf_url?: string | null
          stem_id: string
          time_signature?: string | null
          track_id: string
          updated_at?: string | null
          user_id: string
          version_id?: string | null
        }
        Update: {
          bpm?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          gp5_url?: string | null
          id?: string
          key_detected?: string | null
          klangio_log_id?: string | null
          midi_quant_url?: string | null
          midi_url?: string | null
          model?: string
          mxml_url?: string | null
          notes?: Json | null
          notes_count?: number | null
          pdf_url?: string | null
          stem_id?: string
          time_signature?: string | null
          track_id?: string
          updated_at?: string | null
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stem_transcriptions_klangio_log_id_fkey"
            columns: ["klangio_log_id"]
            isOneToOne: false
            referencedRelation: "klangio_analysis_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_transcriptions_stem_id_fkey"
            columns: ["stem_id"]
            isOneToOne: false
            referencedRelation: "track_stems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_transcriptions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_transcriptions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_transcriptions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_transcriptions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          bpm: number | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          key_signature: string | null
          master_volume: number | null
          name: string
          opened_at: string | null
          source_track_id: string | null
          status: string | null
          stems_mode: string | null
          time_signature: string | null
          tracks: Json | null
          updated_at: string | null
          user_id: string
          view_settings: Json | null
        }
        Insert: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          key_signature?: string | null
          master_volume?: number | null
          name: string
          opened_at?: string | null
          source_track_id?: string | null
          status?: string | null
          stems_mode?: string | null
          time_signature?: string | null
          tracks?: Json | null
          updated_at?: string | null
          user_id: string
          view_settings?: Json | null
        }
        Update: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          key_signature?: string | null
          master_volume?: number | null
          name?: string
          opened_at?: string | null
          source_track_id?: string | null
          status?: string | null
          stems_mode?: string | null
          time_signature?: string | null
          tracks?: Json | null
          updated_at?: string | null
          user_id?: string
          view_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_projects_source_track_id_fkey"
            columns: ["source_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_source_track_id_fkey"
            columns: ["source_track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_source_track_id_fkey"
            columns: ["source_track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
      subscription_history: {
        Row: {
          action: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          previous_tier: Database["public"]["Enums"]["subscription_tier"] | null
          stars_transaction_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          stars_transaction_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          stars_transaction_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_stars_transaction_id_fkey"
            columns: ["stars_transaction_id"]
            isOneToOne: false
            referencedRelation: "stars_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          allowed_features: string[] | null
          audio_quality: string | null
          badge_text: string | null
          code: string
          color: string | null
          cover_url: string | null
          created_at: string
          credits_amount: number
          credits_period: string
          custom_pricing: boolean | null
          description: Json
          detailed_description: Json
          display_order: number
          features: Json | null
          has_api_access: boolean | null
          has_dedicated_support: boolean | null
          has_mastering: boolean | null
          has_midi_export: boolean | null
          has_priority: boolean | null
          has_stem_separation: boolean | null
          icon_emoji: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_concurrent_generations: number | null
          metadata: Json | null
          min_purchase_amount: number | null
          name: Json
          price_robokassa: number | null
          price_stars: number | null
          price_usd: number | null
          updated_at: string
        }
        Insert: {
          allowed_features?: string[] | null
          audio_quality?: string | null
          badge_text?: string | null
          code: string
          color?: string | null
          cover_url?: string | null
          created_at?: string
          credits_amount?: number
          credits_period?: string
          custom_pricing?: boolean | null
          description?: Json
          detailed_description?: Json
          display_order?: number
          features?: Json | null
          has_api_access?: boolean | null
          has_dedicated_support?: boolean | null
          has_mastering?: boolean | null
          has_midi_export?: boolean | null
          has_priority?: boolean | null
          has_stem_separation?: boolean | null
          icon_emoji?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_concurrent_generations?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          name?: Json
          price_robokassa?: number | null
          price_stars?: number | null
          price_usd?: number | null
          updated_at?: string
        }
        Update: {
          allowed_features?: string[] | null
          audio_quality?: string | null
          badge_text?: string | null
          code?: string
          color?: string | null
          cover_url?: string | null
          created_at?: string
          credits_amount?: number
          credits_period?: string
          custom_pricing?: boolean | null
          description?: Json
          detailed_description?: Json
          display_order?: number
          features?: Json | null
          has_api_access?: boolean | null
          has_dedicated_support?: boolean | null
          has_mastering?: boolean | null
          has_midi_export?: boolean | null
          has_priority?: boolean | null
          has_stem_separation?: boolean | null
          icon_emoji?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_concurrent_generations?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          name?: Json
          price_robokassa?: number | null
          price_stars?: number | null
          price_usd?: number | null
          updated_at?: string
        }
        Relationships: []
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
      tag_statistics: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          last_used_at: string | null
          normalized_name: string
          tag_name: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          normalized_name: string
          tag_name: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          normalized_name?: string
          tag_name?: string
          usage_count?: number | null
        }
        Relationships: []
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
      telegram_bot_config: {
        Row: {
          config_key: string
          config_value: Json
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      telegram_bot_logs: {
        Row: {
          action_data: Json | null
          action_type: string
          chat_id: number
          created_at: string | null
          id: string
          menu_key: string | null
          message_id: number | null
          response_time_ms: number | null
          telegram_user_id: number
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          chat_id: number
          created_at?: string | null
          id?: string
          menu_key?: string | null
          message_id?: number | null
          response_time_ms?: number | null
          telegram_user_id: number
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          chat_id?: number
          created_at?: string | null
          id?: string
          menu_key?: string | null
          message_id?: number | null
          response_time_ms?: number | null
          telegram_user_id?: number
        }
        Relationships: []
      }
      telegram_bot_metrics: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          success: boolean
          telegram_chat_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          success?: boolean
          telegram_chat_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          success?: boolean
          telegram_chat_id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_bot_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          mode: string | null
          options: Json | null
          session_type: string
          telegram_user_id: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          mode?: string | null
          options?: Json | null
          session_type: string
          telegram_user_id: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          mode?: string | null
          options?: Json | null
          session_type?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      telegram_failed_notifications: {
        Row: {
          chat_id: number
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          notification_type: string
          payload: Json
          resolved_at: string | null
          retry_count: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notification_type: string
          payload: Json
          resolved_at?: string | null
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notification_type?: string
          payload?: Json
          resolved_at?: string | null
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_menu_items: {
        Row: {
          action_data: string | null
          action_type: string
          caption: string | null
          column_span: number | null
          created_at: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          image_fallback: string | null
          image_url: string | null
          is_enabled: boolean | null
          menu_key: string
          parent_key: string | null
          requires_auth: boolean | null
          row_position: number | null
          show_in_menu: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          action_data?: string | null
          action_type?: string
          caption?: string | null
          column_span?: number | null
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          image_fallback?: string | null
          image_url?: string | null
          is_enabled?: boolean | null
          menu_key: string
          parent_key?: string | null
          requires_auth?: boolean | null
          row_position?: number | null
          show_in_menu?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          action_data?: string | null
          action_type?: string
          caption?: string | null
          column_span?: number | null
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          image_fallback?: string | null
          image_url?: string | null
          is_enabled?: boolean | null
          menu_key?: string
          parent_key?: string | null
          requires_auth?: boolean | null
          row_position?: number | null
          show_in_menu?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      telegram_menu_state: {
        Row: {
          active_menu_message_id: number | null
          chat_id: number
          created_at: string
          current_menu: string | null
          id: string
          navigation_stack: string[] | null
          updated_at: string
          user_id: number
        }
        Insert: {
          active_menu_message_id?: number | null
          chat_id: number
          created_at?: string
          current_menu?: string | null
          id?: string
          navigation_stack?: string[] | null
          updated_at?: string
          user_id: number
        }
        Update: {
          active_menu_message_id?: number | null
          chat_id?: number
          created_at?: string
          current_menu?: string | null
          id?: string
          navigation_stack?: string[] | null
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
      telegram_notification_queue: {
        Row: {
          chat_id: number
          created_at: string | null
          dedupe_key: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          notification_type: string
          payload: Json
          priority: string | null
          priority_score: number | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          dedupe_key?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notification_type: string
          payload?: Json
          priority?: string | null
          priority_score?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          dedupe_key?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notification_type?: string
          payload?: Json
          priority?: string | null
          priority_score?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          request_count: number
          user_id: number
          window_start: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          request_count?: number
          user_id: number
          window_start?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          request_count?: number
          user_id?: number
          window_start?: string
        }
        Relationships: []
      }
      telegram_voice_transcriptions: {
        Row: {
          confidence: number | null
          created_at: string | null
          detected_language: string | null
          duration_seconds: number | null
          generation_task_id: string | null
          id: string
          telegram_chat_id: number
          telegram_file_id: string
          transcription: string | null
          used_for_generation: boolean | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          detected_language?: string | null
          duration_seconds?: number | null
          generation_task_id?: string | null
          id?: string
          telegram_chat_id: number
          telegram_file_id: string
          transcription?: string | null
          used_for_generation?: boolean | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          detected_language?: string | null
          duration_seconds?: number | null
          generation_task_id?: string | null
          id?: string
          telegram_chat_id?: number
          telegram_file_id?: string
          transcription?: string | null
          used_for_generation?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_wizard_state: {
        Row: {
          created_at: string | null
          current_step: string
          expires_at: string
          id: string
          message_id: number | null
          selections: Json | null
          updated_at: string | null
          user_id: string
          wizard_type: string
        }
        Insert: {
          created_at?: string | null
          current_step: string
          expires_at: string
          id?: string
          message_id?: number | null
          selections?: Json | null
          updated_at?: string | null
          user_id: string
          wizard_type: string
        }
        Update: {
          created_at?: string | null
          current_step?: string
          expires_at?: string
          id?: string
          message_id?: number | null
          selections?: Json | null
          updated_at?: string | null
          user_id?: string
          wizard_type?: string
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          app_version: string | null
          created_at: string
          duration_ms: number | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          platform: string | null
          session_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          duration_ms?: number | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          platform?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          duration_ms?: number | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tinkoff_subscriptions: {
        Row: {
          amount_cents: number
          billing_cycle_days: number
          card_exp_date: string | null
          card_pan: string | null
          created_at: string
          currency: string
          failed_attempts: number | null
          id: string
          last_payment_date: string | null
          last_payment_id: string | null
          metadata: Json | null
          next_billing_date: string | null
          product_code: string
          rebill_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          billing_cycle_days?: number
          card_exp_date?: string | null
          card_pan?: string | null
          created_at?: string
          currency?: string
          failed_attempts?: number | null
          id?: string
          last_payment_date?: string | null
          last_payment_id?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          product_code: string
          rebill_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          billing_cycle_days?: number
          card_exp_date?: string | null
          card_pan?: string | null
          created_at?: string
          currency?: string
          failed_attempts?: number | null
          id?: string
          last_payment_date?: string | null
          last_payment_id?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          product_code?: string
          rebill_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tinkoff_subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
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
          {
            foreignKeyName: "track_analytics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_analytics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
            foreignKeyName: "track_change_log_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_change_log_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_stems: {
        Row: {
          audio_url: string
          created_at: string | null
          generation_model: string | null
          generation_prompt: string | null
          id: string
          separation_mode: string | null
          source: string | null
          status: string | null
          stem_type: string
          track_id: string
          updated_at: string | null
          version_id: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          separation_mode?: string | null
          source?: string | null
          status?: string | null
          stem_type: string
          track_id: string
          updated_at?: string | null
          version_id?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          separation_mode?: string | null
          source?: string | null
          status?: string | null
          stem_type?: string
          track_id?: string
          updated_at?: string | null
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
            foreignKeyName: "track_stems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_stems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
      track_tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          normalized_name: string
          tag_name: string
          track_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          normalized_name: string
          tag_name: string
          track_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          normalized_name?: string
          tag_name?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_tags_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_tags_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_tags_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
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
          source_type: string | null
          track_id: string
          transcription_data: Json | null
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
          source_type?: string | null
          track_id: string
          transcription_data?: Json | null
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
          source_type?: string | null
          track_id?: string
          transcription_data?: Json | null
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
          {
            foreignKeyName: "track_versions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_versions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          active_version_id: string | null
          allow_remix: boolean | null
          approved_at: string | null
          approved_by: string | null
          artist_avatar_url: string | null
          artist_id: string | null
          artist_name: string | null
          audio_quality: string | null
          audio_url: string | null
          audio_url_hd: string | null
          computed_genre: string | null
          computed_mood: string | null
          cover_url: string | null
          created_at: string | null
          creator_display_name: string | null
          duration_seconds: number | null
          error_message: string | null
          generation_mode: string | null
          has_stems: boolean | null
          has_vocals: boolean | null
          id: string
          is_approved: boolean | null
          is_instrumental: boolean | null
          is_master: boolean | null
          is_public: boolean | null
          is_watermarked: boolean | null
          likes_count: number | null
          local_audio_url: string | null
          local_cover_url: string | null
          local_video_url: string | null
          lyrics: string | null
          lyrics_language: string | null
          lyrics_transcription_method: string | null
          model_name: string | null
          negative_tags: string | null
          parent_track_id: string | null
          play_count: number | null
          project_id: string | null
          project_track_id: string | null
          prompt: string
          provider: string | null
          quality_score: number | null
          reference_audio_url: string | null
          share_count: number | null
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
          trending_score: number | null
          updated_at: string | null
          upscale_status: string | null
          user_id: string
          video_url: string | null
          vocal_gender: string | null
          watermark_status: string | null
          watermarked_at: string | null
          watermarked_url: string | null
        }
        Insert: {
          active_version_id?: string | null
          allow_remix?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          artist_avatar_url?: string | null
          artist_id?: string | null
          artist_name?: string | null
          audio_quality?: string | null
          audio_url?: string | null
          audio_url_hd?: string | null
          computed_genre?: string | null
          computed_mood?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_display_name?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generation_mode?: string | null
          has_stems?: boolean | null
          has_vocals?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_instrumental?: boolean | null
          is_master?: boolean | null
          is_public?: boolean | null
          is_watermarked?: boolean | null
          likes_count?: number | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          local_video_url?: string | null
          lyrics?: string | null
          lyrics_language?: string | null
          lyrics_transcription_method?: string | null
          model_name?: string | null
          negative_tags?: string | null
          parent_track_id?: string | null
          play_count?: number | null
          project_id?: string | null
          project_track_id?: string | null
          prompt: string
          provider?: string | null
          quality_score?: number | null
          reference_audio_url?: string | null
          share_count?: number | null
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
          trending_score?: number | null
          updated_at?: string | null
          upscale_status?: string | null
          user_id: string
          video_url?: string | null
          vocal_gender?: string | null
          watermark_status?: string | null
          watermarked_at?: string | null
          watermarked_url?: string | null
        }
        Update: {
          active_version_id?: string | null
          allow_remix?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          artist_avatar_url?: string | null
          artist_id?: string | null
          artist_name?: string | null
          audio_quality?: string | null
          audio_url?: string | null
          audio_url_hd?: string | null
          computed_genre?: string | null
          computed_mood?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_display_name?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generation_mode?: string | null
          has_stems?: boolean | null
          has_vocals?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_instrumental?: boolean | null
          is_master?: boolean | null
          is_public?: boolean | null
          is_watermarked?: boolean | null
          likes_count?: number | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          local_video_url?: string | null
          lyrics?: string | null
          lyrics_language?: string | null
          lyrics_transcription_method?: string | null
          model_name?: string | null
          negative_tags?: string | null
          parent_track_id?: string | null
          play_count?: number | null
          project_id?: string | null
          project_track_id?: string | null
          prompt?: string
          provider?: string | null
          quality_score?: number | null
          reference_audio_url?: string | null
          share_count?: number | null
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
          trending_score?: number | null
          updated_at?: string | null
          upscale_status?: string | null
          user_id?: string
          video_url?: string | null
          vocal_gender?: string | null
          watermark_status?: string | null
          watermarked_at?: string | null
          watermarked_url?: string | null
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
            foreignKeyName: "tracks_parent_track_id_fkey"
            columns: ["parent_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_parent_track_id_fkey"
            columns: ["parent_track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_parent_track_id_fkey"
            columns: ["parent_track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "music_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_project_track_id_fkey"
            columns: ["project_track_id"]
            isOneToOne: false
            referencedRelation: "project_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
      user_analytics_events: {
        Row: {
          created_at: string | null
          event_name: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          credits_earned: number
          id: string
          streak_day: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string | null
          credits_earned?: number
          id?: string
          streak_day?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          credits_earned?: number
          id?: string
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string | null
          current_streak: number
          daily_earned_reset_at: string | null
          daily_earned_today: number | null
          experience: number
          id: string
          last_checkin_date: string | null
          level: number
          longest_streak: number
          referral_code: string | null
          referral_count: number | null
          referral_earnings: number | null
          referred_by: string | null
          total_earned: number
          total_likes_received: number | null
          total_plays: number | null
          total_shares: number | null
          total_spent: number
          total_tracks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          current_streak?: number
          daily_earned_reset_at?: string | null
          daily_earned_today?: number | null
          experience?: number
          id?: string
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          total_earned?: number
          total_likes_received?: number | null
          total_plays?: number | null
          total_shares?: number | null
          total_spent?: number
          total_tracks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          current_streak?: number
          daily_earned_reset_at?: string | null
          daily_earned_today?: number | null
          experience?: number
          id?: string
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          total_earned?: number
          total_likes_received?: number | null
          total_plays?: number | null
          total_shares?: number | null
          total_spent?: number
          total_tracks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          rating: number | null
          replied_at: string | null
          replied_by: string | null
          status: string
          telegram_chat_id: number | null
          telegram_id: number
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          telegram_chat_id?: number | null
          telegram_id: number
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          telegram_chat_id?: number | null
          telegram_id?: number
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_generation_history: {
        Row: {
          created_at: string
          generation_mode: string | null
          id: string
          is_instrumental: boolean | null
          lyrics: string | null
          metadata: Json | null
          model_name: string | null
          prompt: string
          reference_audio_id: string | null
          status: string | null
          style: string | null
          tags: string[] | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_mode?: string | null
          id?: string
          is_instrumental?: boolean | null
          lyrics?: string | null
          metadata?: Json | null
          model_name?: string | null
          prompt: string
          reference_audio_id?: string | null
          status?: string | null
          style?: string | null
          tags?: string[] | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          generation_mode?: string | null
          id?: string
          is_instrumental?: boolean | null
          lyrics?: string | null
          metadata?: Json | null
          model_name?: string | null
          prompt?: string
          reference_audio_id?: string | null
          status?: string | null
          style?: string | null
          tags?: string[] | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_generation_history_reference_audio_id_fkey"
            columns: ["reference_audio_id"]
            isOneToOne: false
            referencedRelation: "reference_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_generation_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_generation_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_generation_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_generation_stats: {
        Row: {
          cover_count: number | null
          created_at: string | null
          credits_spent: number | null
          date: string
          estimated_cost: number | null
          extend_count: number | null
          failed_count: number | null
          generations_count: number | null
          id: string
          instrumental_count: number | null
          music_count: number | null
          stems_count: number | null
          successful_count: number | null
          updated_at: string | null
          user_id: string
          vocals_count: number | null
        }
        Insert: {
          cover_count?: number | null
          created_at?: string | null
          credits_spent?: number | null
          date?: string
          estimated_cost?: number | null
          extend_count?: number | null
          failed_count?: number | null
          generations_count?: number | null
          id?: string
          instrumental_count?: number | null
          music_count?: number | null
          stems_count?: number | null
          successful_count?: number | null
          updated_at?: string | null
          user_id: string
          vocals_count?: number | null
        }
        Update: {
          cover_count?: number | null
          created_at?: string | null
          credits_spent?: number | null
          date?: string
          estimated_cost?: number | null
          extend_count?: number | null
          failed_count?: number | null
          generations_count?: number | null
          id?: string
          instrumental_count?: number | null
          music_count?: number | null
          stems_count?: number | null
          successful_count?: number | null
          updated_at?: string | null
          user_id?: string
          vocals_count?: number | null
        }
        Relationships: []
      }
      user_journey_events: {
        Row: {
          completed: boolean | null
          created_at: string | null
          dropped_off: boolean | null
          duration_from_prev_ms: number | null
          funnel_name: string
          id: string
          metadata: Json | null
          session_id: string
          step_index: number
          step_name: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          dropped_off?: boolean | null
          duration_from_prev_ms?: number | null
          funnel_name: string
          id?: string
          metadata?: Json | null
          session_id: string
          step_index: number
          step_name: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          dropped_off?: boolean | null
          duration_from_prev_ms?: number | null
          funnel_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          step_index?: number
          step_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          auto_midi_enabled: boolean | null
          auto_midi_model: string | null
          auto_midi_stems_only: boolean | null
          created_at: string | null
          id: string
          notify_achievements: boolean | null
          notify_comments: boolean | null
          notify_completed: boolean | null
          notify_daily_reminder: boolean | null
          notify_failed: boolean | null
          notify_followers: boolean | null
          notify_likes: boolean | null
          notify_mentions: boolean | null
          notify_progress: boolean | null
          notify_stem_ready: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_midi_enabled?: boolean | null
          auto_midi_model?: string | null
          auto_midi_stems_only?: boolean | null
          created_at?: string | null
          id?: string
          notify_achievements?: boolean | null
          notify_comments?: boolean | null
          notify_completed?: boolean | null
          notify_daily_reminder?: boolean | null
          notify_failed?: boolean | null
          notify_followers?: boolean | null
          notify_likes?: boolean | null
          notify_mentions?: boolean | null
          notify_progress?: boolean | null
          notify_stem_ready?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_midi_enabled?: boolean | null
          auto_midi_model?: string | null
          auto_midi_stems_only?: boolean | null
          created_at?: string | null
          id?: string
          notify_achievements?: boolean | null
          notify_comments?: boolean | null
          notify_completed?: boolean | null
          notify_daily_reminder?: boolean | null
          notify_failed?: boolean | null
          notify_followers?: boolean | null
          notify_likes?: boolean | null
          notify_mentions?: boolean | null
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
          telegram_id: number | null
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
          telegram_id?: number | null
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
          telegram_id?: number | null
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
      video_generation_tasks: {
        Row: {
          aspect_ratio: string | null
          completed_at: string | null
          created_at: string | null
          duration: string | null
          error_message: string | null
          fal_request_id: string | null
          generate_audio: boolean | null
          id: string
          local_video_url: string | null
          metadata: Json | null
          prompt: string
          status: string
          suno_audio_id: string | null
          suno_task_id: string | null
          thumbnail_url: string | null
          track_id: string | null
          user_id: string
          video_task_id: string | null
          video_url: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration?: string | null
          error_message?: string | null
          fal_request_id?: string | null
          generate_audio?: boolean | null
          id?: string
          local_video_url?: string | null
          metadata?: Json | null
          prompt: string
          status?: string
          suno_audio_id?: string | null
          suno_task_id?: string | null
          thumbnail_url?: string | null
          track_id?: string | null
          user_id: string
          video_task_id?: string | null
          video_url?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration?: string | null
          error_message?: string | null
          fal_request_id?: string | null
          generate_audio?: boolean | null
          id?: string
          local_video_url?: string | null
          metadata?: Json | null
          prompt?: string
          status?: string
          suno_audio_id?: string | null
          suno_task_id?: string | null
          thumbnail_url?: string | null
          track_id?: string | null
          user_id?: string
          video_task_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_active_audio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_generation_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "trending_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profile_view: {
        Row: {
          first_name: string | null
          id: string | null
          is_public: boolean | null
          photo_url: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          first_name?: string | null
          id?: string | null
          is_public?: boolean | null
          photo_url?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string | null
          is_public?: boolean | null
          photo_url?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      safe_public_profiles: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          followers_count: number | null
          following_count: number | null
          is_public: boolean | null
          last_name: string | null
          photo_url: string | null
          social_links: Json | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          is_public?: boolean | null
          last_name?: string | null
          photo_url?: string | null
          social_links?: Json | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          is_public?: boolean | null
          last_name?: string | null
          photo_url?: string | null
          social_links?: Json | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      tracks_with_active_audio: {
        Row: {
          active_version_id: string | null
          active_version_label: string | null
          computed_genre: string | null
          computed_mood: string | null
          created_at: string | null
          duration_seconds: number | null
          has_stems: boolean | null
          id: string | null
          is_instrumental: boolean | null
          is_public: boolean | null
          likes_count: number | null
          lyrics: string | null
          play_count: number | null
          prompt: string | null
          resolved_audio_url: string | null
          resolved_cover_url: string | null
          status: string | null
          style: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_active_version_id_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_tracks: {
        Row: {
          audio_url: string | null
          computed_genre: string | null
          computed_mood: string | null
          cover_url: string | null
          created_at: string | null
          creator_name: string | null
          creator_username: string | null
          duration_seconds: number | null
          id: string | null
          quality_score: number | null
          style: string | null
          tags: string | null
          telegram_file_id: string | null
          title: string | null
          trending_score: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_action_type?: string
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
      }
      archive_old_api_usage_logs: { Args: never; Returns: Json }
      archive_old_error_logs: { Args: never; Returns: Json }
      build_suno_prompt: {
        Args: { _style_id?: string; _tag_ids: string[] }
        Returns: string
      }
      calculate_profile_completeness: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: number
      }
      can_create_project: { Args: { _user_id: string }; Returns: Json }
      check_telegram_rate_limit: {
        Args: {
          p_action_type?: string
          p_max_requests?: number
          p_user_id: number
          p_window_seconds?: number
        }
        Returns: {
          current_count: number
          is_limited: boolean
          remaining: number
          reset_at: string
        }[]
      }
      cleanup_expired_bot_sessions: { Args: never; Returns: undefined }
      cleanup_expired_notifications: { Args: never; Returns: number }
      cleanup_expired_wizard_states: { Args: never; Returns: undefined }
      cleanup_failed_telegram_notifications: { Args: never; Returns: number }
      cleanup_stuck_generation_tasks: {
        Args: never
        Returns: {
          tasks_failed: number
          tracks_failed: number
        }[]
      }
      cleanup_telegram_queue: { Args: never; Returns: number }
      cleanup_telegram_rate_limits: { Args: never; Returns: number }
      compute_track_genre: {
        Args: { _style: string; _tags: string }
        Returns: string
      }
      compute_track_mood: {
        Args: { _style: string; _tags: string }
        Returns: string
      }
      deduct_generation_credits: {
        Args: {
          p_cost: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
      }
      delete_notifications_by_group: {
        Args: { p_group_key: string; p_user_id: string }
        Returns: number
      }
      ensure_track_version: {
        Args: {
          p_audio_url: string
          p_label?: string
          p_track_id: string
          p_version_type?: string
        }
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
      get_deeplink_stats: {
        Args: { _time_period?: unknown }
        Returns: {
          conversion_rate: number
          conversions: number
          top_sources: Json
          top_types: Json
          total_clicks: number
          unique_users: number
        }[]
      }
      get_error_trends: {
        Args: { _time_period?: unknown }
        Returns: {
          critical_errors: number
          errors_by_day: Json
          errors_by_severity: Json
          errors_by_type: Json
          top_error_fingerprints: Json
          total_errors: number
          unique_fingerprints: number
        }[]
      }
      get_experience_for_level: { Args: { _level: number }; Returns: number }
      get_featured_tracks: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          audio_url: string
          computed_genre: string
          computed_mood: string
          cover_url: string
          created_at: string
          creator_name: string
          creator_username: string
          duration_seconds: number
          id: string
          quality_score: number
          style: string
          tags: string
          telegram_file_id: string
          title: string
          trending_score: number
          user_id: string
        }[]
      }
      get_funnel_dropoff_stats: {
        Args: { _days_back?: number; _funnel_name: string }
        Returns: {
          avg_duration_ms: number
          conversion_rate: number
          step_index: number
          step_name: string
          users_dropped: number
          users_reached: number
        }[]
      }
      get_gamification_analytics: {
        Args: { _time_period?: unknown }
        Returns: {
          achievement_popularity: Json
          active_users: number
          avg_level: number
          checkin_stats: Json
          level_distribution: Json
          max_level: number
          top_achievers: Json
          total_credits_earned: number
          total_credits_spent: number
          total_experience: number
          total_users: number
        }[]
      }
      get_generation_analytics: {
        Args: { _time_period?: unknown }
        Returns: {
          avg_cost_per_generation: number
          avg_generation_time_seconds: number
          cost_by_service: Json
          failed_generations: number
          generations_by_day: Json
          generations_by_hour: Json
          model_distribution: Json
          successful_generations: number
          tag_combinations: Json
          top_genres: Json
          top_styles: Json
          top_tags: Json
          total_estimated_cost: number
          total_generation_time_minutes: number
          total_generations: number
        }[]
      }
      get_generation_stats: {
        Args: { _time_period?: unknown }
        Returns: {
          avg_duration_seconds: number
          completed: number
          failed: number
          pending: number
          processing: number
          success_rate: number
          total_generations: number
        }[]
      }
      get_leaderboard:
        | {
            Args: { _limit?: number }
            Returns: {
              achievements_count: number
              current_streak: number
              experience: number
              level: number
              photo_url: string
              rank: number
              total_earned: number
              user_id: string
              username: string
            }[]
          }
        | {
            Args: { _category?: string; _limit?: number }
            Returns: {
              achievements_count: number
              current_streak: number
              experience: number
              level: number
              photo_url: string
              rank: number
              total_earned: number
              total_likes_received: number
              total_plays: number
              total_shares: number
              total_tracks: number
              user_id: string
              username: string
            }[]
          }
      get_level_from_experience: {
        Args: { _experience: number }
        Returns: number
      }
      get_optimized_cover_url: {
        Args: { p_size?: string; p_track_id: string }
        Returns: string
      }
      get_payment_analytics: {
        Args: { _time_period?: unknown }
        Returns: {
          avg_transaction_stars: number
          completed_transactions: number
          conversion_rate: number
          repeat_buyer_rate: number
          revenue_by_day: Json
          subscription_breakdown: Json
          top_products: Json
          total_revenue_usd: number
          total_stars_collected: number
          total_transactions: number
          unique_buyers: number
        }[]
      }
      get_pending_notification_retries: {
        Args: { _limit?: number }
        Returns: {
          chat_id: number
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          notification_type: string
          payload: Json
          resolved_at: string | null
          retry_count: number | null
          status: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "telegram_failed_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_telegram_notifications: {
        Args: { _limit?: number }
        Returns: {
          chat_id: number
          created_at: string | null
          dedupe_key: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          notification_type: string
          payload: Json
          priority: string | null
          priority_score: number | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "telegram_notification_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_telegram_retries: {
        Args: { batch_size?: number }
        Returns: {
          chat_id: number
          created_at: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number
          method: string
          next_retry_at: string | null
          payload: Json
          retry_count: number
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "failed_telegram_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          id: string
          is_public: boolean
          photo_url: string
          user_id: string
          username: string
        }[]
      }
      get_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          is_public: boolean
          photo_url: string
          user_id: string
          username: string
        }[]
      }
      get_safe_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          banner_url: string
          bio: string
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_public: boolean
          photo_url: string
          user_id: string
          username: string
        }[]
      }
      get_safe_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          banner_url: string
          bio: string
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_public: boolean
          photo_url: string
          user_id: string
          username: string
        }[]
      }
      get_stars_payment_stats: {
        Args: never
        Returns: {
          active_subscriptions: number
          completed_transactions: number
          total_credits_granted: number
          total_stars_collected: number
          total_transactions: number
        }[]
      }
      get_subscription_status: { Args: { p_user_id: string }; Returns: Json }
      get_telegram_bot_metrics: {
        Args: { _time_period?: unknown }
        Returns: {
          avg_response_time_ms: number
          events_by_type: Json
          failed_events: number
          success_rate: number
          successful_events: number
          total_events: number
        }[]
      }
      get_telemetry_stats: {
        Args: { _time_period?: unknown }
        Returns: {
          avg_session_duration_sec: number
          error_summary: Json
          events_by_type: Json
          platform_distribution: Json
          top_events: Json
          total_events: number
          unique_sessions: number
          unique_users: number
        }[]
      }
      get_track_active_audio: {
        Args: { p_track_id: string }
        Returns: {
          audio_url: string
          cover_url: string
          version_label: string
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
      get_user_balance_summary: {
        Args: never
        Returns: {
          avg_balance: number
          total_balance: number
          total_earned: number
          total_spent: number
          total_users: number
          users_low_balance: number
          users_with_zero_balance: number
        }[]
      }
      get_user_behavior_stats: {
        Args: { _time_period?: unknown }
        Returns: {
          events_by_type: Json
          hourly_distribution: Json
          top_pages: Json
          total_events: number
          unique_sessions: number
          unique_users: number
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
      increment_track_share_count: {
        Args: { track_uuid: string }
        Returns: undefined
      }
      is_premium_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_blocked: {
        Args: { p_blocked_id: string; p_blocker_id: string }
        Returns: boolean
      }
      jsonb_object_keys_count: { Args: { obj: Json }; Returns: number }
      link_transcription_to_version: {
        Args: { p_transcription_id: string; p_version_id: string }
        Returns: undefined
      }
      log_share_reward: { Args: never; Returns: undefined }
      process_gateway_payment: {
        Args: {
          p_gateway_transaction_id: string
          p_metadata?: Json
          p_transaction_id: string
        }
        Returns: Json
      }
      process_stars_payment: {
        Args: {
          p_metadata?: Json
          p_telegram_payment_charge_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
      recommend_styles_for_user: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          recommendation_score: number
          style_id: string
          style_name: string
        }[]
      }
      reset_daily_earnings: { Args: never; Returns: undefined }
      run_log_archival: { Args: never; Returns: Json }
      upsert_notification: {
        Args: {
          p_action_url?: string
          p_expires_at?: string
          p_group_key?: string
          p_message: string
          p_metadata?: Json
          p_priority?: number
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payment_gateway: "telegram_stars" | "tinkoff" | "robokassa"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
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
      payment_gateway: ["telegram_stars", "tinkoff", "robokassa"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
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
