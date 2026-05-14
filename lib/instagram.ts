export type InstagramPost = {
  id: string
  media_url: string
  thumbnail_url?: string
  permalink: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  caption?: string
}

export async function getInstagramPosts(limit = 9): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID
  if (!token || !userId) return []

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${userId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=${limit}&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}
