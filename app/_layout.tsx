import { ClerkProvider } from "@clerk/expo";
import { resourceCache } from "@clerk/expo/resource-cache";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { initNotificationHandler, notificationsNativeAvailable } from "@/lib/notifications";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { InteractionManager, Platform } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file."
  );
}

void SplashScreen.preventAutoHideAsync();

function NotificationDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const Notifications = await import("expo-notifications");
          if (cancelled) {
            return;
          }

          const open = (n: import("expo-notifications").Notification) => {
            const url = n.request.content.data?.url;
            if (typeof url === "string" && url.length > 0) {
              router.push(url as never);
            }
          };

          const last = await Notifications.getLastNotificationResponseAsync();
          if (!cancelled && last?.notification) {
            open(last.notification);
            void Notifications.clearLastNotificationResponseAsync();
          }

          subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            open(response.notification);
          });
        } catch {
          /* Expo Go / missing native module — ignore */
        }
      })();
    });

    return () => {
      cancelled = true;
      task.cancel();
      subscription?.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  const fontsReady = fontsLoaded || fontError != null;

  useEffect(() => {
    if (fontError && __DEV__) {
      console.warn("[expo-font]", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  useEffect(() => {
    if (!fontsReady || Platform.OS === "web") {
      return;
    }
    if (notificationsNativeAvailable()) {
      void initNotificationHandler();
    }
  }, [fontsReady]);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      __experimental_resourceCache={resourceCache}
    >
      {fontsReady ? (
        <>
          <NotificationDeepLink />
          <Stack screenOptions={{ headerShown: false }} />
        </>
      ) : null}
    </ClerkProvider>
  );
}
