"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function DryRunPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const performLoad = useCallback(async (format = 'json') => {
    setLoading(true);
    try {
      const res = await fetch(`/dashboard/api/dry-run?format=${format}`);
      if (!res.ok) throw new Error('Failed to load');
      if (format === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dry-run.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const j = await res.json();
        setReport(j);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // debounced wrapper to prevent rapid repeated requests
  const loadDebounced = useCallback((format = 'json') => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    // 300ms debounce
    debounceRef.current = window.setTimeout(() => performLoad(format), 300);
  }, [performLoad]);

  useEffect(() => { loadDebounced('json'); }, [loadDebounced]);

  return (
    <div style={{ padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Dry-run Report</h2>
        <div>
          <button onClick={() => loadDebounced('json')} disabled={loading} style={{ padding: '6px 10px' }}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button onClick={() => loadDebounced('csv')} disabled={loading} style={{ marginLeft: 8, padding: '6px 10px' }}>Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          {report ? (
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(report.summary || report, null, 2)}</pre>
          ) : (
            <p style={{ margin: 0 }}>No dry-run data available.</p>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Items</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>ID</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Filename</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Original bytes</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Projected bytes</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Savings %</th>
                </tr>
              </thead>
              <tbody>
                {(report?.items || []).map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{it.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{it.filename || it.attachment_url}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{it.file_size_bytes ?? '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{it.projected_bytes ?? '-'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{it.savings_pct ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
