'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { caQuery } from '@/lib/shopify/customer-account'
import { adminGql } from '@/lib/shopify/admin'
import { bankNameToCode } from '@/lib/utils/toss-bank'

async function getToken() {
  const store = await cookies()
  return store.get('customer_token')?.value ?? null
}

// CustomerAddressInput 스키마에 맞춘 쓰기 필드만 사용.
// (province/country/phone 같은 이름은 입력 스키마에 없어 mutation이 거부됨)
// 한국 스토어: 도로명주소=address1, 상세=address2, territoryCode='KR' 고정.
export type AddressInput = {
  firstName: string
  lastName?: string
  address1: string
  address2?: string
  zip: string
  phoneNumber?: string
  territoryCode: string
  zoneCode: string // ISO 3166-2 지역 코드 (예: KR-41) — CA API 필수
}

export async function createAddress(input: AddressInput) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  const data = await caQuery<{ customerAddressCreate: { userErrors: { message: string }[] } }>(
    token,
    `mutation CreateAddress($address: CustomerAddressInput!) {
      customerAddressCreate(address: $address) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { address: input }
  )
  const errors = data?.customerAddressCreate?.userErrors
  if (errors?.length) return { error: errors[0].message }
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function updateAddress(id: string, input: AddressInput) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  const data = await caQuery<{ customerAddressUpdate: { userErrors: { message: string }[] } }>(
    token,
    `mutation UpdateAddress($id: ID!, $address: CustomerAddressInput!) {
      customerAddressUpdate(addressId: $id, address: $address) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { id, address: input }
  )
  const errors = data?.customerAddressUpdate?.userErrors
  if (errors?.length) return { error: errors[0].message }
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function deleteAddress(id: string) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  await caQuery(
    token,
    `mutation DeleteAddress($id: ID!) {
      customerAddressDelete(addressId: $id) {
        deletedAddressId
        userErrors { field message }
      }
    }`,
    { id }
  )
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function cancelOrder(orderId: string) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  // 소유권 검증(IDOR 방어): 로그인 고객의 customer.id를 토큰에서 직접 도출하고,
  // 대상 주문의 customer.id와 일치할 때만 취소를 허용한다.
  // (주문내역 페이지와 동일한 소유권 기준 — customer_id로 묶임.)
  const caData = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
  const customerId = caData?.customer?.id?.split('/').pop()
  if (!customerId) return { error: 'unauthorized' }

  // Shopify Admin에서 결제·소유자 정보 조회 (Toss paymentKey, 환불 계좌, 입금상태 등)
  const numericId = orderId.split('/').pop()
  const orderRes = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'}/orders/${numericId}.json?fields=total_price,note_attributes,customer,financial_status`,
    { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN! }, cache: 'no-store' }
  )
  // 조회 실패면 결제정보를 모른 채 환불을 건너뛰고 Shopify만 취소되는 불일치가 생긴다 → 즉시 중단.
  if (!orderRes.ok) {
    console.error('[cancelOrder] order fetch failed:', orderId, await orderRes.text().catch(() => ''))
    return { error: '주문 조회 실패 — 잠시 후 다시 시도해 주세요' }
  }

  const { order: o } = await orderRes.json()

  // IDOR 방어: 주문 소유자 != 로그인 고객이면 거부.
  if (String(o?.customer?.id ?? '') !== customerId) {
    return { error: 'forbidden' }
  }

  const attrs: { name: string; value: string }[] = o?.note_attributes ?? []
  const get = (k: string) => attrs.find((a) => a.name === k)?.value ?? null
  const paymentKey = get('toss_payment_key')
  const totalPrice = Math.round(Number(o?.total_price ?? 0))

  // 무통장(가상계좌) 주문은 생성 시 환불 계좌 정보를 note_attributes에 저장한다.
  const refundBank = get('refund_bank')
  const refundAccount = get('refund_account')
  const refundHolder = get('refund_holder')
  const isVbank = !!(refundBank && refundAccount)
  // 입금 완료(financial_status: paid)된 가상계좌만 환불 계좌가 필요하다.
  // 입금 전(pending)은 가상계좌를 무효화만 하면 되어 환불 계좌가 불필요.
  const isPaidVbank = isVbank && o?.financial_status === 'paid'

  if (paymentKey && totalPrice > 0) {
    type CancelBody = {
      cancelReason: string
      refundReceiveAccount?: { bank: string; accountNumber: string; holderName: string }
    }
    // cancelAmount는 생략 → 토스가 잔액 전액 취소(부분취소 안 함). 금액 불일치 오류 회피.
    const cancelBody: CancelBody = { cancelReason: '고객 주문 취소' }

    if (isPaidVbank) {
      const bankCode = bankNameToCode(refundBank)
      // '기타'/미지원 은행은 코드 매핑 불가 → 자동 환불 불가. 수동 처리로 안내하고 중단
      // (여기서 멈추지 않으면 Shopify는 환불처리되는데 실제 송금은 안 되는 불일치 발생).
      if (!bankCode) {
        return { error: '무통장 환불 계좌 은행을 자동 처리할 수 없습니다 — 고객센터로 문의해 주세요' }
      }
      cancelBody.refundReceiveAccount = {
        bank: bankCode,
        accountNumber: refundAccount!,
        holderName: refundHolder ?? '',
      }
    }

    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64'),
      },
      body: JSON.stringify(cancelBody),
    })
    if (!tossRes.ok) {
      const err = await tossRes.json().catch(() => ({}))
      return { error: (err as { message?: string }).message ?? 'Toss 결제 취소 실패' }
    }
  }

  // Shopify 주문 취소
  const { data } = await adminGql(
    `mutation CancelOrder($orderId: ID!) {
      orderCancel(orderId: $orderId, reason: CUSTOMER, refund: true, restock: true, notifyCustomer: true) {
        job { id }
        orderCancelUserErrors { message }
      }
    }`,
    { orderId }
  )
  const errors = data?.orderCancel?.orderCancelUserErrors
  if (errors?.length) return { error: errors[0].message }

  revalidatePath('/[lang]/account/orders', 'page')
  return { success: true }
}

export async function setDefaultAddress(id: string) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  await caQuery(
    token,
    `mutation SetDefault($id: ID!) {
      customerDefaultAddressUpdate(addressId: $id) {
        customer { defaultAddress { id } }
        userErrors { field message }
      }
    }`,
    { id }
  )
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}
