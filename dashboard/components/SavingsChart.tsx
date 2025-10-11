import React from 'react'

type Point = { label: string; value: number }

export default function SavingsChart({ data = [] }: { data?: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <svg width="400" height="120" viewBox="0 0 400 120" role="img" aria-label="savings chart">
      {data.map((d, i) => {
        const w = 24
        const gap = 8
        const x = 10 + i * (w + gap)
        const h = Math.round((d.value / max) * 80)
        const y = 100 - h
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={w} height={h} fill="#4f46e5" />
            <text x={x + w / 2} y={115} fontSize={10} textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
