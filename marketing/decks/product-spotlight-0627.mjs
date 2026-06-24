// 소재(deck) — 06-27 단일 상품핀 배치 (검색 키워드 명확한 상품 3종)
// 데이터 신호: 단일 상품핀·랭킹형이 클릭에서 압도(TOP5 CTR~22%) → standalone 상품핀 위주 전환.
// 각 card = 핀 1장. card별 link(상품 페이지 핸들)로 직행 UTM, searchTag로 핀 검색 노출.
// 가격은 핀 이미지에 미표기(evergreen) — 실시간 가격은 상품 페이지에서.
// 이미지: Shopify CDN URL (Storefront API featuredImage 기준, 2026-06-23 확인).

const IMG = {
  dino:      'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000628.png?v=1782090896',  // MESH SET 핑크 공룡 (나시+반바지)
  truck:     'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000631.png?v=1782090916',  // ABC SKIN 오프로드 트럭 (반팔+반바지)
  pineapple: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000629.png?v=1782090902',  // ABC SKIN 파인애플 (반팔+반바지)
}

// 상품 페이지 직행 링크 — 런칭 전이라 메이크샵 라이브몰 상품 URL(branduid 고유ID).
// 추적용 파라미터(GfDT·search·sort 등)는 evergreen 핀에 박히면 깨질 수 있어 제거, 불변 핵심만.
// 헤드리스 런칭 후 /ko/products/{handle}로 일괄 교체 예정.
const LINK = {
  dino:      '/shop/shopdetail.html?branduid=11331194&xcode=012&mcode=005&type=Y',  // MESH 핑크 공룡
  truck:     '/shop/shopdetail.html?branduid=11331198&xcode=012&mcode=005&type=Y',  // ABC SKIN 오프로드 트럭
  pineapple: '/shop/shopdetail.html?branduid=11331196&xcode=012&mcode=005&type=Y',  // ABC SKIN 파인애플
}

export default {
  slug: 'product-spotlight-0627',
  type: 'product',
  // 덱 공통 링크(개별 card.link 없을 때 폴백) — 메이크샵 KIDS 컬렉션
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '여름 아동복 단일 상품 추천',
    keywords: '여름 아동복 코디, 아기 여름 세트, 베이비 반팔 반바지',
    hashtags: ['아동복', '아기옷', '아기여름옷', '베이비룩', '키즈패션', 'applebuttercollege'],
    pinDesc: '{keywords}. 매일 입히기 좋은 세트. 사이즈 XS–XL.',
  },
  cards: [
    {
      type: 'product',
      searchTag: '공룡 아동복',
      name: '핑크 공룡 메쉬 세트',
      desc: '땀 잘 마르는 메쉬 나시\n물놀이 후 갈아입기 좋은 여름 세트',
      tag: '나시 + 반바지', size: 'XS–XL',
      image: IMG.dino,
      link: LINK.dino,
      hashtags: ['아동복', '아기여름옷', '공룡', '나시', '물놀이룩', '키즈패션', 'applebuttercollege'],
    },
    {
      type: 'product',
      searchTag: '탈것 아동복',
      name: '오프로드 트럭 세트',
      desc: '자동차·트럭 좋아하는 아이라면\n등원룩으로 딱',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.truck,
      link: LINK.truck,
      hashtags: ['아동복', '아기여름옷', '남아옷', '등원룩', '자동차', '키즈패션', 'applebuttercollege'],
    },
    {
      type: 'product',
      searchTag: '과일 패턴 아동복',
      name: '파인애플 세트',
      desc: '상큼한 파인애플 프린트\n여름 데일리룩',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.pineapple,
      link: LINK.pineapple,
      hashtags: ['아동복', '아기여름옷', '여름코디', '파인애플', '데일리룩', '키즈패션', 'applebuttercollege'],
    },
  ],
}
