import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-center py-6 border-b border-border">
        <Link href="/" className="block outline-none hover:opacity-60 transition-opacity">
          <Image src="/logo.png" alt="applebuttercollege" width={240} height={36} className="block h-9 w-auto object-contain" />
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="font-display text-[96px] sm:text-[140px] leading-none font-bold text-border select-none">
          404
        </p>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-ink">페이지를 찾을 수 없어요</p>
          <p className="text-xs text-ink-muted">
            주소가 잘못됐거나 삭제된 페이지예요.
            <br />
            <span className="text-ink-muted/70">ページが見つかりません。</span>
          </p>
        </div>
        <Link
          href="/"
          className="text-xs underline underline-offset-4 text-ink-muted hover:text-ink transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </div>
  )
}
