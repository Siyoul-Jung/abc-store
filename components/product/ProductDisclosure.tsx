// 상품정보제공고시 (전자상거래법) + 어린이제품 KC 표시 (어린이제품 안전특별법).
// 한국 판매분 법적 고지 — ko locale에서만 렌더링 (PolicyModal과 동일 원칙).
//
// 값은 전 상품 공통(라벨·시험성적서 기준). 상품별로 달라지는 항목(소재·색상·치수)은
// "상세페이지 참조" 표기 — 고시에서 허용하는 방식. 원단/성적서가 추가되면 KC 행만 갱신.
// 근거 서류: KATRI 시험성적서 KIKO25-00005662 (KOLAS) — 보관 의무 5년, 게시 의무는 없음.

const DISCLOSURE_ROWS: [string, string][] = [
  ['제품 소재', '상품 상세페이지 참조'],
  ['색상', '상품 상세페이지 참조'],
  ['치수', '사이즈 가이드 참조'],
  ['제조자', 'HFFF Co., Ltd. (applebuttercollege)'],
  ['제조국', '중국'],
  ['제조연월', '제품 라벨 별도 표기'],
  ['세탁방법 및 취급시 주의사항', '뒤집어서 세탁, 표백제 사용 금지 (제품 라벨 참조)'],
  ['KC 인증정보', '어린이제품 공급자적합성확인 필 (시험기관 KATRI, 성적서번호 KIKO25-00005662)'],
  ['사용연령', '36개월 이상 ~ 만 13세 이하'],
  ['품질보증기준', '전자상거래법 및 소비자분쟁해결기준에 따름'],
  ['A/S 책임자와 전화번호', 'applebuttercollege · 010-2339-8492 (문의는 Q&A 게시판 이용)'],
]

export default function ProductDisclosure() {
  return (
    <details className="group border-t border-border">
      <summary className="list-none flex items-center justify-between py-4 cursor-pointer select-none gap-6">
        <span className="text-sm font-medium">상품정보제공고시</span>
        <svg width="14" height="14" viewBox="0 0 14 14"
          className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180">
          <path d="M2 5 L7 9.5 L12 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </summary>
      <div className="pb-5">
        <table className="w-full text-xs">
          <tbody>
            {DISCLOSURE_ROWS.map(([label, value]) => (
              <tr key={label} className="border-b border-border last:border-b-0">
                <th scope="row" className="text-left align-top font-normal text-ink-muted py-2 pr-3 w-32 break-keep">
                  {label}
                </th>
                <td className="py-2 text-ink break-words">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
