/**
 * useHealthAlert — mutation hooks for the admin health-alert controls.
 *
 * - useSendTestHealthAlert: dispatch a test alert
 * - useForceHealthAlert: bypass the health gate and dispatch immediately
 */
import { useMutation } from "@tanstack/react-query";
import { sendTestHealthAlert, forceHealthAlert } from "@/services/admin.service";

export function useSendTestHealthAlert() {
  return useMutation<Record<string, unknown>, Error, void>({
    mutationFn: async () => sendTestHealthAlert(),
  });
}

export function useForceHealthAlert() {
  return useMutation<Record<string, unknown>, Error, void>({
    mutationFn: async () => forceHealthAlert(),
  });
}
