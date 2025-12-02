import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Track, Project, GenerationTask } from '../types/bot.ts';

const BOT_CONFIG = {
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
};

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export class MusicService {
  async getUserByTelegramId(telegramId: number) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async getUserTracks(telegramId: number): Promise<Track[]> {
    const profile = await this.getUserByTelegramId(telegramId);
    if (!profile) return [];

    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }

    return data as Track[];
  }

  async getTrackById(trackId: string): Promise<Track | null> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (error) {
      console.error('Error fetching track:', error);
      return null;
    }

    return data as Track;
  }

  async getUserProjects(telegramId: number): Promise<Project[]> {
    const profile = await this.getUserByTelegramId(telegramId);
    if (!profile) {
      console.error('No profile found for telegram_id:', telegramId);
      return [];
    }

    console.log('Fetching projects for user_id:', profile.user_id);

    const { data, error } = await supabase
      .from('music_projects')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(20); // Увеличиваем лимит

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    console.log('Projects fetched:', data?.length || 0);
    
    return data as Project[];
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('music_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return data as Project;
  }

  async getActiveTasks(telegramId: number): Promise<GenerationTask[]> {
    const profile = await this.getUserByTelegramId(telegramId);
    if (!profile) return [];

    const { data, error } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('user_id', profile.user_id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data as GenerationTask[];
  }

  async incrementPlayCount(trackId: string) {
    const { error } = await supabase.rpc('increment_play_count', {
      track_id: trackId
    });

    if (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  formatTrackCaption(track: Track, index?: number, total?: number): string {
    const title = track.title || 'Новый трек';
    const artist = track.artist || 'MusicVerse AI';
    const style = track.style || '';
    const tags = track.tags ? `🏷 ${track.tags}` : '';
    
    let caption = `🎧 *${this.escapeMarkdown(title)}*\n`;
    caption += `👤 ${this.escapeMarkdown(artist)}\n`;
    
    if (style) {
      caption += `🎸 ${this.escapeMarkdown(style)}\n`;
    }
    
    if (tags) {
      caption += `${tags}\n`;
    }
    
    if (index !== undefined && total !== undefined) {
      caption += `\n💿 Трек ${index + 1} из ${total}`;
    }
    
    if (track.play_count) {
      caption += `\n📊 Прослушиваний: ${track.play_count}`;
    }

    return caption;
  }

  formatProjectCaption(project: Project, index?: number, total?: number): string {
    const title = project.title || 'Новый проект';
    const description = project.description || '';
    const type = project.type || 'single';
    
    let caption = `📁 *${this.escapeMarkdown(title)}*\n`;
    caption += `📀 Тип: ${this.escapeMarkdown(type)}\n`;
    
    if (description) {
      const shortDesc = description.length > 100 
        ? description.substring(0, 100) + '...' 
        : description;
      caption += `\n${this.escapeMarkdown(shortDesc)}\n`;
    }
    
    if (index !== undefined && total !== undefined) {
      caption += `\n📂 Проект ${index + 1} из ${total}`;
    }
    
    caption += `\n📅 Создан: ${new Date(project.created_at).toLocaleDateString('ru-RU')}`;

    return caption;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  escapeMarkdown(text: string): string {
    // Escape markdown special characters for Telegram MarkdownV2
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  getCoverUrl(track: Track): string {
    return track.local_cover_url || track.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80';
  }

  getProjectCoverUrl(project: Project): string {
    return project.cover_url || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop&q=80';
  }

  getAudioUrl(track: Track): string | null {
    return track.local_audio_url || track.audio_url;
  }
}

export const musicService = new MusicService();
