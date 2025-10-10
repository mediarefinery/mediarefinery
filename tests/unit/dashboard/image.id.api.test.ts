import { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../../dashboard/pages/api/images/[id]'
import * as repo from '../../../src/lib/db/repository'
import * as guard from '../../../dashboard/lib/requireAdmin'

describe('images/[id] API', () => {
  const mockReq = (query: Record<string, any>) => ({ query } as unknown as NextApiRequest)
  const mockRes = () => {
    const res: Partial<NextApiResponse> = {}
    res.status = jest.fn(() => res as NextApiResponse)
    res.json = jest.fn(() => res as NextApiResponse)
    return res as NextApiResponse
  }

  beforeAll(() => {
  // mock admin guard to allow the handler to proceed
  jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'test' } })

    ;(jest.spyOn(repo as any, 'getInventoryById') as any).mockImplementation(async (id: number) => {
      if (id === 1) return { id: 1, attachment_url: 'https://cdn/a.jpg', filename: 'a.jpg', file_size_bytes: 100 }
      return null
    })
    ;(jest.spyOn(repo as any, 'getOptimizationsByInventoryId') as any).mockImplementation(async (id: number) => {
      if (id === 1) return [{ id: 10, inventory_id: 1, optimized_url: 'https://cdn/a__opt.webp', filename: 'a__opt.webp', file_size_bytes: 60 }]
      return []
    })
  })

  test('returns inventory and optimizations', async () => {
    const req = mockReq({ id: '1' })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty('inventory')
  })

  test('returns 404 when not found', async () => {
    const req = mockReq({ id: '999' })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})
