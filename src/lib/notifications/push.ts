import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@dalleup.com",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function sendPushNotification(userId: string, payload: { title: string; message: string; type?: string; url?: string }) {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    const data = JSON.stringify({ title: payload.title, message: payload.message, type: payload.type, url: payload.url ?? "/" });
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            data
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => null);
          }
        }
      })
    );
  } catch {
    /* Silencieux : le push ne bloque pas la notification in-app */
  }
}
