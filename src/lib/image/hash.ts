import crypto from 'crypto';

export async function sha256FromBuffer(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export async function sha256FromStream(stream: NodeJS.ReadableStream) {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// Compute SHA-256 for a fetch URL by streaming the response body (works with WHATWG ReadableStream in Node 18+)
export async function sha256AndSizeFromUrl(url: string): Promise<{ sha256: string; size: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  // Try to use the WHATWG readable stream reader
  const body: any = (res as any).body;
  const hash = crypto.createHash('sha256');
  let size = 0;

  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    while (true) {
      // reader.read() returns a promise resolving to { done, value }
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      hash.update(chunk);
      size += chunk.length;
    }
    return { sha256: hash.digest('hex'), size };
  }

  // Fallback to arrayBuffer
  const buf = Buffer.from(await res.arrayBuffer());
  hash.update(buf);
  size = buf.length;
  return { sha256: hash.digest('hex'), size };
}
