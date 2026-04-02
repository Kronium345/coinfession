import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { Platform } from "react-native";

const RENEWAL_ID_PREFIX = "renewal:";
const ANDROID_CHANNEL = "renewals";

type RenewalSubscription = {
  id: string;
  name: string;
  renewalDate?: string;
  status?: string;
};

let handlerReady = false;

export function ensureNotificationHandler(): void {
  if (handlerReady) return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "Subscription renewals",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function clearRenewalScheduledNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending.map((p) => {
      if (p.identifier.startsWith(RENEWAL_ID_PREFIX)) {
        return Notifications.cancelScheduledNotificationAsync(p.identifier);
      }
      return Promise.resolve();
    })
  );
}

function countsAsActive(s: RenewalSubscription): boolean {
  const st = s.status?.toLowerCase().trim();
  return !st || st === "active";
}

/**
 * Schedules one local notification per active subscription: 9:00 local time one day before renewal.
 * Requires a physical device; safe no-op on web / Expo Go limitations for push (local still works on many setups).
 */
export async function syncSubscriptionRenewalReminders(
  subscriptions: RenewalSubscription[]
): Promise<void> {
  if (Platform.OS === "web") return;

  ensureNotificationHandler();
  await ensureAndroidNotificationChannel();

  await clearRenewalScheduledNotifications();

  if (!Device.isDevice) return;

  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = req.status;
  }
  if (status !== "granted") return;

  for (const sub of subscriptions.filter(countsAsActive)) {
    if (!sub.renewalDate) continue;
    const renewal = dayjs(sub.renewalDate);
    if (!renewal.isValid()) continue;
    const remindAt = renewal.subtract(1, "day").hour(9).minute(0).second(0).millisecond(0);
    if (!remindAt.isValid() || remindAt.valueOf() <= Date.now()) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${RENEWAL_ID_PREFIX}${sub.id}`,
        content: {
          title: "Subscription renewing soon",
          body: `${sub.name} renews on ${renewal.format("MMM D")}.`,
          data: { kind: "renewal", subscriptionId: sub.id, url: "/(tabs)/subscriptions" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remindAt.toDate(),
          channelId: Platform.OS === "android" ? ANDROID_CHANNEL : undefined,
        },
      });
    } catch {
      /* single row failure — continue */
    }
  }
}

ensureNotificationHandler();
