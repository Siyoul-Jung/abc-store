import crypto from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID!
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN!

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  // 한국 번호: 앞에 82 붙이고 숫자만 (010-1234-5678 → 821012345678)
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '82' + digits.slice(1)
  return digits
}

export type CAPIEventPayload = {
  eventName: 'Purchase' | 'AddToCart' | 'ViewContent' | 'InitiateCheckout'
  eventSourceUrl: string
  value: number
  currency: string
  orderId?: string
  eventId?: string // 브라우저 픽셀과 dedup 키. 같은 (event_name, event_id)면 Meta가 하나로 합침.
  contents: { id: string; quantity: number; item_price: number }[]
  userData: {
    email?: string
    phone?: string
    firstName?: string
    zipcode?: string
    clientIp?: string
    clientUserAgent?: string
    fbp?: string
    fbc?: string
  }
}

export async function sendCAPIEvent(payload: CAPIEventPayload): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return

  const { eventName, eventSourceUrl, value, currency, orderId, eventId, contents, userData } = payload

  const user_data: Record<string, string> = {
    country: sha256('kr'),
  }
  if (userData.email)     user_data.em  = sha256(userData.email)
  if (userData.phone)     user_data.ph  = sha256(normalizePhone(userData.phone))
  if (userData.firstName) user_data.fn  = sha256(userData.firstName.trim().toLowerCase())
  if (userData.zipcode)   user_data.zp  = sha256(userData.zipcode.trim())
  if (userData.clientIp)        user_data.client_ip_address  = userData.clientIp
  if (userData.clientUserAgent) user_data.client_user_agent  = userData.clientUserAgent
  if (userData.fbp)       user_data.fbp = userData.fbp
  if (userData.fbc)       user_data.fbc = userData.fbc

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: eventSourceUrl,
    action_source: 'website',
    ...(eventId ? { event_id: eventId } : {}),
    user_data,
    custom_data: {
      value,
      currency,
      contents,
      content_type: 'product',
      ...(orderId ? { order_id: orderId } : {}),
    },
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      console.error('[meta-capi] failed:', await res.text())
    }
  } catch (e) {
    console.error('[meta-capi] error:', e)
  }
}
