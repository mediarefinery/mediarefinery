#!/usr/bin/env node
/*
  Seed development Supabase with small sample records.
  Usage:
    cp .env.example .env
    # populate SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
    node scripts/seed-dev.js
*/

const dotenv = require('dotenv');
dotenv.config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function seed() {
  console.log('Seeding development Supabase with sample MediaRefinery records...');

  // Insert two inventory items
  const inventoryRows = [
    {
      attachment_url: 'https://example.com/wp-content/uploads/2020/01/sample-photo.jpg',
      attachment_id: 12345,
      filename: 'sample-photo.jpg',
      mime_type: 'image/jpeg',
      file_size_bytes: 345678,
      sha256: 'deadbeefcafebabe000000000000000000000000000000000000000000000000',
      metadata: { width: 1920, height: 1080, author: 'Alice' }
    },
    {
      attachment_url: 'https://example.com/wp-content/uploads/2021/05/sample-graphic.png',
      attachment_id: 23456,
      filename: 'sample-graphic.png',
      mime_type: 'image/png',
      file_size_bytes: 45678,
      sha256: 'feedface00000000000000000000000000000000000000000000000000000000',
      metadata: { width: 800, height: 600, author: 'Bob' }
    }
  ];

  const { data: invData, error: invError } = await sb.from('media_inventory').insert(inventoryRows).select();
  if (invError) {
    console.error('Failed to insert inventory rows:', invError);
    process.exit(1);
  }
  console.log('Inserted inventory rows:', invData);

  // Insert an optimization for the first inventory row
  const optRow = {
    inventory_id: invData[0].id,
    optimized_url: 'https://example.com/wp-content/uploads/2020/01/sample-photo__opt.webp',
    filename: 'sample-photo__opt.webp',
    mime_type: 'image/webp',
    file_size_bytes: 123456,
    format: 'webp',
    notes: { quality: 75 }
  };

  const { data: optData, error: optError } = await sb.from('media_optimization').insert([optRow]).select();
  if (optError) {
    console.error('Failed to insert optimization row:', optError);
    process.exit(1);
  }
  console.log('Inserted optimization row:', optData);

  // Post rewrite sample
  const { data: prData, error: prError } = await sb.from('post_rewrites').insert([
    {
      post_id: 987,
      original_content: '<p><img src="https://example.com/wp-content/uploads/2020/01/sample-photo.jpg"></p>',
      rewritten_content: '<p><img src="https://example.com/wp-content/uploads/2020/01/sample-photo__opt.webp"></p>',
      mapping: { 'sample-photo.jpg': 'sample-photo__opt.webp' },
      applied_by: 'dev-seed'
    }
  ]).select();
  if (prError) {
    console.error('Failed to insert post_rewrites row:', prError);
    process.exit(1);
  }
  console.log('Inserted post_rewrites row:', prData);

  // Config sample
  const { data: cfgData, error: cfgError } = await sb.from('config').upsert({ key: 'dev:seed', value: { seededAt: new Date().toISOString() } }).select();
  if (cfgError) {
    console.error('Failed to upsert config row:', cfgError);
    process.exit(1);
  }
  console.log('Upserted config row:', cfgData);

  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Unexpected error during seeding:', err);
  process.exit(1);
});
