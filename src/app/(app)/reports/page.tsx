import { Suspense } from 'react'
import { getReportsData } from '@/src/lib/data'
import { ReportsShell } from '@/src/components/reports/reports-shell'
import ReportsLoading from './loading'

interface Props {
  searchParams: Promise<{ year?: string }>
}

async function ReportsContent({ year }: { year?: number }) {
  const data = await getReportsData(year)
  return <ReportsShell data={data} />
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : undefined
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent year={year} />
    </Suspense>
  )
}
