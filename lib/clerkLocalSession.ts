import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Matches @clerk/expo `constants.CLERK_CLIENT_JWT_KEY` (SecureStore token-cache). */
const CLERK_CLIENT_JWT_KEY = "__clerk_client_jwt";

/**
 * Clears Clerk keys from SecureStore. Use after deleting a user in the Clerk
 * dashboard or if auth init hangs with a stale session.
 */
export async function clearClerkSecureStorage(
  publishableKey: string
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  const suffix =
    publishableKey.length >= 5 ? publishableKey.slice(-5) : publishableKey;
  const keys = new Set<string>([CLERK_CLIENT_JWT_KEY]);
  if (suffix) {
    keys.add(`__clerk_cache_session_jwt_${suffix}`);
    keys.add(`__clerk_cache_client_${suffix}`);
    keys.add(`__clerk_cache_environment_${suffix}`);
  }
  for (const key of keys) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* key may not exist */
    }
  }
}
