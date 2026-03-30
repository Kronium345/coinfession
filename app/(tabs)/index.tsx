import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors, fonts } from "../../theme";


export default function App() {
  return (
    <SafeAreaView style={tw`flex-1 items-center justify-center bg-background`}>
      <Text style={styles.title}>Home</Text>


      <Link href="/(auth)/sign-in" style={styles.link}>Sign In</Link>
      <Link href="/(auth)/sign-up" style={styles.link}>Sign Up</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    ...tw`text-5xl`,
    color: colors.success,
    fontFamily: fonts.sansExtrabold,
  },
  subtitle: {
    ...tw`mt-2 text-base`,
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
  },
  link: {
    ...tw`text-white`,
    backgroundColor: colors.primary,
    fontFamily: fonts.sansBold,
    marginTop: 4,
    borderRadius: 4,
    padding: 4,
  },
});