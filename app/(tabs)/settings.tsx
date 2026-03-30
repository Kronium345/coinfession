import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

const settings = () => {
    return (
        <SafeAreaView style={tw`flex-1 items-center p-5 justify-center bg-background`}>
            <Text>settings</Text>
        </SafeAreaView>
    )
}

export default settings