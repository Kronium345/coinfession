import ProfileAvatar from "@/components/ProfileAvatar";
import { UserProfileView } from "@clerk/expo/native";
import { isClerkAPIResponseError, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "burnt";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../../theme";

const pickerOpts: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

function isImagePickerNativeMissing(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("ExponentImagePicker") || msg.includes("NativeModule ExpoImagePicker");
}

function alertImagePickerNeedsNativeBuild() {
  Alert.alert(
    "Install a new development build",
    "expo-image-picker only works after the native app is compiled with it. From the coinfession folder run: eas build --profile development --platform android (or ios), install that build, then open the app again. If you build locally: npx expo prebuild && npx expo run:android --device."
  );
}

/**
 * Clerk’s embedded native UserProfile uses the native Clerk SDK for uploads.
 * Opening the camera can briefly desync native vs JS session, which surfaces as
 * “not authenticated”. Uploading via `user.setProfileImage` uses the JS session
 * and avoids that path.
 */
export default function UserProfileScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [photoBusy, setPhotoBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void user?.reload();
      };
    }, [user])
  );

  const uploadFromUri = async (uri: string) => {
    if (!user) return;
    const base64 = await readAsStringAsync(uri, { encoding: "base64" });
    await user.setProfileImage({ file: base64 });
    await user.reload();
    toast({ title: "Profile photo updated", preset: "done" });
  };

  const openCamera = async () => {
    if (!user) return;
    setPhotoBusy(true);
    try {
      const { granted, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Camera access",
          canAskAgain === false
            ? "Enable the camera for Coinfession in system settings to take a profile photo."
            : "Camera permission is needed to take a profile photo."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync(pickerOpts);
      if (result.canceled || !result.assets[0]) return;
      await uploadFromUri(result.assets[0].uri);
    } catch (e) {
      if (isImagePickerNativeMissing(e)) {
        alertImagePickerNeedsNativeBuild();
        return;
      }
      const msg = isClerkAPIResponseError(e)
        ? e.errors?.[0]?.message ?? e.message
        : e instanceof Error
          ? e.message
          : "Could not update profile photo.";
      Alert.alert("Upload failed", msg);
    } finally {
      setPhotoBusy(false);
    }
  };

  const openLibrary = async () => {
    if (!user) return;
    setPhotoBusy(true);
    try {
      const { granted, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Photos access",
          canAskAgain === false
            ? "Enable photo access for Coinfession in system settings to choose a profile photo."
            : "Photo library permission is needed to choose a profile photo."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync(pickerOpts);
      if (result.canceled || !result.assets[0]) return;
      await uploadFromUri(result.assets[0].uri);
    } catch (e) {
      if (isImagePickerNativeMissing(e)) {
        alertImagePickerNeedsNativeBuild();
        return;
      }
      const msg = isClerkAPIResponseError(e)
        ? e.errors?.[0]?.message ?? e.message
        : e instanceof Error
          ? e.message
          : "Could not update profile photo.";
      Alert.alert("Upload failed", msg);
    } finally {
      setPhotoBusy(false);
    }
  };

  const pickPhotoSource = () => {
    const camera = () => void openCamera();
    const library = () => void openLibrary();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take photo", "Choose from library"],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) camera();
          if (i === 2) library();
        }
      );
    } else {
      Alert.alert("Profile photo", "Use your signed-in session to upload (fixes camera auth issues).", [
        { text: "Cancel", style: "cancel" },
        { text: "Take photo", onPress: camera },
        { text: "Choose from library", onPress: library },
      ]);
    }
  };

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

      {isLoaded && user ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <ProfileAvatar imageUrl={user.imageUrl} style={{ width: 56, height: 56, borderRadius: 28 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.primary }}>
              Profile photo
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
              Use this if the camera in the section below says you’re not signed in—it uses your app
              session directly.
            </Text>
          </View>
          <Pressable
            onPress={pickPhotoSource}
            disabled={photoBusy}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: colors.accent,
              opacity: photoBusy ? 0.65 : 1,
            }}
          >
            {photoBusy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary }}>
                Change
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <UserProfileView style={{ flex: 1 }} isDismissable={false} />
    </SafeAreaView>
  );
}
