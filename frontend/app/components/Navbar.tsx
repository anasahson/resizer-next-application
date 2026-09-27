'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, LogIn, Sparkles, LayoutDashboard, Sun, Moon, UserPlus } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  dropdown?: { label: string; href: string; desc?: string; icon?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Tools',
    href: '/tools',
    dropdown: [
      { label: 'Convert to WebP', href: '/tools', desc: 'Superior web compression', icon: '🖼️' },
      { label: 'Convert to AVIF', href: '/tools', desc: 'Next-gen image format', icon: '✨' },
      { label: 'Convert to JPG', href: '/tools', desc: 'Universal compatibility', icon: '📷' },
      { label: 'Convert to PNG', href: '/tools', desc: 'Lossless transparency', icon: '🎨' },
      { label: 'Convert to HEIC', href: '/tools', desc: 'Apple high efficiency format', icon: '🍎' },
      { label: 'Compress Image', href: '/tools', desc: 'Shrink file size instantly', icon: '⚡' },
    ],
  },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync theme with localStorage and document classes
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('resizer-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('resizer-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('resizer-theme', 'light');
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border/60 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 group-hover:shadow-blue-500/25 transition-all duration-200">
            R
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Resizer
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);

            if (item.dropdown) {
              return (
                <div
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => setToolsDropdownOpen(true)}
                  onMouseLeave={() => setToolsDropdownOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors duration-200 ${active
                        ? 'text-accent font-semibold bg-accent/10 dark:bg-accent/15'
                        : 'text-muted hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180 text-accent' : 'text-muted'
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute left-0 top-full pt-2 w-64 transition-all duration-200 origin-top-left ${toolsDropdownOpen
                        ? 'opacity-100 scale-100 visible translate-y-0'
                        : 'opacity-0 scale-95 invisible -translate-y-1'
                      }`}
                  >
                    <div className="bg-surface dark:bg-zinc-900 border border-border/80 rounded-2xl shadow-xl p-2 backdrop-blur-xl">
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                        Conversion Tools
                      </div>
                      {item.dropdown.map((tool) => (
                        <Link
                          key={tool.label}
                          href={tool.href}
                          onClick={() => setToolsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary hover:text-primary dark:text-zinc-300 dark:hover:text-white hover:bg-accent/10 dark:hover:bg-white/5 transition-all group/item"
                        >
                          <span className="text-lg group-hover/item:scale-110 transition-transform">
                            {tool.icon}
                          </span>
                          <div>
                            <div className="font-medium text-primary dark:text-white leading-tight">
                              {tool.label}
                            </div>
                            {tool.desc && (
                              <div className="text-xs text-muted leading-tight mt-0.5">
                                {tool.desc}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg transition-colors duration-200 ${active
                    ? 'text-accent font-semibold bg-accent/10 dark:bg-accent/15'
                    : 'text-muted hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Multi-Auth & Profile Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl border border-border/80 bg-surface-elevated dark:bg-zinc-900 flex items-center justify-center text-muted hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            {mounted && darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* User Auth Profile Dropdown / Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-border/80 bg-surface-elevated dark:bg-zinc-900 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs ${isSuperAdmin
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/30'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}
                >
                  {isSuperAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <span className="hidden sm:inline font-semibold text-primary dark:text-white max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
                <span
                  className={`hidden sm:inline-block font-mono uppercase text-[10px] font-bold px-1.5 py-0.5 rounded ${isSuperAdmin
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    }`}
                >
                  {user.role}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-surface dark:bg-zinc-900 border border-border/80 rounded-2xl shadow-2xl p-2 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-xs font-semibold text-primary dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-muted truncate">{user.email}</p>
                    <span
                      className={`inline-block mt-1 font-mono uppercase text-[9px] font-bold px-1.5 py-0.5 rounded ${isSuperAdmin
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}
                    >
                      Role: {user.role}
                    </span>
                  </div>

                  {isSuperAdmin && (
                    <Link
                      href="/admin/control-center"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-400 hover:text-indigo-300 dark:hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors mt-1 font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>👑 Control Center</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-secondary hover:text-primary dark:text-zinc-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-1 font-medium"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>👤 My Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors mt-1 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 text-primary dark:text-white text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-blue-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-xl border border-border flex items-center justify-center text-primary dark:text-white hover:bg-surface-elevated dark:hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-surface dark:bg-zinc-950 px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);

            if (item.dropdown) {
              return (
                <div key={item.label} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                        ? 'text-accent font-semibold bg-accent/10'
                        : 'text-primary dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-muted">All tools →</span>
                  </Link>
                  <div className="pl-3 pr-1 py-1 space-y-1">
                    {item.dropdown.map((tool) => (
                      <Link
                        key={tool.label}
                        href={tool.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                    ? 'text-accent font-semibold bg-accent/10'
                    : 'text-primary dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
            {user ? (
              <>
                {isSuperAdmin && (
                  <Link
                    href="/admin/control-center"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>👑 Control Center</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  <span>👤 My Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 border border-border text-primary dark:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
