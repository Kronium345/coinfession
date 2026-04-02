import { spacing } from "../theme";

/** Bottom padding for scroll views so content clears the tab bar and home indicator. */
export function tabBarScrollPaddingBottom(safeAreaBottom: number) {
  const fromTabs = safeAreaBottom + spacing[18] + 24;
  return Math.max(fromTabs, spacing[30]);
}
