import { Suspense } from 'react'
import { getTransactionsData } from "@/src/lib/data"
import { TransactionsShell } from "@/src/components/transactions/transactions-shell"
import TransactionsLoading from "./loading"

async function TransactionsContent() {
  const data = await getTransactionsData()
  return <TransactionsShell data={data} />
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsLoading />}>
      <TransactionsContent />
    </Suspense>
  )
}
