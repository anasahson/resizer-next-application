'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore } from '../context/useSubscriptionStore';
import { useAuth } from '../context/AuthContext';
import { Check, Zap, Crown, Shield, ArrowRight, Sparkles, Image as ImageIcon, Download, Users } from 'lucide-react';

const PLAN_META: Record<string, {
  icon: React.ReactNode;
  color: string;
  gradient: string;
  ring: string;
  badge?: string;
  popular?: boolean;
}> = {
  free: {
    icon: <ImageIcon className="w-6 h-6" />,
    color: 'text-slate-500 dark:text-slate-400',
    gradient: 'from-slate-500 to-slate-600',
    ring: 'border-border',
  },
  pro: {
    icon: <Zap className="w-6 h-6" />,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'border-blue-500',
    badge: 'Most Popular',
    popular: true,
  },
  business: {
    icon: <Crown className="w-6 h-6" />,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    ring: 'border-amber-500',
    badge: 'Best Value',
  },
};

const PLAN_ORDER = ['free', 'pro', 'business'];

const FAQS = [
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Yes! You can change your plan at any time. Changes take effect immediately, and we prorate unused time.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'No trial needed — just start with the Free plan (5 images/month) and upgrade when you\'re ready. No credit card required.',
  },
  {
    q: 'What happens when I hit my monthly limit?',
    a: 'You\'ll see a friendly prompt to upgrade. Your existing images are always available for download.',
  },
  {
    q: 'Can I invite friends for referral bonuses?',
    a: 'Yes! Get 10% commission on each friend who upgrades to a paid plan. Go to your Dashboard → Referrals to get your link.',
  },
  {
    q: 'What image formats are supported?',
    a: 'All plans support JPG, PNG, WebP, AVIF, and HEIC input. Output formats include WebP, AVIF, JPG, and PNG.',
  },
  {
    q: 'Is my data private?',
    a: 'Absolutely. Images are processed server-side, never stored permanently, and never shared with third parties.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { plans, fetchPlans } = useSubscriptionStore();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      router.push('/register');
      return;
    }
    if (planId === 'free') {
      router.push('/');
      return;
    }
    setIsLoading(planId);
    setCheckoutError('');
    try {
      const { upgradeToProDev } = useSubscriptionStore.getState();
      const checkoutUrl = await upgradeToProDev(planId);
      window.location.assign(checkoutUrl);
    } catch (error: unknown) {
      const responseError = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      const message = responseError || 'Unable to start checkout. Please try again.';
      setCheckoutError(message);
      setIsLoading(null);
    }
  };

  const plansLoaded = Object.keys(plans).length > 0;

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="text-center pt-16 pb-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, transparent pricing — no hidden fees</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-base sm:text-lg text-muted max-w-xl mx-auto">
          Start free — no credit card needed. Upgrade when you need more images, batch processing, or priority support.
        </p>
      </section>

      {/* ── PLAN CARDS ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {!plansLoaded ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLAN_ORDER.map((planId) => {
              const plan = plans[planId];
              if (!plan) return null;
              const meta = PLAN_META[planId] || PLAN_META.free;
              const isFree = planId === 'free';
              const priceDisplay = isFree ? '$0' : `$${(plan.price / 100).toFixed(0)}`;

              return (
                <div
                  key={planId}
                  className={`relative rounded-3xl border-2 p-8 flex flex-col gap-6 transition-all duration-300 ${
                    meta.popular
                      ? 'border-blue-500 bg-gradient-to-b from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 shadow-2xl shadow-blue-500/10 scale-[1.02] md:scale-[1.04]'
                      : 'border-border bg-surface-elevated dark:bg-zinc-900/80 hover:border-blue-400/50 hover:shadow-lg'
                  }`}
                >
                  {/* Badge */}
                  {meta.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient} shadow-lg`}>
                      {meta.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${meta.gradient} text-white shadow-md`}>
                      {meta.icon}
                    </div>
                    <h2 className="text-xl font-extrabold text-primary dark:text-white">{plan.name}</h2>
                    <div className="flex items-end gap-1.5 mt-2">
                      <span className="text-4xl font-extrabold text-primary dark:text-white">{priceDisplay}</span>
                      {!isFree && <span className="text-muted text-sm mb-1">/month</span>}
                    </div>
                    <div className={`mt-2 text-sm font-semibold ${meta.color}`}>
                      {plan.imagesPerMonth === 99999 ? 'Unlimited images/month' : `${plan.imagesPerMonth} images/month`}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${meta.gradient}`}>
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-secondary dark:text-zinc-300 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(planId)}
                    disabled={isLoading === planId}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                      meta.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                        : isFree
                        ? 'bg-surface dark:bg-zinc-800 border border-border text-primary dark:text-white hover:border-blue-400'
                        : `bg-gradient-to-r ${meta.gradient} text-white shadow-lg`
                    }`}
                  >
                    {isLoading === planId ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>
                          {isFree
                            ? (user ? 'Start Resizing Free' : 'Get Started Free')
                            : `Upgrade to ${plan.name}`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!isFree && (
                    <p className="text-[11px] text-center text-muted -mt-3">
                      Secure checkout · Cancel anytime
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {checkoutError && (
          <div role="alert" className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-700 dark:text-rose-300">
            {checkoutError}
          </div>
        )}

        {/* ── TRUST BADGES ── */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Shield className="w-5 h-5 text-emerald-500" />, title: 'Secure Payments', desc: 'Powered by Stripe' },
            { icon: <Zap className="w-5 h-5 text-blue-500" />, title: 'Cancel Anytime', desc: 'No lock-in contracts' },
            { icon: <Users className="w-5 h-5 text-purple-500" />, title: 'Referral Bonuses', desc: '10% for each friend' },
            { icon: <Download className="w-5 h-5 text-amber-500" />, title: 'Instant Access', desc: 'No setup required' },
          ].map((t) => (
            <div key={t.title} className="flex items-start gap-3 p-4 rounded-2xl bg-surface-elevated dark:bg-zinc-900/60 border border-border/50">
              <div className="w-9 h-9 rounded-xl bg-surface dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {t.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-primary dark:text-white">{t.title}</div>
                <div className="text-[11px] text-muted leading-tight mt-0.5">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-extrabold text-center mb-8 text-primary dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-surface-elevated dark:bg-zinc-900/80 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
              >
                <span className="text-sm font-semibold text-primary dark:text-white leading-snug">
                  {faq.q}
                </span>
                <span className={`shrink-0 w-5 h-5 rounded-full border border-border flex items-center justify-center text-muted transition-transform ${openFaq === idx ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-sm text-muted leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted text-sm mb-3">Still have questions? We&apos;re here to help.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-primary dark:text-white hover:border-blue-400 transition-all"
          >
            Read our documentation →
          </Link>
        </div>
      </section>
    </div>
  );
}
