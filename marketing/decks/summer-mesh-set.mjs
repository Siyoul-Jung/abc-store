// 소재(deck) — 여름 메쉬 나시 세트 모음 (collage)
// 06-30(수) 큐레이션 슬롯. 시원함·물놀이·등원 시즌 검색 공략.
// 이미지 = Shopify Admin API로 조회한 active(status:active, 재고>0) MESH SET featuredImage (2026-06-29 확인, 전부 200).
// 추천 4종: 블루 해변 · 핑크 공룡 · 베리베리 · 클래식 피그 핑크 (색·모티프 다양성).
// 남녀공용 — 특정 성별로 좁히지 않음. 가격 미표기. 콜라주 링크 = KIDS 카테고리.

const IMG = {
  bluebeach:   'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000626.png?v=1782090882',  // MESH SET-블루 해변 (inv 86)
  pinkdino:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000628.png?v=1782090896',  // MESH SET-핑크 공룡 (inv 76)
  berrybery:   'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000625.png?v=1782090875',  // MESH SET-베리베리 (inv 41)
  classicpig:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000623.png?v=1782090862',  // MESH SET-클래식 피그 핑크 (inv 338)
}

export default {
  slug: 'summer-mesh-set',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '여름 메쉬 나시 세트 모음',
    keywords: '여름 아기 나시 세트, 시원한 아동복, 물놀이룩, 메쉬 나시',
    hashtags: ['여름아기나시', '물놀이룩', '시원한아동복', '메쉬나시', 'applebuttercollege'],
    pinDesc: '땀나는 여름엔 통풍 잘 되는 메쉬 나시 세트가 답이에요. {keywords}. 등원·물놀이·데일리까지, 사이즈 XS–XL.',
    igLead: '땀 많은 여름, 통풍 잘 되는 메쉬 나시 세트 모았어요.',
    igFoot: '나시+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'MESH SET',
      title: '여름 메쉬\n나시 세트 모음',
      sub: '통풍 잘 되는 나시+반바지 · 사이즈 XS–XL',
      items: [
        { image: IMG.bluebeach,  label: '블루 해변' },
        { image: IMG.pinkdino,   label: '핑크 공룡' },
        { image: IMG.berrybery,  label: '베리베리' },
        { image: IMG.classicpig, label: '클래식 피그 핑크' },
      ],
    },
  ],
}
