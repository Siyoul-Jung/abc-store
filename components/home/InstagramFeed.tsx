import Image from 'next/image'
import Link from 'next/link'
import { getInstagramPosts } from '@/lib/instagram'

export default async function InstagramFeed() {
  const posts = await getInstagramPosts(6)
  if (posts.length === 0) return null

  return (
    <section className="py-10 mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-5 px-4 sm:px-6">
          <h2 className="text-sm font-bold tracking-widest uppercase">Instagram</h2>
          <a
            href="https://www.instagram.com/applebuttercollege"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            @applebuttercollege →
          </a>
        </div>

        <div
          className="flex gap-1 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-1 sm:overflow-visible px-4 sm:px-6"
          style={{ scrollbarWidth: 'none' }}
        >
          {posts.map((post) => {
            const src = post.media_type === 'VIDEO' ? post.thumbnail_url ?? post.media_url : post.media_url
            return (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group snap-start shrink-0 w-[38vw] sm:w-auto aspect-square overflow-hidden bg-surface block rounded-xl"
              >
                <Image
                  src={src}
                  alt={post.caption ? Array.from(post.caption).slice(0, 80).join('') : 'Instagram post'}
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 38vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
