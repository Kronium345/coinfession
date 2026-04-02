import { cx } from "@/lib/tw";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const ListHeading = ({ title }: ListHeadingProps) => {
  const router = useRouter();
  return (
    <View style={cx("list-head")}>
      <Text style={cx("list-title")}>{title}</Text>
      <Pressable
        onPress={() => router.push("/subscriptions")}
        style={cx("list-action")}
        accessibilityRole="button"
        accessibilityLabel="View all subscriptions"
      >
        <Text style={cx("list-action-text")}>View All</Text>
      </Pressable>
    </View>
  );
};

export default ListHeading