import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import ListHeading from "@/components/ListHeading";
import ProfileAvatar from "@/components/ProfileAvatar";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubsCard from "@/components/UpcomingSubsCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { icons } from "@/constants/icons";
import { cx } from "@/lib/tw";
import { tabBarScrollPaddingBottom } from "@/lib/tabBarScrollPadding";
import { formatCurrency, formatNextRenewalCaption } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors, fonts } from "../../theme";


export default function App() {

  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const { subscriptions, addSubscription, isLoading, syncError, preferredCurrency } =
    useSubscriptions();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) void user.reload();
    }, [user])
  );

  const homeBalance = useMemo(() => {
    const countsTowardTotal = (s: Subscription) => {
      const st = s.status?.toLowerCase().trim();
      return !st || st === "active";
    };

    const active = subscriptions.filter(countsTowardTotal);
    const yearly = (billing: string) => /year|annual/i.test(billing ?? "");

    let monthlyTotal = 0;
    const currency = active[0]?.currency ?? preferredCurrency;
    for (const s of active) {
      monthlyTotal += yearly(s.billing) ? s.price / 12 : s.price;
    }

    const nextRenewal = active
      .filter((s) => s.renewalDate)
      .map((s) => ({ sub: s, at: dayjs(s.renewalDate) }))
      .filter((x) => x.at.isValid())
      .sort((a, b) => a.at.valueOf() - b.at.valueOf())[0]?.sub.renewalDate ?? null;

    return { monthlyTotal, currency, nextRenewal };
  }, [subscriptions, preferredCurrency]);

  const upcomingSubscriptions = useMemo<UpcomingSubscription[]>(() => {
    const now = dayjs();

    return subscriptions
      .filter((sub) => Boolean(sub.renewalDate))
      .map((sub) => {
        const renewal = dayjs(sub.renewalDate);
        const daysLeft = Math.max(0, renewal.startOf("day").diff(now.startOf("day"), "day"));
        return {
          id: sub.id,
          icon: sub.icon,
          name: sub.name,
          price: sub.price,
          currency: sub.currency ?? preferredCurrency,
          daysLeft,
          renewalTs: renewal.valueOf(),
        };
      })
      .filter((sub) => Number.isFinite(sub.renewalTs))
      .sort((a, b) => a.renewalTs - b.renewalTs)
      .slice(0, 6)
      .map(({ renewalTs, ...sub }) => sub);
  }, [subscriptions, preferredCurrency]);

  return (
    <SafeAreaView style={[tw`flex-1 px-5 pt-2`, { backgroundColor: colors.background }]}>
      <CreateSubscriptionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={addSubscription}
        defaultCurrency={preferredCurrency}
      />
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View style={cx("home-header")}>
              <View style={cx("home-user")}>
                <ProfileAvatar imageUrl={user?.imageUrl} style={cx("home-avatar")} />
                <Text style={cx("home-user-name")}>
                  {user?.firstName?.trim() ||
                    user?.username ||
                    user?.primaryEmailAddress?.emailAddress ||
                    "Welcome"}
                </Text>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
              >
                <Image source={icons.add} style={cx("home-add-icon")} />
              </Pressable>
            </View>

            <View style={cx("home-balance-card")}>
              <Text style={cx("home-balance-label")}>Monthly recurring</Text>
              <View style={cx("home-balance-stack")}>
                <Text style={cx("home-balance-amount")}>
                  {formatCurrency(homeBalance.monthlyTotal, homeBalance.currency)}
                </Text>
                <Text style={cx("home-balance-meta")}>{formatNextRenewalCaption(homeBalance.nextRenewal)}</Text>
              </View>
            </View>

            <View style={cx("mb-5")}>
              <ListHeading title="Upcoming" />
              <FlatList
                data={upcomingSubscriptions}
                renderItem={({ item }) => <UpcomingSubsCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<Text style={cx("home-empty-state")}>No upcoming renewals yet.</Text>}
              />
            </View>

            <ListHeading title="All Subscriptions" />
            {isLoading ? <Text style={cx("home-empty-state")}>Syncing subscriptions...</Text> : null}
            {syncError ? <Text style={cx("home-empty-state")}>{syncError}</Text> : null}
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => { setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id)); }}
          />}
        extraData={{ expandedSubscriptionId, count: subscriptions.length }}
        ItemSeparatorComponent={() => <View style={cx("h-4")} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={cx("home-empty-state")}>No subscriptions yet.</Text>}
        contentContainerStyle={{ paddingBottom: tabBarScrollPaddingBottom(insets.bottom) }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    ...tw`text-5xl`,
    color: colors.success,
    fontFamily: fonts.sansExtrabold,
  },
  subtitle: {
    ...tw`mt-2 text-base`,
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
  },
  link: {
    ...tw`text-white`,
    backgroundColor: colors.primary,
    fontFamily: fonts.sansBold,
    marginTop: 4,
    borderRadius: 4,
    padding: 4,
  },
});