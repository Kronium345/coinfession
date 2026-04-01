import { cx } from "@/lib/tw";
import { useUser, useUserProfileModal } from "@clerk/expo";
import { UserButton } from "@clerk/expo/native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user } = useUser();
  const { presentUserProfile, isAvailable } = useUserProfileModal();

  return (
    <SafeAreaView style={cx("auth-safe-area")} edges={["top"]}>
      <View style={cx("auth-content")}>
        <Text style={cx("auth-title")}>Profile</Text>
        <View style={cx("auth-card")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <UserButton />
            <View style={{ flex: 1 }}>
              <Text style={cx("auth-label")}>
                {user?.firstName || user?.username || "User"}
              </Text>
              <Text style={cx("auth-helper")}>
                {user?.primaryEmailAddress?.emailAddress ?? "No email on file"}
              </Text>
            </View>
          </View>

          <Text style={[cx("auth-helper"), { marginTop: 12 }]}>
            Manage name, profile photo, and account details via Clerk native profile.
          </Text>

          <Pressable
            onPress={() => void presentUserProfile()}
            disabled={!isAvailable}
            style={[
              cx("auth-button"),
              { marginTop: 14 },
              !isAvailable ? { opacity: 0.6 } : null,
            ]}
          >
            <Text style={cx("auth-button-text")}>
              {isAvailable ? "Edit profile photo/details" : "Profile modal unavailable"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

