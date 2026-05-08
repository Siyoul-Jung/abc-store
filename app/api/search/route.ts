import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient, getShopifyContext } from '@/lib/shopify/client'
import { PREDICTIVE_SEARCH_QUERY } from '@/lib/shopify/queries/search'
import type { Locale } from '@/lib/shopify/types'

export async function GET(req: NextRequest) {
  const q    = req.nextUrl.searchParams.get('q')?.trim()
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'ko') as Locale

  if (!q || q.length < 1) {
    return NextResponse.json({ products: [] })
  }

  const ctx = getShopifyContext(lang)
  const { data, errors } = await shopifyClient.request(PREDICTIVE_SEARCH_QUERY, {
    variables: { query: q, ...ctx },
  })

  if (errors) return NextResponse.json({ products: [] }, { status: 500 })

  return NextResponse.json({ products: data.predictiveSearch.products })
}
