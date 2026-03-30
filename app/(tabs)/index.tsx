import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import tw from "twrnc";
import { colors, fonts } from "../../theme";

export default function App() {
  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...tw`flex-1 items-center justify-center`,
    backgroundColor: colors.background,
  },
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