import type { BankConnection } from "./api";

/** Uses the most recently updated connection first (API sorts by `updatedAt` desc). */
export function preferredCurrencyFromBankConnections(rows: BankConnection[]): string {
  const top = rows[0];
  if (top?.countryCode === "GB") return "GBP";
  return "USD";
}
