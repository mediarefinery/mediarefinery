export async function handler(req: any, res: any) {
  const sample = { optimized: 0, skipped: 0, bytesSaved: 0 };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(sample));
}
