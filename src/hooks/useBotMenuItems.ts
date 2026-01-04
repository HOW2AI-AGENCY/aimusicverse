/**
 * Hooks for managing Telegram bot menu items
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BotMenuItem {
  id: string;
  menu_key: string;
  parent_key: string | null;
  sort_order: number;
  title: string;
  caption: string | null;
  description: string | null;
  image_url: string | null;
  image_fallback: string | null;
  action_type: string;
  action_data: string | null;
  row_position: number;
  column_span: number;
  is_enabled: boolean;
  show_in_menu: boolean;
  requires_auth: boolean;
  icon_emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemInput {
  menu_key: string;
  parent_key?: string | null;
  sort_order?: number;
  title: string;
  caption?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_fallback?: string | null;
  action_type?: string;
  action_data?: string | null;
  row_position?: number;
  column_span?: number;
  is_enabled?: boolean;
  show_in_menu?: boolean;
  requires_auth?: boolean;
  icon_emoji?: string | null;
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
  id: string;
}

/**
 * Fetch all menu items
 */
export function useBotMenuItems() {
  return useQuery({
    queryKey: ['bot-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_menu_items')
        .select('*')
        .order('parent_key', { ascending: true, nullsFirst: true })
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as BotMenuItem[];
    }
  });
}

/**
 * Fetch menu items by parent key
 */
export function useBotMenuItemsByParent(parentKey: string | null) {
  return useQuery({
    queryKey: ['bot-menu-items', 'parent', parentKey],
    queryFn: async () => {
      let query = supabase
        .from('telegram_menu_items')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (parentKey === null) {
        query = query.is('parent_key', null);
      } else {
        query = query.eq('parent_key', parentKey);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BotMenuItem[];
    }
  });
}

/**
 * Create a new menu item
 */
export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateMenuItemInput) => {
      const { data, error } = await supabase
        .from('telegram_menu_items')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-items'] });
      toast.success('Пункт меню создан');
    },
    onError: (error) => {
      toast.error('Ошибка создания пункта меню', {
        description: error.message
      });
    }
  });
}

/**
 * Update a menu item
 */
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMenuItemInput) => {
      const { data, error } = await supabase
        .from('telegram_menu_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-items'] });
      toast.success('Пункт меню обновлён');
    },
    onError: (error) => {
      toast.error('Ошибка обновления', {
        description: error.message
      });
    }
  });
}

/**
 * Delete a menu item
 */
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-items'] });
      toast.success('Пункт меню удалён');
    },
    onError: (error) => {
      toast.error('Ошибка удаления', {
        description: error.message
      });
    }
  });
}

/**
 * Reorder menu items
 */
export function useReorderMenuItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number; row_position: number }[]) => {
      // Update each item's sort_order and row_position
      const updates = items.map(item =>
        supabase
          .from('telegram_menu_items')
          .update({
            sort_order: item.sort_order,
            row_position: item.row_position,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-items'] });
      toast.success('Порядок сохранён');
    },
    onError: (error) => {
      toast.error('Ошибка сохранения порядка', {
        description: error.message
      });
    }
  });
}

/**
 * Toggle menu item enabled state
 */
export function useToggleMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from('telegram_menu_items')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-items'] });
      toast.success(data.is_enabled ? 'Пункт включён' : 'Пункт отключён');
    },
    onError: (error) => {
      toast.error('Ошибка переключения', {
        description: error.message
      });
    }
  });
}

/**
 * Upload image for menu item
 */
export async function uploadMenuItemImage(file: File, menuKey: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `menu-${menuKey}-${Date.now()}.${fileExt}`;
  const filePath = `menu-images/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('bot-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (uploadError) throw uploadError;
  
  const { data: { publicUrl } } = supabase.storage
    .from('bot-assets')
    .getPublicUrl(filePath);
  
  return publicUrl;
}
