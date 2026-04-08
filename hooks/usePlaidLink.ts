import {
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  recomputeInsights,
  syncBankTransactions,
} from "@/lib/api";
import { useAuth } from "@clerk/expo";
import * as Application from "expo-application";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import type { LinkExit, LinkSuccess } from "react-native-plaid-link-sdk";

/** Load Plaid only when starting Link so LinkKit native code is not touched at tab/screen import time. */
async function loadPlaidLinkSdk() {
  return import("react-native-plaid-link-sdk");
}

export type UsePlaidLinkOptions = {
  onAfterExchange?: () => void;
};

export function usePlaidLink(options?: UsePlaidLinkOptions) {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const startLink = useCallback(
    async (countryCode: "US" | "GB" = "US") => {
      setBusy(true);
      setError(null);
      try {
        const androidPackageName =
          Platform.OS === "android" ? Application.applicationId ?? undefined : undefined;

        const { linkToken } = await createPlaidLinkToken(getToken, {
          countryCode,
          androidPackageName,
        });

        const { create, open } = await loadPlaidLinkSdk();
        create({ token: linkToken });

        open({
          onSuccess: async (success: LinkSuccess) => {
            try {
              await exchangePlaidPublicToken(getToken, {
                publicToken: success.publicToken,
                countryCode,
                metadata: {
                  institution: success.metadata.institution
                    ? {
                      institution_id: success.metadata.institution.id,
                      name: success.metadata.institution.name,
                    }
                    : undefined,
                  accounts: success.metadata.accounts?.map((a) => ({ id: a.id })),
                },
              });
              await syncBankTransactions(getToken);
              await recomputeInsights(getToken);
              options?.onAfterExchange?.();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Link succeeded but server exchange/sync failed."
              );
            } finally {
              setBusy(false);
            }
          },
          onExit: (exit: LinkExit) => {
            setBusy(false);
            if (exit.error?.displayMessage) {
              setError(exit.error.displayMessage);
            } else if (exit.error?.errorMessage) {
              setError(exit.error.errorMessage);
            }
          },
        });
      } catch (err) {
        setBusy(false);
        setError(err instanceof Error ? err.message : "Could not start Plaid Link.");
      }
    },
    [getToken, options?.onAfterExchange]
  );

  return { startLink, busy, error, clearError };
}
