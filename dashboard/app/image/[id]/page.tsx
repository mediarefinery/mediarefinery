import React from 'react';

export default function ImagePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h2>Image {params.id}</h2>
      <p>Original / optimized metadata and preview will be shown here.</p>
    </div>
  );
}
