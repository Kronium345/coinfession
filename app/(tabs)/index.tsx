import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubsCard from "@/components/UpcomingSubsCard";
import { HOME_BALANCE } from "@/constants/data";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import { cx } from "@/lib/tw";
import { formatCurrency, formatSubscriptionDateTime } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors, fonts } from "../../theme";


export default function App() {

  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const { subscriptions, addSubscription, isLoading, syncError } = useSubscriptions();
  const { user } = useUser();
  const [createModalVisible, setCreateModalVisible] = useState(false);
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
          currency: sub.currency ?? "USD",
          daysLeft,
          renewalTs: renewal.valueOf(),
        };
      })
      .filter((sub) => Number.isFinite(sub.renewalTs))
      .sort((a, b) => a.renewalTs - b.renewalTs)
      .slice(0, 6)
      .map(({ renewalTs, ...sub }) => sub);
  }, [subscriptions]);

  return (
    <SafeAreaView style={[tw`flex-1 px-5 pt-2`, { backgroundColor: colors.background }]}>
      <CreateSubscriptionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={addSubscription}
      />
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View style={cx("home-header")}>
              <View style={cx("home-user")}>
                <Image
                  source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                  style={cx("home-avatar")}
                />
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
              <Text style={cx("home-balance-label")}>Balance</Text>
              <View style={cx("home-balance-row")}>
                <Text style={cx("home-balance-amount")}>{formatCurrency(HOME_BALANCE.amount)}</Text>
                <Text style={cx("home-balance-date")}>{formatSubscriptionDateTime(HOME_BALANCE.nextRenewalDate)}</Text>
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
        contentContainerStyle={cx("pb-30")}
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