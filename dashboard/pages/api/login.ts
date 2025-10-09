import { NextApiRequest, NextApiResponse } from 'next'
import { createSessionCookie } from '../../lib/supabaseAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { access_token } = req.body || {}
  if (!access_token) return res.status(400).json({ error: 'missing access_token' })

  // In a real implementation we'd validate token with Supabase and look up user
  const cookie = createSessionCookie(access_token)
  res.setHeader('Set-Cookie', cookie)
  return res.status(200).json({ ok: true })
}
