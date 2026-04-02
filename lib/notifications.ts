import Constants from "expo-constants";
import * as Device from "expo-device";
import dayjs from "dayjs";
import { Platform } from "react-native";

const RENEWAL_ID_PREFIX = "renewal:";
const ANDROID_CHANNEL = "renewals";

type NotificationsModule = typeof import("expo-notifications");

type RenewalSubscription = {
  id: string;
  name: string;
  renewalDate?: string;
  status?: string;
};

let cachedNotifications: NotificationsModule | null = null;
let notificationsLoadFailed = false;
let handlerReady = false;

/**
 * `expo-notifications` must never be `import()`-ed in Expo Go: its entry loads `ExpoPushTokenManager`,
 * which is not present on Android Expo Go (SDK 53+). Use a development / production build instead.
 */
export function notificationsNativeAvailable(): boolean {
  if (Platform.OS === "web") {
    return false;
  }
  if (Constants.appOwnership === "expo") {
    return false;
  }
  return true;
}

/**
 * Lazy-load expo-notifications only when the runtime includes the native module (not Expo Go).
 */
async function loadNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web" || notificationsLoadFailed || !notificationsNativeAvailable()) {
    return null;
  }
  if (cachedNotifications) {
    return cachedNotifications;
  }
  try {
    cachedNotifications = await import("expo-notifications");
    return cachedNotifications;
  } catch {
    notificationsLoadFailed = true;
    return null;
  }
}

/** Call once after mount (e.g. root layout). Safe no-op if the native module isn’t available. */
export async function initNotificationHandler(): Promise<void> {
  const N = await loadNotifications();
  if (!N || handlerReady) {
    return;
  }
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  } catch {
    notificationsLoadFailed = true;
  }
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  const N = await loadNotifications();
  if (!N || Platform.OS !== "android") {
    return;
  }
  try {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: "Subscription renewals",
      importance: N.AndroidImportance.HIGH,
    });
  } catch {
    /* channel optional */
  }
}

export async function clearRenewalScheduledNotifications(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  const N = await loadNotifications();
  if (!N) {
    return;
  }
  try {
    const pending = await N.getAllScheduledNotificationsAsync();
    await Promise.all(
      pending.map((p) => {
        if (p.identifier.startsWith(RENEWAL_ID_PREFIX)) {
          return N.cancelScheduledNotificationAsync(p.identifier);
        }
        return Promise.resolve();
      })
    );
  } catch {
    /* noop */
  }
}

function countsAsActive(s: RenewalSubscription): boolean {
  const st = s.status?.toLowerCase().trim();
  return !st || st === "active";
}

/**
 * Schedules one local notification per active subscription: 9:00 local time one day before renewal.
 */
export async function syncSubscriptionRenewalReminders(
  subscriptions: RenewalSubscription[]
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await initNotificationHandler();
  const N = await loadNotifications();
  if (!N) {
    return;
  }

  await ensureAndroidNotificationChannel();
  await clearRenewalScheduledNotifications();

  if (!Device.isDevice) {
    return;
  }

  try {
    const perm = await N.getPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      const req = await N.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = req.status;
    }
    if (status !== "granted") {
      return;
    }

    for (const sub of subscriptions.filter(countsAsActive)) {
      if (!sub.renewalDate) {
        continue;
      }
      const renewal = dayjs(sub.renewalDate);
      if (!renewal.isValid()) {
        continue;
      }
      const remindAt = renewal.subtract(1, "day").hour(9).minute(0).second(0).millisecond(0);
      if (!remindAt.isValid() || remindAt.valueOf() <= Date.now()) {
        continue;
      }

      try {
        await N.scheduleNotificationAsync({
          identifier: `${RENEWAL_ID_PREFIX}${sub.id}`,
          content: {
            title: "Subscription renewing soon",
            body: `${sub.name} renews on ${renewal.format("MMM D")}.`,
            data: { kind: "renewal", subscriptionId: sub.id, url: "/(tabs)/subscriptions" },
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: remindAt.toDate(),
            channelId: Platform.OS === "android" ? ANDROID_CHANNEL : undefined,
          },
        });
      } catch {
        /* single row failure */
      }
    }
  } catch {
    notificationsLoadFailed = true;
  }
}
