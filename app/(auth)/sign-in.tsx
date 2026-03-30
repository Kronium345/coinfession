import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SignIn = () => {
    return (
        <View>
            <Text>sign-in</Text>
            <Link href="/(auth)/sign-up">Sign Up</Link>
        </View>
    );
};

export default SignIn;

const styles = StyleSheet.create({});