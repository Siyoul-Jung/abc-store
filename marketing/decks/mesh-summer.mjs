// 소재(deck) — MESH SET 여름 나시+반바지 콜라주
// 기존 ABC SKIN SET(반팔)과 다른 새 카테고리. "나시 아동복", "민소매 세트" 검색 커버리지 확보.

const IMG = {
  pinkdino: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000628.png?v=1782090896',  // 핑크 공룡
  berrybery:'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000625.png?v=1782090875',  // 베리베리
  bluebeach:'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000626.png?v=1782090882',  // 블루 해변
  bluecar:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000627.png?v=1782090889',  // 블루 카
}

export default {
  slug: 'mesh-summer',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '더운 날엔 나시 세트',
    keywords: '여름 아기 나시 세트, 베이비 민소매 반바지, 아동복 여름',
    hashtags: ['아동복', '아기옷', '아기여름옷', '나시세트', '베이비룩', '아기코디', '키즈패션', 'applebuttercollege'],
    pinDesc: '더운 날 입히기 딱 좋은 나시+반바지 세트 모음이에요. {keywords}. 사이즈 XS–XL.',
    igLead: '진짜 더운 날엔 나시 세트가 답이에요.',
    igFoot: '나시+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'MESH SET',
      title: '더운 날엔\n나시 세트',
      sub: '나시+반바지 · 사이즈 XS–XL',
      items: [
        { image: IMG.pinkdino,  label: '핑크 공룡' },
        { image: IMG.berrybery, label: '베리베리' },
        { image: IMG.bluebeach, label: '블루 해변' },
        { image: IMG.bluecar,   label: '블루 카' },
      ],
    },
  ],
}
