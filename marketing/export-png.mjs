// PNG 추출기 — 설치된 Chrome을 headless로 호출해 카드별 1080×1080 PNG 생성.
// npm 패키지 0개 (Chrome CLI만 사용).
// 실행: node marketing/export-png.mjs [slug]
// 입력: marketing/output/cards/<slug>-NN.html
// 출력: marketing/output/png/<slug>-NN.png

import { execFileSync } from 'node:child_process'
import { readdirSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const slug = process.argv[2] || 'summer-bestsellers'

// Chrome 경로 (Windows 기본 설치 위치)
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]
const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chrome) {
  console.error('Chrome을 찾지 못했습니다. 경로를 export-png.mjs에 추가하세요.')
  process.exit(1)
}

const cardsDir = join(__dirname, 'output', 'cards')
const pngDir = join(__dirname, 'output', 'png')
mkdirSync(pngDir, { recursive: true })

const files = readdirSync(cardsDir)
  .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('.html'))
  .sort()

if (!files.length) {
  console.error(`카드 HTML이 없습니다 (slug: ${slug}). 먼저 생성기를 실행하세요.`)
  process.exit(1)
}

// 파일명의 포맷 토큰으로 캔버스 높이 + 채널 폴더 결정
function heightFor(fname) {
  if (fname.includes('-4x5-')) return 1350
  if (fname.includes('-2x3-')) return 1620
  return 1080
}
// 채널별 하위 폴더로 분리 (헷갈리지 않게): 4x5=인스타, 2x3=핀터레스트
function channelFor(fname) {
  if (fname.includes('-4x5-')) return 'instagram'
  if (fname.includes('-2x3-')) return 'pinterest'
  return 'etc'
}
// slug→type 매핑 (생성기가 남긴 manifest). 유형별 하위 폴더(ranking/product/info) 분류용.
let manifest = {}
const manifestPath = join(cardsDir, 'manifest.json')
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) } catch { /* 없으면 etc */ }
}
// 파일명에서 slug 추출 → manifest로 유형 결정
function typeFor(fname) {
  const slug = fname.replace(/-(2x3|4x5)-\d+\.html$/, '')
  return manifest[slug] ?? 'etc'
}

console.log(`Chrome으로 ${files.length}장 PNG 추출 중...`)
for (const f of files) {
  const channel = channelFor(f)
  const type = typeFor(f)
  // 채널 > 유형 폴더로 분류: png/pinterest/ranking, png/pinterest/product ...
  const destDir = join(pngDir, channel, type)
  mkdirSync(destDir, { recursive: true })
  const htmlUrl = pathToFileURL(join(cardsDir, f)).href
  const pngPath = join(destDir, f.replace('.html', '.png'))
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',     // 실제 픽셀 그대로 (2x 방지)
    `--window-size=1080,${heightFor(f)}`,
    '--virtual-time-budget=6000',        // 폰트·이미지 로드 대기
    `--screenshot=${pngPath}`,
    htmlUrl,
  ], { stdio: 'ignore' })
  console.log(`  ✓ output/png/${channel}/${type}/${f.replace('.html', '.png')}`)
}
console.log(`완료: ${files.length}장 → marketing/output/png/<채널>/<유형>/`)
