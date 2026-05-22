import { createClient, SupabaseClient } from '@supabase/supabase-js'

function lazy(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | undefined
  return new Proxy({} as SupabaseClient, {
    get(_, prop) {
      if (!instance) instance = factory()
      const val = Reflect.get(instance, prop, instance)
      return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(instance) : val
    },
  })
}

export const supabase = lazy(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
)

export const supabaseAdmin = lazy(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
)
