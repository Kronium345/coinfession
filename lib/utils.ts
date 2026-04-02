import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return value.toFixed(2);
    }
};

/** Narrow symbol for UI prefixes (e.g. GBP → £, USD → $). Falls back to the ISO code. */
export function getCurrencyNarrowSymbol(currencyCode: string): string {
    try {
        const parts = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currencyCode,
            currencyDisplay: "narrowSymbol",
        }).formatToParts(0);
        return parts.find((p) => p.type === "currency")?.value ?? currencyCode;
    } catch {
        return currencyCode;
    }
}

export const formatSubscriptionDateTime = (value?: string): string => {
    if (!value) return "Not provided";
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

/** Single-line caption for the home balance card (short date, wraps safely). */
export const formatNextRenewalCaption = (value?: string | null): string => {
    if (!value) return "No renewals scheduled yet";
    const parsed = dayjs(value);
    return parsed.isValid() ? `Next renewal · ${parsed.format("MMM D, YYYY")}` : "No renewals scheduled yet";
};

export const formatStatusLabel = (value?: string): string => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
};