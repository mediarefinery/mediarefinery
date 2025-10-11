/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ImageTable from '../../../dashboard/components/ImageTable';

// Provide a simple mock for the images API the component calls
beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ images: [{ id: 1, filename: 'cat.jpg', attachment_url: 'http://example.com/cat.jpg', file_size_bytes: 12345, status: 'optimized', discovered_at: '2025-10-10' }], total: 1 }) } as any)) as any;
});

afterEach(() => {
  // @ts-ignore
  global.fetch.mockRestore?.();
});

describe('ImageTable basic accessibility assertions', () => {
  it('renders filter form with accessible labels and table with caption', async () => {
    render(<ImageTable />);

    // Wait for the fetch to populate the table
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Form should have aria-label
    const form = screen.getByLabelText(/image filters/i);
    expect(form).toBeTruthy();

  // Search button should reference the table via aria-controls
  const search = screen.getByRole('button', { name: /search/i });
  expect(search.getAttribute('aria-controls')).toBe('image-table');

    // The table caption should exist
  const caption = screen.getByText(/image inventory list/i);
  expect(caption).toBeTruthy();

  // The filename link should be present with accessible name (wait for async render)
  const link = await screen.findByRole('link', { name: /open image 1 details/i });
  expect(link.getAttribute('href')).toBe('/dashboard/image/1');
  });
});
