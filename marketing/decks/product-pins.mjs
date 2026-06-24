// 소재(deck) — 단일 상품핀 (2번 템플릿 'product')
// 상품 1개 = 카드 1장 = 핀 1장. card별로 export-png가 개별 PNG를 뽑아준다.
// ※ 지금은 누끼 1컷만 있어 데모. 상품컷 3컷(누끼·디테일·무드) 확보되면 상품당 핀 여러 개로 확장.
// 가격은 핀 이미지에 넣지 않는다(evergreen 핀이라 가격 변동 시 박제됨) — 실시간 가격은 상품 페이지에서.
// ⚠️ 아래 IMG URL은 재마이그레이션으로 깨졌을 수 있음 — 복구 후 새 Shopify CDN URL로 교체 필요.

const IMG = {
  babypink: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000609.png?v=1778568428',  // 싯피그 베이비 핑크
  dino:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000558.png?v=1778568137',
  honey:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000560.png?v=1778568150',
}

export default {
  slug: 'product-pins',
  type: 'product',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: 'applebuttercollege 여름 신상 세트',
    keywords: '아기 여름 세트, 베이비 반팔 반바지',
    hashtags: ['아동복', '아기옷', '아기여름옷', '베이비룩', '키즈패션', 'applebuttercollege'],
    pinDesc: '{keywords}. 매일 입히기 좋은 반팔+반바지 세트. 사이즈 XS–XL.',
  },
  cards: [
    {
      type: 'product',
      eyebrow: 'NEW IN',
      name: '싯피그 베이비 핑크 세트',
      image: IMG.babypink,
    },
    {
      type: 'product',
      eyebrow: 'NEW IN',
      name: '핑크 공룡 세트',
      image: IMG.dino,
    },
    {
      type: 'product',
      eyebrow: 'NEW IN',
      name: '허니베어 세트',
      image: IMG.honey,
    },
  ],
}
