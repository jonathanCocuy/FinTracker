import { getGoalsData, getTransactionsData } from "@/src/lib/data"
import { GoalsShell } from "@/src/components/goals/goals-shell"

export default async function GoalsPage() {
  const [goals, txData] = await Promise.all([
    getGoalsData(),
    getTransactionsData(), // For the accounts to deduct from
  ])

  return <GoalsShell goals={goals} accounts={txData.accounts} />
}
