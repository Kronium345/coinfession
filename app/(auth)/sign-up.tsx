import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SignUp = () => {
    return (
        <View>
            <Text>sign-up</Text>
            <Link href="/(auth)/sign-in">Sign I</Link>
        </View>
    )
}

export default SignUp

const styles = StyleSheet.create({})