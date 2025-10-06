import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sample = { optimized: 0, skipped: 0, bytesSaved: 0 };
  res.status(200).json(sample);
}
