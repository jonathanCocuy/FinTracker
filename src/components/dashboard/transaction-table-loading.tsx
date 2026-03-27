import { Skeleton } from "@/src/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"

export function TransactionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border bg-card w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Imitamos las cabeceras comunes de tu tabla */}
            <TableHead className="w-[100px]"><Skeleton className="h-3 w-16" /></TableHead>
            <TableHead><Skeleton className="h-3 w-24" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-3 w-16 ml-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* El círculo del icono de categoría */}
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    {/* La descripción de la transacción */}
                    <Skeleton className="h-3 w-24 nm:w-32" />
                    {/* El subtexto (fecha o cuenta) */}
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              </TableCell>
              {/* Celda vacía para mantener el espaciado si tienes más columnas */}
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="text-right">
                {/* El monto de la transacción */}
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}