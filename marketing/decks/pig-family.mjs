// 소재(deck) — PIG FAMILY 콜라주. 브랜드 시그니처 캐릭터 "피그" 모음.
// ABC SKIN(반팔) 버전만 사용해 mesh-summer(나시) 콜라주와 상품타입 구별.
// mesh/new-abc/summer 계열과 상품 중복 없음. "돼지 아동복", "피그" 검색 커버리지.

const IMG = {
  classicPink: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000604.png?v=1778568410', // 클래식 피그 핑크
  chubby:      'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000621.png?v=1782090848', // 통통 피그
  farm:        'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/1780956833_456208.png?v=1782183936', // 피그 팜
  flowerYellow:'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000607.png?v=1778568415', // 꽃피그 노랑
}

export default {
  slug: 'pig-family',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '피그 패밀리 반팔',
    keywords: '돼지 아동복, 피그 캐릭터 아기옷, 반팔 세트 아동복, 남녀공용 키즈룩',
    hashtags: ['돼지아동복', '피그', '아기반팔세트', '캐릭터아동복', '남녀공용아기옷', 'applebuttercollege'],
    pinDesc: '애플버터컬리지 시그니처 캐릭터 피그 패밀리 반팔 세트 모음. {keywords}. 사이즈 XS–XL.',
    igLead: '우리 집 시그니처, 피그 패밀리 모였어요.',
    igFoot: '피그 반팔 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'PIG FAMILY',
      title: '피그 패밀리\n반팔 세트',
      sub: '캐릭터 반팔+반바지 · 사이즈 XS–XL',
      items: [
        { image: IMG.classicPink,  label: '클래식 피그' },
        { image: IMG.chubby,       label: '통통 피그' },
        { image: IMG.farm,         label: '피그 팜' },
        { image: IMG.flowerYellow, label: '꽃피그' },
      ],
    },
  ],
}
