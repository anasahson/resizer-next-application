import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design frames',
  robots: { index: false, follow: false },
};

/**
 * Static, pixel-accurate implementation of the product's design frames.
 * Each frame is rendered at its design width so it can be exported 1:1
 * (screenshot) and dropped into Figma, a deck, or a design review.
 */

const checkerboard =
  'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';

function Chrome({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b px-8 py-4 ${dark ? 'border-zinc-800 bg-zinc-950' : 'border-border bg-surface'}`}>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-black text-white">R</span>
          <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-foreground'}`}>Resizer AI</span>
        </div>
        <nav className={`flex gap-6 text-xs font-medium ${dark ? 'text-zinc-400' : 'text-muted'}`}>
          <span>Tools</span>
          <span>AI Studio</span>
          <span>Analyzer</span>
          <span>Features</span>
          <span>Pricing</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${dark ? 'text-zinc-400' : 'text-muted'}`}>Sign in</span>
        <span className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white">Get Started</span>
      </div>
    </div>
  );
}

function Dropzone({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-3xl border-2 border-dashed border-accent/40 bg-accent/[0.04] text-center ${compact ? 'p-6' : 'p-10'}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-2xl text-accent">↑</div>
      <p className={`mt-4 font-bold text-foreground ${compact ? 'text-sm' : 'text-lg'}`}>Drop up to 20 images here</p>
      <p className="mt-1 text-xs text-muted">or click to browse · Ctrl+V to paste · JPG, PNG, WebP, AVIF, HEIC · up to 50 MB</p>
      <div className={`mt-5 flex justify-center gap-2 ${compact ? 'flex-col' : ''}`}>
        <span className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white">Select images</span>
        <span className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground">Paste URL</span>
        {!compact && <span className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground">Google Drive</span>}
        {!compact && <span className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground">Dropbox</span>}
      </div>
    </div>
  );
}

function ToolCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-sm">{icon}</div>
      <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{desc}</p>
      <p className="mt-3 text-[11px] font-semibold text-accent">Open tool →</p>
    </div>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Toggle({ label, on = true }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-foreground">
      <span className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${on ? 'border-accent bg-accent text-white' : 'border-border bg-surface'}`}>
        {on ? '✓' : ''}
      </span>
      {label}
    </div>
  );
}

export default function DesignPage() {
  return (
    <div className="bg-slate-100 py-10">
      <div className="mx-auto space-y-12">

        {/* FRAME 1 — Homepage */}
        <section id="frame-home" className="mx-auto w-[1440px] overflow-hidden rounded-2xl bg-background shadow-xl">
          <Chrome />
          <div className="px-16 py-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-positive/30 bg-positive/10 px-3 py-1 text-[11px] font-bold text-positive">
                Core processing API · browser fallback
              </span>
              <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-[-0.04em] text-foreground">
                Resize, compress and prepare images in one workspace.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
                A product-grade image toolkit with clear processing choices. AI background removal runs in your browser; the model downloads on first use and your image stays on your device.
              </p>
            </div>
            <div className="mt-8">
              <Dropzone />
            </div>
            <div className="mt-8 flex gap-2 text-xs font-semibold">
              {['All tools', 'Optimize', 'Resize & crop', 'Convert', 'AI studio'].map((tab, i) => (
                <span key={tab} className={`rounded-full px-4 py-2 ${i === 0 ? 'bg-accent text-white' : 'border border-border bg-surface text-muted'}`}>
                  {tab}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <ToolCard icon="⚡" title="Compress" desc="Shrink up to 80% locally with a live quality target." />
              <ToolCard icon="📐" title="Resize" desc="Social, print and passport sizes with exact pixels." />
              <ToolCard icon="✂️" title="BG Remover AI" desc="Provider-backed cutout; sign-in and account approval required." />
              <ToolCard icon="🔄" title="WebP / AVIF" desc="Next-gen conversion with before/after size deltas." />
            </div>
          </div>
        </section>

        {/* FRAME 2 — Workspace */}
        <section id="frame-workspace" className="mx-auto w-[1440px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400">← Back</span>
              <span className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white">Batch · 4 files</span>
              <span className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300">Original / Output</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span>Zoom 100%</span>
              <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-zinc-900">Studio: Light</span>
            </div>
          </div>

          <div className="flex">
            <div className="flex-1 p-6">
              <div className="flex overflow-hidden rounded-2xl border border-zinc-800">
                <div className="relative flex-1 bg-zinc-900">
                  <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                    BEFORE · 1920×1080 · 1.8 MB
                  </div>
                  <div className="h-[360px] w-full bg-gradient-to-br from-sky-500/30 via-indigo-500/25 to-fuchsia-500/25" />
                </div>
                <div className="relative flex-1 border-l-2 border-accent" style={{ background: checkerboard }}>
                  <div className="absolute right-3 top-3 rounded-md bg-accent px-2 py-1 text-[10px] font-bold text-white">
                    AFTER · 1080×1080 · 340 KB · −81%
                  </div>
                  <div className="m-auto h-[360px] w-[72%] bg-gradient-to-br from-sky-500/40 via-indigo-500/30 to-fuchsia-500/30" />
                  <div className="absolute left-0 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow-lg">
                    ↔
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  { w: '1920 → 1080', d: '−81%' },
                  { w: '4000 → 2048', d: '−74%' },
                  { w: '1280 → 1080', d: '−29%' },
                  { w: '+ Add', d: '' },
                ].map((item, i) => (
                  <div key={i} className={`rounded-xl border p-2 ${i === 0 ? 'border-accent bg-accent/10' : 'border-zinc-800 bg-zinc-900'}`}>
                    <div className="mb-1.5 h-12 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800" />
                    <p className="text-[10px] font-semibold text-zinc-200">{item.w}</p>
                    <p className="text-[10px] font-bold text-positive">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="w-[380px] border-l border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Inspector</p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-zinc-300">Format</p>
                  <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white">WebP ⌄</div>
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-[11px]">
                    <span className="font-semibold text-zinc-300">Quality</span>
                    <span className="font-mono font-bold text-accent">82</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-700">
                    <div className="h-1.5 w-[70%] rounded-full bg-accent" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {['Tiny', 'Web', 'Print', 'Max'].map((p, i) => (
                      <span key={p} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${i === 1 ? 'bg-accent text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-500">Width</p>
                    <p className="text-xs font-bold text-white">1080</p>
                  </div>
                  <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-500">Height</p>
                    <p className="text-xs font-bold text-white">1080</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <Toggle label="Lock aspect ratio" />
                  <Toggle label="Do not enlarge if smaller" />
                  <Toggle label="Strip EXIF / GPS metadata" />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                  <span className="text-[11px] text-zinc-400">Target size</span>
                  <span className="font-mono text-xs font-bold text-white">200 KB</span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[11px] font-semibold text-zinc-300">Effects &amp; watermark</p>
                  <p className="mt-1 text-[10px] text-zinc-500">Rotate · flip · grayscale · blur · text mark</p>
                </div>

                <div className="rounded-xl bg-accent px-4 py-3 text-center text-xs font-bold text-white">
                  Process 4 files
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* FRAME 3 — Completion + next-step loop */}
        <section id="frame-complete" className="mx-auto w-[1440px] overflow-hidden rounded-2xl bg-slate-200 p-16 shadow-xl">
          <div className="mx-auto w-[640px] rounded-3xl border border-border bg-surface p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-positive/15 text-positive">✓</span>
              <div>
                <p className="text-base font-bold text-foreground">4 files processed</p>
                <p className="text-xs text-muted">Saved 4.2 MB in total (−78%)</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-positive/30 bg-positive/[0.07] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Before</p>
                  <p className="text-lg font-black text-foreground">5.4 MB</p>
                </div>
                <div className="text-positive">→</div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">After</p>
                  <p className="text-lg font-black text-positive">1.2 MB</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <span className="flex-1 rounded-xl bg-accent py-3 text-center text-xs font-bold text-white">Download ZIP (4)</span>
              <span className="rounded-xl border border-border px-4 py-3 text-xs font-semibold text-foreground">Delete from temp ↗</span>
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Next step</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { icon: '📐', t: 'Resize these' },
                { icon: '✂️', t: 'Remove background' },
                { icon: '🔄', t: 'Convert to AVIF' },
              ].map((item) => (
                <div key={item.t} className="rounded-xl border border-border bg-surface-elevated/60 p-3 text-center">
                  <div className="text-lg">{item.icon}</div>
                  <p className="mt-1 text-[11px] font-semibold text-foreground">{item.t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FRAME 4 — Mobile homepage */}
        <section id="frame-mobile" className="mx-auto w-[390px] overflow-hidden rounded-[36px] border-[10px] border-zinc-900 bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-black text-white">R</span>
              <span className="text-xs font-bold text-foreground">Resizer AI</span>
            </div>
            <span className="text-sm text-muted">☰</span>
          </div>
          <div className="px-4 py-5">
            <span className="inline-flex rounded-full border border-positive/30 bg-positive/10 px-2 py-1 text-[9px] font-bold text-positive">
              Core processing API · browser fallback
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-foreground">
              Resize, compress &amp; remove backgrounds.
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Background removal runs in your browser. The AI model downloads on first use; your image stays on your device.
            </p>
            <div className="mt-4">
              <Dropzone compact />
            </div>
            <div className="mt-4 flex gap-2 overflow-hidden text-[10px] font-semibold">
              {['All', 'Optimize', 'Resize', 'AI'].map((tab, i) => (
                <span key={tab} className={`rounded-full px-3 py-1.5 ${i === 0 ? 'bg-accent text-white' : 'border border-border text-muted'}`}>
                  {tab}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <ToolCard icon="⚡" title="Compress" desc="Shrink up to 80% locally." />
              <ToolCard icon="📐" title="Resize" desc="Social, print and passport sizes." />
            </div>
          </div>
        </section>

        <p className="mx-auto max-w-3xl text-center text-xs text-muted">
          Frames: 1440 px desktop grid (12 cols / 24 px gutter), 390 px mobile grid (4 cols / 16 px gutter),
          8 pt vertical rhythm. Tokens resolve from the app&apos;s semantic layer, so these frames and the
          shipped UI cannot drift apart.
        </p>
      </div>
    </div>
  );
}
