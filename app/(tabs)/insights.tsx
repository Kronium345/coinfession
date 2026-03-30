import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";


const insights = () => {
    return (
        <SafeAreaView style={tw`flex-1 items-center p-5 justify-center bg-background`}>
            <Text>insights</Text>
        </SafeAreaView>
    )
}

export default insights