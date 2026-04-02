import { useSubscriptions } from "@/context/SubscriptionsContext";
import { cx } from "@/lib/tw";
import {
  deleteBudget,
  getInsightsSummary,
  upsertBudget,
  type InsightSummary,
} from "@/lib/api";
import {
  axisTicks,
  buildHistoryRows,
  buildWeekRenewalBars,
  monthOverMonthPercentChange,
  niceAxisMax,
  pickHighlightBarIndex,
  totalScheduledChargesInMonth,
} from "@/lib/insightsMetrics";
import { formatCurrency } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../../theme";
import { toUserFriendlyErrorMessage } from "@/lib/api";

const CHART_HEIGHT = 140;
const Y_TICK_COUNT = 5;

export default function InsightsScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  const { subscriptions } = useSubscriptions();
  const [now] = useState(() => dayjs());
  const [insightSummary, setInsightSummary] = useState<InsightSummary | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetBusy, setBudgetBusy] = useState(false);

  const insightItem = insightSummary?.items[0] ?? null;

  const insightMonth = useMemo(() => now.startOf("month"), [now]);
  const prevMonth = useMemo(() => insightMonth.subtract(1, "month"), [insightMonth]);

  const monthLabel = useMemo(
    () => insightMonth.format("MMMM YYYY"),
    [insightMonth]
  );

  const monthCharges = useMemo(
    () => totalScheduledChargesInMonth(subscriptions, insightMonth),
    [subscriptions, insightMonth]
  );

  const prevMonthCharges = useMemo(
    () => totalScheduledChargesInMonth(subscriptions, prevMonth),
    [subscriptions, prevMonth]
  );

  const mom = useMemo(
    () => monthOverMonthPercentChange(monthCharges, prevMonthCharges),
    [monthCharges, prevMonthCharges]
  );

  const weekBars = useMemo(
    () => buildWeekRenewalBars(subscriptions, now),
    [subscriptions, now]
  );

  const highlightIndex = useMemo(
    () => pickHighlightBarIndex(weekBars),
    [weekBars]
  );

  const highlightTotal =
    highlightIndex !== null ? weekBars[highlightIndex]?.total ?? 0 : 0;

  const barMax = useMemo(() => {
    const dataMax = Math.max(...weekBars.map((b) => b.total), 0);
    return niceAxisMax(dataMax);
  }, [weekBars]);

  const yTicks = useMemo(() => axisTicks(barMax, Y_TICK_COUNT), [barMax]);

  const historyRows = useMemo(
    () => buildHistoryRows(subscriptions, insightMonth, 6),
    [subscriptions, insightMonth]
  );

  const goHome = () => router.push("/");
  const goSubscriptions = () => router.push("/subscriptions");

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let active = true;
    const load = async () => {
      try {
        const summary = await getInsightsSummary(getTokenRef.current);
        if (active) {
          setInsightSummary(summary);
          setInsightError(null);
        }
      } catch (error) {
        if (active) {
          setInsightError(toUserFriendlyErrorMessage(error));
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  const refreshInsightSummary = async () => {
    const summary = await getInsightsSummary(getTokenRef.current);
    setInsightSummary(summary);
  };

  const onAddBudget = async () => {
    const limit = Number.parseFloat(budgetLimit);
    if (!budgetCategory.trim() || !Number.isFinite(limit) || limit <= 0) return;
    setBudgetBusy(true);
    try {
      await upsertBudget(getTokenRef.current, { category: budgetCategory.trim(), monthlyLimit: limit });
      await refreshInsightSummary();
      setBudgetCategory("");
      setBudgetLimit("");
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : "Could not save budget.");
    } finally {
      setBudgetBusy(false);
    }
  };

  const onDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(getTokenRef.current, id);
      await refreshInsightSummary();
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : "Could not remove budget.");
    }
  };

  const cf = insightSummary?.cashflow;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={goHome}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Monthly Insights</Text>
          <Pressable
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="More options"
            disabled
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <Text style={cx("list-title")}>Upcoming</Text>
          <Pressable onPress={goSubscriptions} style={cx("list-action")}>
            <Text style={cx("list-action-text")}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            <View style={styles.yAxis}>
              {[...yTicks].reverse().map((tick) => (
                <Text key={tick} style={styles.yTickLabel}>
                  {tick}
                </Text>
              ))}
            </View>
            <View style={styles.chartPlot}>
              <View style={styles.grid}>
                {yTicks.slice(0, -1).map((_, i) => (
                  <View
                    key={`grid-${i}`}
                    style={[
                      styles.gridLine,
                      {
                        top: `${(100 / (Y_TICK_COUNT - 1)) * (i + 1)}%`,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.bars}>
                {weekBars.map((day, index) => {
                  const heightPct =
                    barMax > 0 ? Math.max(4, (day.total / barMax) * 100) : 4;
                  const isHi = index === highlightIndex && day.total > 0;
                  return (
                    <View key={day.label} style={styles.barCol}>
                      <View style={styles.tooltipSlot}>
                        {isHi && highlightTotal > 0 ? (
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipText}>
                              {formatCurrency(highlightTotal, "USD")}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPct}%`,
                              backgroundColor: isHi
                                ? colors.accent
                                : colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.xLabel}>{day.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
          <Text style={styles.chartFootnote}>
            Renewals scheduled this calendar week ({now.startOf("isoWeek").format("MMM D")} –{" "}
            {now.endOf("isoWeek").format("MMM D")}). Bars show totals due on each day.
          </Text>
        </View>

        <View style={styles.expenseCard}>
          <View>
            <Text style={styles.expenseTitle}>Expenses</Text>
            <Text style={styles.expenseSubtitle}>{monthLabel}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>
              -{formatCurrency(monthCharges, "USD")}
            </Text>
            <Text style={styles.expenseDelta}>
              {mom === null
                ? prevMonthCharges <= 0 && monthCharges > 0
                  ? "New activity this month"
                  : prevMonthCharges <= 0
                    ? "No prior month to compare"
                    : "—"
                : `${mom >= 0 ? "+" : ""}${mom.toFixed(0)}% vs last month`}
            </Text>
          </View>
        </View>
        <Text style={styles.expenseExplain}>
          Total is the sum of renewal amounts dated in {monthLabel} for active
          subscriptions (cash basis).
        </Text>

        {cf ? (
          <View style={styles.secondaryCard}>
            <Text style={styles.secondaryTitle}>Spending from linked accounts</Text>
            <Text style={styles.secondarySub}>{cf.monthLabel}</Text>
            <View style={styles.secondaryRow}>
              <Text style={styles.secondaryAmount}>
                {formatCurrency(cf.currentMonthTotal, "USD")}
              </Text>
              <Text style={styles.secondaryDelta}>
                {cf.monthOverMonthPercent === null
                  ? "— vs prior month"
                  : `${cf.monthOverMonthPercent >= 0 ? "+" : ""}${cf.monthOverMonthPercent.toFixed(0)}% vs prior month`}
              </Text>
            </View>
            <Text style={styles.secondaryFoot}>
              Sum of bank-synced transactions posted this calendar month (absolute amounts).
            </Text>
          </View>
        ) : null}

        {cf && cf.categoryTotals.length > 0 ? (
          <View style={styles.secondaryCard}>
            <Text style={styles.secondaryTitle}>Top categories (bank)</Text>
            {cf.categoryTotals.slice(0, 5).map((c) => (
              <View key={c.category} style={styles.listRow}>
                <Text style={styles.listRowLeft} numberOfLines={1}>
                  {c.category}
                </Text>
                <Text style={styles.listRowRight}>{formatCurrency(c.total, "USD")}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {cf && cf.topMerchants.length > 0 ? (
          <View style={styles.secondaryCard}>
            <Text style={styles.secondaryTitle}>Top merchants (bank)</Text>
            {cf.topMerchants.slice(0, 5).map((m) => (
              <View key={m.merchant} style={styles.listRow}>
                <Text style={styles.listRowLeft} numberOfLines={1}>
                  {m.merchant}
                </Text>
                <Text style={styles.listRowRight}>{formatCurrency(m.total, "USD")}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.secondaryCard}>
          <Text style={styles.secondaryTitle}>Monthly category caps</Text>
          <Text style={styles.secondaryFoot}>
            Use the same category label as your bank transactions (case-insensitive). We warn at
            80% of the cap and when you go over.
          </Text>
          {insightSummary?.budgetStatuses?.length ? (
            insightSummary.budgetStatuses.map((b) => (
              <View key={b.id} style={styles.budgetRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.listRowLeft}>{b.category}</Text>
                  <Text
                    style={[
                      styles.budgetMeta,
                      b.status === "over"
                        ? { color: colors.accent }
                        : b.status === "warning"
                          ? { color: "#c27b16" }
                          : null,
                    ]}
                  >
                    Spent {formatCurrency(b.spent, b.currency)} / cap{" "}
                    {formatCurrency(b.monthlyLimit, b.currency)}
                    {b.status === "over" ? " · Over cap" : b.status === "warning" ? " · Near cap" : ""}
                  </Text>
                </View>
                <Pressable onPress={() => void onDeleteBudget(b.id)} hitSlop={8}>
                  <Text style={styles.budgetRemove}>Remove</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.secondaryFoot}>No caps yet — add one below.</Text>
          )}
          <View style={styles.budgetForm}>
            <TextInput
              placeholder="Category (e.g. FOOD_AND_DRINK)"
              placeholderTextColor={colors.mutedForeground}
              value={budgetCategory}
              onChangeText={setBudgetCategory}
              style={styles.budgetInput}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Monthly limit (USD)"
              placeholderTextColor={colors.mutedForeground}
              value={budgetLimit}
              onChangeText={setBudgetLimit}
              keyboardType="decimal-pad"
              style={styles.budgetInput}
            />
            <Pressable
              onPress={() => void onAddBudget()}
              disabled={budgetBusy}
              style={[styles.budgetSaveBtn, budgetBusy ? { opacity: 0.6 } : null]}
            >
              {budgetBusy ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.budgetSaveText}>Save cap</Text>
              )}
            </Pressable>
          </View>
        </View>

        {insightSummary?.insightsUpdatedAt ? (
          <Text style={styles.metaHint}>
            Rule-based insights last computed{" "}
            {dayjs(insightSummary.insightsUpdatedAt).format("MMM D, YYYY h:mm A")}.
          </Text>
        ) : null}

        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>Smarter suggestions</Text>
          {insightItem ? (
            <Text style={styles.aiBody}>
              {insightItem.band}: {insightItem.description} Suggested action:{" "}
              {insightItem.suggestion} Top factors: {insightItem.topFactors.join(", ")}.
            </Text>
          ) : (
            <Text style={styles.aiBody}>
              {insightError ?? "Insights are being prepared from your latest expense patterns."}
            </Text>
          )}
        </View>

        <View style={styles.sectionHead}>
          <Text style={cx("list-title")}>History</Text>
          <Pressable onPress={goSubscriptions} style={cx("list-action")}>
            <Text style={cx("list-action-text")}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.historyList}>
          {historyRows.length === 0 ? (
            <Text style={cx("home-empty-state")}>
              No renewal dates on file. Add subscriptions with renewal dates to see
              history.
            </Text>
          ) : (
            historyRows.map((row) => (
              <View
                key={row.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: row.color ?? colors.muted },
                ]}
              >
                <View style={styles.historyTop}>
                  <Image source={row.icon} style={styles.historyIcon} />
                  <View style={styles.historyMid}>
                    <Text style={styles.historyName} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.historyDate}>
                      {row.renewal.format("MMMM D — h:mm A")}
                    </Text>
                  </View>
                  <View style={styles.historyPriceCol}>
                    <Text style={styles.historyPrice}>
                      {formatCurrency(row.price, row.currency ?? "USD")}
                    </Text>
                    <Text style={styles.historyCadence}>
                      {row.billing.toLowerCase().includes("year")
                        ? "per year"
                        : "per month"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.primary,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  yAxis: {
    width: 28,
    justifyContent: "space-between",
    paddingBottom: 22,
    paddingTop: 8,
  },
  yTickLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  chartPlot: {
    flex: 1,
    position: "relative",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    marginBottom: 22,
    marginTop: 8,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(8, 17, 38, 0.12)",
  },
  tooltipSlot: {
    height: 28,
    marginBottom: 4,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  tooltip: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tooltipText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.background,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  barCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  barTrack: {
    width: "72%",
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  xLabel: {
    marginTop: 8,
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  chartFootnote: {
    marginTop: 12,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 8,
  },
  expenseTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.primary,
  },
  expenseSubtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontFamily: fonts.sansExtrabold,
    fontSize: 20,
    color: colors.primary,
  },
  expenseDelta: {
    marginTop: 4,
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.accent,
  },
  expenseExplain: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 16,
    lineHeight: 17,
  },
  secondaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  secondaryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.primary,
  },
  secondarySub: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: 10,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryAmount: {
    fontFamily: fonts.sansExtrabold,
    fontSize: 22,
    color: colors.primary,
  },
  secondaryDelta: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.accent,
    flexShrink: 1,
    textAlign: "right",
  },
  secondaryFoot: {
    marginTop: 10,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(8, 17, 38, 0.08)",
  },
  listRowLeft: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
  },
  listRowRight: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.primary,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(8, 17, 38, 0.08)",
    gap: 8,
  },
  budgetMeta: {
    marginTop: 4,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  budgetRemove: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  budgetForm: {
    marginTop: 14,
    gap: 10,
  },
  budgetInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.primary,
    backgroundColor: colors.background,
  },
  budgetSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetSaveText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.background,
  },
  metaHint: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.mutedForeground,
    marginBottom: 12,
    lineHeight: 16,
  },
  aiCard: {
    backgroundColor: colors.muted,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  aiTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  aiBody: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
  },
  historyList: {
    gap: 12,
    marginBottom: 24,
  },
  historyCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(8, 17, 38, 0.06)",
  },
  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  historyMid: {
    flex: 1,
    minWidth: 0,
  },
  historyName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.primary,
  },
  historyDate: {
    marginTop: 4,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  historyPriceCol: {
    alignItems: "flex-end",
  },
  historyPrice: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.primary,
  },
  historyCadence: {
    marginTop: 4,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.mutedForeground,
  },
});