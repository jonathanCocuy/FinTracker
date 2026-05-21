import { Suspense } from 'react'
import { getGoalsData, getTransactionsData } from "@/src/lib/data"
import { GoalsShell } from "@/src/components/goals/goals-shell"
import GoalsLoading from "./loading"

async function GoalsContent() {
  const [goals, txData] = await Promise.all([
    getGoalsData(),
    getTransactionsData(),
  ])
  return <GoalsShell goals={goals} accounts={txData.accounts} />
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsLoading />}>
      <GoalsContent />
    </Suspense>
  )
}
