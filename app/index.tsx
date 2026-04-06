import { clearClerkSecureStorage } from "@/lib/clerkLocalSession";
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DevSettings,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/** Clerk native sync can hang on stale tokens (e.g. user deleted in dashboard). */
const CLERK_STUCK_AFTER_MS = 15_000;

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [showStuckHelp, setShowStuckHelp] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setShowStuckHelp(false);
      return;
    }
    const t = setTimeout(() => setShowStuckHelp(true), CLERK_STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          gap: 16,
        }}
      >
        <ActivityIndicator size="large" />
        {showStuckHelp ? (
          <>
            <Text
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: 12,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            >
              Bundle key prefix: {publishableKey.slice(0, 16) || "(empty)"}
              …{"\n"}
              If this is not your current Clerk key, fix EAS env and rebuild.
            </Text>
            <Text style={{ textAlign: "center", color: "#444" }}>
              Sign-in is taking too long. If you deleted this user in Clerk or
              switched API keys, clear the saved session and reload.
            </Text>
            <Pressable
              onPress={async () => {
                await clearClerkSecureStorage(publishableKey);
                if (Platform.OS === "web") {
                  window.location.reload();
                } else {
                  DevSettings.reload();
                }
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                backgroundColor: "#111",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Clear saved session & reload
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

