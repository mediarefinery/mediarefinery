import { NextApiRequest, NextApiResponse } from 'next'
import { parseTokenFromRequest, fetchSupabaseUser, clearSessionCookie } from '../../lib/supabaseAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie())
    return res.status(200).json({ ok: true })
  }

  const token = parseTokenFromRequest(req as unknown as Request)
  if (!token) return res.status(200).json({ user: null })

  const user = await fetchSupabaseUser(token)
  return res.status(200).json({ user })
}
