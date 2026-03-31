import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubsCard from "@/components/UpcomingSubsCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import { cx } from "@/lib/tw";
import { formatCurrency, formatSubscriptionDateTime } from "@/lib/utils";
import { useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors, fonts } from "../../theme";


export default function App() {

  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  return (
    <SafeAreaView style={[tw`flex-1 px-5 pt-2`, { backgroundColor: colors.background }]}>
      <View style={cx("home-header")}>
        <View style={cx("home-user")}>
          <Image source={images.avatar} style={cx("home-avatar")} />
          <Text style={cx("home-user-name")}>{HOME_USER.name}</Text>
        </View>
        <Image source={icons.add} style={cx("home-add-icon")} />
      </View>
      <View style={cx("home-balance-card")}>
        <Text style={cx("home-balance-label")}>Balance</Text>
        <View style={cx("home-balance-row")}>
          <Text style={cx("home-balance-amount")}>{formatCurrency(HOME_BALANCE.amount)}</Text>
          <Text style={cx("home-balance-date")}>{formatSubscriptionDateTime(HOME_BALANCE.nextRenewalDate)}</Text>
        </View>
      </View>
      <View>
        <ListHeading title="Upcoming" />
        <FlatList
          data={UPCOMING_SUBSCRIPTIONS}
          renderItem={({ item }) => <UpcomingSubsCard {...item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text style={cx("home-empty-state")}>No upcoming renewals yet.</Text>}
        />
      </View>
      <View>
        <ListHeading title="All Subscriptions" />
        <SubscriptionCard
          expanded={expandedSubscriptionId === HOME_SUBSCRIPTIONS[0].id}
          data={HOME_SUBSCRIPTIONS[0]}
          onPress={() => { setExpandedSubscriptionId((currentId) => (currentId === HOME_SUBSCRIPTIONS[0].id ? null : HOME_SUBSCRIPTIONS[0].id)); }}
        />
      </View>
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