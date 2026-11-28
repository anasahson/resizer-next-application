import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quick Start Guide',
  description:
    'Simple step-by-step help for compressing, converting, resizing, and preparing images and PDFs with Resizer AI.',
  alternates: { canonical: '/guide' },
};

const mainTasks = [
  {
    number: '01',
    title: 'Make an image smaller',
    description: 'Compress an image to reduce its file size for a website, form, or message.',
    href: '/tools?tool=compress',
    action: 'Open image compressor',
    steps: [
      'Choose Compress and add your image.',
      'Optionally choose a maximum file size, such as 100 KB.',
      'Process the image, then download it.',
    ],
  },
  {
    number: '02',
    title: 'Change an image format',
    description: 'Convert a photo or graphic to JPG, PNG, WebP, or AVIF.',
    href: '/tools?tool=convert',
    action: 'Open format converter',
    steps: [
      'Choose Convert and add your image.',
      'Pick the format you need.',
      'Process and download the converted image.',
    ],
  },
  {
    number: '03',
    title: 'Change image dimensions',
    description: 'Set an exact width and height, or resize by percentage.',
    href: '/tools?tool=resize',
    action: 'Open image resizer',
    steps: [
      'Choose Resize and add your image.',
      'Enter the width and height in pixels, or switch to Percentage.',
      'Keep proportions on to prevent stretching, then process and download.',
    ],
  },
];

const moreTools = [
  {
    title: 'Resize for a platform',
    description: 'Start with ready-made sizes for social media, stores, and print.',
    href: '/presets',
    link: 'Browse image presets',
  },
  {
    title: 'Work with PDFs',
    description: 'Turn PDF pages into images, or combine images into a PDF.',
    href: '/tools?tool=pdf',
    link: 'Open PDF tools',
  },
  {
    title: 'Remove a background',
    description: 'Make a transparent cutout in your browser. The AI model downloads on first use, but your image stays on your device.',
    href: '/remove-background',
    link: 'Open background remover',
  },
  {
    title: 'Check website images',
    description: 'Review image dimensions and optimization opportunities from your markup.',
    href: '/analyzer',
    link: 'Open image analyzer',
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          Resizer AI help
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-primary dark:text-white sm:text-5xl">
          What do you want to do?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Pick a task below. Each guide walks you through the few steps you need—no image-editing
          experience required.
        </p>
        <Link
          href="/#resizer-studio"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500"
        >
          Start with an image
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section aria-labelledby="main-tasks-heading" className="mt-12 sm:mt-16">
        <h2 id="main-tasks-heading" className="text-xl font-extrabold text-primary dark:text-white sm:text-2xl">
          The most common image tasks
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {mainTasks.map((task) => (
            <article key={task.number} className="flex flex-col rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
              <span className="text-xs font-black tracking-widest text-blue-600 dark:text-blue-400">
                TASK {task.number}
              </span>
              <h3 className="mt-2 text-lg font-extrabold text-primary dark:text-white">{task.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted">{task.description}</p>
              <ol className="mt-5 space-y-3">
                {task.steps.map((step) => (
                  <li key={step} className="flex gap-2.5 text-sm leading-5 text-primary dark:text-zinc-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Link
                href={task.href}
                className="mt-6 inline-flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-bold text-primary transition-colors hover:border-blue-400 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              >
                {task.action}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="more-tools-heading" className="mt-12 sm:mt-16">
        <h2 id="more-tools-heading" className="text-xl font-extrabold text-primary dark:text-white sm:text-2xl">
          More ways to use the site
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {moreTools.map((tool) => (
            <article key={tool.title} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div>
                <h3 className="font-bold text-primary dark:text-white">{tool.title}</h3>
                <p className="mt-1 text-sm leading-5 text-muted">{tool.description}</p>
              </div>
              <Link
                href={tool.href}
                aria-label={tool.link}
                className="shrink-0 rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400"
              >
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="helpful-tips-heading" className="mt-12 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-500/20 dark:bg-blue-500/5 sm:mt-16 sm:p-8">
        <h2 id="helpful-tips-heading" className="text-xl font-extrabold text-primary dark:text-white">
          A few helpful tips
        </h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-2">
          <li>For a specific upload limit, use Compress to Target KB and enter the maximum size requested.</li>
          <li>For exact dimensions, enter pixels. Keep proportions enabled unless you intentionally want to stretch an image.</li>
          <li>You can add multiple images to supported batch tools, then download the results together as a ZIP.</li>
          <li>Some optional AI tools send an image to their provider after you submit it. Review the notice on that tool before continuing.</li>
        </ul>
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        Still need help? <Link href="/contact" className="font-semibold text-blue-600 underline underline-offset-4 dark:text-blue-400">Contact support</Link>.
      </p>
    </div>
  );
}
