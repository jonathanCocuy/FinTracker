import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getSharedGroupDetail } from '@/src/lib/shared-data'
import { GroupShell } from '@/src/components/shared/group-shell'
import SharedGroupLoading from './loading'

async function GroupContent({ id }: { id: string }) {
  const detail = await getSharedGroupDetail(id)
  if (!detail) return notFound()
  return <GroupShell detail={detail} />
}

export default async function SharedGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<SharedGroupLoading />}>
      <GroupContent id={id} />
    </Suspense>
  )
}
