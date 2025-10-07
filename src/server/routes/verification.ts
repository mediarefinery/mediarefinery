// Summarize verification results for dashboard consumption
export type VerificationRecord = { itemUrl?: string, itemId?: string | number, ok: boolean, statusCode?: number, attempts?: number }

export function summarizeVerification(records: VerificationRecord[]) {
  const total = records.length
  const ok = records.filter(r => r.ok).length
  const failed = total - ok
  const byStatus: Record<string, number> = {}
  for (const r of records) {
    const key = r.statusCode ? String(r.statusCode) : (r.ok ? '200' : 'error')
    byStatus[key] = (byStatus[key] || 0) + 1
  }
  const topFailed = records.filter(r => !r.ok).slice(0, 10).map(r => ({ url: r.itemUrl, id: r.itemId, attempts: r.attempts, statusCode: r.statusCode }))
  return { total, ok, failed, passRate: total > 0 ? (ok / total) * 100 : 0, byStatus, topFailed }
}

export async function verificationSummaryHandler(req: any, res: any) {
  try {
    const records: VerificationRecord[] = req.body?.records || []
    const summary = summarizeVerification(records)
    return res.json(summary)
  } catch (err) {
    return res.status?.(500)?.json?.({ error: String(err) })
  }
}

export default { summarizeVerification, verificationSummaryHandler }
