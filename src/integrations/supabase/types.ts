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
          message?: string
          sender_id?: string
          sent_count?: number | null
          target_type?: string | null
          title?: string
        }
        Relationships: []
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
          created_at: string
          first_name: string
          id: string
          is_public: boolean | null
          language_code: string | null
          last_name: string | null
          photo_url: string | null
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
          created_at?: string
          first_name: string
          id?: string
          is_public?: boolean | null
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
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
          created_at?: string
          first_name?: string
          id?: string
          is_public?: boolean | null
          language_code?: string | null
          last_name?: string | null
          photo_url?: string | null
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
          collab_artist_id: string | null
          created_at: string | null
          duration_target: number | null
          id: string
          lyrics_status: string | null
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
          lyrics_status?: string | null
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
          lyrics_status?: string | null
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
      reference_audio: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
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
          likes_count: number | null
          local_audio_url: string | null
          local_cover_url: string | null
          local_video_url: string | null
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
          video_url: string | null
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
          likes_count?: number | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          local_video_url?: string | null
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
          video_url?: string | null
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
          likes_count?: number | null
          local_audio_url?: string | null
          local_cover_url?: string | null
          local_video_url?: string | null
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
          video_url?: string | null
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
          experience: number
          id: string
          last_checkin_date: string | null
          level: number
          longest_streak: number
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
          experience?: number
          id?: string
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number
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
          experience?: number
          id?: string
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number
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
          notify_likes: boolean | null
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
          notify_likes?: boolean | null
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
          notify_likes?: boolean | null
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
      get_experience_for_level: { Args: { _level: number }; Returns: number }
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
      log_share_reward: { Args: never; Returns: undefined }
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
