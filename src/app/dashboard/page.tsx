import { getDashboardData } from "@/src/lib/data"
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell"

export default async function Dashboard() {
  const data = await getDashboardData()
  return <DashboardShell data={data} />
}
