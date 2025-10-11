import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SavingsChart from '../../../dashboard/components/SavingsChart'

describe('SavingsChart', () => {
  test('renders bars for data points (server-side)', () => {
    const data = [ { label: 'A', value: 10 }, { label: 'B', value: 20 } ]
    const out = renderToStaticMarkup(<SavingsChart data={data} />)
    expect(out).toContain('savings chart')
    expect(out).toContain('<rect')
  })
})
