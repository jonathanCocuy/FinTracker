"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/src/lib/i18n"
import { KpiCard, KpiHeroCard, type KpiItem } from "./kpi-cards"
import { CategoryDonut } from "./category-donut"
import { MonthStats } from "./month-stats"
import { createColumns } from "./columns"
import { TransactionTable } from "./transaction-table"
import { TransactionModal } from "./transaction-modal"
import { AccountGrid } from "./account-card"
import { EmptyState } from "@/src/components/ui/empty-state"
import * as LucideIcons from "lucide-react"
import { ArrowUpRight, Wallet, AlertTriangle, CheckCircle2, ChevronRight, Target, TrendingUp, TrendingDown } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts"
import Link from "next/link"
import { AccountModal } from "@/src/components/dashboard/account-modal"
import { ExportMenu } from "@/src/components/dashboard/export-menu"
import { HistoricalTrends } from "@/src/components/dashboard/historical-trends"
import { NetWorthChart } from "@/src/components/dashboard/net-worth-chart"
import { Progress } from "@/src/components/ui/progress"
import type { DashboardData, DashboardTransaction } from "@/src/lib/data"
import { cn } from "@/src/lib/utils"
import { TrmBadge } from "@/src/components/dashboard/trm-badge"


export function DashboardShell({ data }: { data: DashboardData }) {
  const { t, locale } = useI18n()
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<DashboardTransaction | null>(null)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [balancesVisible, setBalancesVisible] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowx-balances-visible")
      if (stored !== null) setBalancesVisible(stored === "true")
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("flowx-balances-visible", String(balancesVisible)) } catch {}
  }, [balancesVisible])

  const categoryColorMap: Record<string, string> = Object.fromEntries(
    data.categories.map(c => [c.name, c.color])
  )

  const hasAccounts = data.accounts.length > 0

  const firstName = data.profile?.full_name || "..."
  const baseCurrency = data.profile?.base_currency ?? 'COP'
  const dateLocale = locale === "en" ? "en-US" : "es-CO"
  const formattedDate = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const kpis: KpiItem[] = [
    {
      label: t("kpis.balanceTotal"),
      tooltip: t("kpis.tooltips.balanceTotal"),
      value: data.totalBalance,
      previousValue: data.prevTotalBalance,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "default",
      currencyCode: baseCurrency,
    },
    {
      label: t("kpis.incomeMonth"),
      tooltip: t("kpis.tooltips.incomeMonth"),
      value: data.currentMonthIncome,
      previousValue: data.prevMonthIncome,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "income",
      currencyCode: baseCurrency,
    },
    {
      label: t("kpis.expensesMonth"),
      tooltip: t("kpis.tooltips.expensesMonth"),
      value: data.currentMonthExpenses,
      previousValue: data.prevMonthExpenses,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "expense",
      currencyCode: baseCurrency,
    },
    {
      label: t("kpis.savingsGoal"),
      tooltip: t("kpis.tooltips.savingsGoal"),
      value: data.currentMonthIncome - data.currentMonthExpenses,
      previousValue: data.prevMonthIncome - data.prevMonthExpenses,
      subtitle: t("kpis.savingsSubtitle"),
      color: "savings",
      currencyCode: baseCurrency,
    },
  ]

  const donutData = data.donutData.map(({ category, value }) => {
    const cat = data.categories.find(c => c.name === category)
    return {
      name: cat?.label ?? t(`categories.${category}`),
      value,
      color: categoryColorMap[category] ?? "#6b7280",
    }
  })

  const columns = createColumns(t, data.accounts, locale, data.categories)

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between w-full px-2 pt-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground/50 tracking-wide">
            {t("dashboard.welcome")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-none">
            {firstName}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formattedDate}
          </p>
        </div>
        <TrmBadge baseCurrency={baseCurrency} />
      </div>

      {/* KPI Layout */}
      <div className="w-full flex flex-col gap-3">
        {/* Balance Total — hero card */}
        <KpiHeroCard item={kpis[0]} visible={balancesVisible} onToggleVisible={() => setBalancesVisible(v => !v)} />

        {/* Separador de sección mensual */}
        <div className="flex flex-col gap-2 mt-1 px-1">
          <p className="text-[11px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            {t("kpis.thisMonth")}
          </p>
          <div className="h-px w-full bg-linear-to-r from-border/50 via-border to-transparent" />
        </div>

        {/* Tarjetas mensuales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard item={kpis[1]} visible={balancesVisible} />
          <KpiCard item={kpis[2]} visible={balancesVisible} />
          <KpiCard item={kpis[3]} visible={balancesVisible} />
        </div>
      </div>

      <AccountGrid
        accounts={data.accounts}
        onHoverAccount={setHoveredAccountId}
        hoveredAccountId={hoveredAccountId}
        showAddButton={hasAccounts}
      />

      {!hasAccounts ? (
        <>
          {/* Banner: no hay cuentas */}
          <div className="w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Wallet size={28} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold font-aeonik-bold">{t("dashboard.noAccountsTitle")}</p>
              <p className="text-sm text-muted-foreground max-w-sm font-aeonik">{t("dashboard.noAccountsDescription")}</p>
            </div>
            <button
              onClick={() => setCreateAccountOpen(true)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t("dashboard.noAccountsCta")}
            </button>
          </div>

          <AccountModal
            open={createAccountOpen}
            onOpenChange={setCreateAccountOpen}
          />
        </>

      ) : (
        <>
          {/* Historical Trends */}
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col gap-2 mt-4 px-2">
              <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                {t("trends.title")}
              </p>
              <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
            </div>
            <HistoricalTrends data={data.incomeVsExpensesMonthly} />
          </div>

          {/* Net Worth History */}
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col gap-2 px-2">
              <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                {t("netWorth.title")}
              </p>
              <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
              <NetWorthChart data={data.netWorthHistory} />
            </div>
          </div>

          {/* Donut + Recent Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex flex-col gap-4 w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.categoryChart")}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <div className="w-full h-[280px]">
                <CategoryDonut data={donutData} />
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.monthStats")}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <MonthStats stats={data.monthStats} t={t} locale={locale} />
            </div>
          </div>

          {/* Budget & Goals Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Budget Widget */}
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("budgets.widget")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <Link
                  href="/budgets"
                  className="group w-full rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200 flex flex-col flex-1"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {data.budgetAlerts.some(b => b.isOver) ? (
                          <AlertTriangle size={15} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        )}
                        <span className="text-sm font-semibold">
                          {data.budgetAlerts.some(b => b.isOver)
                            ? t("budgets.overBudget")
                            : t("budgets.onTrack")}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {t("budgets.widgetLink")}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  {data.budgetAlerts.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {data.budgetAlerts.slice(0, 3).map(alert => (
                        <div key={alert.category} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">
                            {t(`categories.${alert.category}`)}
                          </span>
                          <Progress
                            value={Math.min(alert.percentage, 100)}
                            className="flex-1 h-1.5"
                            indicatorClassName={cn(
                              alert.isOver ? "bg-rose-500" : alert.percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                          />
                          <span className={cn(
                            "text-xs font-bold tabular-nums w-10 text-right shrink-0",
                            alert.isOver ? "text-rose-500" : alert.percentage >= 80 ? "text-amber-500" : "text-muted-foreground/60"
                          )}>
                            {Math.round(alert.percentage)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("budgets.widgetEmpty")}</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        {t("budgets.widgetEmptyCta")}
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  )}
                  </div>
                </Link>
              </div>
            {/* Goals Widget */}
            {/* Investment Widget */}
          {(() => {
            const inv = data.topInvestments
            if (inv.length === 0 || !data.profile?.show_investments) return null
            const currency = data.profile?.base_currency ?? "COP"
            const isUSD = currency === "USD"
            const fmtAmt = (v: number) => new Intl.NumberFormat(isUSD ? "en-US" : "es-CO", {
              style: "currency", currency, maximumFractionDigits: 0,
            }).format(v)
            const relevantInv = inv.filter(r => r.currency === currency)
            const totalMain = relevantInv.reduce((s, r) => s + r.amount, 0)

            // Build monthly cumulative sparkline
            const monthMap: Record<string, number> = {}
            for (const r of [...relevantInv].sort((a, b) => a.date.localeCompare(b.date))) {
              const key = r.date.substring(0, 7)
              monthMap[key] = (monthMap[key] ?? 0) + r.amount
            }
            let cumulative = 0
            const sparkData = Object.entries(monthMap).map(([month, val]) => {
              cumulative += val
              return { month, total: cumulative }
            })
            const sparkTrend = sparkData.length >= 2
              ? sparkData[sparkData.length - 1].total - sparkData[sparkData.length - 2].total
              : 0

            return (
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">{t("investments.widget")}</p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <Link href="/investments" className="group w-full rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200 flex flex-col flex-1">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sparkTrend >= 0
                          ? <TrendingUp size={15} className="text-emerald-500" />
                          : <TrendingDown size={15} className="text-rose-500" />
                        }
                        <span className="text-sm font-semibold">{inv.length} {t("investments.widgetRecords")}</span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {t("investments.widgetLink")}<ChevronRight size={13} />
                      </span>
                    </div>

                    {/* Total + sparkline */}
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{currency}</span>
                        <span className="text-lg font-black tabular-nums leading-tight">{fmtAmt(totalMain)}</span>
                        {sparkData.length >= 2 && (
                          <span className={`text-[11px] font-semibold ${sparkTrend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {sparkTrend >= 0 ? "+" : ""}{fmtAmt(sparkTrend)} {t("dashboard.vsPreviousMonth")}
                          </span>
                        )}
                      </div>
                      {sparkData.length >= 2 && (
                        <div className="h-12 w-28 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <defs>
                                <linearGradient id="invSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Tooltip
                                contentStyle={{ display: "none" }}
                                cursor={false}
                              />
                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#invSparkGrad)"
                                dot={false}
                                isAnimationActive
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })()}

          {data.topGoals.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("goals.title")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <Link
                  href="/goals"
                  className="group w-full rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200 flex flex-col flex-1"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-500">
                        <Target size={15} />
                        <span className="text-sm font-semibold">
                          {t("goals.title")}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {t("dashboard.viewAll")}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {data.topGoals.map(goal => {
                        const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
                        return (
                          <div key={goal.id} className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24 shrink-0 truncate">
                              {(() => {
                                const name = goal.icon
                                const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name] : null
                                return Icon
                                  ? <Icon size={12} className="text-muted-foreground shrink-0" />
                                  : <span className="text-xs shrink-0">{goal.icon || '🎯'}</span>
                              })()}
                              <span className="text-xs text-muted-foreground truncate">{goal.name}</span>
                            </div>
                            <Progress
                              value={percentage}
                              className="flex-1 h-1.5"
                              indicatorClassName="bg-blue-500"
                            />
                            <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0 text-blue-500">
                              {percentage}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Link>
              </div>
            ) : <div />}
          </div>

          {/* Transactions Section */}
          <div className="flex flex-col gap-4 items-left w-full">
            <div className="w-full flex flex-col gap-4 overflow-x-auto">
              <div className="flex flex-row justify-between items-center w-full pr-2">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("dashboard.transactionsTitle")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TransactionModal />
                </div>
              </div>
              {data.transactions.length > 0 ? (
                <>
                  <TransactionTable
                    columns={columns}
                    data={data.transactions.slice(0, 5)}
                    hoveredAccountId={hoveredAccountId}
                    onRowClick={(row) => setEditingTransaction(row as DashboardTransaction)}
                  />
                  <div className="flex justify-end pr-1">
                    <Link
                      href="/transactions"
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {t("dashboard.viewAll")}
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-md border bg-card p-12 flex flex-col items-center justify-center text-center">
                  <EmptyState icon={ArrowUpRight} title={t("dashboard.noTransactions")} />
                </div>
              )}
            </div>
          </div>

          {editingTransaction && (
            <TransactionModal
              transaction={editingTransaction}
              open={true}
              onOpenChange={(open) => { if (!open) setEditingTransaction(null) }}
            />
          )}
        </>
      )}
    </div>
  )
}
