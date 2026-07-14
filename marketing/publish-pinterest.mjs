// Pinterest 자동 발행기 (v5 API) — 덱 산출 핀을 여름 아동복 보드에 발행.
//
// 사용: node marketing/publish-pinterest.mjs [job.json 경로] [--dry-run]
//   - job 미지정 시 marketing/.publish-job.json 사용
//   - --dry-run: 실제 POST 없이 조립된 payload만 출력(검증용)
//
// job.json 형식:
//   { "imagePath": "...2x3-01.png", "title": "...", "description": "...",
//     "link": "https://...&utm_...", "altText": "...", "board": "<board_id 선택>" }
//
// 토큰: .env.local의 PINTEREST_ACCESS_TOKEN(30일). 401이면 REFRESH_TOKEN(60일)으로
//       자동 갱신 후 재시도하고, 새 access_token을 .env.local에 다시 써넣는다.

import { readFileSync, writeFileSync } from 'fs'

const ENV_PATH = '.env.local'
function loadEnv() {
  return Object.fromEntries(
    readFileSync(ENV_PATH, 'utf-8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  )
}

// .env.local의 특정 키 값을 교체(토큰 갱신용). 다른 줄은 그대로 둔다.
function updateEnvKey(key, value) {
  const lines = readFileSync(ENV_PATH, 'utf-8').split('\n')
  let found = false
  const out = lines.map(l => {
    if (l.startsWith(`${key}=`)) { found = true; return `${key}=${value}` }
    return l
  })
  if (!found) out.push(`${key}=${value}`)
  writeFileSync(ENV_PATH, out.join('\n'))
}

async function refreshAccessToken(env) {
  const basic = Buffer.from(`${env.PINTEREST_APP_ID}:${env.PINTEREST_APP_SECRET}`).toString('base64')
  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.PINTEREST_REFRESH_TOKEN }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`토큰 갱신 실패 ${res.status}: ${JSON.stringify(j)}`)
  updateEnvKey('PINTEREST_ACCESS_TOKEN', j.access_token)
  if (j.refresh_token) updateEnvKey('PINTEREST_REFRESH_TOKEN', j.refresh_token)
  console.log('[token] access_token 갱신 완료')
  return j.access_token
}

// 401이면 1회 갱신 후 재시도하는 fetch 래퍼
async function pinFetch(path, opts, env) {
  let token = env.PINTEREST_ACCESS_TOKEN
  let res = await fetch(`https://api.pinterest.com/v5${path}`, {
    ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    token = await refreshAccessToken(env)
    res = await fetch(`https://api.pinterest.com/v5${path}`, {
      ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` },
    })
  }
  return res
}

function buildPayload(job, env) {
  const board = job.board || env.PINTEREST_BOARD_ID
  if (!board) throw new Error('board_id 없음 (job.board 또는 PINTEREST_BOARD_ID)')
  if (!job.imagePath) throw new Error('imagePath 없음')
  if ((job.title ?? '').length > 100) throw new Error(`title 100자 초과 (${job.title.length})`)

  const base64 = readFileSync(job.imagePath).toString('base64')
  return {
    board_id: board,
    title: job.title,
    description: job.description ?? '',
    link: job.link ?? undefined,
    alt_text: job.altText ?? undefined,
    media_source: { source_type: 'image_base64', content_type: 'image/png', data: base64 },
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const jobPath = args.find(a => !a.startsWith('--')) || 'marketing/.publish-job.json'
  const job = JSON.parse(readFileSync(jobPath, 'utf-8'))
  const env = loadEnv()
  const payload = buildPayload(job, env)

  // 로그용 요약(base64는 길이만)
  const preview = { ...payload, media_source: { ...payload.media_source, data: `<base64 ${payload.media_source.data.length}자>` } }
  console.log('=== 발행 payload ===')
  console.log(JSON.stringify(preview, null, 2))

  if (dryRun) { console.log('\n[dry-run] 실제 발행 안 함. payload만 검증.'); return }

  const res = await pinFetch('/pins', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }, env)
  const j = await res.json()
  if (!res.ok) { console.error(`\n발행 실패 ${res.status}:`, JSON.stringify(j, null, 2)); process.exit(1) }
  console.log(`\n✅ 발행 완료 — 핀 ID: ${j.id}`)
  console.log(`   확인: https://www.pinterest.com/pin/${j.id}/`)
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
