import { EngineBadge } from "@/components/engine-badge";
import { SiteNav, Wordmark } from "@/components/site-nav";
import { ResetRunButton } from "@/components/reset-run-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      {/*
        Decorative background wash. Fixed and behind everything so it costs no
        layout, and `pointer-events-none` so it can never swallow a tap — a
        full-viewport layer without this property is a classic way to make every
        control on a page silently unclickable.
      */}
      <div className="bg-aurora" aria-hidden="true" />

      {/*
        The header wraps rather than overflows: on narrow screens the status
        cluster drops to a second line instead of pushing the page sideways.
      */}
      <header className="sticky top-0 z-30 border-b border-white/60 glass">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <Wordmark />
            <SiteNav />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <EngineBadge />
            <ResetRunButton />
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-white/50">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-subtle-foreground">
          <p>
            SkillBridge · <span className="text-muted-foreground">From knowing to applying.</span>
          </p>
          <p>Built for VentureHack 2026 · EduTech track</p>
        </div>
      </footer>
    </div>
  );
}
