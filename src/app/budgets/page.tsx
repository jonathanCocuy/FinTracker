import { getBudgetsData } from "@/src/lib/data"
import { BudgetsShell } from "@/src/components/budgets/budgets-shell"

export default async function BudgetsPage() {
  const data = await getBudgetsData()
  return <BudgetsShell data={data} />
}
