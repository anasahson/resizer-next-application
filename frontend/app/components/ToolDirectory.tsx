'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  BadgeCheck,
  ChartNoAxesCombined,
  Crop,
  FileImage,
  FilePlus2,
  FileStack,
  FileType,
  Focus,
  GalleryHorizontalEnd,
  Gauge,
  Image as ImageIcon,
  Layers,
  Maximize2,
  RefreshCw,
  RotateCw,
  ScanLine,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Stamp,
  Target,
  WandSparkles,
  Workflow,
} from 'lucide-react';
import {
  TOOL_CATEGORIES,
  TOOL_ITEMS,
  WORKFLOW_CARD,
  type ToolCategoryId,
  type ToolItem,
} from '../data/tools';

const ICONS: Record<string, typeof Gauge> = {
  ArrowLeftRight,
  BadgeCheck,
  ChartNoAxesCombined,
  Crop,
  FileImage,
  FilePlus2,
  FileStack,
  FileType,
  Focus,
  GalleryHorizontalEnd,
  Gauge,
  Image: ImageIcon,
  Layers,
  Maximize2,
  RefreshCw,
  RotateCw,
  ScanLine,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Stamp,
  Target,
  WandSparkles,
  Workflow,
};

export default function ToolDirectory({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<'all' | ToolCategoryId>('all');
  const visible = active === 'all'
    ? TOOL_ITEMS
    : TOOL_ITEMS.filter((tool) => tool.category === active);

  const categoryById = new Map(TOOL_CATEGORIES.map((category) => [category.id, category]));

  return (
    <section aria-label="Resizer AI tool directory" className={compact ? '' : 'mx-auto max-w-[1440px]'}>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter tools by category">
        <button
          type="button"
          onClick={() => setActive('all')}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
            active === 'all'
              ? 'border-slate-950 bg-slate-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
              : 'border-border bg-surface text-muted hover:border-accent/50 hover:text-primary'
          }`}
        >
          All
        </button>
        {TOOL_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActive(category.id)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              active === category.id
                ? 'text-slate-950 shadow-sm'
                : 'border-border bg-surface text-muted hover:text-primary'
            }`}
            style={{
              borderColor: active === category.id ? category.color : undefined,
              backgroundColor: active === category.id ? `${category.color}18` : undefined,
            }}
          >
            {category.filterLabel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((tool: ToolItem) => {
          const category = categoryById.get(tool.category)!;
          const Icon = ICONS[tool.icon] || Gauge;
          return (
            <article
              key={tool.slug}
              className="group relative flex min-h-52 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_30px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:bg-zinc-900"
              style={{ borderTopColor: category.color, borderTopWidth: 3 }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${category.color}18`, color: category.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {tool.badge && (
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    {tool.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black tracking-tight text-primary dark:text-white">{tool.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{tool.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-md bg-surface-elevated px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-muted dark:bg-zinc-800">
                  {tool.engineDetail}
                </span>
                <Link
                  href={tool.studioHref || tool.href}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition group-hover:scale-105"
                  style={{ backgroundColor: category.color }}
                  aria-label={`Open ${tool.title}`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}

        {active === 'all' && (
          <article className="group flex min-h-52 flex-col rounded-2xl border border-rose-200 bg-rose-50 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(244,114,182,0.12)] dark:border-rose-500/20 dark:bg-rose-500/[0.07]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
              <Workflow className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-black tracking-tight text-primary dark:text-white">{WORKFLOW_CARD.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted">{WORKFLOW_CARD.description}</p>
            <Link
              href={WORKFLOW_CARD.href}
              className="mt-4 inline-flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
            >
              Open workflow builder
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}
