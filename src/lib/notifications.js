import { supabase } from './supabase';

/**
 * Send match notification emails via Supabase Edge Function + Resend.
 * @param {Array<{userId: string, nickname: string}>} matches - matched users
 * @param {string} eventTitle - event title for email content
 * @returns {Promise<{sent: number, failed: number, total: number}>}
 */
export async function sendMatchNotifications(matches, eventTitle) {
  const { data, error } = await supabase.functions.invoke('send-match-notification', {
    body: { matches, eventTitle },
  });

  if (error) {
    console.error('이메일 알림 전송 실패:', error.message);
    throw error;
  }

  return data;
}
