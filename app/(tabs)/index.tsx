import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors, fonts } from "../../theme";


export default function App() {
  return (
    <SafeAreaView style={tw`flex-1 items-center justify-center bg-background`}>
      <Text style={styles.title}>Welcome to twrnc!</Text>
      <Text style={styles.subtitle}>
        Using design tokens from theme.js
      </Text>

      <Link href="/(auth)/sign-in" style={styles.link}>Sign In</Link>
      <Link href="/(auth)/sign-up" style={styles.link}>Sign Up</Link>
      <Link href="/subscriptions/spotify" style={styles.link}>Spotify Subscription</Link>
      <Link href={{
        pathname: "/subscriptions/[id]",
        params: { id: "claude" },
      }} style={styles.link}>Claude Subscription</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    ...tw`text-2xl`,
    color: colors.success,
    fontFamily: fonts.sansBold,
  },
  subtitle: {
    ...tw`mt-2 text-base`,
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
  },
  link: {
    ...tw`text-white`,
    backgroundColor: colors.primary,
    fontFamily: fonts.sansMedium,
    marginTop: 4,
    borderRadius: 4,
    padding: 4,
  },
});