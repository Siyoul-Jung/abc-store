import { adminGql } from './admin'

// 저재고 점검 + 관리자 알림.
// Shopify는 "저재고 임계값 이메일" 같은 네이티브 설정이 없다(Stocky 등 앱 영역).
// → Admin API로 추적 재고를 직접 조회해, 임계값 이하 variant를 관리자에게 메일로 보고한다.
// keep-alive cron이 매일 1회 호출한다(Vercel Hobby cron 2개 제한 회피 — 전용 cron 추가 대신 통합).
//
// 임계값: LOW_STOCK_THRESHOLD env (기본 3). 0·음수(오버셀)도 포함해 보고한다.
// 발신: 도메인 미인증 동안은 실제 전송이 안 될 수 있음(다른 메일과 동일 제약). 인증 후 자동 동작.

// 카탈로그 규모가 작아(수십 개) Shopify 최대치인 250개 1페이지로 전수 조회한다.
// 향후 250개를 넘기면 hasNextPage가 true가 되며, 그 경우 점검 누락을 로그로 남긴다(조용한 누락 방지).
const LOW_STOCK_QUERY = `
  query LowStock {
    products(first: 250) {
      pageInfo { hasNextPage }
      nodes {
        title
        variants(first: 100) {
          nodes {
            title
            inventoryQuantity
            inventoryItem { tracked }
          }
        }
      }
    }
  }
`

type LowStockItem = { product: string; variant: string; qty: number }

type GqlProducts = {
  products: {
    pageInfo: { hasNextPage: boolean }
    nodes: {
      title: string
      variants: {
        nodes: {
          title: string
          inventoryQuantity: number | null
          inventoryItem: { tracked: boolean } | null
        }[]
      }
    }[]
  }
}

// 재고 추적 중인 variant만 대상으로 임계값 이하 항목을 수집한다.
export async function findLowStock(threshold: number): Promise<LowStockItem[]> {
  const res = await adminGql<GqlProducts>(LOW_STOCK_QUERY)
  const page = res.data?.products
  if (!page) return []

  if (page.pageInfo.hasNextPage) {
    // 카탈로그가 250개를 초과 — 일부 상품이 점검에서 누락됨. 페이지네이션 추가 필요 신호.
    console.warn('[low-stock] 상품 250개 초과: 일부 상품 점검 누락. 페이지네이션 보강 필요.')
  }

  const items: LowStockItem[] = []
  for (const p of page.nodes) {
    for (const v of p.variants.nodes) {
      // 추적하지 않는 재고는 inventoryQuantity가 의미 없으므로 제외.
      if (!v.inventoryItem?.tracked) continue
      const qty = v.inventoryQuantity ?? 0
      if (qty <= threshold) {
        items.push({ product: p.title, variant: v.title, qty })
      }
    }
  }

  // 가장 급한 것(재고 적은 순) 먼저.
  return items.sort((a, b) => a.qty - b.qty)
}

// 저재고 항목이 있으면 관리자에게 메일을 보낸다. 반환: 점검 결과 요약.
export async function checkLowStockAndAlert(): Promise<{ threshold: number; count: number }> {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 3)
  const items = await findLowStock(threshold)

  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (items.length > 0 && resendKey && adminEmail) {
    const rows = items
      .map(
        (i) =>
          `<tr><td style="padding:4px 12px 4px 0">${i.product}</td><td style="padding:4px 12px 4px 0;color:#736E66">${i.variant}</td><td style="padding:4px 0;text-align:right"><b style="color:${i.qty <= 0 ? '#e5484d' : '#1C1C1C'}">${i.qty}</b></td></tr>`,
      )
      .join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'applebuttercollege <no-reply@applebuttercollege.com>',
        to: adminEmail,
        subject: `[재고 부족] ${items.length}개 품목 (임계 ${threshold}개 이하)`,
        html:
          `<p>재고 ${threshold}개 이하 품목입니다. 재입고/발주를 검토해 주세요.</p>` +
          `<table style="border-collapse:collapse;font-size:14px"><thead><tr style="border-bottom:1px solid #E8E3DC"><th style="text-align:left;padding:4px 12px 4px 0">상품</th><th style="text-align:left;padding:4px 12px 4px 0">옵션</th><th style="text-align:right;padding:4px 0">재고</th></tr></thead><tbody>${rows}</tbody></table>` +
          `<p style="color:#736E66;font-size:12px;margin-top:16px">applebuttercollege 자동 재고 점검 (매일 1회)</p>`,
      }),
    })
  }

  return { threshold, count: items.length }
}
