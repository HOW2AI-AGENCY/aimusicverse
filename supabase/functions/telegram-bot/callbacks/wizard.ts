/**
 * Wizard Callback Handlers
 */

export async function handleWizardCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (data.startsWith('wizard_')) {
    const { handleWizardCallback } = await import('../wizards/project-wizard.ts');
    const handled = await handleWizardCallback(data, chatId, userId, messageId, queryId);
    return handled;
  }

  return false;
}
