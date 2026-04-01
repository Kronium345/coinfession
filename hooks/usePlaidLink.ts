import {
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  syncBankTransactions,
} from "@/lib/api";
import { useAuth } from "@clerk/expo";
import * as Application from "expo-application";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { create, open, type LinkExit, type LinkSuccess } from "react-native-plaid-link-sdk";

export function usePlaidLink() {
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

        create({ token: linkToken });

        open({
          onSuccess: async (success: LinkSuccess) => {
            try {
              await exchangePlaidPublicToken(getToken, {
                publicToken: success.publicToken,
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
    [getToken]
  );

  return { startLink, busy, error, clearError };
}
