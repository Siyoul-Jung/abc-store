import type { Locale } from '@/lib/shopify/types'

// Lounge 컨셉(성인 라운지 팬츠) 브랜드 카피.
// 원칙: 굵은 영어 헤드라인·버튼·밸류 문구는 전 locale 공통(Anton엔 한글이 없고 말장난이 번역 안 됨),
// 그 아래 설명 문장·안내 문구만 ko/ja로 현지화한다.

const EN = {
  hero: {
    headline: 'Always run hot?',
    sub: 'Meet your everyday lounge pants.',
    detail: 'Light. Soft. Built to last.',
    cta: 'Shop lounge pants',
    badge: 'Comfort, all year round.',
  },
  values: ['Cool feel.', 'Soft touch.', 'Built to last.'],
  why: {
    title: 'Less “too hot.” More “just right.”',
    sub: 'Comfort starts with what you put on.',
    items: [
      { q: 'Feeling too warm?', title: 'Keep it light.', body: 'A lightweight knit with a cool feel.' },
      { q: 'Rough against your skin?', title: 'Go soft.', body: 'A smooth, soft touch for downtime.' },
      { q: 'Tired of pants that don’t last?', title: 'Wear. Wash. Repeat.', body: 'Soft feel. Tough as hell.' },
    ],
  },
  prints: { title: 'Pick your print.', sub: 'Same comfort. Your personality.', all: 'Shop all prints', shop: 'Shop' },
  closing: {
    title: 'Take comfort seriously.',
    sub: 'Yourself? Less so.',
    cta: 'Ready to get comfortable?',
    button: 'Shop lounge pants',
  },
  // 상품 상세 — adult 태그 상품 전용(팬츠 사실 문구라 키즈·기타 상품에 노출 금지)
  pdp: {
    tagline: 'Cool feel. Soft touch. Built to last.',
    detail: 'No side seams. No pockets. Made for comfort.',
    notes: ['Pants only. T-shirt not included.', 'Shipping calculated at checkout.'],
    block: {
      title: ['No side seams.', 'No pockets.', 'Just comfort.'],
      body: 'Designed without side seams or pockets for easy, everyday comfort.',
      kicker: 'Put them on. You’ll get it.',
    },
  },
  // 상품 상세 01·02·03 패널
  features: [
    { no: '01', title: 'Feel cool.', body: 'Light comfort. All year round.' },
    { no: '02', title: 'Seriously soft.', body: 'Your everyday comfort.' },
    { no: '03', title: 'Wash. Wash. Repeat.', body: 'Soft feel. Tough as hell.' },
  ],
}

export type LoungeCopy = typeof EN

const KO: LoungeCopy = {
  ...EN,
  hero: { ...EN.hero, sub: '더위 많이 타는 당신을 위한 데일리 라운지 팬츠.', detail: '가볍고, 부드럽고, 오래 입어요.' },
  why: {
    ...EN.why,
    sub: '편안함은 입는 것에서 시작돼요.',
    items: [
      { ...EN.why.items[0], q: '더위를 많이 타나요?', body: '시원한 촉감의 가벼운 니트 원단.' },
      { ...EN.why.items[1], q: '피부에 닿는 느낌이 거슬리나요?', body: '쉬는 시간을 위한 부드러운 촉감.' },
      { ...EN.why.items[2], q: '금방 늘어나는 바지가 지겹나요?', body: '부드럽지만, 놀랍도록 튼튼하게.' },
    ],
  },
  prints: { ...EN.prints, sub: '편안함은 그대로, 프린트는 취향대로.' },
  pdp: {
    ...EN.pdp,
    detail: '옆선도, 주머니도 없이. 편안함만 남겼어요.',
    notes: ['팬츠 단품이에요. 티셔츠는 포함되지 않아요.', '배송비는 결제 단계에서 계산돼요.'],
    block: { ...EN.pdp.block, body: '옆선과 주머니를 없애 매일 편하게 입을 수 있게 만들었어요.', kicker: '입어 보면 알아요.' },
  },
  features: [
    { ...EN.features[0], body: '가벼운 편안함, 사계절 내내.' },
    { ...EN.features[1], body: '매일의 편안함.' },
    { ...EN.features[2], body: '부드럽지만, 놀랍도록 튼튼하게.' },
  ],
}

const JA: LoungeCopy = {
  ...EN,
  hero: { ...EN.hero, sub: '暑がりなあなたのための、毎日のラウンジパンツ。', detail: '軽くて、やわらかくて、長持ち。' },
  why: {
    ...EN.why,
    sub: '快適さは、身につけるものから。',
    items: [
      { ...EN.why.items[0], q: '暑がりですか？', body: 'ひんやり軽いニット素材。' },
      { ...EN.why.items[1], q: '肌ざわりが気になる？', body: 'くつろぎ時間のための、なめらかな肌ざわり。' },
      { ...EN.why.items[2], q: 'すぐヘタるパンツにうんざり？', body: 'やわらかいのに、驚くほどタフ。' },
    ],
  },
  prints: { ...EN.prints, sub: '快適さはそのまま、柄はお好みで。' },
  pdp: {
    ...EN.pdp,
    detail: 'サイドシームもポケットもなし。快適さだけを。',
    notes: ['パンツ単品です。Tシャツは含まれません。', '送料はご購入手続き時に計算されます。'],
    block: { ...EN.pdp.block, body: 'サイドシームとポケットをなくし、毎日気軽にはけるデザインに。', kicker: 'はいてみれば、わかります。' },
  },
  features: [
    { ...EN.features[0], body: '軽やかな快適さを、一年中。' },
    { ...EN.features[1], body: '毎日の快適さ。' },
    { ...EN.features[2], body: 'やわらかいのに、驚くほどタフ。' },
  ],
}

const BY_LOCALE: Record<Locale, LoungeCopy> = { ko: KO, ja: JA, en: EN }

export function loungeCopy(locale: Locale): LoungeCopy {
  return BY_LOCALE[locale]
}

// 언어와 무관한 공통 문구(밸류 띠 등)용
export const LOUNGE_COPY = EN

// 카드·패널 배경 순환색 (프린트 톤)
export const LOUNGE_TONES = ['bg-sky', 'bg-blush', 'bg-sun'] as const
