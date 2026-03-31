"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  pageSize?: number
  searchPlaceholder?: string
  searchColumn?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyState,
  pageSize = 10,
  searchPlaceholder = "Buscar...",
  searchColumn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowSpinner(false)
      return
    }
    const timer = setTimeout(() => setShowSpinner(true), 500)
    return () => clearTimeout(timer)
  }, [isLoading])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={
            (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
          }
          onChange={(e) =>
            table.getColumn(searchColumn)?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
      <Table style={{ tableLayout: "fixed", minWidth: "700px" }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                >
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
          {isLoading && !data.length ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {showSpinner ? (
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Cargando...</span>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyState ?? (
                  <span className="text-sm text-neutral-500">
                    Sin resultados.
                  </span>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Pagination */}
      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Pagina {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
