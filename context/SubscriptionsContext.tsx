import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { createSubscription, listSubscriptions, type ApiSubscription } from "@/lib/api";
import { resolveSubscriptionIcon } from "@/lib/resolveSubscriptionIcon";
import { useAuth } from "@clerk/expo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => Promise<void>;
  isLoading: boolean;
  syncError: string | null;
  refreshSubscriptions: () => Promise<void>;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(
  null
);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);
  const hasBootstrappedRef = useRef(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    HOME_SUBSCRIPTIONS.map((s) => ({
      ...s,
      icon: resolveSubscriptionIcon(s.name),
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const mapApiSubscription = useCallback((item: ApiSubscription): Subscription => {
    return {
      id: item._id,
      name: item.name,
      plan: item.plan ?? undefined,
      category: item.category ?? undefined,
      paymentMethod: item.paymentMethod ?? undefined,
      status: item.status ?? "active",
      startDate: item.startDate ?? undefined,
      price: item.price,
      currency: item.currency ?? "USD",
      billing: item.billing,
      renewalDate: item.renewalDate ?? undefined,
      color: item.color ?? undefined,
      icon: resolveSubscriptionIcon(item.name),
    };
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const remote = await listSubscriptions(getTokenRef.current);
      setSubscriptions(remote.map(mapApiSubscription));
      setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to sync subscriptions.");
    } finally {
      setIsLoading(false);
    }
  }, [mapApiSubscription]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      hasBootstrappedRef.current = false;
      return;
    }
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;
    void refreshSubscriptions();
  }, [isLoaded, isSignedIn, refreshSubscriptions]);

  const addSubscription = useCallback(
    async (subscription: Subscription) => {
      const payload = {
        name: subscription.name,
        plan: subscription.plan ?? null,
        category: subscription.category ?? null,
        paymentMethod: subscription.paymentMethod ?? null,
        status: subscription.status ?? "active",
        startDate: subscription.startDate ?? null,
        price: subscription.price,
        currency: subscription.currency ?? "USD",
        billing: subscription.billing,
        renewalDate: subscription.renewalDate ?? null,
        color: subscription.color ?? null,
      };

      const created = await createSubscription(getTokenRef.current, payload);
      setSubscriptions((prev) => [mapApiSubscription(created), ...prev]);
    },
    [mapApiSubscription]
  );

  const value = useMemo(
    () => ({ subscriptions, addSubscription, isLoading, syncError, refreshSubscriptions }),
    [subscriptions, addSubscription, isLoading, syncError, refreshSubscriptions]
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) {
    throw new Error(
      "useSubscriptions must be used within SubscriptionsProvider"
    );
  }
  return ctx;
}
