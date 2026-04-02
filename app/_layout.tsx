import "@/lib/notifications";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { PostHogProvider } from "posthog-react-native";
import { useEffect } from "react";
import { Platform } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file."
  );
}

function NotificationDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") return;

    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === "string" && url.length > 0) {
        router.push(url as never);
      }
    };

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (last?.notification) {
        open(last.notification);
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      open(response.notification);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
      options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <NotificationDeepLink />
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkProvider>
    </PostHogProvider>
  );
}
