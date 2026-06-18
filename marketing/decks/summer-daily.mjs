// 소재(deck) — 여름 데일리 코디 큐레이션 (1번 템플릿 'curation', 세부 형태: 시즌 모음)
// summer-bestsellers.mjs를 복사해 텍스트만 바꾼 것. 항목 수도 자유(여기선 3개).
// ※ 1번 템플릿에 새 소재 추가가 이렇게 파일 하나로 끝난다는 시연용.

const IMG = {
  skyblue: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000556.png?v=1778568124',
  nine:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000562.png?v=1778568163',
  honey:   'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000560.png?v=1778568150',
}

export default {
  slug: 'summer-daily',
  type: 'curation',   // 카테고리. 세부 형태: 시즌 모음
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '매일 입히기 좋은 여름 데일리 세트 3',
    keywords: '아기 여름 데일리룩, 어린이집 등원룩, 베이비 세트',
    hashtags: ['아동복', '아기옷', '등원룩', '데일리룩', '아기여름옷', '베이비룩', '키즈패션', 'applebuttercollege'],
    pinDesc: '아침마다 고민 없이 입히기 좋은 여름 데일리 세트만 모았어요. {names}. {keywords}. 편하게 매일 입히는 옷.',
    igLead: '아침마다 옷 고민, 데일리로 좋은 것만 추렸어요.',
    igFoot: '반팔+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 →',
  },
  cards: [
    {
      type: 'cover',
      eyebrow: 'SUMMER DAILY',
      title: '매일 입히기 좋은\n여름 데일리\n세트 3',
      sub: '아침 옷 고민 끝',
      image: IMG.nine,
    },
    {
      type: 'rank', rank: 1,
      name: '나인원원 세트',
      desc: '매일 손이 가는\n데일리 스테디셀러',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.nine,
    },
    {
      type: 'rank', rank: 2,
      name: '피그 스카이블루 세트',
      desc: '시원한 컬러로\n여름 내내 활용도 최고',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.skyblue,
    },
    {
      type: 'rank', rank: 3,
      name: '허니베어 세트',
      desc: '포근한 곰돌이로\n남녀아 모두 좋아요',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.honey,
    },
    {
      type: 'cta',
      title: '여름 데일리\n세트 보러가기',
      sub: '지금 만나보기',
    },
  ],
}
