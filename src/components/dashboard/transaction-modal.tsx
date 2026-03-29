"use client"

import React, { useState } from "react"
import { useI18n } from "@/src/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import * as LucideIcons from "lucide-react"
import { CalendarIcon, Plus, Smile } from "lucide-react"

import { Calendar } from "@/src/components/ui/calendar"

import { Button } from "@/src/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"

// ─── Icon list ────────────────────────────────────────────────────────────────
const ICON_LIST = [
  "ShoppingCart", "Utensils", "Car", "Home", "Heart", "Star",
  "Zap", "Music", "Camera", "Gift", "Coffee", "Plane",
  "Bus", "Train", "Bike", "Dumbbell", "BookOpen", "Briefcase",
  "Monitor", "Smartphone", "Tv", "Wifi", "CreditCard", "Wallet",
  "PiggyBank", "TrendingUp", "ReceiptText", "Package", "Tag", "Repeat",
]

// ─── Icon Picker component ────────────────────────────────────────────────────
function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = ICON_LIST.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const SelectedIcon = value ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className: string }>>)[value] : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="h-10 w-10 shrink-0 bg-background/50 border-border"
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-4 w-4" />
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder={t("transactionModal.searchIcon")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 h-8 text-sm"
        />
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1">
          {filtered.map((name) => {
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className: string }>>)[name]
            if (!Icon) return null
            return (
              <Button
                key={name}
                variant={value === name ? "default" : "ghost"}
                size="icon"
                type="button"
                title={name}
                className="h-9 w-9"
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Formatted number input (es-CO: 1.000.000) ────────────────────────────────
const amountFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function AmountInput({
  value,
  onChange,
  ...props
}: {
  value: string
  onChange: (v: string) => void
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">) {
  const [raw, setRaw] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  React.useEffect(() => {
    if (!isFocused) setRaw(value)
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d.,]/g, "")
    setRaw(v)
    // es-CO: 1.234.567,89 -> strip dots (thousands), keep comma as decimal
    const numStr = v.replace(/\./g, "").replace(",", ".")
    onChange(numStr || "")
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (raw) {
      const num = parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0
      onChange(String(num))
    }
  }

  const displayValue = isFocused
    ? raw
    : value
      ? amountFormatter.format(parseFloat(value) || 0)
      : ""

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      {...props}
    />
  )
}


// ─── Modal ────────────────────────────────────────────────────────────────────
export function TransactionModal() {
  const { t } = useI18n()

  const formSchema = z.object({
    icon: z.string().min(1, t("validation.selectIcon")),
    description: z.string().min(2, t("validation.descriptionRequired")),
    amount: z.string().min(1, t("validation.enterAmount")),
    category: z.string().min(1, t("validation.selectCategory")),
    type: z.enum(["income", "expense"]),
    date: z.date(),
    account: z.string().min(1, t("validation.selectAccount")),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      icon: "",
      description: "",
      amount: "",
      category: "",
      type: "expense",
      date: new Date(),
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Datos capturados:", values)
    form.reset()
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-md gap-2 font-semibold hover:scale-105 transition-transform">
          <Plus size={18} />
          <p className="text-xs">{t("transactionModal.newMovement")}</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95%] mx-auto sm:max-w-[425px] bg-card/95 backdrop-blur-md border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-center sm:text-left">
            {t("transactionModal.title")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-1 text-center">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                    {t("transactionModal.amountLabel")}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="h-14 text-3xl font-bold text-center bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="flex flex-row gap-2 items-center">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <IconPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={t("transactionModal.descriptionPlaceholder")}
                        className="h-10 bg-background/40 border-border/60"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                      {t("transactionModal.categoryLabel")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background/40">
                          <SelectValue placeholder={t("transactionModal.categoryPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="food">{t("categories.food")}</SelectItem>
                        <SelectItem value="transport">{t("categories.transport")}</SelectItem>
                        <SelectItem value="housing">{t("categories.housing")}</SelectItem>
                        <SelectItem value="subscriptions">{t("categories.subscriptions")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                      {t("transactionModal.dateLabel")}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full h-[42px] px-3 justify-start font-normal bg-background/40">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? field.value.toLocaleDateString() : <span>{t("common.pickDate")}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                    {t("transactionModal.accountLabel")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background/40">
                        <SelectValue placeholder={t("transactionModal.accountPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nequi">Nequi</SelectItem>
                      <SelectItem value="bancolombia">Bancolombia</SelectItem>
                      <SelectItem value="nubank">Nubank</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2">
              {t("transactionModal.saveTransaction")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}