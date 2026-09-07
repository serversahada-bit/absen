import webpush from 'web-push';
import { query } from './db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface PushSubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscription(sub: PushSubscriptionRow, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
    } else {
      console.error('[Push] Gagal kirim notifikasi:', error.message || error);
    }
  }
}

export async function sendPushToKaryawan(karyawanId: number, payload: PushPayload) {
  const subs: PushSubscriptionRow[] = await query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE karyawan_id = ?',
    [karyawanId]
  );
  await Promise.all(subs.map((sub) => sendToSubscription(sub, payload)));
}

export async function sendPushBroadcast(payload: PushPayload) {
  const subs: PushSubscriptionRow[] = await query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions'
  );
  await Promise.all(subs.map((sub) => sendToSubscription(sub, payload)));
}
