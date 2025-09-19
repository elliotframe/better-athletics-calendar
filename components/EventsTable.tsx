"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import Link from "next/link"

const columns = [
  { accessorKey: "name", header: "Event Name" },
  {
    accessorKey: "date",
    header: "Date",
    cell: (info: any) => {
      const val: string = info.getValue()
      if (!val) return ""
      const [year, month, day] = val.split("-")
      return `${day}/${month}/${year}`
    },
    sortingFn: (rowA: any, rowB: any, columnId: any) => {
      const a = rowA.getValue(columnId)
      const b = rowB.getValue(columnId)
      if (!a) return -1
      if (!b) return 1
      return a.localeCompare(b)
    },
  },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "type", header: "Type" },
]

function Pagination({
  pageIndex,
  pageCount,
  sortField,
  sortDir,
}: {
  pageIndex: number
  pageCount: number
  sortField: string
  sortDir: string
}) {
  const pageWindow = 2
  const pages = []
  const fullWindow = pageWindow*2 + 1

  let start = Math.max(0, pageIndex - pageWindow)
  let end = Math.min(pageCount - 1, pageIndex + pageWindow)
  const diff = (fullWindow) - (end-start+1)
  if (diff > 0) {
    if (pageIndex < pageWindow) {
      end = Math.min(end + diff, pageCount-1)
    }
    if (pageIndex > pageCount-1-pageWindow) {
      start = Math.max(start - diff, 0)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      {/* Prev */}
      {pageIndex > 0 && (
        <Link
          href={`/?page=${pageIndex - 1}&sort=${sortField}_${sortDir}`}
          prefetch={true}
          className="px-3 py-1 border rounded"
        >
          Prev
        </Link>
      )}
      {pageIndex <= 0 && (
        <div className="px-3 py-1 border rounded text-gray-600">Prev</div>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={`/?page=${p}&sort=${sortField}_${sortDir}`}
          prefetch={true}
          className={`px-3 py-1 border rounded ${p === pageIndex ? "bg-gray-200 font-bold" : ""}`}
        >
          {p + 1}
        </Link>
      ))}

      {/* Next */}
      {pageIndex < pageCount - 1 && (
        <Link
          href={`/?page=${pageIndex + 1}&sort=${sortField}_${sortDir}`}
          prefetch={true}
          className="px-3 py-1 border rounded"
        >
          Next
        </Link>
      )}
      {pageIndex >= pageCount - 1 && (
        <div className="px-3 py-1 border rounded text-gray-600">Next</div>
      )}
    </div>
  )
}

export default function EventsTable() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const pageParam = parseInt(searchParams.get("page") || "0", 10)
  const sortParam = searchParams.get("sort") || "date_asc"
  const [sortField, sortDir] = sortParam.split("_")

  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: { sorting: [{ id: sortField, desc: sortDir === "desc" }] },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/events?page=${pageParam + 1}&pageSize=${pageSize}&sortBy=${sortField}&sortDir=${sortDir}`
        )
        const json = await res.json()
        setData(json.events || [])
        setTotal(json.total || 0)
      } catch (err) {
        console.error("Error fetching events:", err)
        setData([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageParam, sortField, sortDir])

  return (
    <div>
      <table className="min-w-full border border-gray-200">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2 border-b border-gray-200">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {data.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 border-b border-gray-200">
                    {cell.column.id === "name" ? (
                      <Link href={`/event/${row.original.docHash}`} className="text-blue-500 hover:underline">
                        {String(cell.getValue())}
                      </Link>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center p-4">
                No events found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        pageIndex={pageParam}
        pageCount={Math.ceil(total / pageSize)}
        sortField={sortField}
        sortDir={sortDir}
      />
      {loading && <div>Loading events...</div>}
    </div>
  )
}
