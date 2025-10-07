export async function handler(req: any, res: any) {
  const sample = { images: [], page: Number(req.query?.page || 1) };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(sample));
}
