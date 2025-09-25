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
  beforeParam,
  afterParam,
  typeParam,
}: {
  pageIndex: number
  pageCount: number
  sortField: string
  sortDir: string
  beforeParam: string
  afterParam: string
  typeParam: string
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
    <div className="flex items-center gap-2 mt-6 mb-4 justify-center">
      {/* Prev */}
      {pageIndex > 0 ? (
        <Link
          href={`/?page=${pageIndex - 1}&sort=${sortField}_${sortDir}&before=${beforeParam}&after=${afterParam}&type=${typeParam}`}
          prefetch={true}
          className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
        >
          Prev
        </Link>
      ) : (
        <div className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900 text-gray-600">
          Prev
        </div>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={`/?page=${p}&sort=${sortField}_${sortDir}&before=${beforeParam}&after=${afterParam}&type=${typeParam}`}
          prefetch={true}
          className={`px-3 py-1.5 rounded-md border transition-colors ${
            p === pageIndex
              ? "bg-blue-500 border-blue-500 text-white font-semibold"
              : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
          }`}
        >
          {p + 1}
        </Link>
      ))}

      {/* Next */}
      {pageIndex < pageCount - 1 ? (
        <Link
          href={`/?page=${pageIndex + 1}&sort=${sortField}_${sortDir}&before=${beforeParam}&after=${afterParam}&type=${typeParam}`}
          prefetch={true}
          className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
        >
          Next
        </Link>
      ) : (
        <div className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900 text-gray-600">
          Next
        </div>
      )}
    </div>
  )
}

function MonthFilterControls({
  pageIndex,
  pageCount,
  sortField,
  sortDir,
  beforeParam,
  afterParam,
  typeParam,
  earliest,
  latest,
}: {
  pageIndex: number
  pageCount: number
  sortField: string
  sortDir: string
  beforeParam: string
  afterParam: string
  typeParam: string
  earliest: string
  latest: string
}){

  const [isOpen, setIsOpen] = useState(false)
  
  function getMonthsFirst(earliest: string) {
    const months = [
      "01", "02", "03", "04", "05", "06",
      "07", "08", "09", "10", "11", "12"
    ]
    const years = getYears();

    if (earliest.substring(0,4) > years[0].toString()) return []
    return months.filter(m => m >= earliest.substring(5,7))
  }

  function getMonthsLast(latest: string) {
    const months = [
      "01", "02", "03", "04", "05", "06",
      "07", "08", "09", "10", "11", "12"
    ]
    const years = getYears();

    if (latest.substring(0,4) < years[1].toString()) return []
    return months.filter(m => m <= latest.substring(5,7))
  }

  function getYears() {
    const year = new Date().getFullYear();
    return [year, year+1]
  }

  function getYearsAndMonths(earliest: string, latest: string) {
    const years = getYears();
    const data: Record<number, string[]> = {
      [years[0]]: getMonthsFirst(earliest),
      [years[1]]: getMonthsLast(latest),
    };
    return data;
  }

  function getLastDayOfMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate()
  }

  function getSelectedMonth(beforeParam: string) {
    return afterParam.substring(5,7)
  }

  return (
    <div className="border border-gray-700 rounded-md overflow-hidden mb-4">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
      >
        <span>Filter by Month</span>
        <span className="transform transition-transform duration-200">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="px-4 py-3 bg-gray-800 text-white flex flex-col sm:flex-row sm:justify-start sm:gap-12">
          {Object.entries(getYearsAndMonths(earliest, latest)).map(([year, months]) => (
            <div key={year} className="flex flex-col mb-4 sm:mb-0">
              <span className="font-bold text-gray-300 mb-2">{year}</span>
              <div className="flex flex-wrap gap-2">
                {months.map((month) => {
                  const isSelected = getSelectedMonth(beforeParam) === month
                  const href = isSelected
                    ? `/?page=0&sort=${sortField}_${sortDir}`
                    : `/?page=0&sort=${sortField}_${sortDir}&after=${year}-${month}-01&before=${year}-${month}-${getLastDayOfMonth(Number(year), Number(month)).toString().padStart(2, '0')}&type=${typeParam}`

                  return (
                    <Link
                      key={month}
                      href={href}
                      prefetch={true}
                      className={`px-3 py-1.5 rounded-md border text-sm transition-colors duration-200
                        ${isSelected
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                        }`}
                    >
                      {month}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeFilterControls({
  types,
  pageIndex,
  sortField,
  sortDir,
  beforeParam,
  afterParam
}: {
  types: string[]
  pageIndex: number
  sortField: string
  sortDir: string
  beforeParam: string
  afterParam: string
}) {
  const searchParams = useSearchParams()
  const currentType = searchParams.get("type") || ""

  return (
    <div className="border border-gray-700 rounded-md overflow-hidden mb-4 bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
      <label htmlFor="type-filter" className="font-semibold">Filter by Type:</label>
      <select
        id="type-filter"
        className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
        value={currentType}
        onChange={(e) => {
          const selectedType = e.target.value
          const params = new URLSearchParams(searchParams.toString())
          if (selectedType) {
            params.set("type", selectedType)
          } else {
            params.delete("type")
          }
          params.set("page", "0") // reset page
          params.set("sort", `${sortField}_${sortDir}`)
          if (beforeParam) params.set("before", beforeParam)
          if (afterParam) params.set("after", afterParam)
          window.location.href = `/?${params.toString()}`
        }}
      >
        <option value="">All</option>
        {types.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </div>
  )
}



export default function EventsTable() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const pageParam = parseInt(searchParams.get("page") || "0", 10)
  const sortParam = searchParams.get("sort") || "date_asc"
  const [sortField, sortDir] = sortParam.split("_")
  const beforeParam = searchParams.get('before') || ""
  const afterParam = searchParams.get('after') || ""
  const typeParam = searchParams.get('type') || ""

  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [earliest, setEarliest] = useState("")
  const [latest, setLatest] = useState("")
  const [types, setTypes] = useState<any[]>([])
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
          `/api/events?page=${pageParam + 1}&pageSize=${pageSize}&sort=${sortField}_${sortDir}&before=${beforeParam}&after=${afterParam}&type=${typeParam}`
        )
        const json = await res.json()
        setData(json.events || [])
        setTotal(json.total || 0)
        setEarliest(json.earliest)
        setLatest(json.latest)
        setTypes(json.types)
      } catch (err) {
        console.error("Error fetching events:", err)
        setData([])
        setTotal(0)
        setEarliest("")
        setLatest("")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageParam, sortField, sortDir, beforeParam, afterParam])

  return (
    <div>
      <MonthFilterControls pageIndex={pageParam}
        pageCount={Math.ceil(total / pageSize)}
        sortField={sortField}
        sortDir={sortDir}
        beforeParam={beforeParam}
        afterParam={afterParam}
        typeParam={typeParam}
        earliest={earliest}
        latest={latest}
      />
      <TypeFilterControls
        types={types}
        pageIndex={pageParam}
        sortField={sortField}
        sortDir={sortDir}
        beforeParam={beforeParam}
        afterParam={afterParam}
      />
      <Pagination
        pageIndex={pageParam}
        pageCount={Math.ceil(total / pageSize)}
        sortField={sortField}
        sortDir={sortDir}
        beforeParam={beforeParam}
        afterParam={afterParam}
        typeParam={typeParam}
      />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full table-fixed border-collapse text-sm text-gray-200">
          <colgroup>
            <col className="w-1/3 sm:w-2/5" />
            <col className="w-1/3 sm:w-1/5" />
            <col className="w-1/3 sm:w-1/5" />
            <col className="w-1/3 sm:w-1/5" />
          </colgroup>

          <thead className="bg-gray-900 text-gray-300">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`px-4 py-2 border-b border-gray-700 text-left font-semibold uppercase tracking-wider text-xs min-w-[80px]
                      ${idx === 3 ? "hidden sm:table-cell" : ""}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {Array.from({ length: pageSize }).map((_, rowIndex) => {
              const row = table.getRowModel().rows[rowIndex]
              return (
                <tr key={rowIndex} className={row ? "hover:bg-gray-800 transition-colors duration-200" : ""}>
                  {Array.from({ length: columns.length }).map((_, cellIndex) => {
                    if (row) {
                      const cell = row.getVisibleCells()[cellIndex]
                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-2 border-b border-gray-700 ${cellIndex === 3 ? "hidden sm:table-cell" : ""}`}
                        >
                          {cell.column.id === "name" ? (
                            <Link
                              href={row.original.url ? row.original.url : `/event/${row.original.eventId}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-150"
                            >
                              {String(cell.getValue())}
                            </Link>
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      )
                    } else {
                      return <td key={cellIndex} className={`px-4 py-2 border-b border-gray-700 ${cellIndex === 3 ? "hidden sm:table-cell" : ""}`}>&nbsp;</td>
                    }
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {loading && <div>Loading events...</div>}
    </div>
  )
}
