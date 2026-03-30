import { cx } from "@/lib/tw";
import { formatCurrency } from "@/lib/utils";
import React from 'react';
import { Image, Text, View } from 'react-native';

const UpcomingSubsCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
    return (
        <View style={cx("upcoming-card")}>
            <View style={cx("upcoming-row")}>
                <Image source={icon} style={cx("upcoming-icon")} />
                <View>
                    <Text style={cx("upcoming-price")}>{formatCurrency(price, currency)}</Text>
                    <Text style={cx("upcoming-meta")} numberOfLines={1}>{daysLeft > 1 ? `${daysLeft} days left` : `${daysLeft} day left`}</Text>
                </View>
            </View>
            <Text style={cx("upcoming-name")} numberOfLines={1}>{name}</Text>
        </View>
    )
}

export default UpcomingSubsCard