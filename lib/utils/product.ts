// 성인 상품 판별 — ADULT 컬렉션과 같은 기준(Shopify 태그 `adult`, 대소문자 무시).
// 아동 전용 표시(연령별 사이즈표·어린이제품 KC·사용연령)를 성인 상품에서 끄는 데 쓴다.
export function isAdultProduct(tags: string[]): boolean {
  return tags.some((t) => t.toLowerCase() === 'adult')
}
