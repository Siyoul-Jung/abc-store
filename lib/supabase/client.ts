import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 공개 클라이언트 (RLS 적용)
export const supabase = createClient(url, anon)

// 서버 전용 클라이언트 (RLS 우회, 서버 액션에서만 사용)
export const supabaseAdmin = createClient(url, service)
