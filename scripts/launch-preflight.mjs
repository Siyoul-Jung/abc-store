// 런칭 점검 — 운영(Vercel·Shopify·Resend·shop 도메인) 설정을 읽기만 해서 ✅/❌로 보여준다. 아무것도 바꾸지 않음.
// 런칭 당일 대본(docs/launch-verification.md §1) 전후로 실행: 전환 전엔 "남은 것", 전환 후엔 "다 바뀌었나" 확인용.
//
// 실행: node scripts/launch-preflight.mjs
// 필요: .env.local 의 VERCEL_TOKEN, SHOPIFY_ADMIN_API_TOKEN, RESEND_API_KEY
// 한계: Vercel `sensitive` 변수(TOSS_SECRET_KEY, META_CAPI_ACCESS_TOKEN 등)는 값을 읽을 수 없어 "등록 여부"만 본다.

import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SHOP_URL = 'https://shop.applebuttercollege.com'
const VERCEL_PROJECT = 'prj_L0X2vQomrPIzB3xP9wYaDtCV47cj'
const VERCEL_TEAM = 'team_mpoxqShsXNQfEI3qASQVt2KJ'
const RESEND_DOMAIN_ID = '65db62eb-5456-4144-91cc-7ef63287df5f'
const META_PIXEL = '1334497731158875'      // 실제 픽셀(데이터세트 applebuttercollege)
const META_APP_ID = '4366638826942704'     // 앱 ID — 픽셀 자리에 들어가 있으면 오류
const VER = env.SHOPIFY_API_VERSION || env.SHOPIFY_STOREFRONT_API_VERSION || '2026-04'

const results = []
const check = (ok, label, detail = '') => results.push({ ok, label, detail })
const warn = (label, detail = '') => results.push({ ok: null, label, detail })

async function vercel(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${VERCEL_TEAM}`, {
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
  })
  return res.json()
}

async function shopify(query) {
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${VER}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_API_TOKEN },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

// ── 1. Vercel 운영 환경변수 ───────────────────────────────────────────────
async function checkVercel() {
  const { envs = [] } = await vercel(`/v10/projects/${VERCEL_PROJECT}/env`)
  const prod = envs.filter(e => e.target?.includes('production'))
  const byKey = Object.fromEntries(prod.map(e => [e.key, e]))
  const read = async (key) => {
    const e = byKey[key]
    if (!e) return undefined
    if (e.type === 'sensitive') return '(sensitive)'
    const d = await vercel(`/v1/projects/${VERCEL_PROJECT}/env/${e.id}`)
    return d.value
  }

  // SITE_URL·CHECKOUT_PAUSED는 sensitive로 등록돼 값을 못 읽는다 → 실제 사이트 동작으로 판정(checkSite).
  const siteUrl = await read('NEXT_PUBLIC_SITE_URL')
  if (siteUrl !== '(sensitive)') check(siteUrl === SHOP_URL, 'NEXT_PUBLIC_SITE_URL = shop 도메인', `현재: ${siteUrl ?? '미등록'}`)

  const comingSoon = await read('NEXT_PUBLIC_COMING_SOON')
  check(comingSoon !== 'true', 'Coming Soon 모드 꺼짐', `현재: ${comingSoon ?? '미등록(=꺼짐)'}`)

  const tossClient = await read('NEXT_PUBLIC_TOSS_CLIENT_KEY')
  check(!!tossClient?.startsWith('live_'), '토스 클라이언트 키 = live', `현재: ${tossClient ? tossClient.slice(0, 8) + '…' : '미등록'}`)

  const pixel = await read('NEXT_PUBLIC_META_PIXEL_ID')
  check(pixel === META_PIXEL, 'Meta 브라우저 픽셀 ID = 실제 픽셀',
    pixel === META_APP_ID ? '현재: 앱 ID가 들어가 있음(오류)' : `현재: ${pixel ?? '미등록'}`)

  for (const key of ['TOSS_SECRET_KEY', 'META_PIXEL_ID', 'META_CAPI_ACCESS_TOKEN', 'RESEND_API_KEY', 'CRON_SECRET', 'ADMIN_SECRET', 'SHOPIFY_ADMIN_API_TOKEN']) {
    check(!!byKey[key], `${key} 등록됨`, byKey[key] ? `수정일 ${new Date(byKey[key].updatedAt).toISOString().slice(0, 10)}` : '미등록')
  }
  if (byKey.META_CAPI_ACCESS_TOKEN && byKey.META_CAPI_ACCESS_TOKEN.updatedAt < Date.parse('2026-10-01')) {
    warn('META_CAPI_ACCESS_TOKEN 교체 필요', '2026-05 등록분은 2026-07-24 만료 — 시스템유저 토큰으로 교체')
  }
}

// ── 2. Shopify 상품 ───────────────────────────────────────────────────────
async function checkShopify() {
  const d = await shopify(`{ products(first: 100, query: "status:active") { nodes { title tags } } }`)
  const active = d.data?.products?.nodes ?? []
  const untagged = active.filter(p => !p.tags.some(t => ['adult', 'kids'].includes(t.toLowerCase())))
  check(active.length > 0, '판매중(active) 상품 있음', `${active.length}개`)
  check(untagged.length === 0, '모든 판매 상품에 kids/adult 태그', untagged.length ? `태그 없음 ${untagged.length}개 (예: ${untagged[0].title})` : '')
  warn('예시 상품 정리 여부는 직접 확인', '런칭 신상만 active인지 Shopify Admin에서 확인')
}

// ── 3. Resend 메일 도메인 ─────────────────────────────────────────────────
async function checkResend() {
  const res = await fetch(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}`, {
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
  })
  const d = await res.json()
  check(d.status === 'verified', 'Resend 도메인 verified', `현재: ${d.status}`)
}

// ── 4. shop 도메인·SEO ────────────────────────────────────────────────────
async function checkSite() {
  const home = await fetch(`${SHOP_URL}/ko`, { redirect: 'manual' }).catch(() => null)
  check(home?.status === 200, 'shop 도메인 https 접속', `HTTP ${home?.status ?? '연결 실패'}`)

  const robots = await fetch(`${SHOP_URL}/robots.txt`).then(r => r.text()).catch(() => '')
  const sitemapLine = robots.split('\n').find(l => l.toLowerCase().startsWith('sitemap:'))?.trim() ?? ''
  check(sitemapLine.includes(SHOP_URL), 'robots.txt 사이트맵 = shop 도메인', sitemapLine || '사이트맵 줄 없음')

  // 결제 차단: proxy.ts가 /ko/checkout → /ko/cart?notice=checkout_paused 로 보냄
  const co = await fetch(`${SHOP_URL}/ko/checkout`, { redirect: 'manual' }).catch(() => null)
  const loc = co?.headers.get('location') ?? ''
  check(!loc.includes('checkout_paused'), '결제 차단 해제 (CHECKOUT_PAUSED)', loc.includes('checkout_paused') ? '체크아웃이 장바구니로 돌려보내짐 = 차단 중' : `HTTP ${co?.status}`)

  const gsc = await fetch(`${SHOP_URL}/googlee7eb4da97bd7f90f.html`).then(r => r.text()).catch(() => '')
  check(gsc.includes('google-site-verification'), 'Search Console 인증 파일 유지')
}

await Promise.all([checkVercel(), checkShopify(), checkResend(), checkSite()].map(p =>
  p.catch(e => check(false, '점검 실패', e.message))))

for (const r of results) {
  const mark = r.ok === null ? '⚠️ ' : r.ok ? '✅' : '❌'
  console.log(`${mark} ${r.label}${r.detail ? `  — ${r.detail}` : ''}`)
}
const fails = results.filter(r => r.ok === false).length
console.log(`\n${fails ? `❌ ${fails}개 남음` : '✅ 전부 통과'}`)
