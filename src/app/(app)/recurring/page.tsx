import { Suspense } from 'react'
import { getRecurringData } from "@/src/lib/data"
import { RecurringShell } from "@/src/components/recurring/recurring-shell"
import RecurringLoading from "./loading"

async function RecurringContent() {
  const data = await getRecurringData()
  return <RecurringShell {...data} />
}

export default function RecurringPage() {
  return (
    <Suspense fallback={<RecurringLoading />}>
      <RecurringContent />
    </Suspense>
  )
}
