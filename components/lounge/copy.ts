// Lounge 컨셉(성인 라운지 팬츠) 브랜드 카피 — 시안 그대로 영어 헤드라인.
// 언어별 번역은 아직 미정이라 전 locale 공통. 번역 확정 시 dictionaries로 옮긴다.

export const LOUNGE_COPY = {
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
  // 상품 상세 01·02·03 패널
  features: [
    { no: '01', title: 'Feel cool.', body: 'Light comfort. All year round.' },
    { no: '02', title: 'Seriously soft.', body: 'Your everyday comfort.' },
    { no: '03', title: 'Wash. Wash. Repeat.', body: 'Soft feel. Tough as hell.' },
  ],
} as const

// 카드·패널 배경 순환색 (프린트 톤)
export const LOUNGE_TONES = ['bg-sky', 'bg-blush', 'bg-sun'] as const
