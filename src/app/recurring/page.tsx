import { getRecurringData } from "@/src/lib/data"
import { RecurringShell } from "@/src/components/recurring/recurring-shell"

export default async function RecurringPage() {
  const data = await getRecurringData()
  return <RecurringShell {...data} />
}
