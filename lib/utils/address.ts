// 배송 국가별 주소 규칙 — 체크아웃 폼(클라이언트)·confirm 라우트(서버)·주문 생성이 공유.

export type ShipCountry = 'KR' | 'JP' | 'US'

// 결제 통화 → 배송 국가. 통화 하나에 국가가 여럿 생기면(USD → US/CA 등) 국가 선택 UI로 확장한다.
const COUNTRY_BY_CURRENCY: Record<string, ShipCountry> = { KRW: 'KR', JPY: 'JP', USD: 'US' }

export function shipCountryFor(currency: string): ShipCountry | null {
  return COUNTRY_BY_CURRENCY[currency] ?? null
}

const ZIP_PATTERNS: Record<ShipCountry, RegExp> = {
  KR: /^\d{5}$/,
  JP: /^\d{3}-?\d{4}$/,
  US: /^\d{5}(-\d{4})?$/,
}

export function isValidZip(country: ShipCountry, zip: string): boolean {
  return ZIP_PATTERNS[country].test(zip.trim())
}

// 한국은 도·시가 address1(도로명주소)에 포함돼 별도 필드가 없다. 일본·미국은 province(도도부현/주)·city 필수.
export function needsRegion(country: ShipCountry): boolean {
  return country !== 'KR'
}

// 도도부현 — Shopify province_code는 'JP-01'~'JP-47' (JIS 코드 순서 = 배열 순서).
export const JP_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
].map((name, i) => ({ code: `JP-${String(i + 1).padStart(2, '0')}`, name }))

// 미국 주 — Shopify province_code는 USPS 2자 코드.
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }))
