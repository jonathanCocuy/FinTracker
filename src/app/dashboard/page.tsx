import { Suspense } from 'react'
import { getDashboardData } from "@/src/lib/data"
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell"
import DashboardLoading from "./loading"

async function DashboardContent() {
  const data = await getDashboardData()
  return <DashboardShell data={data} />
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
