/**
 * Project Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleProjectCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (!data.startsWith('project_') && !data.startsWith('projects_page_') && !data.startsWith('copy_project_link_') && data !== 'nav_projects') {
    return false;
  }

  const { 
    handleProjectsCallback, 
    handleProjectDetails, 
    handleProjectEdit, 
    handleProjectStatusChange, 
    handleProjectDeleteConfirm, 
    handleProjectDelete, 
    handleProjectTracks,
    handleProjectShare,
    handleProjectStats
  } = await import('../handlers/projects.ts');
  
  if (data === 'nav_projects' || data.startsWith('projects_page_')) {
    const page = data.startsWith('projects_page_') ? parseInt(data.split('_')[2]) : 0;
    await handleProjectsCallback(chatId, userId, messageId, queryId, page);
    return true;
  }

  if (data.startsWith('project_details_')) {
    await handleProjectDetails(chatId, data.replace('project_details_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('project_share_')) {
    await handleProjectShare(chatId, data.replace('project_share_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('project_stats_')) {
    await handleProjectStats(chatId, data.replace('project_stats_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('project_edit_')) {
    await handleProjectEdit(chatId, data.replace('project_edit_', ''), userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('project_status_')) {
    const parts = data.replace('project_status_', '').split('_');
    await handleProjectStatusChange(chatId, parts[0], parts[1], userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('project_delete_confirm_')) {
    await handleProjectDeleteConfirm(chatId, data.replace('project_delete_confirm_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('project_delete_')) {
    await handleProjectDelete(chatId, data.replace('project_delete_', ''), userId, messageId, queryId);
    return true;
  }

  if (data.startsWith('project_tracks_')) {
    await handleProjectTracks(chatId, data.replace('project_tracks_', ''), messageId, queryId);
    return true;
  }

  if (data.startsWith('copy_project_link_')) {
    await answerCallbackQuery(queryId, '📋 Ссылка скопирована!');
    return true;
  }

  return false;
}
