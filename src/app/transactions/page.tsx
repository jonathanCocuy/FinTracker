import { getTransactionsData } from "@/src/lib/data"
import { TransactionsShell } from "@/src/components/transactions/transactions-shell"

export default async function TransactionsPage() {
  const data = await getTransactionsData()
  return <TransactionsShell data={data} />
}
