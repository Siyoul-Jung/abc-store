// 토스 웹훅 서명검증 테스트 (방법 A — 가짜 입금신호로 검증 경로 통과 확인)
//
// 실행: node scripts/test-toss-webhook.mjs [orderId]
//   - orderId 생략 시 존재하지 않는 주문으로 "보안게이트 통과 + 주문없음" 경로만 검증.
//   - 실제 pending 주문의 tossOrderId를 주면 paid 전환까지 end-to-end 검증.
//
// 검증 시나리오:
//   ① 올바른 서명           → 401 아님 (보안 게이트 통과)
//   ② 틀린 서명             → 401 (위조 차단)
//   ③ 서명 헤더 없음        → 401 (헤더 누락 차단)
//
// 전제: dev 서버 실행 중(localhost:3000) + .env.local 의 TOSS_WEBHOOK_SECRET 동일.

import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENDPOINT = 'http://localhost:3000/api/toss/webhook'

// .env.local 에서 TOSS_WEBHOOK_SECRET 읽기 (값은 출력하지 않음)
function readSecret() {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  const line = env.split('\n').find((l) => l.startsWith('TOSS_WEBHOOK_SECRET='))
  if (!line) throw new Error('.env.local 에 TOSS_WEBHOOK_SECRET 없음')
  return line.slice('TOSS_WEBHOOK_SECRET='.length).trim()
}

const secret = readSecret()
const orderId = process.argv[2] || `TEST_${Date.now()}`

// 가짜 가상계좌 입금완료 페이로드
const payload = JSON.stringify({
  eventType: 'VIRTUAL_ACCOUNT.DONE',
  data: {
    paymentKey: 'test_payment_key_' + orderId,
    orderId,
    status: 'DONE',
    totalAmount: 41500,
  },
})

const transmissionTime = new Date().toISOString()

// 토스 방식으로 올바른 서명 계산: HMAC-SHA256(`{payload}:{전송시각}`) → base64, "v1:" 접두사
function sign(body, time, key) {
  const hash = crypto.createHmac('sha256', key).update(`${body}:${time}`).digest('base64')
  return `v1:${hash}`
}

async function post(label, { signature, omitSig = false }) {
  const headers = { 'Content-Type': 'application/json', 'tosspayments-webhook-transmission-time': transmissionTime }
  if (!omitSig) headers['tosspayments-webhook-signature'] = signature
  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: payload })
  const text = await res.text()
  console.log(`  ${label}: HTTP ${res.status} — ${text}`)
  return res.status
}

console.log(`\n웹훅 서명검증 테스트 (orderId: ${orderId})\n`)

const validSig = sign(payload, transmissionTime, secret)
const wrongSig = sign(payload, transmissionTime, 'WRONG_KEY')

const s1 = await post('① 올바른 서명     ', { signature: validSig })
const s2 = await post('② 틀린 서명       ', { signature: wrongSig })
const s3 = await post('③ 서명 헤더 없음   ', { omitSig: true })

console.log('\n결과 판정:')
console.log(`  ① 보안 게이트 통과 (401 아님): ${s1 !== 401 ? '✅ PASS' : '❌ FAIL'}  (HTTP ${s1})`)
console.log(`  ② 틀린 서명 차단 (401):        ${s2 === 401 ? '✅ PASS' : '❌ FAIL'}  (HTTP ${s2})`)
console.log(`  ③ 헤더 누락 차단 (401):        ${s3 === 401 ? '✅ PASS' : '❌ FAIL'}  (HTTP ${s3})`)
console.log('')
if (s1 === 200) console.log('  → ①이 200: 실제 주문 paid 전환까지 성공 (end-to-end).')
else if (s1 === 500) console.log('  → ①이 500: 보안 게이트는 통과, 해당 orderId 주문이 없어 전환 단계에서 멈춤(정상 — 가짜 orderId).')
console.log('')
