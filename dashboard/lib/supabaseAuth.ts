import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.SUPABASE_URL

export async function fetchSupabaseUser(token: string | null) {
  if (!SUPABASE_URL || !token) return null

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      // prefer no-cache for fresh user data
      cache: 'no-store',
    })

    if (!res.ok) return null
    const user = await res.json()
    return user
  } catch (err) {
    return null
  }
}

export function parseTokenFromRequest(req: Request) {
  // Accept token in body (login), Authorization header, or cookie 'sb_token'
  const auth = req.headers.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)

  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/\bsb_token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }

  return null
}

export function createSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production'
  // set cookie attributes; Next.js edge and Node support Set-Cookie header
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  return `sb_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
}

export function clearSessionCookie() {
  return `sb_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
