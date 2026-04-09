import {
  isClerkAPIResponseError,
  isClerkRuntimeError,
} from "@clerk/expo";

/** Shown in the app when Clerk can’t reach the Frontend API (see logs for URL and raw error). */
const FRIENDLY_NETWORK_ERROR =
  "We couldn’t reach the sign-in service. Check your internet connection and try again. If you’re on Wi‑Fi, try mobile data (or vice versa). " +
  "If it keeps failing, the service may be briefly unavailable—try again in a few minutes.";

function isNetworkFailure(error: unknown): boolean {
  if (isClerkRuntimeError(error) && error.code === "network_error") {
    return true;
  }
  if (isClerkAPIResponseError(error)) {
    const codes =
      error.errors?.map((e) => e.code).filter(Boolean) ?? [];
    if (codes.includes("network_error")) {
      return true;
    }
  }
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (/network request failed/i.test(msg) || /\bNetwork error\b/i.test(msg)) {
    return true;
  }
  const code =
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;
  return code === "network_error";
}

/**
 * Clerk sometimes blocks `signIn.password` when a session is still active in the
 * native client while `useAuth().isSignedIn` is false (stale state). Recover by
 * signing out and retrying once.
 */
export function isClerkAlreadySignedInError(error: unknown): boolean {
  if (error == null) {
    return false;
  }
  if (isClerkRuntimeError(error)) {
    const code =
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "";
    if (code === "already_signed_in") {
      return true;
    }
  }
  if (isClerkAPIResponseError(error)) {
    const codes =
      error.errors?.map((e) => e.code).filter(Boolean).map(String) ?? [];
    if (
      codes.some((c) =>
        /^(session_exists|client_session_already_exists|already_signed_in)$/i.test(
          c
        )
      )
    ) {
      return true;
    }
  }
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : clerkErrorToMessage(error);
  const msg = raw.toLowerCase();
  return (
    msg.includes("already signed in") || msg.includes("already signed")
  );
}

/** User-visible message from a Clerk `error` object or thrown value. */
export function clerkErrorToMessage(error: unknown): string {
  if (error == null) {
    return "Something went wrong. Please try again.";
  }
  if (isNetworkFailure(error)) {
    return FRIENDLY_NETWORK_ERROR;
  }
  if (isClerkAPIResponseError(error)) {
    const first = error.errors?.[0];
    const text =
      first?.longMessage?.trim() ||
      first?.message?.trim() ||
      error.message?.trim();
    return text || "Request failed. Please try again.";
  }
  if (error instanceof Error) {
    return error.message || "Something went wrong. Please try again.";
  }
  return String(error);
}

/** Logs to Metro / native logcat; include Clerk error codes for support. */
export function logClerkAuth(scope: string, error: unknown): void {
  console.warn(`[Clerk:${scope}]`, error);
  if (isClerkAPIResponseError(error) && error.errors?.length) {
    console.warn(
      `[Clerk:${scope}] details`,
      error.errors.map((e) => ({
        code: e.code,
        message: e.message,
        longMessage: e.longMessage,
        meta: e.meta,
      }))
    );
  }
}
