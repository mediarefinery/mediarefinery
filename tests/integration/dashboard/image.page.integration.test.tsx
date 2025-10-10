/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import ImagePage from '../../../dashboard/app/image/[id]/page'

describe('Image detail page integration', () => {
  const sample = { inventory: { id: 1, filename: 'a.jpg', attachment_url: 'https://cdn/a.jpg', file_size_bytes: 100 }, optimizations: [{ id: 10, inventory_id: 1, optimized_url: 'https://cdn/a__opt.webp', filename: 'a__opt.webp', file_size_bytes: 60 }] }

  beforeAll(() => {
    (global as any).fetch = jest.fn((url: string) => {
      return Promise.resolve({ ok: true, json: async () => sample })
    })
  })

  afterAll(() => {
    delete (global as any).fetch
  })

  test('renders inventory and optimizations', async () => {
    // The page component expects params prop
    render(<ImagePage params={{ id: '1' }} />)
    expect(screen.getByText(/Loading image 1/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Filename:/i)).toBeInTheDocument())
    expect(screen.getByText('a.jpg')).toBeInTheDocument()
    // bytes saved and reduction
    await waitFor(() => expect(screen.getByText(/Bytes saved/i)).toBeInTheDocument())
    expect(screen.getByText(/Reduction/i)).toBeInTheDocument()
    // optimization filename and thumbnail
    expect(screen.getByText('a__opt.webp')).toBeInTheDocument()
    const thumb = screen.getByAltText('a__opt.webp') || screen.getByAltText('')
    expect(thumb).toBeInTheDocument()
  })
})
