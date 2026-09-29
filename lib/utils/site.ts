// 스토어 공개 주소 — 단일 출처. sitemap·robots·canonical·OG(metadataBase)·Meta CAPI·메일 링크가 모두 여기서 읽는다.
// 쇼피파이 헤드리스몰 = shop.applebuttercollege.com (apex applebuttercollege.com은 메이크샵 자사몰 — 병행운영).
// 예전엔 apex가 6곳에 하드코딩돼 sitemap·SEO 주소가 메이크샵몰을 가리켰다. 주소 전환은 env 하나만 바꾸면 된다.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.applebuttercollege.com').replace(/\/+$/, '')
