'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Shield,
  Lock,
  Settings,
  ChevronRight,
  Mail,
  KeyRound,
  LogOut,
  Edit3,
  RefreshCw,
  ExternalLink,
  Wrench,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, updateProfile, logout, isLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  // Active Tab in User Dashboard
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Settings Tab Password Form State
  const [settingsCurrentPass, setSettingsCurrentPass] = useState('');
  const [settingsNewPass, setSettingsNewPass] = useState('');
  const [settingsConfirmPass, setSettingsConfirmPass] = useState('');
  const [showSettingsCurrentPass, setShowSettingsCurrentPass] = useState(false);
  const [showSettingsNewPass, setShowSettingsNewPass] = useState(false);
  const [showSettingsConfirmPass, setShowSettingsConfirmPass] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // User data can be restored from local storage, so render it only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth guard: redirect unauthenticated visitors to /login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Check for successful upgrade redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const upgradedPlan = params.get('upgraded');
      if (upgradedPlan) {
        window.setTimeout(() => {
          triggerToast(`🎉 Successfully upgraded to the ${upgradedPlan.toUpperCase()} plan!`, 'success');
        }, 0);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const openEditModal = () => {
    setEditName(user?.name || '');
    setCurrentPass('');
    setNewPass('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    const payload: { name: string; currentPassword?: string; newPassword?: string } = { name: editName };
    if (newPass) {
      payload.currentPassword = currentPass;
      payload.newPassword = newPass;
    }

    const res = await updateProfile(payload);
    setIsUpdatingProfile(false);

    if (res.success) {
      triggerToast(res.message || 'Profile updated successfully!');
      setIsEditProfileOpen(false);
      setCurrentPass('');
      setNewPass('');
      setShowCurrentPass(false);
      setShowNewPass(false);
    } else {
      triggerToast(res.message || 'Failed to update profile', 'error');
    }
  };

  const handleSaveSettingsPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsNewPass !== settingsConfirmPass) {
      triggerToast('New passwords do not match.', 'error');
      return;
    }
    if (settingsNewPass.length < 12) {
      triggerToast('New password must be at least 12 characters.', 'error');
      return;
    }

    setIsSavingSettings(true);
    const res = await updateProfile({
      currentPassword: settingsCurrentPass,
      newPassword: settingsNewPass,
    });
    setIsSavingSettings(false);

    if (res.success) {
      triggerToast('Password updated successfully!');
      setSettingsCurrentPass('');
      setSettingsNewPass('');
      setSettingsConfirmPass('');
      setShowSettingsCurrentPass(false);
      setShowSettingsNewPass(false);
      setShowSettingsConfirmPass(false);
    } else {
      triggerToast(res.message || 'Failed to update password', 'error');
    }
  };

  if (!hasMounted || isLoading || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-4 dark:bg-zinc-950">
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          Loading your workspace
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 selection:bg-indigo-500 selection:text-white transition-colors duration-200 dark:bg-zinc-950/40 dark:text-zinc-100">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl dark:bg-indigo-600/15" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-600/15" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/40 text-rose-800 dark:text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Account workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Your workspace
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
              Manage your account and jump back into your image workflow.
            </p>
          </div>
          <Link
            href="/tools?tool=convert"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            <Wrench className="h-4 w-4" />
            Open image tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* ASIDE SIDEBAR                                                             */}
          {/* ========================================================================= */}
          <aside className="space-y-6 rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_50px_-32px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-xl lg:sticky lg:top-24 lg:col-span-3">
            {/* User Mini Profile Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-zinc-800/80">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-cyan-500/20 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user ? user.name : 'Guest User'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user?.email || 'Signed-in account'}</p>
                <span className="inline-block mt-1 bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25 dark:border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  👤 Free Member
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-600/30 dark:to-blue-600/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>My Profile & Account</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-600/30 dark:to-blue-600/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Account Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

            </nav>

            {/* Website Direct Links */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
                Website Tools
              </p>
              <Link
                href="/tools?tool=convert"
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-300 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Open Image Tools</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
              <Link
                href="/"
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-300 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Homepage Studio</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-2">
              {user && (
                <button
                  onClick={openEditModal}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-300 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Edit Profile</span>
                </button>
              )}

              {user ? (
                <button
                  onClick={logout}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* MAIN CONTENT AREA                                                         */}
          {/* ========================================================================= */}
          <main className="space-y-6 lg:col-span-9">
            {/* TAB 1: PROFILE & ACCOUNT OVERVIEW */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* User Profile Header Card */}
                <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#172554_0%,#312e81_48%,#4f46e5_100%)] p-6 text-white shadow-[0_24px_70px_-35px_rgba(49,46,129,0.75)] sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-extrabold text-white shadow-inner shadow-white/10">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-2xl font-bold tracking-tight text-white">
                            {user ? user.name : 'Welcome, Guest'}
                          </h2>
                          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-indigo-100">
                            👤 Active Member
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-blue-100/80">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-blue-200/70" />
                            <span>{user?.email || 'Signed-in account'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-blue-200/70" />
                            <span className="font-mono">Role: {user?.role || 'user'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {user && (
                        <button
                          onClick={openEditModal}
                          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </button>
                      )}
                      <Link
                        href="/tools?tool=convert"
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-indigo-950 shadow-md shadow-black/10 transition hover:bg-indigo-50"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Use Image Tools</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Account & Security Highlights */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Account Plan</span>
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-slate-900 dark:text-white">Free Starter</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Your current account tier</p>
                    </div>
                  </div>

                  <Link href="/privacy" className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-indigo-500/40">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Security & Privacy</span>
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">Privacy information</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Review file and account data policies</p>
                    </div>
                  </Link>

                  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Supported Formats</span>
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-lg font-bold text-violet-700 dark:text-violet-300">WebP · AVIF · JPG · PNG</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Choose a format in the image tools</p>
                    </div>
                  </div>
                </div>

                {/* Quick Callout to Website Tools */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 dark:border-indigo-500/30 dark:from-indigo-950/40 dark:to-blue-950/30 sm:flex-row">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Ready for your next image workflow?</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Convert, resize, and compress images from one workspace.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/tools?tool=convert"
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
                    >
                      <span>Start converting</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Quick Website Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/tools?tool=convert"
                    className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        Convert an image
                      </h4>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Choose a format, adjust quality, and export your image.
                    </p>
                  </Link>

                  <Link
                    href="/presets"
                    className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        Browse presets
                      </h4>
                      <Sparkles className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Start with ready-made sizes for social, stores, and print.
                    </p>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      <span>Account Settings & Security</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage your credentials, preferences, and account profile.</p>
                  </div>

                  {/* Profile Info Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800/80">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.name || 'Guest User'}
                        className="w-full bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-slate-700 dark:text-zinc-300 font-medium cursor-not-allowed opacity-80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-slate-700 dark:text-zinc-300 font-medium cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleSaveSettingsPassword} className="space-y-4 max-w-md">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Change Password</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Current Password</label>
                      <div className="relative">
                        <input type={showSettingsCurrentPass ? 'text' : 'password'} placeholder="••••••••" value={settingsCurrentPass} onChange={(e) => setSettingsCurrentPass(e.target.value)} className="w-full bg-white dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500" />
                        <button type="button" onClick={() => setShowSettingsCurrentPass((visible) => !visible)} aria-label={showSettingsCurrentPass ? 'Hide current password' : 'Show current password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                          {showSettingsCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">New Password</label>
                      <div className="relative">
                        <input type={showSettingsNewPass ? 'text' : 'password'} placeholder="At least 12 characters" value={settingsNewPass} onChange={(e) => setSettingsNewPass(e.target.value)} className="w-full bg-white dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500" />
                        <button type="button" onClick={() => setShowSettingsNewPass((visible) => !visible)} aria-label={showSettingsNewPass ? 'Hide new password' : 'Show new password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                          {showSettingsNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input type={showSettingsConfirmPass ? 'text' : 'password'} placeholder="Repeat new password" value={settingsConfirmPass} onChange={(e) => setSettingsConfirmPass(e.target.value)} className="w-full bg-white dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500" />
                        <button type="button" onClick={() => setShowSettingsConfirmPass((visible) => !visible)} aria-label={showSettingsConfirmPass ? 'Hide password confirmation' : 'Show password confirmation'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                          {showSettingsConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingSettings || !settingsCurrentPass || !settingsNewPass}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-cyan-600/25 transition-all"
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80">
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2">Change Password (Optional)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500"
                      />
                      <button type="button" onClick={() => setShowCurrentPass((visible) => !visible)} aria-label={showCurrentPass ? 'Hide current password' : 'Show current password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="New password (min 6 characters)"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500"
                      />
                      <button type="button" onClick={() => setShowNewPass((visible) => !visible)} aria-label={showNewPass ? 'Hide new password' : 'Show new password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white flex items-center gap-2 shadow-md shadow-cyan-600/30"
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
