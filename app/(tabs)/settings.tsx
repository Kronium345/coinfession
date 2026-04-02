import {
  getInsightsSummary,
  listBankConnections,
  recomputeInsights,
  syncBankTransactions,
  type BankConnection,
} from "@/lib/api";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { cx } from "@/lib/tw";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import { useUserProfileModal } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import { colors } from "../../theme";

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { presentUserProfile, isAvailable } = useUserProfileModal();
  const getTokenRef = useRef(getToken);
  const hasBootstrappedRef = useRef(false);
  const posthog = usePostHog();
  const {
    renewalRemindersEnabled,
    setRenewalRemindersEnabled,
    renewalRemindersPrefLoaded,
  } = useSubscriptions();
  const { startLink, busy: plaidBusy, error: plaidError, clearError } = usePlaidLink();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [insightsUpdatedAt, setInsightsUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const lastBankSync = useMemo(() => {
    const times = connections
      .map((c) => (c.lastSyncAt ? new Date(c.lastSyncAt).getTime() : null))
      .filter((t): t is number => t !== null);
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [connections]);

  const refreshInsightsMeta = useCallback(async () => {
    try {
      const summary = await getInsightsSummary(getTokenRef.current);
      setInsightsUpdatedAt(summary.insightsUpdatedAt ?? null);
    } catch {
      setInsightsUpdatedAt(null);
    }
  }, []);

  const refreshConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const rows = await listBankConnections(getTokenRef.current);
      setConnections(rows);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;
    void refreshConnections();
    void refreshInsightsMeta();
  }, [refreshConnections, refreshInsightsMeta]);

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

  const handleSync = async () => {
    setSyncBusy(true);
    setSyncMessage(null);
    try {
      const result = await syncBankTransactions(getTokenRef.current);
      const detail = result.results
        .map((r) =>
          r.ok
            ? `${r.itemId}: +${r.added ?? 0}/~${r.modified ?? 0}/-${r.removed ?? 0}`
            : `${r.itemId}: ${r.error ?? "error"}`
        )
        .join(" · ");
      const hasSuccessfulSync = result.results.some((r) => r.ok);
      if (hasSuccessfulSync) {
        await recomputeInsights(getTokenRef.current);
      }
      setSyncMessage(
        `${result.message} ${result.linkedAccounts} item(s). ${detail || ""}`.trim()
      );
      await refreshConnections();
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncBusy(false);
    }
  };

  const connectUs = () => {
    clearError();
    void startLink("US");
  };

  const connectUk = () => {
    clearError();
    void startLink("GB");
  };

  return (
    <SafeAreaView style={cx("auth-safe-area")} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[cx("auth-content"), { paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={cx("auth-title")}>Settings</Text>

        <View style={cx("auth-card")}>
          <Text style={[cx("auth-helper"), { marginBottom: 12 }]}>Profile</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={cx("auth-label")}>
                {user?.firstName || user?.username || "User"}
              </Text>
              <Text style={cx("auth-helper")}>
                {user?.primaryEmailAddress?.emailAddress ?? "No email on file"}
              </Text>
            </View>
          </View>
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
              {isAvailable ? "Edit profile photo/details" : "Profile unavailable"}
            </Text>
          </Pressable>
        </View>

        <View style={cx("auth-card")}>
          <Text style={[cx("auth-helper"), { marginBottom: 12 }]}>Notifications</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={cx("auth-label")}>Renewal reminders</Text>
              <Text style={[cx("auth-helper"), { marginTop: 4 }]}>
                Schedules a local notification one day before each active subscription renews. Uses
                this device only; rebuild after enabling the notifications plugin if needed.
              </Text>
            </View>
            <Switch
              value={renewalRemindersEnabled}
              onValueChange={setRenewalRemindersEnabled}
              disabled={!renewalRemindersPrefLoaded}
              trackColor={{ false: "#c9c9c9", true: `${colors.accent}99` }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={cx("auth-card")}>
          <Text style={[cx("auth-helper"), { marginBottom: 12 }]}>Linked banks (Plaid)</Text>
          {plaidError ? (
            <Text style={[cx("auth-error"), { marginBottom: 8 }]}>{plaidError}</Text>
          ) : null}
          {syncMessage ? (
            <Text style={[cx("auth-helper"), { marginBottom: 8 }]}>{syncMessage}</Text>
          ) : null}
          {loadingConnections ? (
            <ActivityIndicator style={{ marginBottom: 12 }} />
          ) : connections.length === 0 ? (
            <Text style={[cx("auth-helper"), { marginBottom: 12 }]}>
              No bank connections yet. Use a development build (not Expo Go) for Plaid Link.
            </Text>
          ) : (
            <View style={{ gap: 10, marginBottom: 12 }}>
              {connections.map((c) => (
                <View key={c._id} style={{ borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, padding: 10 }}>
                  <Text style={{ fontWeight: "600" }}>
                    {c.institutionName ?? c.institutionId ?? "Bank"}
                  </Text>
                  <Text style={cx("auth-helper")}>Status: {c.status}</Text>
                  {c.lastSyncAt ? (
                    <Text style={cx("auth-helper")}>Last sync: {new Date(c.lastSyncAt).toLocaleString()}</Text>
                  ) : null}
                  {c.lastSyncError ? (
                    <Text style={cx("auth-error")}>{c.lastSyncError}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={connectUs}
            disabled={plaidBusy || syncBusy}
            style={[cx("auth-button"), (plaidBusy || syncBusy) && { opacity: 0.6 }]}
          >
            {plaidBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={cx("auth-button-text")}>Connect bank (US)</Text>
            )}
          </Pressable>

          <Pressable
            onPress={connectUk}
            disabled={plaidBusy || syncBusy}
            style={[cx("auth-button"), { marginTop: 10 }, (plaidBusy || syncBusy) && { opacity: 0.6 }]}
          >
            <Text style={cx("auth-button-text")}>Connect bank (UK)</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleSync()}
            disabled={syncBusy || plaidBusy}
            style={[cx("auth-button"), { marginTop: 10 }, (syncBusy || plaidBusy) && { opacity: 0.6 }]}
          >
            {syncBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={cx("auth-button-text")}>Sync transactions now</Text>
            )}
          </Pressable>

          <Pressable onPress={() => void refreshConnections()} style={{ marginTop: 12 }}>
            <Text style={[cx("auth-helper"), { textDecorationLine: "underline" }]}>Refresh connection list</Text>
          </Pressable>
          {lastBankSync ? (
            <Text style={[cx("auth-helper"), { marginTop: 10 }]}>
              Last bank sync: {lastBankSync.toLocaleString()}
            </Text>
          ) : null}
          {insightsUpdatedAt ? (
            <Text style={[cx("auth-helper"), { marginTop: 4 }]}>
              Insights last computed: {new Date(insightsUpdatedAt).toLocaleString()}
            </Text>
          ) : null}
          <Text style={[cx("auth-helper"), { marginTop: 12 }]}>
            Linking a bank only requests read-only transaction data for this app. Plaid does not
            charge your accounts on behalf of Coinfession from this connection flow.
          </Text>
        </View>

        <View style={cx("auth-card")}>
          <Text style={cx("auth-helper")}>
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </Text>
          <Pressable onPress={handleLogout} style={[cx("auth-button"), { marginTop: 16 }]}>
            <Text style={cx("auth-button-text")}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
