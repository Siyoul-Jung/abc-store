// 콘텐츠 로드맵 포스터 — 디자이너·마케터 공유용 한 장 인포그래픽.
// 3유형 × 세부유형을 브랜드 톤으로 시각화. 카드 엔진과 동일하게 HTML → Chrome PNG.
// 실행: node marketing/roadmap-poster.mjs   (HTML 생성 + PNG 추출까지)

import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOGO_URL = pathToFileURL(join(__dirname, '..', 'public', 'logo.png')).href

const T = {
  ink: '#1C1C1C', muted: '#A8968F', pink: '#FFEDE9',
  red: '#CF181C', accent: '#F5562E', border: '#F3DAD4', card: '#FFFFFF',
}

const W = 1680, H = 1400

const COLUMNS = [
  {
    no: '①', name: '큐레이션', tagline: '여러 개를 묶어서',
    status: '발행 중', statusColor: T.accent,
    why: '"추천·모음" 검색에 강함',
    items: [
      ['베스트 랭킹', '여름 아동복 추천'],
      ['시즌·테마 모음', '여름 아기옷 · 물놀이룩'],
      ['상황별 모음', '등원룩 · 돌복 · 휴가룩'],
      ['신상 모음', '아동복 신상'],
      ['가격대별', '3만원대 세트'],
    ],
  },
  {
    no: '②', name: '단일 상품핀', tagline: '상품 하나에 집중',
    status: '상품컷 보강 후', statusColor: T.muted,
    why: '검색어마다 1:1, 유입 폭 최대',
    items: [
      ['누끼 정면컷', '○○ 세트'],
      ['디테일 클로즈업', '원단 · 패턴'],
      ['무드 · 연출컷', '코디 영감'],
      ['신상 강조', '신상'],
      ['세일 강조', '할인 · 세일'],
    ],
  },
  {
    no: '③', name: '정보형', tagline: '저장하고 싶은 정보',
    status: '준비됨', statusColor: T.accent,
    why: '저장률 높아 오래 노출',
    items: [
      ['사이즈 가이드', '100 사이즈 몇 살'],
      ['소재 · 세탁 가이드', '아기옷 세탁'],
      ['코디 팁', '아기 코디 팁'],
      ['연령별 추천', '돌아기 옷'],
      ['자주 묻는 질문', '아동복 교환'],
    ],
  },
]

const col = (c) => `
  <div class="col">
    <div class="col-head">
      <div class="no">${c.no}</div>
      <div>
        <div class="col-name">${c.name}</div>
        <div class="col-tag">${c.tagline}</div>
      </div>
    </div>
    <div class="badge" style="color:${c.statusColor};border-color:${c.statusColor}">${c.status}</div>
    <div class="why">${c.why}</div>
    <div class="items">
      ${c.items.map((it) => `
      <div class="item">
        <div class="item-name">${it[0]}</div>
        <div class="item-kw">🔍 ${it[1]}</div>
      </div>`).join('')}
    </div>
  </div>`

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:${T.pink};font-family:'Noto Sans KR',sans-serif;color:${T.ink};}
  .poster{width:${W}px;height:${H}px;background:${T.pink};padding:72px 72px 56px;display:flex;flex-direction:column;position:relative;}
  .eyebrow{font-family:'Poppins',sans-serif;font-weight:700;letter-spacing:.24em;font-size:22px;color:${T.accent};text-transform:uppercase;}
  .title{font-weight:900;font-size:62px;letter-spacing:-.02em;margin-top:14px;}
  .sub{margin-top:14px;font-size:27px;color:${T.muted};}
  .cols{display:flex;gap:36px;margin-top:48px;flex:1;}
  .col{flex:1;background:${T.card};border-radius:32px;padding:42px 38px;display:flex;flex-direction:column;}
  .col-head{display:flex;align-items:center;gap:18px;}
  .no{font-family:'Poppins',sans-serif;font-weight:800;font-size:54px;color:${T.accent};line-height:1;}
  .col-name{font-weight:900;font-size:40px;letter-spacing:-.01em;}
  .col-tag{font-size:24px;color:${T.muted};margin-top:4px;}
  .badge{align-self:flex-start;margin-top:24px;font-family:'Poppins',sans-serif;font-weight:700;font-size:20px;
    letter-spacing:.02em;border:2px solid;border-radius:999px;padding:8px 20px;}
  .why{margin-top:18px;font-size:24px;color:${T.muted};padding-bottom:24px;border-bottom:1px solid ${T.border};}
  .items{margin-top:8px;display:flex;flex-direction:column;}
  .item{padding:20px 0;border-bottom:1px solid ${T.border};}
  .item:last-child{border-bottom:none;}
  .item-name{font-weight:700;font-size:30px;}
  .item-kw{margin-top:7px;font-size:22px;color:${T.muted};}
  .foot{display:flex;align-items:center;justify-content:space-between;margin-top:40px;}
  .foot-note{font-size:25px;color:${T.ink};}
  .foot-note b{color:${T.accent};}
  .logo{height:54px;object-fit:contain;}
</style></head>
<body>
  <div class="poster">
    <div class="eyebrow">CONTENT ROADMAP</div>
    <div class="title">핀터레스트 콘텐츠 — 3가지 유형</div>
    <div class="sub">데이터·이미지만 주시면 브랜드 톤 카드 + 발행 캡션을 자동 생성합니다. 아이디어를 더해주세요.</div>
    <div class="cols">
      ${COLUMNS.map(col).join('')}
    </div>
    <div class="foot">
      <div class="foot-note">발행 리듬 — <b>주 3~5장</b>, 서로 다른 핀. 양보다 꾸준함. 유입은 누적형(2~3개월).</div>
      <img class="logo" src="${LOGO_URL}" alt="applebuttercollege"/>
    </div>
  </div>
</body></html>`

const outDir = join(__dirname, 'output')
mkdirSync(outDir, { recursive: true })
const htmlPath = join(outDir, 'roadmap.html')
writeFileSync(htmlPath, html, 'utf-8')

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => existsSync(p))
if (!CHROME) { console.error('Chrome 경로를 찾지 못했습니다.'); process.exit(1) }

const pngPath = join(outDir, 'roadmap.png')
execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--window-size=${W},${H}`,
  '--virtual-time-budget=6000', `--screenshot=${pngPath}`,
  pathToFileURL(htmlPath).href,
], { stdio: 'ignore' })
console.log('생성: output/roadmap.html + output/roadmap.png')
