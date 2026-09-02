// 소재(deck) — 07-13 단일 상품핀 (7월 물놀이 성수기 정타 상품 1종)
// 데이터 신호: 단일 상품핀·랭킹형이 클릭에서 압도 → standalone 상품핀 위주 전환 유지.
// card = 핀 1장. searchTag로 핀 검색 노출, 가격은 미표기(evergreen).
// 이미지: Shopify CDN URL (Storefront API featuredImage 기준).

const IMG = {
  chick: 'https://cdn.shopify.com/s/files/1/0787/0916/2212/files/001000000589.png?v=1778568325',  // ABC SKIN 병아리 튜브 (반팔+반바지)
}

export default {
  slug: 'product-spotlight-0713',
  type: 'product',
  // 병아리 튜브 branduid 미확인 → 직상품 링크 대신 KIDS 브랜드 컬렉션 폴백 링크(덱 공통).
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '병아리 튜브 세트 · 물놀이룩 아동복',
    keywords: '물놀이룩 아동복, 아기 여름옷, 병아리 반팔 세트',
    hashtags: ['물놀이룩', '아기여름옷', '병아리', '아동복', '여름코디', '키즈패션', 'applebuttercollege'],
    pinDesc: '수영튜브 안은 병아리 프린트 반팔+반바지 세트. {keywords}. 사이즈 XS–XL.',
  },
  cards: [
    {
      type: 'product',
      searchTag: '물놀이룩 아동복',
      name: '병아리 튜브 세트',
      desc: '수영튜브 안은 병아리 프린트\n물놀이·여름 나들이룩',
      tag: '반팔 + 반바지', size: 'XS–XL',
      image: IMG.chick,
      hashtags: ['물놀이룩', '아기여름옷', '병아리', '아동복', '여름코디', '키즈패션', 'applebuttercollege'],
    },
  ],
}
