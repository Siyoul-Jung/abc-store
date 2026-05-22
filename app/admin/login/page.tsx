export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-center mb-8">어드민</h1>
        <form action="/api/admin/auth" method="POST" className="flex flex-col gap-4">
          <input
            type="password"
            name="secret"
            placeholder="관리자 비밀번호"
            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink"
            required
          />
          <button type="submit"
            className="w-full py-3 bg-ink text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity">
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
