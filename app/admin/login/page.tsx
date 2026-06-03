type Props = { searchParams: Promise<{ error?: string }> }

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-ink-muted mb-2">
            applebuttercollege
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">관리자 로그인</h1>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-5 flex items-center gap-2 px-3.5 py-3 bg-coral/10 border border-coral/30 rounded-lg text-sm text-coral">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              비밀번호가 올바르지 않습니다.
            </div>
          )}

          <form action="/api/admin/auth" method="POST" className="flex flex-col gap-4">
            <div>
              <label htmlFor="secret" className="block text-xs font-medium text-ink-muted mb-1.5">
                관리자 비밀번호
              </label>
              <input
                id="secret"
                type="password"
                name="secret"
                placeholder="••••••••"
                autoFocus
                className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-ink text-white rounded-lg text-sm font-medium tracking-wide hover:opacity-80 transition-opacity"
            >
              로그인
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-ink-muted/70 mt-6">
          관리자 전용 페이지입니다.
        </p>
      </div>
    </div>
  )
}
