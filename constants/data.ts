import { resolveSubscriptionIcon } from "@/lib/resolveSubscriptionIcon";
import { icons } from "./icons";

export const tabs: AppTab[] = [
    { name: "index", title: "Home", icon: icons.home },
    { name: "transactions", title: "Transactions", ionIcon: "cash-outline" },
    { name: "subscriptions", title: "Subscriptions", icon: icons.wallet },
    { name: "insights", title: "Insights", icon: icons.activity },
    { name: "settings", title: "Settings", icon: icons.setting },
];

export const HOME_BALANCE = {
    amount: 2489.48,
    nextRenewalDate: "2026-03-18T09:00:00.000Z",
};

export const UPCOMING_SUBSCRIPTIONS: UpcomingSubscription[] = [
    {
        id: "spotify",
        icon: resolveSubscriptionIcon("Spotify"),
        name: "Spotify",
        price: 5.99,
        currency: "USD",
        daysLeft: 2,
    },
    {
        id: "notion",
        icon: resolveSubscriptionIcon("Notion"),
        name: "Notion",
        price: 12.0,
        currency: "USD",
        daysLeft: 4,
    },
    {
        id: "figma",
        icon: resolveSubscriptionIcon("Figma"),
        name: "Figma",
        price: 15.0,
        currency: "USD",
        daysLeft: 6,
    },
];

export const HOME_SUBSCRIPTIONS: Omit<Subscription, "icon">[] = [
    {
        id: "adobe-creative-cloud",
        name: "Adobe Creative Cloud",
        plan: "Teams Plan",
        category: "Design",
        paymentMethod: "Visa ending in 8530",
        status: "active",
        startDate: "2025-03-20T10:00:00.000Z",
        price: 77.49,
        currency: "USD",
        billing: "Monthly",
        renewalDate: "2026-03-20T10:00:00.000Z",
        color: "#f5c542",
    },
    {
        id: "github-pro",
        name: "GitHub Pro",
        plan: "Developer",
        category: "Developer Tools",
        paymentMethod: "Mastercard ending in 2408",
        status: "active",
        startDate: "2024-11-24T10:00:00.000Z",
        price: 9.99,
        currency: "USD",
        billing: "Monthly",
        renewalDate: "2026-03-24T10:00:00.000Z",
        color: "#e8def8",
    },
    {
        id: "claude-pro",
        name: "Claude Pro",
        plan: "Pro Plan",
        category: "AI Tools",
        paymentMethod: "Amex ending in 1010",
        status: "paused",
        startDate: "2025-06-27T10:00:00.000Z",
        price: 20.0,
        currency: "USD",
        billing: "Monthly",
        renewalDate: "2026-03-27T10:00:00.000Z",
        color: "#b8d4e3",
    },
    {
        id: "canva-pro",
        name: "Canva Pro",
        plan: "Yearly Access",
        category: "Design",
        paymentMethod: "Visa ending in 7784",
        status: "cancelled",
        startDate: "2024-04-02T10:00:00.000Z",
        price: 119.99,
        currency: "USD",
        billing: "Yearly",
        renewalDate: "2026-04-02T10:00:00.000Z",
        color: "#b8e8d0",
    },
];