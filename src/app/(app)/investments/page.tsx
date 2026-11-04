import { Suspense } from "react"
import { getInvestmentsData } from "@/src/lib/data"
import { InvestmentsShell } from "@/src/components/investments/investments-shell"

async function InvestmentsContent() {
  const records = await getInvestmentsData()
  return <InvestmentsShell records={records} />
}

function InvestmentsLoading() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-4 animate-pulse">
      <div className="h-16 w-full rounded-xl bg-muted/40" />
      <div className="h-12 w-64 rounded-xl bg-muted/40" />
      <div className="grid grid-cols-3 gap-3 w-full">
        {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/40" />)}
      </div>
      <div className="flex flex-col gap-2 w-full">
        {[0,1,2,3,4].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/40" />)}
      </div>
    </div>
  )
}

export default function InvestmentsPage() {
  return (
    <Suspense fallback={<InvestmentsLoading />}>
      <InvestmentsContent />
    </Suspense>
  )
}
