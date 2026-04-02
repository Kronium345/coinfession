import images from "@/constants/images";
import { Image } from "expo-image";
import type { StyleProp } from "react-native";
import type { ImageStyle } from "react-native";

type ProfileAvatarProps = {
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
};

export default function ProfileAvatar({ imageUrl, style }: ProfileAvatarProps) {
  return (
    <Image
      source={imageUrl ? { uri: imageUrl } : images.avatar}
      style={style}
      cachePolicy="none"
      contentFit="cover"
    />
  );
}
