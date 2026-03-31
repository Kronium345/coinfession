import { AuthBrandBlock } from "@/components/auth/AuthBrandBlock";
import {
  isValidEmail,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  validateVerificationCode,
} from "@/lib/auth-validation";
import { cx } from "@/lib/tw";
import { useAuth, useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

export default function SignUpScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [localEmailError, setLocalEmailError] = useState<string | null>(null);
  const [localPasswordError, setLocalPasswordError] = useState<string | null>(
    null
  );
  const [localCodeError, setLocalCodeError] = useState<string | null>(null);

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

  const onStartSignUp = async () => {
    setLocalEmailError(null);
    setLocalPasswordError(null);

    if (!isValidEmail(email)) {
      setLocalEmailError("Enter a valid email address.");
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setLocalPasswordError(pwErr);
      return;
    }

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });
    if (error) {
      return;
    }

    await signUp.verifications.sendEmailCode();
  };

  const onVerify = async () => {
    setLocalCodeError(null);
    const codeErr = validateVerificationCode(code);
    if (codeErr) {
      setLocalCodeError(codeErr);
      return;
    }

    const digits = code.replace(/\D/g, "");
    await signUp.verifications.verifyEmailCode({ code: digits });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }
          finishNavigation(decorateUrl);
        },
      });
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  const awaitingEmailCode =
    signUp.status === "missing_requirements" &&
    Boolean(signUp.unverifiedFields?.includes("email_address")) &&
    (signUp.missingFields?.length ?? 0) === 0;

  const clerkEmailError = errors.fields?.emailAddress?.message as
    | string
    | undefined;
  const clerkPasswordError = errors.fields?.password?.message as
    | string
    | undefined;
  const clerkCodeError = errors.fields?.code?.message as string | undefined;

  const emailError = localEmailError ?? clerkEmailError;
  const passwordError = localPasswordError ?? clerkPasswordError;
  const codeError = localCodeError ?? clerkCodeError;

  const canStart = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.length >= PASSWORD_MIN_LENGTH &&
      !busy
    );
  }, [email, password, busy]);

  if (awaitingEmailCode) {
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
            <Text style={cx("auth-title")}>Confirm your email</Text>
            <Text style={cx("auth-subtitle")}>
              Enter the code we sent. This keeps your account secure and makes
              recovery simple.
            </Text>
            <View style={cx("auth-card")}>
              <View style={[cx("auth-field"), { zIndex: 2 }]}>
                <Text style={cx("auth-label")}>Verification code</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  editable={!busy}
                  style={cx("auth-input", codeError && "auth-input-error")}
                />
                {codeError ? (
                  <Text style={cx("auth-error")}>{codeError}</Text>
                ) : null}
              </View>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Pressable
                  onPress={onVerify}
                  disabled={busy}
                  style={({ pressed }) => [
                    cx("auth-button", busy && "auth-button-disabled"),
                    { marginTop: 0 },
                    pressed && !busy ? { opacity: 0.92 } : null,
                  ]}
                >
                  <Text style={cx("auth-button-text")}>Verify email</Text>
                </Pressable>
                <Pressable
                  onPress={() => signUp.verifications.sendEmailCode()}
                  disabled={busy}
                  style={cx("auth-secondary-button")}
                >
                  <Text style={cx("auth-secondary-button-text")}>
                    Resend code
                  </Text>
                </Pressable>
              </View>
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
          <Text style={cx("auth-title")}>Create your account</Text>
          <Text style={cx("auth-subtitle")}>
            Start tracking subscriptions with less stress and fewer surprises.
          </Text>
          <View style={cx("auth-card")}>
            <View nativeID="clerk-captcha" />
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
                  autoComplete="new-password"
                  textContentType="newPassword"
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
              onPress={onStartSignUp}
              disabled={!canStart}
              style={({ pressed }) => [
                cx("auth-button", (!canStart || busy) && "auth-button-disabled"),
                pressed && canStart && !busy ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={cx("auth-button-text")}>Continue</Text>
            </Pressable>
            <Text style={cx("auth-helper")}>
              By continuing you agree to sensible checks that protect this
              community from abuse.
            </Text>
            <View style={cx("auth-link-row")}>
              <Text style={cx("auth-link-copy")}>Already have an account?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text style={cx("auth-link")}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
