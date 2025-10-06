export async function fetchSummary() {
  const res = await fetch('/api/summary');
  if (!res.ok) throw new Error('fetchSummary failed');
  return res.json();
}

export async function fetchImages(page = 1) {
  const res = await fetch(`/api/images?page=${page}`);
  if (!res.ok) throw new Error('fetchImages failed');
  return res.json();
}
