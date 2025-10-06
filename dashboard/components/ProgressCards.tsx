import React from 'react';

export default function ProgressCards() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Optimized</h3>
        <p>0</p>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Skipped</h3>
        <p>0</p>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Bytes Saved</h3>
        <p>0</p>
      </div>
    </div>
  );
}
