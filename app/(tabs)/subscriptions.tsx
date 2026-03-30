import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

const subscriptions = () => {
    return (
        <SafeAreaView style={tw`flex-1 p-5 items-center justify-center bg-background`}>
            <Text>subscriptions</Text>
        </SafeAreaView>
    )
}

export default subscriptions