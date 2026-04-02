import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
} from "expo-file-system/legacy";

import type { NormalizedTransaction } from "./api";

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function shareTransactionsAsCsv(rows: NormalizedTransaction[]): Promise<void> {
  const header = "date,merchant,category,amount,currency,pending,source_ref\n";
  const lines = rows.map((r) =>
    [
      csvEscape(new Date(r.occurredAt).toISOString().slice(0, 10)),
      csvEscape(r.merchant),
      csvEscape(r.category),
      String(r.amount),
      csvEscape(r.currency ?? "USD"),
      r.pending ? "true" : "false",
      csvEscape(r.sourceRef ?? ""),
    ].join(",")
  );
  const body = header + lines.join("\n");
  const base = cacheDirectory ?? documentDirectory;
  if (!base) {
    throw new Error("No writable directory for export.");
  }
  const uri = `${base}coinfession-transactions-${Date.now()}.csv`;
  await writeAsStringAsync(uri, body);

  // Lazy-load to avoid crashing in runtimes without the native module (e.g. Expo Go).
  let Sharing: typeof import("expo-sharing");
  try {
    Sharing = await import("expo-sharing");
  } catch {
    throw new Error(
      "CSV export requires expo-sharing in a development build (or production build). Rebuild the app to enable it."
    );
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "text/csv",
    dialogTitle: "Export transactions",
  });
}
