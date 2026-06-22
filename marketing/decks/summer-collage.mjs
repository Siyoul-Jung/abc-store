// 소재(deck) — 여름 세트 스타일링 모음 (collage)
// 상품 누끼 여러 개를 흰 카드 격자로 묶은 "세트 모음판". 사진 플랫레이 아님(보유 누끼컷 구성).
// 한 핀에 여러 상품 노출 → "여름 세트 모음" 검색 + 클릭 선택지 확대.

const IMG = {
  babypink: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000557.png?v=1778568130',
  skyblue:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000556.png?v=1778568124',
  dino:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000558.png?v=1778568137',
  honey:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000560.png?v=1778568150',
}

export default {
  slug: 'summer-collage',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '올여름 입히기 좋은 세트 모음',
    keywords: '여름 아기 세트 모음, 베이비 반팔 반바지, 아동복 코디',
    hashtags: ['아동복', '아기옷', '아기여름옷', '세트룩', '베이비룩', '아기코디', '키즈패션', 'applebuttercollege'],
    pinDesc: '올여름 입히기 좋은 세트만 모았어요. {keywords}. 매일 입히기 좋은 반팔+반바지 세트, 사이즈 XS–XL.',
    igLead: '올여름 데일리로 좋은 세트, 한눈에 모아봤어요.',
    igFoot: '반팔+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'SUMMER SETS',
      title: '올여름 입히기 좋은\n세트 모음',
      sub: '매일 입히기 좋은 반팔+반바지 세트',
      items: [
        { image: IMG.babypink, label: '피그 베이비핑크' },
        { image: IMG.skyblue,  label: '피그 스카이블루' },
        { image: IMG.dino,     label: '핑크 공룡' },
        { image: IMG.honey,    label: '허니베어' },
      ],
    },
  ],
}
