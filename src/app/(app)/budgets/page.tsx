import { Suspense } from 'react'
import { getBudgetsData } from "@/src/lib/data"
import { BudgetsShell } from "@/src/components/budgets/budgets-shell"
import BudgetsLoading from "./loading"

async function BudgetsContent() {
  const data = await getBudgetsData()
  return <BudgetsShell data={data} />
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsContent />
    </Suspense>
  )
}
