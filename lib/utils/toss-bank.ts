// 토스 환불 계좌(refundReceiveAccount)의 `bank` 필드는 은행 '이름'이 아니라
// 금융결제원 표준 기관코드(2자리)를 요구한다.
// 체크아웃(CheckoutForm)에서 사용자는 은행 '이름'을 고르므로,
// 무통장 입금 환불 시 이름 → 코드 변환이 필요하다.
//
// 매핑 키는 CheckoutForm.tsx의 은행 목록과 1:1로 맞춘다.
// '기타'는 코드가 없어 자동 환불 불가 → 호출부에서 수동 처리로 안내한다.
const BANK_CODE: Record<string, string> = {
  국민은행: '004',
  신한은행: '088',
  우리은행: '020',
  하나은행: '081',
  농협은행: '011',
  기업은행: '003',
  카카오뱅크: '090',
  토스뱅크: '092',
  케이뱅크: '089',
  새마을금고: '045',
  SC제일은행: '023',
  우체국: '071',
}

/** 은행 이름 → 토스 기관코드. 매핑 불가('기타'/미지원)면 null. */
export function bankNameToCode(name: string | null | undefined): string | null {
  if (!name) return null
  return BANK_CODE[name.trim()] ?? null
}
