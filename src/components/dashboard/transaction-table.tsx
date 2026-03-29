"use client"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useI18n } from "@/src/lib/i18n"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Transaction } from "@/src/types/transaction.types"
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Propiedad para recibir qué cuenta tiene el mouse encima
  hoveredAccountId?: string | null
}

export function TransactionTable<TData, TValue>({
  columns,
  data,
  hoveredAccountId,
}: DataTableProps<TData, TValue>) {
  const { t } = useI18n()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border bg-card w-full overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground py-3">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              // 1. Extraemos la transacción para verificar el accountId
              // Usamos 'as any' para acceder a la propiedad accountId del objeto genérico TData
              const transaction = row.original as Transaction;
              
              // 2. Lógica de resaltado: 
              // Si hay un hover activo Y esta fila NO pertenece a esa cuenta -> la opacamos
              const isDimmed = hoveredAccountId !== null && transaction.account !== hoveredAccountId;

              return (
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"}
                  className={`
                    transition-all duration-300 border-b border-border/40
                    ${isDimmed 
                      ? "opacity-15 grayscale-80 scale-[0.99] blur-[0.5px]" 
                      : "opacity-100 scale-100 bg-transparent"
                    }
                    ${hoveredAccountId === transaction.account && hoveredAccountId !== null 
                      ? "bg-primary/2 shadow-[inset_2px_0_0_0_var(--color-primary)]" 
                      : ""
                    }
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic text-sm">
                {t("dashboard.noTransactions")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}