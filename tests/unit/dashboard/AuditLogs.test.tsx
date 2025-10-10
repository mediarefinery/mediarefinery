/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import AuditLogs from '../../../dashboard/components/AuditLogs'

jest.mock('../../../dashboard/lib/api', () => ({
  fetchAuditLogs: jest.fn().mockResolvedValue({ items: [{ id: 1, action: 'optimize', actor: 'u1', created_at: '2020-01-01T00:00:00Z', target_type: 'image', target_id: 42, details: { saved: 123 } }] })
}))

test('renders audit logs table', async () => {
  render(<AuditLogs />)
  const title = await screen.findByText('Audit Logs')
  const action = await screen.findByText('optimize')
  expect(title).toBeTruthy()
  expect(action).toBeTruthy()
})
