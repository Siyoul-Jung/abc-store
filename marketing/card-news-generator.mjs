// 카드뉴스 생성기 (프로토타입)
// 데이터(deck) → 브랜드 카드뉴스 HTML 자동 생성.
// 소재(deck)만 갈아끼우면 재생성되는 "콘텐츠 엔진" 골격.
// 실행: node marketing/card-news-generator.mjs
// 출력: marketing/output/<slug>.html  → 브라우저에서 열어 확인 (각 카드 1080×1080)

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 로고 절대 file URL — 미리보기/카드페이지 위치가 달라도 깨지지 않도록
const LOGO_URL = pathToFileURL(join(__dirname, '..', 'public', 'logo.png')).href

// ─────────────────────────────────────────────
// 1) 브랜드 테마 (globals.css 토큰과 동일)
// ─────────────────────────────────────────────
const THEME = {
  ink: '#1C1C1C',
  inkMuted: '#A8968F',
  pink: '#FFEDE9',      // 브랜드 블러시 핑크 (인스타 피드에서 추출)
  red: '#CF181C',       // 브랜드 레드 (로고 색)
  border: '#F3DAD4',
  logo: LOGO_URL,   // 레드 스크립트 로고 (워터마크)
  brand: 'applebuttercollege',
  url: 'applebuttercollege.com',
}

// 발행용 목적지 — 핀/캡션 링크의 베이스. 채널별 UTM을 자동으로 붙인다.
// 런칭 전: 메이크샵 자사몰(라이브). Shopify 런칭 시 도메인만 교체.
const SITE = 'https://www.applebuttercollege.com'
function utmLink(path, source, campaign) {
  const sep = path.includes('?') ? '&' : '?'   // 경로에 쿼리(xcode 등) 있으면 &로 이어붙임
  return `${SITE}${path}${sep}utm_source=${source}&utm_medium=organic&utm_campaign=${campaign}`
}

// ─────────────────────────────────────────────
// 2) 소재(deck) — 실제 판매 1위 데이터 기반
//    (여기만 바꾸면 다른 카드뉴스 생성됨)
// ─────────────────────────────────────────────
const IMG = {
  babypink: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000557.png?v=1778568130',
  skyblue:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000556.png?v=1778568124',
  nine:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000562.png?v=1778568163',
  dino:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000558.png?v=1778568137',
  honey:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000560.png?v=1778568150',
}

const deck = {
  slug: 'summer-bestsellers',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',   // 핀/캡션 목적지 — 메이크샵 KIDS (UTM 자동 부착)
  // 캡션 자동 생성용 — 채널별 복붙 텍스트(output/<slug>-captions.md)로 출력됨
  caption: {
    title: '올여름 엄마들이 가장 많이 고른 아기 세트 TOP 5',
    keywords: '아기 여름 세트, 베이비 반팔 반바지, 신생아 돌아기 코디',
    hashtags: ['아동복', '아기옷', '아기여름옷', '베이비룩', '아기코디', '돌아기', '신생아옷', '키즈패션', '남아옷', '여아옷', '세트룩', 'applebuttercollege', '애플버터칼리지'],
  },
  cards: [
    {
      type: 'cover',
      eyebrow: 'SUMMER BEST',
      title: '올여름, 엄마들이\n가장 많이 고른\n아기 세트 TOP 5',
      sub: '올여름 다들 입힌 그 세트',
      image: IMG.babypink,
    },
    {
      type: 'rank', rank: 1,
      name: '피그 베이비핑크 세트',
      desc: '전 사이즈 고르게 사랑받은\n올여름 부동의 1위',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.babypink,
    },
    {
      type: 'rank', rank: 2,
      name: '피그 스카이블루 세트',
      desc: '시원한 컬러감으로\n남아맘들이 가장 많이 픽',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.skyblue,
    },
    {
      type: 'rank', rank: 3,
      name: '나인원원 세트',
      desc: '매일 입히기 좋은\n데일리 스테디셀러',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.nine,
    },
    {
      type: 'rank', rank: 4,
      name: '핑크 공룡 세트',
      desc: '공룡 좋아하는 우리 아이라면\n무조건 픽',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.dino,
    },
    {
      type: 'rank', rank: 5,
      name: '허니베어 세트',
      desc: '포근한 곰돌이 프린트로\n남녀아 모두 인기',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.honey,
    },
    {
      type: 'cta',
      title: '우리 아이\n여름 세트 찾기',
      sub: '지금 만나보기',
    },
  ],
}

// ─────────────────────────────────────────────
// 3) 카드 렌더러 (타입별)
// ─────────────────────────────────────────────
const logoTag = `<img class="logo" src="${THEME.logo}" alt="${THEME.brand}"/>`

function renderCover(c) {
  const img = c.image
    ? `<div class="prod-card"><img src="${c.image}" alt=""/></div>`
    : ''
  return `
  <div class="card cover">
    <div class="cv-head">
      <div class="eyebrow">${c.eyebrow}</div>
      <h1 class="cv-title">${nl(c.title)}</h1>
      <div class="cv-sub">${c.sub}</div>
    </div>
    ${img}
    ${logoTag}
  </div>`
}

function renderRank(c) {
  const photo = c.image
    ? `<div class="prod-card"><img src="${c.image}" alt="${c.name}"/></div>`
    : `<div class="prod-card"><span>상품 이미지</span></div>`
  return `
  <div class="card rank">
    ${photo}
    <div class="caption">
      <div class="meta"><span class="no">${String(c.rank).padStart(2, '0')}</span><span class="tag">${c.tag}</span>${c.size ? `<span class="tag">${c.size}</span>` : ''}</div>
      <h2 class="name">${c.name}</h2>
      <p class="desc">${nl(c.desc)}</p>
    </div>
    ${logoTag}
  </div>`
}

function renderCta(c) {
  return `
  <div class="card cta">
    <h1 class="cta-title">${nl(c.title)}</h1>
    <div class="cta-link">${c.sub} →</div>
    ${logoTag}
    <div class="cta-url">${THEME.url}</div>
  </div>`
}

function renderCard(c) {
  if (c.type === 'cover') return renderCover(c)
  if (c.type === 'rank') return renderRank(c)
  if (c.type === 'cta') return renderCta(c)
  return ''
}

const nl = (s) => s.replace(/\n/g, '<br/>')

// ─────────────────────────────────────────────
// 4) 공유 스타일 + HTML 렌더 (미리보기 / 카드별 풀사이즈)
// ─────────────────────────────────────────────
const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">`

// 카드 스타일 (포맷별 치수 주입). scale 축소는 미리보기에서만 .scaler로 적용.
function cardCss(fmt) {
  const rankPhotoH = fmt.h - 528   // 캡션+로고 영역 확보 후 나머지를 상품 사진에
  return `
  :root{
    --ink:${THEME.ink}; --muted:${THEME.inkMuted}; --pink:${THEME.pink};
    --red:${THEME.red}; --border:${THEME.border};
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  .card{
    width:${fmt.w}px;height:${fmt.h}px;
    background:var(--pink);position:relative;display:flex;flex-direction:column;
    color:var(--ink);overflow:hidden;padding-bottom:58px;
  }
  .eyebrow{font-family:'Poppins',sans-serif;font-weight:700;letter-spacing:.24em;
    font-size:27px;color:var(--red);text-transform:uppercase;}
  .prod-card{background:#fff;border-radius:30px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .prod-card img{width:100%;height:100%;object-fit:contain;}
  .prod-card span{color:#C9B8B2;font-size:34px;}
  .logo{display:block;height:64px;object-fit:contain;margin:0 auto;}
  .cover{justify-content:flex-start;}
  .cv-head{padding:96px 90px 0;}
  .cv-title{font-weight:900;font-size:80px;line-height:1.2;letter-spacing:-.02em;margin-top:22px;}
  .cv-sub{margin-top:24px;font-size:34px;color:var(--muted);}
  .cover .prod-card{flex:1;margin:46px 90px 40px;padding:40px;}
  .rank .prod-card{margin:70px 60px 0;height:${rankPhotoH}px;padding:48px 80px;}
  .caption{padding:46px 90px 0;}
  .rank .logo{margin-top:auto;}
  .meta{display:flex;align-items:center;gap:20px;}
  .meta .no{font-family:'Poppins',sans-serif;font-weight:800;font-size:42px;color:var(--red);letter-spacing:.02em;}
  .meta .tag{font-size:25px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;
    padding-left:20px;border-left:1px solid var(--border);}
  .name{font-weight:800;font-size:62px;letter-spacing:-.02em;margin-top:22px;}
  .desc{margin-top:16px;font-size:35px;line-height:1.45;color:var(--muted);font-weight:500;}
  .cta{justify-content:center;align-items:center;text-align:center;padding:90px;}
  .cta-title{font-weight:900;font-size:86px;line-height:1.22;letter-spacing:-.02em;}
  .cta-link{margin-top:46px;color:var(--red);font-weight:700;font-size:46px;letter-spacing:.01em;}
  .cta .logo{margin-top:70px;height:62px;}
  .cta-url{margin-top:24px;color:var(--muted);font-family:'Poppins',sans-serif;font-size:33px;letter-spacing:.06em;}`
}

const SCALE = 0.38

// 미리보기 — 전 카드를 축소해 그리드로
function renderDeck(deck, fmt) {
  const total = deck.cards.length
  const sw = Math.round(fmt.w * SCALE), sh = Math.round(fmt.h * SCALE)
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"/><title>카드뉴스 — ${deck.slug} (${fmt.name})</title>${FONTS}
<style>
${cardCss(fmt)}
  body{background:#EFE7E3;font-family:'Noto Sans KR',sans-serif;padding:40px 0;}
  .page-head{text-align:center;color:#7c736b;margin-bottom:32px;font-size:14px;letter-spacing:.1em;}
  .deck{display:flex;flex-wrap:wrap;gap:28px;justify-content:center;align-items:flex-start;}
  .card-wrap{width:${sw}px;}
  .card-wrap .label{font-size:12px;color:#8b827a;margin:0 0 8px 4px;letter-spacing:.08em;}
  .scaler{width:${sw}px;height:${sh}px;overflow:hidden;border-radius:18px;box-shadow:0 8px 28px rgba(0,0,0,.10);}
  .scaler .card{transform:scale(${SCALE});transform-origin:top left;}
</style></head>
<body>
  <div class="page-head">카드뉴스 미리보기 · ${deck.slug} · ${fmt.name} (${fmt.w}×${fmt.h}) · 총 ${total}장</div>
  <div class="deck">
    ${deck.cards.map((c, i) => `
    <div class="card-wrap">
      <div class="label">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
      <div class="scaler">${renderCard(c)}</div>
    </div>`).join('')}
  </div>
</body></html>`
}

// 카드 1장짜리 풀사이즈 페이지 (PNG 추출용 — Chrome 스크린샷 대상)
function renderCardPage(card, fmt) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"/>${FONTS}
<style>
${cardCss(fmt)}
  html,body{margin:0;background:var(--pink);}
</style></head>
<body>${renderCard(card)}</body></html>`
}

// ─────────────────────────────────────────────
// 4.5) 캡션 생성 — 채널별 복붙용 텍스트 (제목·설명·해시태그·UTM 링크)
//      핀터레스트/인스타 수동 발행을 승인·비용 없이 즉시 가능하게.
// ─────────────────────────────────────────────
function buildCaptions(deck) {
  const cap = deck.caption ?? {}
  const ranks = deck.cards.filter((c) => c.type === 'rank')
  const names = ranks.map((c) => c.name)
  const title = cap.title ?? deck.slug
  const tags = (cap.hashtags ?? []).map((h) => `#${h}`).join(' ')
  const pinLink = utmLink(deck.link, 'pinterest', deck.slug)
  const igLink = utmLink(deck.link, 'instagram', deck.slug)

  const pinDesc =
    `올여름 엄마들이 가장 많이 담은 아기 세트를 모았어요. ${names.join(' · ')} 등 매일 입히기 좋은 반팔+반바지 세트. ` +
    `사이즈 XS–XL. ${cap.keywords ? cap.keywords + '. ' : ''}뭐 입힐지 고민된다면 여기서부터.`

  const igCaption =
    `🍎 ${title}\n\n` +
    `뭐 입힐지 고민될 땐, 요즘 엄마들이 제일 많이 담은 세트부터요.\n` +
    ranks.map((c) => `${c.rank}. ${c.name}`).join('\n') +
    `\n\n반팔+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 만나보세요 →`

  return `# 카드뉴스 캡션 — ${deck.slug}

> 복붙용. 핀터레스트는 핀 설명에 링크 직접 입력(클릭 트래픽), 인스타 피드는 링크 불가 → 프로필 링크 안내.

## 📌 핀터레스트 (핀)
**제목**
${title}

**설명**
${pinDesc}

**목적지 링크 (핀에 입력)**
${pinLink}

**해시태그**
${tags}

---

## 📷 인스타그램 (캐러셀 1장 = 카드 전체)
**캡션**
${igCaption}

**해시태그**
${tags}

**링크 안내**
- 피드: 링크 불가 → "프로필 링크" 문구로 유도
- 스토리/하이라이트: ${igLink}
`
}

// ─────────────────────────────────────────────
// 5) 출력 (포맷별 — 세로형)
// ─────────────────────────────────────────────
const FORMATS = [
  { name: '4x5', w: 1080, h: 1350 },   // 인스타 피드 (세로)
  { name: '2x3', w: 1080, h: 1620 },   // 핀터레스트 (더 길쭉)
]

const outDir = join(__dirname, 'output')
const cardsDir = join(outDir, 'cards')
mkdirSync(cardsDir, { recursive: true })

for (const fmt of FORMATS) {
  const base = `${deck.slug}-${fmt.name}`
  writeFileSync(join(outDir, `${base}.html`), renderDeck(deck, fmt), 'utf-8')
  deck.cards.forEach((c, i) => {
    const name = `${base}-${String(i + 1).padStart(2, '0')}.html`
    writeFileSync(join(cardsDir, name), renderCardPage(c, fmt), 'utf-8')
  })
  console.log(`생성: output/${base}.html  (미리보기, ${fmt.w}×${fmt.h})`)
}

// 캡션 파일 (포맷 무관 — 1회)
writeFileSync(join(outDir, `${deck.slug}-captions.md`), buildCaptions(deck), 'utf-8')
console.log(`생성: output/${deck.slug}-captions.md  (핀터레스트·인스타 복붙 캡션 + UTM 링크)`)

console.log(`카드 ${deck.cards.length}장 × ${FORMATS.length}포맷`)
console.log(`→ PNG 추출: node marketing/export-png.mjs ${deck.slug}`)
