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
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, updateProfile, logout, isLoading } = useAuth();

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
    if (settingsNewPass.length < 6) {
      triggerToast('New password must be at least 6 characters.', 'error');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-cyan-500 selection:text-white pb-20 transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 dark:bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl" />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* ASIDE SIDEBAR                                                             */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-3 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-6 sticky top-20">
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
                href="/tools"
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
          <main className="lg:col-span-9 space-y-6">
            {/* TAB 1: PROFILE & ACCOUNT OVERVIEW */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* User Profile Header Card */}
                <div className="bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-blue-500/25">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {user ? user.name : 'Welcome, Guest'}
                          </h1>
                          <span className="bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25 dark:border-cyan-500/30 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                            👤 Active Member
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            <span>{user?.email || 'Signed-in account'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            <span className="font-mono">Role: {user?.role || 'user'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {user && (
                        <button
                          onClick={openEditModal}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2 transition-all shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Edit Details</span>
                        </button>
                      )}
                      <Link
                        href="/tools"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-cyan-500/20"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Use Image Tools</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Account & Security Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Account Plan</span>
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-slate-900 dark:text-white">Free Starter</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Unlimited conversions with no fees or limits</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Security & Privacy</span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Shield className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Encrypted & Private</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Files are transformed securely in-memory</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Supported Formats</span>
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">WebP · AVIF · JPG · PNG</div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Universal image conversion and compression</p>
                    </div>
                  </div>
                </div>

                {/* Quick Callout to Website Tools */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Ready to resize & optimize images?</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Access all tools on the website with instant drag-and-drop, dimension controls, and high-speed compression.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/tools"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all shrink-0"
                    >
                      <span>Explore Tools</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Quick Website Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/tools"
                    className="p-5 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-cyan-500/50 transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        Image Tools Suite
                      </h4>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Convert to WebP, AVIF, JPEG, PNG, or compress images with customizable quality.
                    </p>
                  </Link>

                  <Link
                    href="/blog"
                    className="p-5 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-cyan-500/50 transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        Engineering Blog
                      </h4>
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Read in-depth technical guides on AVIF vs WebP, Core Web Vitals, and lossless PNG algorithms.
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
                        <input type={showSettingsNewPass ? 'text' : 'password'} placeholder="At least 6 characters" value={settingsNewPass} onChange={(e) => setSettingsNewPass(e.target.value)} className="w-full bg-white dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-500" />
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
