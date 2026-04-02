import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { cx } from "@/lib/tw";
import { tabBarScrollPaddingBottom } from "@/lib/tabBarScrollPadding";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { subscriptions, isLoading, syncError } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;

    return subscriptions.filter((sub) => {
      const haystack = [
        sub.name,
        sub.category,
        sub.plan,
        sub.paymentMethod,
        sub.billing,
        sub.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, subscriptions]);

  return (
    <SafeAreaView
      style={[cx("flex-1 px-5 pt-2"), { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={cx("flex-1")}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={cx("list-title", "mb-3")}>Subscriptions</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, category, plan…"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={cx("auth-input", "mb-4")}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          extraData={{ expandedSubscriptionId, count: subscriptions.length }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={cx("h-4")} />}
          contentContainerStyle={{ paddingBottom: tabBarScrollPaddingBottom(insets.bottom) }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={cx("home-empty-state")}>
              {query.trim()
                ? "No subscriptions match your search."
                : "No subscriptions yet."}
            </Text>
          }
          ListHeaderComponent={
            <>
              {isLoading ? <Text style={cx("home-empty-state")}>Syncing subscriptions...</Text> : null}
              {syncError ? <Text style={cx("home-empty-state")}>{syncError}</Text> : null}
            </>
          }
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() => {
                setExpandedSubscriptionId((id) =>
                  id === item.id ? null : item.id
                );
              }}
            />
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
