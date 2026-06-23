// 소재(deck) — 신상 ABC SKIN 4종 콜라주
// 가장 최근 업로드된 반팔+반바지 4종 모음. "신상" 검색 + 컬러 다양성 노출.

const IMG = {
  parfait:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000632.png?v=1782112186',  // 파르페
  offroad:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000631.png?v=1782090916',  // 오프로드 트럭
  duck:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000630.png?v=1782090909',  // 슬리퍼 오리
  pineapple:'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000629.png?v=1782090902',  // 파인애플
}

export default {
  slug: 'new-abc-skin',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '이번 여름 새로 나온 세트 모음',
    keywords: '여름 아기 세트, 베이비 반팔 반바지, 신상 아동복',
    hashtags: ['아동복', '아기옷', '아기여름옷', '신상', '베이비룩', '아기코디', '키즈패션', 'applebuttercollege'],
    pinDesc: '이번 여름 새로 나온 반팔+반바지 세트 모음이에요. {keywords}. 사이즈 XS–XL.',
    igLead: '이번 여름 새로 나온 세트들, 한눈에 모아봤어요.',
    igFoot: '반팔+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'NEW IN',
      title: '이번 여름\n새로 나온 세트',
      sub: '반팔+반바지 · 사이즈 XS–XL',
      items: [
        { image: IMG.parfait,   label: '파르페' },
        { image: IMG.offroad,   label: '오프로드 트럭' },
        { image: IMG.duck,      label: '슬리퍼 오리' },
        { image: IMG.pineapple, label: '파인애플' },
      ],
    },
  ],
}
