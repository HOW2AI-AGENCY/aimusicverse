/**
 * Hook for daily admin stats notification.
 *
 * NOTE: автоматический toast «Статистика приложения» был отключён —
 * на мобильной главной он отрисовывался как прилипший fixed-баннер,
 * перекрывал контент, BottomNav и плеер. Статистика остаётся
 * доступна в админ-панели (/admin/analytics).
 *
 * Хук сохранён как no-op, чтобы не ломать существующие вызовы.
 */

export function useAdminDailyStats(): void {
  // Intentionally empty. See JSDoc above.
}
