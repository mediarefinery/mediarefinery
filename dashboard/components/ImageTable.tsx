import React, { useEffect, useState } from 'react';

type ImageRow = {
  id: number;
  attachment_url: string;
  filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  status?: string | null;
  discovered_at?: string | null;
};

export default function ImageTable() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortField, setSortField] = useState('discovered_at');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const perPage = 20;

  async function load() {
    const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  if (statusFilter) params.set('status', statusFilter);
  if (authorFilter) params.set('author', authorFilter);
  if (fromDate) params.set('from', fromDate);
  if (toDate) params.set('to', toDate);
  if (sortField) params.set('sort', sortField);
  if (sortOrder) params.set('order', sortOrder);
  const q = (document.getElementById('image-search') as HTMLInputElement | null)?.value;
  if (q) params.set('q', q);
    const res = await fetch(`/dashboard/api/images?${params.toString()}`);
    const body = await res.json();
    setImages(body.images || []);
    setTotal(body.total || 0);
  }

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  return (
    <div>
      <h3>Images</h3>

      <div style={{ marginBottom: 8 }}>
        <label>
          Status:
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="optimized">optimized</option>
            <option value="skipped">skipped</option>
          </select>
        </label>
        <label style={{ marginLeft: 12 }}>
          Author:
          <input placeholder="author id or name" value={authorFilter} onChange={(e) => { setPage(1); setAuthorFilter(e.target.value); }} style={{ marginLeft: 6 }} />
        </label>
        <label style={{ marginLeft: 12 }}>
          From:
          <input type="date" value={fromDate} onChange={(e) => { setPage(1); setFromDate(e.target.value); }} style={{ marginLeft: 6 }} />
        </label>
        <label style={{ marginLeft: 8 }}>
          To:
          <input type="date" value={toDate} onChange={(e) => { setPage(1); setToDate(e.target.value); }} style={{ marginLeft: 6 }} />
        </label>
        <label style={{ marginLeft: 12 }}>
          Sort:
          <select value={sortField} onChange={(e) => { setPage(1); setSortField(e.target.value); }}>
            <option value="discovered_at">Discovered</option>
            <option value="file_size_bytes">Size</option>
            <option value="filename">Filename</option>
            <option value="id">ID</option>
          </select>
        </label>
        <label style={{ marginLeft: 8 }}>
          Order:
          <select value={sortOrder} onChange={(e) => { setPage(1); setSortOrder(e.target.value as 'asc'|'desc'); }}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
        <label style={{ marginLeft: 12 }}>
          Search:
          <input id="image-search" placeholder="filename or url" style={{ marginLeft: 4 }} />
          <button onClick={() => { setPage(1); load(); }} style={{ marginLeft: 6 }}>Search</button>
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Filename</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Size</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Discovered</th>
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <tr key={img.id}>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{img.id}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
                <a href={`/dashboard/image/${img.id}`}>{img.filename || img.attachment_url}</a>
              </td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{img.file_size_bytes ?? '-'}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{img.status || '-'}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{img.discovered_at || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {Math.max(1, Math.ceil(total / perPage))}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={images.length < perPage}>Next</button>
      </div>
    </div>
  );
}
