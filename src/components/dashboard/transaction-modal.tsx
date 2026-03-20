"use client"

import { useState } from "react"
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
          placeholder="Buscar icono..."
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

// ─── Zod schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  icon: z.string().min(1, "Selecciona un icono"),
  description: z.string().min(2, "La descripción es requerida"),
  amount: z.string().min(1, "Ingresa un monto"),
  category: z.string().min(1, "Selecciona una categoría"),
  type: z.enum(["income", "expense"]),
})

// ─── Modal ────────────────────────────────────────────────────────────────────
export function TransactionModal() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      icon: "",
      description: "",
      amount: "",
      category: "",
      type: "expense",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Datos capturados:", values)
    form.reset()
  }

  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-md gap-2 font-semibold">
          <Plus size={18} />
          Nuevo Movimiento
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[90%] mx-auto sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Registrar Transacción
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">

            {/* Icon picker + Description */}
            <div className="flex flex-row gap-2 items-center justify-center">

              {/* Icon field */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormControl>
                          <IconPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Description field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-1.5">
                    <FormControl>
                      <Input
                        placeholder="Ej. Almuerzo, Suscripción..."
                        className="h-10 bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="w-[37px] h-10 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  >
                    <CalendarIcon />
                    {date ? new Date(date).toLocaleDateString() : <span></span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount + Category */}
            <div className="flex wrap gap-2 items-end">

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Monto
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-10 rounded-md border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0 overflow-hidden">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Categoría
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-md border-border">
                          <SelectValue placeholder="Alimentación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="food">Alimentación</SelectItem>
                        <SelectItem value="transport">Transporte</SelectItem>
                        <SelectItem value="housing">Vivienda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold mt-2">
              Guardar Transacción
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}