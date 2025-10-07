export type InventoryItem = {
  id: string | number
  url?: string
  originalBytes: number
  optimizedBytes?: number | null
  status: 'OPTIMIZED' | 'SKIPPED' | 'FAILED'
  reason?: string // skip or fail reason
}

export type VerificationResult = { itemUrl?: string, itemId?: string | number, ok: boolean }

export type FinalSummary = {
  totalItems: number
  optimizedCount: number
  skippedCount: number
  failedCount: number
  totalOriginalBytes: number
  totalOptimizedBytes: number
  totalBytesSaved: number
  percentSaved: number
  avgSavingsPerOptimized: number
  topSkipReasons: Array<{ reason: string, count: number }>
  topFailureReasons: Array<{ reason: string, count: number }>
  verification?: {
    checked: number
    ok: number
    failed: number
    passRate: number
  }
}

function tallyReasons(items: InventoryItem[], status: 'SKIPPED' | 'FAILED') {
  const map = new Map<string, number>()
  for (const it of items) {
    if (it.status === status) {
      const key = (it.reason || 'unknown')
      map.set(key, (map.get(key) || 0) + 1)
    }
  }
  return Array.from(map.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

export function aggregateFinalSummary(items: InventoryItem[], verification?: VerificationResult[]): FinalSummary {
  const totalItems = items.length
  const optimizedCount = items.filter(i => i.status === 'OPTIMIZED').length
  const skippedCount = items.filter(i => i.status === 'SKIPPED').length
  const failedCount = items.filter(i => i.status === 'FAILED').length

  const totalOriginalBytes = items.reduce((s, i) => s + (i.originalBytes || 0), 0)
  const totalOptimizedBytes = items.reduce((s, i) => s + (i.optimizedBytes ?? 0), 0)
  const totalBytesSaved = Math.max(0, totalOriginalBytes - totalOptimizedBytes)

  const percentSaved = totalOriginalBytes > 0 ? (totalBytesSaved / totalOriginalBytes) * 100 : 0
  const avgSavingsPerOptimized = optimizedCount > 0 ? totalBytesSaved / optimizedCount : 0

  const topSkipReasons = tallyReasons(items, 'SKIPPED').slice(0, 5)
  const topFailureReasons = tallyReasons(items, 'FAILED').slice(0, 5)

  let verificationSummary: FinalSummary['verification'] | undefined = undefined
  if (verification) {
    const checked = verification.length
    const ok = verification.filter(v => v.ok).length
    const failed = checked - ok
    const passRate = checked > 0 ? (ok / checked) * 100 : 0
    verificationSummary = { checked, ok, failed, passRate }
  }

  return {
    totalItems,
    optimizedCount,
    skippedCount,
    failedCount,
    totalOriginalBytes,
    totalOptimizedBytes,
    totalBytesSaved,
    percentSaved,
    avgSavingsPerOptimized,
    topSkipReasons,
    topFailureReasons,
    verification: verificationSummary,
  }
}

export default { aggregateFinalSummary }
