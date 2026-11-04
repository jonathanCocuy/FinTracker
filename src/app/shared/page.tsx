import { Suspense } from 'react'
import { getSharedGroups } from '@/src/lib/shared-data'
import { GroupListShell } from '@/src/components/shared/group-list-shell'
import SharedLoading from './loading'

async function SharedContent() {
  const groups = await getSharedGroups()
  return <GroupListShell groups={groups} />
}

export default function SharedPage() {
  return (
    <Suspense fallback={<SharedLoading />}>
      <SharedContent />
    </Suspense>
  )
}
