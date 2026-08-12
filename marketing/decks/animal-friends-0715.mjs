// 소재(deck) — ANIMAL FRIENDS 콜라주. 동물 캐릭터 프린트 4종 모음.
// pig-family/mesh-summer/new-abc-skin/summer-collage와 상품 중복 없음(전 이미지 URL 대조 확인).
// 병아리(product-spotlight-0713 단일핀)는 중복 방지 위해 콜라주에서 제외.
// 풍선 공룡(ABC SKIN 622)은 mesh-summer의 핑크 공룡 메쉬 나시(628)와 다른 상품.
// "동물 아동복", "동물 캐릭터 아기옷" 검색 커버리지.

const IMG = {
  octopus: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/1779683772_656125.png?v=1782183836', // 문어
  crocodile:'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000563.png?v=1778568169', // 핑크 악어
  snail:   'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000588.png?v=1778568319', // 달팽이
  dino:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000622.png?v=1782090855', // 풍선 공룡
}

export default {
  slug: 'animal-friends-0715',
  type: 'curation',
  subtype: 'collage',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '동물 친구 프린트 반팔 세트 모음',
    keywords: '동물 아동복, 동물 캐릭터 아기옷, 반팔 세트 아동복, 남녀공용 키즈룩',
    hashtags: ['동물아동복', '동물캐릭터아기옷', '아기반팔세트', '캐릭터아동복', '남녀공용아기옷', 'applebuttercollege'],
    pinDesc: '문어 악어 달팽이 공룡까지, 동물 친구 프린트 반팔 세트 모음. {keywords}. 사이즈 XS–XL.',
    igLead: '동물 친구들 다 모였어요.',
    igFoot: '동물 반팔 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'collage',
      eyebrow: 'ANIMAL FRIENDS',
      title: '동물 친구 프린트\n반팔 세트',
      sub: '캐릭터 반팔+반바지 · 사이즈 XS–XL',
      items: [
        { image: IMG.octopus,   label: '문어' },
        { image: IMG.crocodile, label: '핑크 악어' },
        { image: IMG.snail,     label: '달팽이' },
        { image: IMG.dino,      label: '풍선 공룡' },
      ],
    },
  ],
}
