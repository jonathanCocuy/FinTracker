"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { useI18n } from "@/src/lib/i18n"
import { GroupModal } from "./group-modal"
import { Users, ChevronRight, Plus } from "lucide-react"
import type { SharedGroup } from "@/src/lib/shared-data"

export function GroupListShell({ groups, myFullName }: { groups: SharedGroup[]; myFullName: string }) {
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('shared.title')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('shared.subtitle')}</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="rounded-xl gap-1.5">
            <Plus size={16} />
            {t('shared.newGroup')}
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Users size={32} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{t('shared.emptyGroups')}</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">{t('shared.emptyGroupsDesc')}</p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="rounded-xl mt-2">
              {t('shared.newGroup')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map(group => {
              const myMember = group.members.find(m => m.is_me)
              return (
                <Link key={group.id} href={`/shared/${group.id}`}>
                  <div className="group p-5 rounded-2xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <Users size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{group.members.length} {t('shared.members').toLowerCase()}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {group.members.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border/30 bg-muted/40">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}
                          <span className="text-muted-foreground">· {m.share_pct}%</span>
                          {m.is_me && <span className="text-primary font-semibold">({t('shared.me')})</span>}
                        </div>
                      ))}
                    </div>
                    {myMember && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {t('shared.myShare')}: <span className="text-foreground font-medium">{myMember.share_pct}%</span>
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      <GroupModal open={modalOpen} onOpenChange={setModalOpen} myFullName={myFullName} />
    </div>
  )
}
