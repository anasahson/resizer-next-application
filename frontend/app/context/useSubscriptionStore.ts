import { create } from 'zustand';
import { subscriptionAPI } from '../lib/api';

interface Plan {
  name: string;
  price: number;
  imagesPerMonth: number;
  features: string[];
}

interface Subscription {
  plan_id: string;
  status: string;
  current_period_end: string;
}

interface QuotaInfo {
  allowed: boolean;
  remaining: number;
  plan: string;
  limit: number;
  usage: number;
  resetDate: string;
}

interface SubscriptionStore {
  plans: Record<string, Plan>;
  currentSubscription: Subscription | null;
  quota: QuotaInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  upgradeToProDev: (planId: string) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  getPortalUrl: () => Promise<string>;
}

const DEFAULT_PLANS: Record<string, Plan> = {
  free: {
    name: 'Free',
    price: 0,
    imagesPerMonth: 5,
    features: ['Basic compression', 'Max 5 images/month', 'WebP format only'],
  },
  pro: {
    name: 'Pro',
    price: 999,
    imagesPerMonth: 500,
    features: ['Advanced compression', '500 images/month', 'All formats', 'Watermark removal', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 4999,
    imagesPerMonth: 99999,
    features: ['Unlimited images', 'All features', 'API access', 'Dedicated support', 'Custom branding'],
  },
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plans: DEFAULT_PLANS,
  currentSubscription: null,
  quota: null,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionAPI.getPlans();
      if (data && data.plans && Object.keys(data.plans).length > 0) {
        set({ plans: data.plans, isLoading: false, error: null });
      } else {
        set({ plans: DEFAULT_PLANS, isLoading: false });
      }
    } catch (error: any) {
      console.warn('Using fallback subscription plans due to error:', error.message);
      set({ plans: DEFAULT_PLANS, error: error.message, isLoading: false });
    }
  },

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionAPI.getCurrentSubscription();
      set({
        currentSubscription: data.subscription,
        quota: data.usage,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  upgradeToProDev: async (planId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionAPI.createCheckout(planId);
      set({ isLoading: false });
      return data.checkoutUrl;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true });
    try {
      await subscriptionAPI.cancelSubscription();
      await get().fetchSubscription();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getPortalUrl: async () => {
    try {
      const { data } = await subscriptionAPI.getPortalSession();
      return data.portalUrl;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
