import Image from 'next/image'
import Link from 'next/link'
import { getInstagramPosts } from '@/lib/instagram'

export default async function InstagramFeed() {
  const posts = await getInstagramPosts(9)
  if (posts.length === 0) return null

  return (
    <section className="py-10 mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-baseline justify-between mb-6">
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

        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => {
            const src = post.media_type === 'VIDEO' ? post.thumbnail_url ?? post.media_url : post.media_url
            return (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl bg-surface"
              >
                <Image
                  src={src}
                  alt={post.caption?.slice(0, 80) ?? 'Instagram post'}
                  width={0}
                  height={0}
                  sizes="33vw"
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
