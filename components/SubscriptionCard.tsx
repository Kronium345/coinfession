import { cx } from '@/lib/tw';
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from '@/lib/utils';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

type ExplicitProps = SubscriptionCardProps;
type DataWrapperProps = {
    data: Subscription;
} & Pick<SubscriptionCardProps, "expanded" | "onPress" | "onCancelPress" | "isCancelling">;

type SubscriptionCardInput = ExplicitProps | DataWrapperProps;

const SubscriptionCard = (props: SubscriptionCardInput) => {
    const base = "data" in props ? props.data : props;
    const { name, price, currency, icon, billing, color, category, plan, renewalDate, paymentMethod, startDate, status } = base;
    const { onPress, expanded } = props;

    return (
        <Pressable
            onPress={onPress}
            style={[
                cx("sub-card", expanded ? "sub-card-expanded" : "bg-card"),
                expanded && color ? { backgroundColor: color } : undefined,
            ]}
        >
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

            {expanded && (
                <View style={cx("sub-body")}>
                    <View style={cx("sub-details")}>
                        <View style={cx("sub-row")}>
                            <View style={cx("sub-row-copy")}>
                                <Text style={cx("sub-label")}>Payment:</Text>
                                <Text style={cx("sub-value")} numberOfLines={1} ellipsizeMode='tail'>{paymentMethod?.trim() || 'Not provided'}</Text>
                            </View>
                        </View>
                        <View style={cx("sub-row")}>
                            <View style={cx("sub-row-copy")}>
                                <Text style={cx("sub-label")}>Category:</Text>
                                <Text style={cx("sub-value")} numberOfLines={1} ellipsizeMode='tail'>{category?.trim() || plan?.trim() || 'Not provided'}</Text>
                            </View>
                        </View>
                        <View style={cx("sub-row")}>
                            <View style={cx("sub-row-copy")}>
                                <Text style={cx("sub-label")}>Started:</Text>
                                <Text style={cx("sub-value")} numberOfLines={1} ellipsizeMode='tail'>{startDate ? formatSubscriptionDateTime(startDate) : ''}</Text>
                            </View>
                        </View>
                        <View style={cx("sub-row")}>
                            <View style={cx("sub-row-copy")}>
                                <Text style={cx("sub-label")}>Renewal Date:</Text>
                                <Text style={cx("sub-value")} numberOfLines={1} ellipsizeMode='tail'>{renewalDate ? formatSubscriptionDateTime(renewalDate) : ''}</Text>
                            </View>
                        </View>
                        <View style={cx("sub-row")}>
                            <View style={cx("sub-row-copy")}>
                                <Text style={cx("sub-label")}>Status:</Text>
                                <Text style={cx("sub-value")} numberOfLines={1} ellipsizeMode='tail'>{status ? formatStatusLabel(status) : ''}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    )
}

export default SubscriptionCard