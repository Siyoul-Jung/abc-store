import { cookies } from 'next/headers'

// 관리자 전용 서버 액션 인증 가드.
// 서버 액션은 사실상 공개 POST 엔드포인트라, 관리자 페이지 가드만으로는 부족하다.
// 관리자 쓰기 액션은 액션 내부에서도 admin_auth 쿠키를 직접 검증한다(관리자 페이지와 동일 기준).
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_auth')?.value !== process.env.ADMIN_SECRET) {
    throw new Error('관리자 인증이 필요합니다.')
  }
}
