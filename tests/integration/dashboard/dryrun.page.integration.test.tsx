/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DryRunPage from '../../../dashboard/app/dry-run/page';

describe('DryRunPage integration', () => {
  const sample = {
    summary: { total: 2, total_bytes: 300 },
    items: [
      { id: 1, filename: 'a.jpg', attachment_url: 'https://cdn/a.jpg', file_size_bytes: 100, projected_bytes: 60, savings_pct: 40 },
      { id: 2, filename: 'b.jpg', attachment_url: 'https://cdn/b.jpg', file_size_bytes: 200, projected_bytes: 140, savings_pct: 30 },
    ]
  };

  beforeAll(() => {
    // mock global fetch
    (global as any).fetch = jest.fn((url: string) => {
      return Promise.resolve({ ok: true, json: async () => sample });
    });
  });

  afterAll(() => {
    delete (global as any).fetch;
  });

  test('renders and fetches report', async () => {
    render(<DryRunPage />);
    expect(screen.getByText(/Dry-run Report/i)).toBeInTheDocument();
    // Wait for the summary to appear
    await waitFor(() => expect(screen.getByText(/Summary/i)).toBeInTheDocument());
    // items table rows
    await waitFor(() => expect(screen.getByText('a.jpg')).toBeInTheDocument());
    expect(screen.getByText('b.jpg')).toBeInTheDocument();

    // clicking refresh triggers fetch again
    const refresh = screen.getByText(/Refresh/i);
    fireEvent.click(refresh);
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
  });
});
