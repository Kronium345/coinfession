/**
 * Runs when Expo resolves config (local `expo start`, `eas build`, etc.).
 * EAS injects dashboard env vars before this runs — local uses `.env`.
 *
 * @see https://docs.expo.dev/guides/environment-variables/
 * @see https://docs.expo.dev/eas/environment-variables/
 */
module.exports = ({ config }) => {
  const clerk = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const api = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!clerk) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
        "Local: add to `.env` (see `.env.example`). " +
        "EAS: Expo dashboard → Environment variables → set for this build's environment (production / preview / development)."
    );
  }

  if (!api) {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL. " +
        "Local: add to `.env`. " +
        "EAS: set to your deployed API base URL (https://…), not localhost."
    );
  }

  return config;
};
