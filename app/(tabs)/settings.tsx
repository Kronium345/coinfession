import { cx } from "@/lib/tw";
import { useClerk, useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();

  const handleLogout = async () => {
    posthog.capture("logout_clicked", {
      source: "settings",
      has_user: Boolean(user?.id),
    });

    try {
      await signOut();
      posthog.capture("logout_success", {
        source: "settings",
      });
    } catch (error) {
      posthog.capture("logout_failed", {
        source: "settings",
        message: error instanceof Error ? error.message : "Unknown sign out error",
      });
      throw error;
    }
  };

  return (
    <SafeAreaView style={cx("auth-safe-area")} edges={["top"]}>
      <View style={cx("auth-content")}>
        <Text style={cx("auth-title")}>Settings</Text>
        <View style={cx("auth-card")}>
          <Text style={cx("auth-helper")}>
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </Text>
          <Pressable onPress={handleLogout} style={cx("auth-button")}>
            <Text style={cx("auth-button-text")}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
