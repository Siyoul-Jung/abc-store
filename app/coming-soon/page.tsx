export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 text-center">

        <span className="text-2xl font-semibold tracking-widest uppercase text-ink">
          applebuttercollege
        </span>

        <div className="flex flex-col gap-2">
          <p className="text-sm tracking-widest uppercase text-ink-muted">Coming Soon</p>
          <p className="text-xs text-ink-muted">
            새로운 모습으로 곧 찾아옵니다.
          </p>
        </div>

        <a
          href="https://www.instagram.com/applebuttercollege"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-ink-muted hover:text-ink transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
          </svg>
        </a>

      </div>
    </main>
  )
}
