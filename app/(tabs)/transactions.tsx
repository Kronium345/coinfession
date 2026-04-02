import { useSubscriptions } from "@/context/SubscriptionsContext";
import { listTransactions, toUserFriendlyErrorMessage, type NormalizedTransaction } from "@/lib/api";
import { shareTransactionsAsCsv } from "@/lib/exportCsv";
import { resolveSubscriptionIcon } from "@/lib/resolveSubscriptionIcon";
import { cx } from "@/lib/tw";
import { useAuth } from "@clerk/expo";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme";

export default function TransactionsScreen() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const { addSubscription } = useSubscriptions();
  const [items, setItems] = useState<NormalizedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listTransactions(getTokenRef.current, { limit: 100 });
      setItems(response.items.filter((i) => i.sourceType === "bank_sync"));
    } catch (e) {
      setError(toUserFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Math.abs(item.amount), 0),
    [items]
  );

  const onExportCsv = async () => {
    if (items.length === 0) {
      Alert.alert("Nothing to export", "Sync transactions first, then try again.");
      return;
    }
    setExportBusy(true);
    try {
      await shareTransactionsAsCsv(items);
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setExportBusy(false);
    }
  };

  const addAsSubscription = async (txn: NormalizedTransaction) => {
    const now = dayjs();
    await addSubscription({
      id: `txn-${txn._id}`,
      name: txn.merchant,
      plan: txn.category,
      category: txn.category,
      paymentMethod: "Bank-linked",
      status: "active",
      startDate: now.toISOString(),
      price: Math.abs(txn.amount),
      currency: txn.currency ?? "USD",
      billing: "Monthly",
      renewalDate: now.add(1, "month").toISOString(),
      color: "#dcdcdc",
      icon: resolveSubscriptionIcon(txn.merchant),
    });
  };

  return (
    <SafeAreaView style={[cx("flex-1 px-5 pt-2"), { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={cx("list-title", "mb-0")}>Transactions</Text>
        <Pressable
          onPress={() => void onExportCsv()}
          disabled={exportBusy || items.length === 0}
          style={{ opacity: exportBusy || items.length === 0 ? 0.5 : 1 }}
        >
          {exportBusy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[cx("auth-helper"), { textDecorationLine: "underline", color: colors.primary }]}>
              Export CSV
            </Text>
          )}
        </Pressable>
      </View>
      <Text style={cx("auth-helper", "mb-4")}>Bank-synced total: ${total.toFixed(2)}</Text>
      {loading ? <Text style={cx("home-empty-state")}>Loading transactions...</Text> : null}
      {error ? <Text style={cx("home-empty-state")}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={() => <View style={cx("h-3")} />}
        contentContainerStyle={cx("pb-30")}
        ListEmptyComponent={<Text style={cx("home-empty-state")}>No synced transactions yet.</Text>}
        renderItem={({ item }) => (
          <View style={cx("auth-card")}>
            <Text style={cx("auth-label")}>{item.merchant}</Text>
            <Text style={cx("auth-helper")}>{item.category}</Text>
            <Text style={cx("auth-helper")}>
              {dayjs(item.occurredAt).format("MMM D, YYYY")} • {item.pending ? "Pending" : "Posted"}
            </Text>
            <Text style={cx("auth-title")}>${Math.abs(item.amount).toFixed(2)}</Text>
            <Pressable onPress={() => void addAsSubscription(item)} style={[cx("auth-button"), { marginTop: 8 }]}>
              <Text style={cx("auth-button-text")}>Add as subscription</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

