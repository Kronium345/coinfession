import { Redirect } from "expo-router";

/**
 * Plaid OAuth returns on iOS via `coinfession://plaid?oauth_state_id=...`.
 * LinkKit consumes the URL natively; this route only satisfies Expo Router
 * so users are not shown the unmatched-route screen.
 */
export default function PlaidOAuthReturn() {
  return <Redirect href="/(tabs)/settings" />;
}
