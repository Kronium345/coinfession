import { UserProfileView } from "@clerk/expo/native";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../../theme";

/**
 * In-app profile (replaces native modal from useUserProfileModal).
 * Clerk’s modal runs getSession() after dismiss; a brief native/JS desync can
 * look like “no session” and trigger an unwanted sign-out when pressing back.
 */
export default function UserProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  useFocusEffect(
    useCallback(() => {
      return () => {
        void user?.reload();
      };
    }, [user])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          style={{ padding: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text
          style={{
            marginLeft: 4,
            fontSize: 18,
            fontFamily: fonts.sansBold,
            color: colors.primary,
          }}
        >
          Account
        </Text>
      </View>
      <UserProfileView style={{ flex: 1 }} isDismissable={false} />
    </SafeAreaView>
  );
}
