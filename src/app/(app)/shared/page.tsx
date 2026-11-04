import { Suspense } from 'react'
import { getSharedGroups, getMyFullName } from '@/src/lib/shared-data'
import { claimPendingInvitations } from '@/src/lib/shared-actions'
import { GroupListShell } from '@/src/components/shared/group-list-shell'
import SharedLoading from './loading'

async function SharedContent() {
  await claimPendingInvitations()
  const [groups, myFullName] = await Promise.all([getSharedGroups(), getMyFullName()])
  return <GroupListShell groups={groups} myFullName={myFullName} />
}

export default function SharedPage() {
  return (
    <Suspense fallback={<SharedLoading />}>
      <SharedContent />
    </Suspense>
  )
}
