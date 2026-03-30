import { cx } from "@/lib/tw";
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const ListHeading = ({ title }: ListHeadingProps) => {
    return (
        <View style={cx("list-head")}>
            <Text style={cx("list-title")}>{title}</Text>
            <TouchableOpacity style={cx("list-action")}>
                <Text style={cx("list-action-text")}>View All</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ListHeading