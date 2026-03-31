import { cx } from "@/lib/tw";
import { useClerk, useUser } from "@clerk/expo";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <SafeAreaView style={cx("auth-safe-area")} edges={["top"]}>
      <View style={cx("auth-content")}>
        <Text style={cx("auth-title")}>Settings</Text>
        <View style={cx("auth-card")}>
          <Text style={cx("auth-helper")}>
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </Text>
          <Pressable onPress={() => signOut()} style={cx("auth-button")}>
            <Text style={cx("auth-button-text")}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
