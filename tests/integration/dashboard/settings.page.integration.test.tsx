/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SettingsPage from '../../../dashboard/app/settings/page'

describe('Settings page integration', () => {
  beforeAll(() => {
  const getResp = { config: { enableAvif: false, qualityProfile: 'photographic', concurrency: 3, scheduleStart: '09:00', scheduleEnd: '17:00' } };
  (global as any).fetch = jest.fn((url: string, opts?: any) => {
      if (!opts || opts.method === 'GET') return Promise.resolve({ ok: true, json: async () => getResp })
      // POST
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
    })
  })

  afterAll(() => {
    delete (global as any).fetch
  })

  test('loads settings and saves', async () => {
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText(/Enable AVIF generation/i)).toBeInTheDocument())
    const save = screen.getByText(/Save/i)
    fireEvent.click(save)
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())
    expect(screen.getByText(/Saved/i)).toBeInTheDocument()
  })
})
