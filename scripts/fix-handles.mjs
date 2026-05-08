/**
 * One-time script: Shopify 상품 handle을 ASCII로 일괄 수정
 * 실행: node scripts/fix-handles.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 파싱
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()]),
)

const DOMAIN = env.SHOPIFY_STORE_DOMAIN
const TOKEN = env.SHOPIFY_ADMIN_API_TOKEN
const VERSION = env.SHOPIFY_STOREFRONT_API_VERSION || '2025-01'
const BASE = `https://${DOMAIN}/admin/api/${VERSION}`

if (!TOKEN) {
  console.error('SHOPIFY_ADMIN_API_TOKEN이 없어요.')
  process.exit(1)
}

function toAsciiHandle(handle, numericId) {
  // ASCII 문자(영문, 숫자, 하이픈)만 남기고 나머지 제거
  const asciiOnly = handle.replace(/[^\x00-\x7F]/g, '-')
  // 연속 하이픈 정리 후 앞뒤 하이픈 제거
  const cleaned = asciiOnly.replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${cleaned}-${numericId}`
}

async function fetchAllProducts() {
  const res = await fetch(`${BASE}/products.json?limit=250&fields=id,handle`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  })
  const data = await res.json()
  return data.products
}

async function updateHandle(id, newHandle) {
  const res = await fetch(`${BASE}/products/${id}.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product: { id, handle: newHandle } }),
  })
  return res.json()
}

async function main() {
  console.log('상품 목록 가져오는 중...')
  const products = await fetchAllProducts()
  console.log(`총 ${products.length}개 상품\n`)

  let updated = 0
  let skipped = 0

  for (const product of products) {
    const numericId = product.id
    const newHandle = toAsciiHandle(product.handle, numericId)

    if (product.handle === newHandle) {
      skipped++
      continue
    }

    console.log(`  ${product.handle}`)
    console.log(`→ ${newHandle}`)

    const result = await updateHandle(numericId, newHandle)

    if (result.product) {
      console.log('  ✓\n')
      updated++
    } else {
      console.error('  ✗ 오류:', JSON.stringify(result.errors))
    }

    // Shopify API rate limit 방지 (2 req/s)
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\n완료: ${updated}개 수정, ${skipped}개 스킵`)
}

main().catch(console.error)
