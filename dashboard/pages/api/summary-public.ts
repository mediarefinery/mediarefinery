import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mirror the protected summary but without RBAC for the dashboard UI
  return res.status(200).json({ optimized: 0, skipped: 0, bytes_saved: 0 })
}
