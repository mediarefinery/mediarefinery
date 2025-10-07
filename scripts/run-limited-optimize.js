#!/usr/bin/env node
/*
  Run a limited-scope optimization against pending inventory items.
  Usage: node scripts/run-limited-optimize.js [--limit N] [--no-upload]
*/
require('dotenv').config()
const fs = require('fs')
const { get } = require('node-fetch')
const { listPending, getInventoryById } = require('../src/lib/db/repository')
const { optimizeInventoryItem } = require('../src/lib/image/optimizer')

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function main() {
  const limitArg = process.argv.indexOf('--limit')
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : 2
  const pending = await listPending(limit)
  console.log('Found pending items:', pending.length)
  const results = []
  for (const p of pending) {
    try {
      console.log('Processing', p.id, p.attachment_url)
      const buf = await fetchBuffer(p.attachment_url)
      const ok = await optimizeInventoryItem(p.id, p.attachment_url, buf, p.filename, p.mime_type)
      results.push({ id: p.id, url: p.attachment_url, ok })
    } catch (err) {
      console.error('Error processing', p.id, err)
      results.push({ id: p.id, url: p.attachment_url, ok: false, err: String(err) })
    }
  }
  fs.writeFileSync('./tests/artifacts/limited-optimize.json', JSON.stringify(results, null, 2), 'utf8')
  console.log('Done. Results written to tests/artifacts/limited-optimize.json')
}

main().catch(err => { console.error(err); process.exit(1) })
