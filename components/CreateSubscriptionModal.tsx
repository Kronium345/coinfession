import { resolveSubscriptionIcon } from "@/lib/resolveSubscriptionIcon";
import { cx } from "@/lib/tw";
import clsx from "clsx";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f4d03f",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#a8e6cf",
  Cloud: "#b8d4e3",
  Music: "#e8c4f0",
  Other: "#dcdcdc",
};

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

function tokensFromClsx(...args: Parameters<typeof clsx>) {
  return clsx(...args)
    .split(/\s+/)
    .filter(Boolean) as string[];
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const posthog = usePostHog();
  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
  const [category, setCategory] = useState<Category>("Other");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setName("");
    setPriceText("");
    setFrequency("Monthly");
    setCategory("Other");
    setSubmitError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const priceNumber = useMemo(() => {
    const n = Number.parseFloat(priceText.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }, [priceText]);

  const canSubmit =
    name.trim().length > 0 && Number.isFinite(priceNumber) && priceNumber > 0;

  const handleSubmit = () => {
    setSubmitError(null);
    if (!name.trim()) {
      setSubmitError("Enter a subscription name.");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setSubmitError("Enter a valid price greater than zero.");
      return;
    }

    const start = dayjs();
    const renewal = start.add(
      frequency === "Monthly" ? 1 : 1,
      frequency === "Monthly" ? "month" : "year"
    );

    const id = `user-sub-${Date.now()}`;

    const subscription: Subscription = {
      id,
      name: name.trim(),
      price: priceNumber,
      currency: "USD",
      billing: frequency,
      category,
      plan: category,
      status: "active",
      startDate: start.toISOString(),
      renewalDate: renewal.toISOString(),
      icon: resolveSubscriptionIcon(name.trim()),
      color: CATEGORY_COLORS[category],
    };

    onCreate(subscription);
    posthog.capture("subscription_created", {
      subscription_name: subscription.name,
      subscription_price: subscription.price,
      subscription_frequency: subscription.billing,
      subscription_category: subscription.category ?? "Other",
    });
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardArea}
        >
          <View style={cx("modal-container")}>
            <View style={cx("modal-header")}>
              <Text style={cx("modal-title")}>New Subscription</Text>
              <Pressable
                onPress={handleClose}
                style={cx("modal-close")}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={cx("modal-close-text")}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={cx("modal-body")}
              showsVerticalScrollIndicator={false}
            >
              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Netflix"
                  placeholderTextColor={colors.mutedForeground}
                  style={cx("auth-input")}
                />
              </View>

              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Price</Text>
                <TextInput
                  value={priceText}
                  onChangeText={setPriceText}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  style={cx("auth-input")}
                />
              </View>

              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Frequency</Text>
                <View style={cx("picker-row")}>
                  <Pressable
                    onPress={() => setFrequency("Monthly")}
                    style={cx(
                      ...tokensFromClsx(
                        "picker-option",
                        frequency === "Monthly" && "picker-option-active"
                      )
                    )}
                  >
                    <Text
                      style={cx(
                        ...tokensFromClsx(
                          "picker-option-text",
                          frequency === "Monthly" && "picker-option-text-active"
                        )
                      )}
                    >
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFrequency("Yearly")}
                    style={cx(
                      ...tokensFromClsx(
                        "picker-option",
                        frequency === "Yearly" && "picker-option-active"
                      )
                    )}
                  >
                    <Text
                      style={cx(
                        ...tokensFromClsx(
                          "picker-option-text",
                          frequency === "Yearly" && "picker-option-text-active"
                        )
                      )}
                    >
                      Yearly
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={cx("auth-field")}>
                <Text style={cx("auth-label")}>Category</Text>
                <View style={cx("category-scroll")}>
                  {CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      style={cx(
                        ...tokensFromClsx(
                          "category-chip",
                          category === c && "category-chip-active"
                        )
                      )}
                    >
                      <Text
                        style={cx(
                          ...tokensFromClsx(
                            "category-chip-text",
                            category === c && "category-chip-text-active"
                          )
                        )}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {submitError ? (
                <Text style={cx("auth-error")}>{submitError}</Text>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  cx("auth-button", !canSubmit && "auth-button-disabled"),
                  pressed && canSubmit ? { opacity: 0.92 } : null,
                ]}
              >
                <Text style={cx("auth-button-text")}>Add subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardArea: {
    width: "100%",
  },
});
