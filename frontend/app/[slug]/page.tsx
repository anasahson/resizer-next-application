import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { TOOL_CATEGORIES, TOOL_ITEMS } from '../data/tools';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOL_ITEMS.map((tool) => ({ slug: tool.slug })).concat({ slug: 'workflows' });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOL_ITEMS.find((item) => item.slug === slug);
  if (slug === 'workflows') {
    return {
      title: 'Create an Image Workflow',
      description: 'Chain image, PDF, resize, and compression tasks into one reusable workflow.',
      alternates: { canonical: '/workflows' },
    };
  }
  if (!tool) return {};
  return {
    title: `${tool.title} — Free Online Tool`,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: tool.href },
  };
}

export default async function ToolLandingPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === 'workflows') {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-4xl font-black tracking-tight text-primary dark:text-white">Create a Workflow</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
          Chain multiple tools together and run them in one click. Workflow automation is being prepared for the next release.
        </p>
        <Link href="/tools" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
          Browse tools <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    );
  }

  const tool = TOOL_ITEMS.find((item) => item.slug === slug);
  if (!tool) notFound();
  const category = TOOL_CATEGORIES.find((item) => item.id === tool.category)!;

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-border bg-surface p-7 shadow-xl dark:bg-zinc-900 sm:p-10" style={{ borderTopColor: category.color, borderTopWidth: 4 }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: category.color }}>
          {category.label}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-primary dark:text-white">{tool.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{tool.description}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {tool.badge && <span className="rounded-full bg-violet-100 px-3 py-1.5 font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{tool.badge}</span>}
          <span className="rounded-full bg-surface-elevated px-3 py-1.5 font-bold text-muted dark:bg-zinc-800">{tool.engineDetail}</span>
        </div>
        <Link
          href={tool.studioHref || '/tools'}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: category.color }}
        >
          Open tool <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
