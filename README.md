# Coinfession Frontend (Expo + React Native)

Mobile app for Coinfession: a Clerk-authenticated expense tracker with bank-linking (Plaid), transactions, subscriptions, insights, profile management, and CSV export.

## Stack

- Expo SDK 54 + Expo Router
- React Native + TypeScript
- Clerk (`@clerk/expo`) for auth and profile UI
- Plaid React Native Link SDK
- PostHog analytics

## Implemented Features

- Clerk sign in/sign up flow with first and last name collection.
- Dynamic user identity in app UI (`firstName`/`username`/email + avatar from Clerk).
- Dedicated `Profile` tab using Clerk native profile modal:
  - edit avatar/photo
  - edit account details
- Plaid link flow from settings:
  - create link token
  - exchange public token
  - sync bank transactions
- Transactions tab:
  - lists normalized bank-synced transactions
  - "Add as subscription" action
  - CSV export via share sheet
- Subscriptions:
  - backend-backed list
  - create subscriptions from modal and transactions
- Insights:
  - loads backend rule-based insight snapshot
  - displays top signal band/suggestion/top factors
  - displays bank cashflow summary and top categories/merchants
  - supports monthly category cap management (budget caps)
- Settings:
  - linked bank connections list/status
  - manual sync button
  - last bank sync timestamp
  - insights recompute timestamp

## Key Files

- App shell and providers: `app/_layout.tsx`
- Home: `app/(tabs)/index.tsx`
- Settings: `app/(tabs)/settings.tsx`
- Transactions: `app/(tabs)/transactions.tsx`
- Insights: `app/(tabs)/insights.tsx`
- Profile: `app/(tabs)/profile.tsx`
- Plaid hook: `hooks/usePlaidLink.ts`
- API client: `lib/api.ts`
- CSV export helper: `lib/exportCsv.ts`

## Environment Variables

Create/update `coinfession/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IPV4>:4000
```

## Run Locally

```bash
npm install
npx expo start
```

For Plaid and Clerk native profile components, use a development build (not Expo Go) for best reliability.

## App Flows

### Bank Linking + Insights Refresh

1. Go to `Settings`.
2. Tap `Connect bank (US)` or `Connect bank (UK)`.
3. Complete Plaid Link.
4. App exchanges token, syncs transactions, and triggers insight recompute.
5. Open `Insights` to view refreshed results.

### Transaction Export

1. Go to `Transactions`.
2. Tap `Export CSV`.
3. Share/save the generated CSV.

### Budget Caps

1. Go to `Insights`.
2. Add a category and monthly limit.
3. After sync/recompute, status shows as `ok`, `warning` (>=80%), or `over`.

## Notes

- This app does not store bank credentials in the frontend.
- Long-lived provider tokens are managed server-side only.
- Clerk profile photo/avatar updates are handled through Clerk-managed UI, not custom upload APIs.
