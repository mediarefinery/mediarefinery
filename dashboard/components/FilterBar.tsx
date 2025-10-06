import React from 'react';

export default function FilterBar() {
  return (
    <div style={{ marginBottom: 12 }}>
      <label>Author: <input /></label>
      <label style={{ marginLeft: 8 }}>Date: <input type="date" /></label>
    </div>
  );
}
