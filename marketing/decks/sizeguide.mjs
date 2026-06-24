// 소재(deck) — 사이즈 가이드 (3번 템플릿 'info', 표 기반)
// 데이터 출처: components/product/SizeGuide.tsx (나이·키·몸무게)
// 표만 바꾸면 소재·세탁 가이드 등 다른 정보형 핀으로도 재사용 가능.

export default {
  slug: 'sizeguide',
  type: 'info',
  link: '/shop/shopbrand.html?xcode=012&mcode=005&type=Y',
  caption: {
    title: '우리 아이 사이즈 찾기 — 나이·키로 한눈에',
    keywords: '아동복 사이즈표, 아기 옷 사이즈, 100 사이즈 몇 살',
    hashtags: ['아동복사이즈', '아기옷사이즈', '사이즈표', '아동복', '아기옷', '육아꿀팁', '키즈패션', 'applebuttercollege'],
    pinDesc: '우리 아이 옷 사이즈, 나이와 키만 알면 한눈에. {keywords}. 저장해두고 주문 전에 확인하세요.',
    igLead: '옷 살 때마다 헷갈리는 사이즈, 저장해두고 보세요.',
    igFoot: '사이즈 XS–XL · 프로필 링크에서 →',
  },
  cards: [
    {
      type: 'info',
      eyebrow: 'SIZE GUIDE',
      title: '우리 아이\n사이즈 찾기',
      sub: '나이 · 키만 알면 한눈에',
      columns: ['사이즈', '나이', '키', '몸무게'],
      rows: [
        ['XS', '1~2세', '80cm', '11kg'],
        ['S', '2~3세', '85cm', '12kg'],
        ['M', '3~4세', '90cm', '13kg'],
        ['L', '4~5세', '100cm', '16kg'],
        ['XL', '5~6세', '110cm', '20kg'],
        ['2XL', '6~7세', '120cm', '22kg'],
        ['3XL', '7~8세', '130cm', '25kg'],
      ],
      tip: '키가 애매하면 한 사이즈 크게 — 아이는 금방 자라요',
    },
  ],
}
