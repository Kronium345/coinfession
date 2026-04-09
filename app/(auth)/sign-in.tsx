import { AuthBrandBlock } from "@/components/auth/AuthBrandBlock";
import {
  isValidEmail,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  validateVerificationCode,
} from "@/lib/auth-validation";
import {
  clerkErrorToMessage,
  isClerkAlreadySignedInError,
  logClerkAuth,
} from "@/lib/clerkErrors";
import { cx } from "@/lib/tw";
import { useAuth, useClerk, useSignIn } from "@clerk/expo";
import { type Href, Link, Redirect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme";

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trustCode, setTrustCode] = useState("");
  const [localEmailError, setLocalEmailError] = useState<string | null>(null);
  const [localPasswordError, setLocalPasswordError] = useState<string | null>(
    null
  );
  const [localCodeError, setLocalCodeError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";

  const finishNavigation = useCallback(
    (decorateUrl: (path: string) => string) => {
      const url = decorateUrl("/");
      if (typeof window !== "undefined" && url.startsWith("http")) {
        window.location.assign(url);
        return;
      }
      router.replace(url as Href);
    },
    [router]
  );

  const onSubmit = async () => {
    setGeneralError(null);
    setLocalEmailError(null);
    setLocalPasswordError(null);

    if (!isValidEmail(email)) {
      const msg = "Enter a valid email address.";
      setLocalEmailError(msg);
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setLocalPasswordError(pwErr);
      return;
    }

    const creds = { emailAddress: email.trim(), password };
    const runPasswordAttempt = async () => {
      signIn.reset();
      return signIn.password(creds);
    };

    let passwordErr: Awaited<
      ReturnType<typeof signIn.password>
    >["error"];

    try {
      let attempt = await runPasswordAttempt();
      if (attempt.error && isClerkAlreadySignedInError(attempt.error)) {
        try {
          await signOut();
        } catch {
          /* stale session; still retry sign-in */
        }
        attempt = await runPasswordAttempt();
      }
      passwordErr = attempt.error;
    } catch (error) {
      if (isClerkAlreadySignedInError(error)) {
        try {
          await signOut();
        } catch {
          /* ignore */
        }
        try {
          const attempt = await runPasswordAttempt();
          passwordErr = attempt.error;
        } catch (err2) {
          setGeneralError(clerkErrorToMessage(err2));
          logClerkAuth("sign-in.password.throw", err2);
          return;
        }
      } else {
        setGeneralError(clerkErrorToMessage(error));
        logClerkAuth("sign-in.password.throw", error);
        return;
      }
    }

    if (passwordErr) {
      setLocalPasswordError(clerkErrorToMessage(passwordErr));
      logClerkAuth("sign-in.password", passwordErr);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }
          finishNavigation(decorateUrl);
        },
      });
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  };

  const onVerifyTrust = async () => {
    setLocalCodeError(null);
    setGeneralError(null);
    const codeErr = validateVerificationCode(trustCode);
    if (codeErr) {
      setLocalCodeError(codeErr);
      setGeneralError(codeErr);
      return;
    }

    const digits = trustCode.replace(/\D/g, "");
    try {
      await signIn.mfa.verifyEmailCode({ code: digits });
    } catch (error) {
      const msg = clerkErrorToMessage(error);
      setGeneralError(msg);
      logClerkAuth("sign-in.verifyEmailCode", error);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }
          finishNavigation(decorateUrl);
        },
      });
    }
  };

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const clerkIdentifierError = errors.fields?.identifier?.message as
    | string
    | undefined;
  const clerkPasswordError = errors.fields?.password?.message as
    | string
    | undefined;
  const clerkCodeError = errors.fields?.code?.message as string | undefined;

  const needsTrust = signIn.status === "needs_client_trust";

  const emailError = localEmailError ?? clerkIdentifierError;
  const passwordError = localPasswordError ?? clerkPasswordError;
  const codeError = localCodeError ?? clerkCodeError;
  /** Field-level Clerk errors render under inputs; avoid a second banner with the same text. */
  const visibleGeneralError = generalError;

  if (needsTrust) {
    return (
      <SafeAreaView style={cx("auth-safe-area")} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={cx("auth-screen")}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={cx("auth-content")}
          >
            <AuthBrandBlock />
            <Text style={cx("auth-title")}>Verify it&apos;s you</Text>
            <Text style={cx("auth-subtitle")}>
              We sent a short code to your email. Enter it below to finish
              signing in securely.
            </Text>
            <View style={cx("auth-card")}>
              {visibleGeneralError ? (
                <Text style={[cx("auth-error"), { marginBottom: 12 }]}>
                  {visibleGeneralError}
                </Text>
              ) : null}
              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Verification code</Text>
                <TextInput
                  value={trustCode}
                  onChangeText={setTrustCode}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  style={cx("auth-input", codeError && "auth-input-error")}
                />
                {codeError ? (
                  <Text style={cx("auth-error")}>{codeError}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={onVerifyTrust}
                disabled={busy}
                style={({ pressed }) => [
                  cx("auth-button", busy && "auth-button-disabled"),
                  { marginTop: 24, marginBottom: 20 },
                  pressed && !busy ? { opacity: 0.92 } : null,
                ]}
              >
                <Text style={cx("auth-button-text")}>Continue</Text>
              </Pressable>
              <Pressable
                onPress={() => signIn.mfa.sendEmailCode()}
                disabled={busy}
                style={cx("auth-secondary-button")}
              >
                <Text style={cx("auth-secondary-button-text")}>
                  Resend code
                </Text>
              </Pressable>
              <Pressable
                onPress={() => signIn.reset()}
                style={cx("auth-secondary-button")}
              >
                <Text style={cx("auth-secondary-button-text")}>Start over</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cx("auth-safe-area")} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={cx("auth-screen")}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={cx("auth-content")}
        >
          <AuthBrandBlock />
          <Text style={cx("auth-title")}>Welcome back</Text>
          <Text style={cx("auth-subtitle")}>
            Sign in to keep renewals, totals, and due dates in one calm place.
          </Text>
          <View style={cx("auth-card")}>
            {visibleGeneralError ? (
              <Text style={[cx("auth-error"), { marginBottom: 12 }]}>
                {visibleGeneralError}
              </Text>
            ) : null}
            <View style={cx("auth-form")}>
              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  style={cx("auth-input", emailError && "auth-input-error")}
                />
                {emailError ? (
                  <Text style={cx("auth-error")}>{emailError}</Text>
                ) : null}
              </View>
              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Password</Text>
                <TextInput
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                  placeholderTextColor={colors.mutedForeground}
                  style={cx(
                    "auth-input",
                    passwordError && "auth-input-error"
                  )}
                />
                {passwordError ? (
                  <Text style={cx("auth-error")}>{passwordError}</Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onSubmit}
              disabled={busy}
              style={({ pressed }) => [
                cx(
                  "auth-button",
                  busy && "auth-button-disabled"
                ),
                { marginTop: 24, marginBottom: 20 },
                pressed && !busy ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={cx("auth-button-text")}>Sign in</Text>
            </Pressable>
            <Text style={cx("auth-helper")}>
              Your data stays encrypted in transit. We never sell personal
              information.
            </Text>
            <View style={[cx("auth-link-row"), { marginTop: 28, marginBottom: 24 }]}>
              <Text style={cx("auth-link-copy")}>New here?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <Text style={cx("auth-link")}>Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
