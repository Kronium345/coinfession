import { cx } from "@/lib/tw";
import { Text, View } from "react-native";

export function AuthBrandBlock() {
  return (
    <View style={cx("auth-brand-block")}>
      <View style={cx("auth-logo-wrap")}>
        <View style={cx("auth-logo-mark")}>
          <Text style={cx("auth-logo-mark-text")}>C</Text>
        </View>
        <View>
          <Text style={cx("auth-wordmark")}>Coinfession</Text>
          <Text style={cx("auth-wordmark-sub")}>Subscription clarity</Text>
        </View>
      </View>
    </View>
  );
}
