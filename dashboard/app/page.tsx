"use client"
import React from 'react'
import ProgressCards from '../components/ProgressCards'
import dynamic from 'next/dynamic'

const ImageTable = dynamic(() => import('../components/ImageTable'), { ssr: false });

export default function Page() {
  return (
    <div>
      <ProgressCards />
      <section>
        <h2>Recent Activity</h2>
        <p>Placeholder for recent runs and summaries.</p>
      </section>
      <section>
        <ImageTable />
      </section>
    </div>
  )
}
