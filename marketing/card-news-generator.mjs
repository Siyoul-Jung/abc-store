// 카드뉴스 생성기 — 콘텐츠 엔진
// decks/ 폴더의 소재 파일을 전부 읽어 브랜드 카드뉴스 HTML을 자동 생성.
// 엔진(렌더러·CSS·색)과 소재(deck 데이터)를 분리 → 새 콘텐츠는 decks/에 파일만 추가.
// 실행: node marketing/card-news-generator.mjs
// 출력: marketing/output/<slug>-<fmt>.html (미리보기) · output/cards/ (PNG용) · output/<slug>-captions.md

import { writeFileSync, mkdirSync, readdirSync } from 'node:fs'
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
  accent: '#F5562E',    // eyebrow·랭크번호·CTA링크 포인트 컬러. 텍스트 레드(차분한 코랄). 로고도 브랜드 레드.
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
// 2) 소재(deck) 로드 — decks/ 폴더의 *.mjs를 전부 읽어온다.
//    새 콘텐츠는 decks/에 파일만 추가하면 자동 포함됨 (엔진 수정 불필요).
// ─────────────────────────────────────────────
async function loadDecks() {
  const decksDir = join(__dirname, 'decks')
  const files = readdirSync(decksDir).filter((f) => f.endsWith('.mjs')).sort()
  const decks = []
  for (const f of files) {
    const mod = await import(pathToFileURL(join(decksDir, f)).href)
    if (mod.default) decks.push(mod.default)
  }
  return decks
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
  // 단독 핀 완결성: rank 번호(랭킹 맥락) + 카테고리 tag + 사이즈를 메타 줄에 함께 노출.
  // searchTag(예: "공룡 아동복")가 있으면 eyebrow 대신 검색 키워드 라벨을 우선 노출 → 핀 검색 친화.
  const label = c.searchTag ?? c.eyebrow
  return `
  <div class="card rank">
    ${photo}
    <div class="caption">
      ${label ? `<div class="eyebrow">${label}</div>` : ''}
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

// 단일 상품핀 — 상품 1개 = 핀 1장. 검색 커버리지·클릭 직행용.
// 단독 핀 완결성: 검색 키워드 라벨(eyebrow/searchTag) + 상품명 + 카테고리·사이즈 메타 + 브랜드 로고가
// 한 장에 모두 노출 → 핀만 봐도 "무슨 브랜드의 어떤 옷, 사이즈 범위"가 전달됨. 가격은 정책상 미표기.
function renderProduct(c) {
  const photo = c.image
    ? `<div class="prod-card"><img src="${c.image}" alt="${c.name}"/></div>`
    : `<div class="prod-card"><span>상품 이미지</span></div>`
  const label = c.searchTag ?? c.eyebrow
  const meta = (c.tag || c.size)
    ? `<div class="meta">${c.tag ? `<span class="tag">${c.tag}</span>` : ''}${c.size ? `<span class="tag">${c.size}</span>` : ''}</div>`
    : ''
  return `
  <div class="card product">
    <div class="head">
      ${label ? `<div class="eyebrow">${label}</div>` : ''}
      <h2 class="name">${c.name}</h2>
      ${meta}
      ${c.price ? `<div class="price">${c.price}</div>` : ''}
    </div>
    ${photo}
    ${logoTag}
  </div>`
}

// 정보형 — 표 기반(사이즈 가이드, 소재·세탁 가이드 등). 저장률 높은 콘텐츠.
function renderInfo(c) {
  const thead = `<tr>${c.columns.map((h) => `<th>${h}</th>`).join('')}</tr>`
  const tbody = c.rows
    .map((r) => `<tr>${r.map((cell, ci) => `<td class="${ci === 0 ? 'c-key' : ''}">${cell}</td>`).join('')}</tr>`)
    .join('')
  return `
  <div class="card info">
    <div class="head">
      ${c.eyebrow ? `<div class="eyebrow">${c.eyebrow}</div>` : ''}
      <h1 class="title">${nl(c.title)}</h1>
      ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
    </div>
    <div class="table-card"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>
    ${c.tip ? `<div class="tip">${c.tip}</div>` : ''}
    ${logoTag}
  </div>`
}

// 스타일링 모음(콜라주) — 상품 누끼 여러 개를 흰 카드 격자로 묶어 한 핀에. "세트/컬러 모음" 검색용.
// ※ 사진 플랫레이 아님(촬영 필요) — 보유한 누끼컷으로 만드는 그래픽 구성.
function renderCollage(c) {
  const cells = c.items
    .map((it) => `
      <div class="cell">
        <div class="prod-card"><img src="${it.image}" alt="${it.label ?? ''}"/></div>
        ${it.label ? `<div class="cell-label">${it.label}</div>` : ''}
      </div>`)
    .join('')
  return `
  <div class="card collage">
    <div class="head">
      ${c.eyebrow ? `<div class="eyebrow">${c.eyebrow}</div>` : ''}
      <h1 class="title">${nl(c.title)}</h1>
      ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
    </div>
    <div class="grid">${cells}</div>
    ${logoTag}
  </div>`
}

function renderCard(c) {
  if (c.type === 'cover') return renderCover(c)
  if (c.type === 'rank') return renderRank(c)
  if (c.type === 'cta') return renderCta(c)
  if (c.type === 'product') return renderProduct(c)
  if (c.type === 'info') return renderInfo(c)
  if (c.type === 'collage') return renderCollage(c)
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
  // 사진 박스 비중을 줄여(빈 여백 축소) 캡션·로고 공간을 확보. 전체는 세로 중앙 정렬.
  const rankPhotoH = Math.round(fmt.h * 0.46)
  return `
  :root{
    --ink:${THEME.ink}; --muted:${THEME.inkMuted}; --pink:${THEME.pink};
    --red:${THEME.red}; --border:${THEME.border}; --accent:${THEME.accent};
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  .card{
    width:${fmt.w}px;height:${fmt.h}px;
    background:var(--pink);position:relative;display:flex;flex-direction:column;
    color:var(--ink);overflow:hidden;padding-bottom:58px;
  }
  .eyebrow{font-family:'Poppins',sans-serif;font-weight:700;letter-spacing:.24em;
    font-size:27px;color:var(--accent);text-transform:uppercase;}
  .prod-card{background:#fff;border-radius:30px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .prod-card img{width:100%;height:100%;object-fit:contain;}
  .prod-card span{color:#C9B8B2;font-size:34px;}
  .logo{display:block;height:64px;object-fit:contain;margin:0 auto;}
  .cover{justify-content:flex-start;}
  .cv-head{padding:96px 90px 0;}
  .cv-title{font-weight:900;font-size:80px;line-height:1.2;letter-spacing:-.02em;margin-top:22px;}
  .cv-sub{margin-top:24px;font-size:34px;color:var(--muted);}
  .cover .prod-card{flex:1;margin:46px 90px 40px;padding:40px;}
  .rank{justify-content:center;padding-bottom:150px;}
  .rank .prod-card{margin:0 60px;height:${rankPhotoH}px;padding:18px 36px;}
  .caption{padding:0 90px;margin-top:44px;}
  .rank .logo{position:absolute;bottom:54px;left:0;right:0;}
  .rank .caption .eyebrow{margin-bottom:20px;}
  .meta{display:flex;align-items:center;gap:20px;}
  .meta .no{font-family:'Poppins',sans-serif;font-weight:800;font-size:42px;color:var(--accent);letter-spacing:.02em;}
  .meta .tag{font-size:25px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;
    padding-left:20px;border-left:1px solid var(--border);}
  .name{font-weight:800;font-size:62px;letter-spacing:-.02em;margin-top:22px;}
  .desc{margin-top:16px;font-size:35px;line-height:1.45;color:var(--muted);font-weight:500;}
  .cta{justify-content:center;align-items:center;text-align:center;padding:90px;}
  .cta-title{font-weight:900;font-size:86px;line-height:1.22;letter-spacing:-.02em;}
  .cta-link{margin-top:46px;color:var(--accent);font-weight:700;font-size:46px;letter-spacing:.01em;}
  .cta .logo{margin-top:70px;height:62px;}
  .cta-url{margin-top:24px;color:var(--muted);font-family:'Poppins',sans-serif;font-size:33px;letter-spacing:.06em;}
  .product{justify-content:flex-start;padding-bottom:150px;}
  .product .head{padding:0 90px;}
  .product .prod-card{flex:1;margin:40px 70px 30px;padding:30px;}
  .product .name{font-weight:800;font-size:60px;letter-spacing:-.02em;margin-top:18px;}
  .product .meta{margin-top:20px;}
  .product .meta .tag{font-size:25px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;
    padding-right:20px;}
  .product .meta .tag + .tag{padding-left:20px;border-left:1px solid var(--border);}
  .product .price{margin-top:14px;font-family:'Poppins',sans-serif;font-weight:700;font-size:40px;color:var(--ink);}
  .info{justify-content:flex-start;padding:96px 90px 150px;}
  .info .title{font-weight:900;font-size:72px;line-height:1.18;letter-spacing:-.02em;margin-top:22px;}
  .info .sub{margin-top:24px;font-size:34px;color:var(--muted);}
  .info .table-card{background:#fff;border-radius:30px;margin-top:56px;padding:24px 40px;}
  .info table{width:100%;border-collapse:collapse;}
  .info th{font-family:'Poppins',sans-serif;font-weight:700;font-size:30px;color:var(--muted);
    letter-spacing:.04em;padding:24px 0;border-bottom:2px solid var(--border);text-align:center;}
  .info td{font-size:36px;font-weight:500;color:var(--ink);padding:24px 0;text-align:center;
    border-bottom:1px solid var(--border);}
  .info tbody tr:last-child td{border-bottom:none;}
  .info .c-key{font-family:'Poppins',sans-serif;font-weight:800;color:var(--accent);font-size:38px;}
  .info .tip{margin-top:44px;font-size:32px;color:var(--muted);text-align:center;line-height:1.4;}
  .info .logo{position:absolute;bottom:54px;left:0;right:0;}
  .collage{justify-content:flex-start;padding:88px 70px 150px;}
  .collage .head{padding:0 20px;}
  .collage .title{font-weight:900;font-size:66px;line-height:1.18;letter-spacing:-.02em;margin-top:18px;}
  .collage .sub{margin-top:18px;font-size:32px;color:var(--muted);}
  .collage .grid{display:flex;flex-wrap:wrap;gap:28px;margin-top:46px;}
  .collage .cell{flex:1 1 calc(50% - 14px);display:flex;flex-direction:column;}
  .collage .cell .prod-card{height:430px;padding:22px;}
  .collage .cell-label{margin-top:14px;text-align:center;font-size:27px;font-weight:600;color:var(--ink);}
  .collage .logo{position:absolute;bottom:54px;left:0;right:0;}`
}

const SCALE = 0.38

// 미리보기 — 전 카드를 축소해 그리드로
function renderDeck(deck, fmt) {
  const total = deck.cards.length
  const sw = Math.round(fmt.w * SCALE), sh = Math.round(fmt.h * SCALE)
  // watch 모드(WATCH=1)에선 1초마다 자동 새로고침 → 저장 즉시 브라우저에 반영
  const autoReload = process.env.WATCH ? '<meta http-equiv="refresh" content="1">' : ''
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"/>${autoReload}<title>카드뉴스 — ${deck.slug} (${fmt.name})</title>${FONTS}
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

  // {names}·{keywords} 치환 — deck.caption.pinDesc가 있으면 사용, 없으면 generic.
  const fill = (s) => s.replace(/\{names\}/g, names.join(' · ')).replace(/\{keywords\}/g, cap.keywords ?? '')
  const pinDesc = cap.pinDesc
    ? fill(cap.pinDesc)
    : `${title}. ${names.length ? names.join(' · ') + '. ' : ''}${cap.keywords ? cap.keywords + '. ' : ''}`

  // 단일 상품핀 = 한 상품 = 한 검색결과. rank·product 카드 각각을 완결된 단독 핀 캡션으로.
  // 우선순위: 카드별 link(상품 페이지 핸들) > 덱 공통 link / 카드별 searchTag·size로 검색 키워드 보강.
  const productPinBlocks = deck.cards
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.type === 'rank' || c.type === 'product')
    .map(({ c, i }) => {
      const png = `${deck.slug}-2x3-${String(i + 1).padStart(2, '0')}.png`
      // 카드에 link(상품 핸들)가 있으면 그 상품 페이지로 직행 UTM, 없으면 덱 공통 링크.
      const dest = c.link
        ? utmLink(c.link, 'pinterest', deck.slug)
        : pinLink
      // 제목: 검색 친화 — 상품명 + 검색 키워드 라벨(있으면).
      const pinTitle = c.searchTag ? `${c.name} | ${c.searchTag}` : c.name
      // 설명: 상품명 + 카드 desc(있으면) + searchTag/keywords + 사이즈 안내.
      const descBits = [
        c.name + (c.tag ? ` ${c.tag}` : ''),
        c.desc ? c.desc.replace(/\n/g, ' ') : '',
        c.searchTag ?? '',
        cap.keywords ?? '',
        c.size ? `사이즈 ${c.size}.` : '',
      ].filter(Boolean)
      return `**${c.name}** — \`pinterest/.../${png}\`\n- 제목: ${pinTitle}\n- 설명: ${descBits.join('. ').replace(/\.\./g, '.')}\n- 링크: ${dest}\n- 해시태그: ${(c.hashtags ? c.hashtags.map((h) => `#${h}`).join(' ') : tags)}`
    })
    .join('\n\n')

  const rankList = ranks.length ? ranks.map((c) => `${c.rank}. ${c.name}`).join('\n') + '\n\n' : ''
  const igCaption =
    `🍎 ${title}\n\n` +
    (cap.igLead ? cap.igLead + '\n' : '') +
    rankList +
    (cap.igFoot ?? '프로필 링크에서 만나보세요 →')

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
${productPinBlocks ? `
---

## 📌 개별 상품핀 (상품 카드별 — 각각 단독 핀으로) ★주력
> 커버 1장만 올리지 말 것. 아래 카드를 각각 단일 핀으로 발행 = 상품마다 검색결과 1개.
> 각 핀의 링크는 해당 상품 페이지로 직행(상품 핸들 기반 UTM).

${productPinBlocks}
` : ''}
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

const decks = await loadDecks()
if (!decks.length) {
  console.error('decks/ 폴더에 소재 파일(*.mjs)이 없습니다.')
  process.exit(1)
}

// 랭크 카드를 단독 핀으로 써도 맥락이 완결되도록, 커버의 eyebrow를 각 랭크 카드에 전파한다.
// (덱 파일을 일일이 고치지 않아도 "SUMMER BEST" 같은 키워드 라벨이 모든 상품 카드에 붙음)
for (const deck of decks) {
  const coverEyebrow = deck.cards.find((c) => c.type === 'cover')?.eyebrow
  if (coverEyebrow) {
    for (const c of deck.cards) {
      if (c.type === 'rank' && !c.eyebrow) c.eyebrow = coverEyebrow
    }
  }
}

const manifest = {}   // slug → "type" 또는 "type/subtype". export-png가 읽어 폴더로 분류.
for (const deck of decks) {
  // subtype이 있으면 한 단계 더 세분화 (예: curation/ranking, curation/seasonal)
  manifest[deck.slug] = deck.subtype ? `${deck.type}/${deck.subtype}` : (deck.type ?? 'etc')
  for (const fmt of FORMATS) {
    const base = `${deck.slug}-${fmt.name}`
    writeFileSync(join(outDir, `${base}.html`), renderDeck(deck, fmt), 'utf-8')
    deck.cards.forEach((c, i) => {
      const name = `${base}-${String(i + 1).padStart(2, '0')}.html`
      writeFileSync(join(cardsDir, name), renderCardPage(c, fmt), 'utf-8')
    })
  }
  // 캡션 파일 (포맷 무관 — deck당 1회)
  writeFileSync(join(outDir, `${deck.slug}-captions.md`), buildCaptions(deck), 'utf-8')
  console.log(`✓ ${deck.slug} [${manifest[deck.slug]}] — 카드 ${deck.cards.length}장 × ${FORMATS.length}포맷 + 캡션`)
}
// slug→type 매핑 — export-png가 PNG를 유형별 폴더로 분류하는 데 사용
writeFileSync(join(cardsDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')

console.log(`\n총 ${decks.length}개 소재 생성 완료 → output/`)
console.log(`PNG 추출: node marketing/export-png.mjs <slug>  (예: ${decks[0].slug})`)
