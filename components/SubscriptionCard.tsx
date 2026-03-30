import { cx } from '@/lib/tw';
import { formatCurrency, formatSubscriptionDateTime } from '@/lib/utils';
import React from 'react';
import { Image, Text, View } from 'react-native';

type SubscriptionCardInput = SubscriptionCardProps | ({ data: Subscription } & Pick<SubscriptionCardProps, "expanded" | "onPress" | "onCancelPress" | "isCancelling">);

const SubscriptionCard = (props: SubscriptionCardInput) => {
    const record = "data" in props ? props.data : props;
    const { name, price, currency, icon, billing, color, category, plan, renewalDate } = record;

    return (
        <View style={[
            cx("sub-card", !color && "bg-card"),
            color ? { backgroundColor: color } : undefined,
        ]}>
            <View style={cx("sub-head")}>
                <View style={cx("sub-main")}>
                    <Image source={icon} style={cx("sub-icon")} />
                    <View style={cx("sub-copy")}>
                        <Text numberOfLines={1} style={cx("sub-title")}>{name}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={cx("sub-meta")}>
                            {category?.trim() || plan?.trim() || formatSubscriptionDateTime(renewalDate)}
                        </Text>
                    </View>
                </View>
                <View style={cx("sub-price-box")}>
                    <Text style={cx("sub-price")}>{formatCurrency(price, currency)}</Text>
                    <Text style={cx("sub-billing")}>{billing}</Text>
                </View>
            </View>
        </View>
    )
}

export default SubscriptionCard