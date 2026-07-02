/**
 * useSendAdminMessage — mutation hook for sending admin-authored messages
 * to a list of selected users via the send-admin-message edge function.
 */
import { useMutation } from "@tanstack/react-query";
import { sendAdminMessageToUsers } from "@/services/admin.service";

export interface SendAdminMessageInput {
  userIds: string[];
  title?: string;
  message: string;
}

export interface SendAdminMessageResult {
  sent: number;
}

export function useSendAdminMessage() {
  return useMutation<SendAdminMessageResult, Error, SendAdminMessageInput>({
    mutationFn: async (input) => sendAdminMessageToUsers(input),
  });
}
