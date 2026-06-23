// 소재(deck) — 여름 베스트셀러 랭킹 카드뉴스
// 유형: ranking (cover → rank×N → cta). 같은 유형의 새 소재는 이 파일을 복사해 데이터만 교체.
// 이미지: Shopify CDN URL.
// ⚠️ 아래 URL은 재마이그레이션으로 깨졌을 수 있음 — 복구 후 새 Shopify CDN URL로 교체 필요.

const IMG = {
  babypink: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000609.png?v=1778568428',  // 싯피그 베이비 핑크
  skyblue:  'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000608.png?v=1778568422',  // 싯피그 스카이블루
  nine:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000562.png?v=1778568163',
  dino:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000558.png?v=1778568137',
  honey:    'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000560.png?v=1778568150',
}

export default {
  slug: 'summer-bestsellers',
  type: 'curation',     // 카테고리
  subtype: 'ranking',   // 세부 형태: 랭킹(베스트 TOP)
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',   // 핀/캡션 목적지 — 메이크샵 KIDS (UTM 자동 부착)
  caption: {
    title: '올여름 엄마들이 가장 많이 고른 세트 TOP 5',
    keywords: '아기 여름 세트, 베이비 반팔 반바지, 신생아 돌아기 코디',
    hashtags: ['아동복', '아기옷', '아기여름옷', '베이비룩', '아기코디', '돌아기', '신생아옷', '키즈패션', '남아옷', '여아옷', '세트룩', 'applebuttercollege', '애플버터칼리지'],
    // 채널별 복붙 문구 — 비우면 generic 자동 생성. 이 deck은 따뜻한 맘 보이스로 직접 작성.
    pinDesc: '올여름 엄마들이 가장 많이 담은 우리 아이 세트를 모았어요. {names} 등 매일 입히기 좋은 반팔+반바지 세트. 사이즈 XS–XL. {keywords}. 뭐 입힐지 고민된다면 여기서부터.',
    igLead: '뭐 입힐지 고민될 땐, 요즘 엄마들이 제일 많이 담은 세트부터요.',
    igFoot: '반팔+반바지 세트 · 사이즈 XS–XL\n프로필 링크에서 만나보세요 →',
  },
  cards: [
    {
      type: 'cover',
      eyebrow: 'SUMMER BEST',
      title: '올여름, 엄마들이\n가장 많이 고른\n세트 TOP 5',
      sub: '올여름 다들 입힌 그 세트',
      image: IMG.babypink,
    },
    {
      type: 'rank', rank: 1,
      name: '싯피그 베이비 핑크 세트',
      desc: '따뜻한 핑크 톤으로\n여아맘들이 가장 많이 픽',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.babypink,
    },
    {
      type: 'rank', rank: 2,
      name: '싯피그 스카이블루 세트',
      desc: '시원한 블루 톤으로\n남아맘들이 가장 많이 픽',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.skyblue,
    },
    {
      type: 'rank', rank: 3,
      name: '나인원원 세트',
      desc: '매일 입히기 좋은\n데일리 스테디셀러',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.nine,
    },
    {
      type: 'rank', rank: 4,
      name: '핑크 공룡 세트',
      desc: '공룡 좋아하는 우리 아이라면\n무조건 픽',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.dino,
    },
    {
      type: 'rank', rank: 5,
      name: '허니베어 세트',
      desc: '포근한 곰돌이 프린트로\n남녀아 모두 인기',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.honey,
    },
    {
      type: 'cta',
      title: '우리 아이\n여름 세트 찾기',
      sub: '지금 만나보기',
    },
  ],
}
