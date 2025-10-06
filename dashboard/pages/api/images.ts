import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = Number(req.query.page || 1);
  const sample = { images: [], page };
  res.status(200).json(sample);
}
