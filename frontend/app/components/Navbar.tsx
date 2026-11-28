'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronDown,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  User as UserIcon,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TOOL_CATEGORIES, TOOL_ITEMS } from '../data/tools';

const TOOL_LINKS = [
  { label: 'Resize & crop', href: '/tools?tool=resize', description: 'Set exact dimensions and fit' },
  { label: 'Compress images', href: '/tools?tool=compress', description: 'Tune quality and output size' },
  { label: 'Convert formats', href: '/tools?tool=convert', description: 'Export WebP, AVIF, JPEG, or PNG' },
  { label: 'Batch processing', href: '/tools?tool=batch', description: 'Apply one workflow to many files' },
  { label: 'PDF to images', href: '/tools?tool=pdf', description: 'Export pages as image files' },
  { label: 'Images to PDF', href: '/tools?tool=image-pdf', description: 'Combine images into a PDF' },
  { label: 'Remove background', href: '/remove-background', description: 'Create a transparent PNG cutout' },
];

const LEARN_LINKS = [
  { label: 'Quick start guide', href: '/guide', description: 'Simple steps for the most common tasks' },
  { label: 'Image size presets', href: '/presets', description: 'Storefront, social, and print sizes' },
  { label: 'Image SEO analyzer', href: '/analyzer', description: 'Audit supplied HTML markup locally' },
  { label: 'Features', href: '/features', description: 'See how the product works' },
  { label: 'Guides & articles', href: '/blog', description: 'Learn image optimization basics' },
];

type DropdownName = 'tools' | 'learn' | null;

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('resizer-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    setUserMenuOpen(false);
  }, [pathname]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    setUserMenuOpen(false);
  };

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    document.documentElement.classList.toggle('light', !nextDark);
    localStorage.setItem('resizer-theme', nextDark ? 'dark' : 'light');
  };

  const isActive = (href: string) => {
    if (href === '/' || href === '/#resizer-studio') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (active: boolean) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-accent/10 text-accent'
        : 'text-muted hover:bg-black/5 hover:text-primary dark:hover:bg-white/5 dark:hover:text-white'
    }`;

  const renderLinks = (links: typeof TOOL_LINKS, mobile = false) => (
    <div className={mobile ? 'grid gap-1' : 'grid gap-1'}>
      {links.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={closeMenus}
          className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/10"
        >
          <span className="block text-sm font-semibold text-primary dark:text-white">{item.label}</span>
          <span className="mt-0.5 block text-xs text-muted">{item.description}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-white/80 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-2xl dark:border-zinc-800/80 dark:bg-zinc-950/85"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeMenus();
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenus}
          aria-label="Resizer AI home"
          className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <ImageIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-primary dark:text-white">
            Resizer <span className="text-accent">AI</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
          <Link href="/tools?tool=resize" className={navLinkClass(false)}>
            Resize
          </Link>
          <Link href="/tools?tool=compress" className={navLinkClass(false)}>
            Compress
          </Link>
          <Link href="/tools?tool=convert" className={navLinkClass(false)}>
            Convert
          </Link>
          <Link href="/guide" className={navLinkClass(isActive('/guide'))}>
            How to use
          </Link>
          <Link href="/remove-background" className={navLinkClass(isActive('/remove-background'))}>
            AI Tools
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-expanded={openDropdown === 'tools'}
              onClick={() => setOpenDropdown(openDropdown === 'tools' ? null : 'tools')}
              className={`${navLinkClass(pathname === '/tools' || pathname === '/remove-background')} inline-flex items-center gap-1.5`}
            >
              All Tools
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'tools' && (
              <div className="absolute right-0 top-full mt-2 w-[680px] rounded-2xl border border-border bg-surface p-4 shadow-2xl dark:bg-zinc-900">
                <div className="grid grid-cols-2 gap-4">
                  {TOOL_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <p className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: category.color }}>
                        {category.label}
                      </p>
                      <div className="grid gap-0.5">
                        {TOOL_ITEMS.filter((tool) => tool.category === category.id).map((tool) => (
                          <Link
                            key={tool.slug}
                            href={tool.studioHref || tool.href}
                            onClick={closeMenus}
                            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition hover:bg-accent/10 dark:text-white"
                          >
                            {tool.title}
                            {tool.badge && <span className="ml-2 text-[9px] text-violet-500">New</span>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/tools" onClick={closeMenus} className="mt-3 flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-bold text-primary hover:bg-accent/10 dark:text-white">
                  View complete tools directory
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-muted transition-colors hover:text-primary dark:bg-zinc-900 dark:hover:text-white"
          >
            {mounted && darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </button>

          {mounted && user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="inline-flex h-9 max-w-52 items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 text-xs font-semibold text-primary transition-colors hover:border-accent/50 dark:bg-zinc-900 dark:text-white"
              >
                {isSuperAdmin ? <ShieldCheck className="h-4 w-4 text-indigo-500" /> : <UserIcon className="h-4 w-4 text-accent" />}
                <span className="truncate">{user.name || 'Account'}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-2xl dark:bg-zinc-900">
                  <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                  {isSuperAdmin && (
                    <Link href="/admin/control-center" onClick={closeMenus} className="block rounded-xl px-3 py-2 text-sm font-medium text-indigo-500 hover:bg-indigo-500/10">
                      Admin control center
                    </Link>
                  )}
                  <Link href="/dashboard" onClick={closeMenus} className="block rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-accent/10 dark:text-white">
                    My dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenus();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : mounted ? (
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-primary dark:hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
          ) : (
            <span className="hidden h-9 w-16 sm:block" aria-hidden="true" />
          )}

          <Link
            href="/#resizer-studio"
            className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 sm:inline-flex"
          >
            Start editing
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-primary transition-colors hover:bg-surface-elevated dark:text-white dark:hover:bg-zinc-900 xl:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/70 bg-surface px-4 py-4 shadow-xl dark:bg-zinc-950 sm:px-6 xl:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            <Link href="/#resizer-studio" onClick={closeMenus} className={navLinkClass(isActive('/#resizer-studio'))}>
              Open image studio
            </Link>
            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Product tools</p>
            {renderLinks(TOOL_LINKS, true)}
            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Explore</p>
            {renderLinks(LEARN_LINKS, true)}
            {mounted && user ? (
              <div className="mt-3 grid gap-2 border-t border-border/70 pt-3">
                {isSuperAdmin && (
                  <Link href="/admin/control-center" onClick={closeMenus} className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-500 hover:bg-indigo-500/10">
                    Admin control center
                  </Link>
                )}
                <Link href="/dashboard" onClick={closeMenus} className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-accent/10 dark:text-white">
                  My dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenus();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="mt-3 grid gap-2 border-t border-border/70 pt-3">
                <Link href="/login" onClick={closeMenus} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-primary dark:text-white">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link href="/register" onClick={closeMenus} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white">
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
