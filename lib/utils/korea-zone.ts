// 시·도 이름(다음 검색 sido / Shopify province) → ISO 3166-2 지역 코드 (CA API zoneCode).
// 부분 문자열 매칭이라 '경기', '경기도', 도로명주소 '경기도 남양주시…' 모두 처리.
export function sidoToZoneCode(sido: string): string {
  const s = sido ?? ''
  if (s.includes('서울')) return 'KR-11'
  if (s.includes('부산')) return 'KR-26'
  if (s.includes('대구')) return 'KR-27'
  if (s.includes('인천')) return 'KR-28'
  if (s.includes('광주')) return 'KR-29'
  if (s.includes('대전')) return 'KR-30'
  if (s.includes('울산')) return 'KR-31'
  if (s.includes('세종')) return 'KR-50'
  if (s.includes('경기')) return 'KR-41'
  if (s.includes('강원')) return 'KR-42'
  if (s.includes('충북') || s.includes('충청북')) return 'KR-43'
  if (s.includes('충남') || s.includes('충청남')) return 'KR-44'
  if (s.includes('전북') || s.includes('전라북')) return 'KR-45'
  if (s.includes('전남') || s.includes('전라남')) return 'KR-46'
  if (s.includes('경북') || s.includes('경상북')) return 'KR-47'
  if (s.includes('경남') || s.includes('경상남')) return 'KR-48'
  if (s.includes('제주')) return 'KR-49'
  return ''
}
