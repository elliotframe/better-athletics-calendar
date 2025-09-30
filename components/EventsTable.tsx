"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, ColumnDef, flexRender, SortingState, PaginationState, Table,ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table"
import Link from "next/link"





function Pagination({table}: {table: ExtendedTable<EventEntry>}) {
  const pageWindow = 2
  const pages = []
  const fullWindow = pageWindow*2 + 1

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

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
      <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 disabled:opacity-50 text-gray-200 hover:bg-gray-700 transition-colors">
        Prev
      </button>

      {pages.map((p) => {
        return(
          <button key={p} onClick={() => table.setPageIndex(p)} className=
          {p===pageIndex ? "px-3 py-1.5 rounded-md border border-gray-700 bg-gray-200 text-gray-800 hover:bg-gray-100 transition-colors"
                          : "px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"}>
            {p + 1}
          </button>
        )
      })}

      <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 disabled:opacity-50 text-gray-200 hover:bg-gray-700 transition-colors">
        Next
      </button>
    
    </div>
  )
}

function MonthFilterControls({ table }: { table: ExtendedTable<EventEntry> }){

  const [isOpen, setIsOpen] = useState(!(table.month === ''))
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const earliest = table.getEarliest();
  const latest = table.getLatest();

  function getMonthsFirst(earliest: string | null) {
    if (!earliest) {
      return []
    }
    const months = [
      "01", "02", "03", "04", "05", "06",
      "07", "08", "09", "10", "11", "12"
    ]
    const years = getYears();

    if (earliest.substring(0,4) > years[0].toString()) return []
    return months.filter(m => m >= earliest.substring(5,7))
  }

  function getMonthsLast(latest: string | null) {
    if (!latest) {
      return []
    }
    const months = [
      "01", "02", "03", "04", "05", "06",
      "07", "08", "09", "10", "11", "12"
    ]
    const years = getYears();

    if (latest.substring(0,4) < years[1].toString()) return []
    return months.filter(m => m <= latest.substring(5,7))
  }

  function filterByMonth(table: ExtendedTable<EventEntry>, year: string, month: string) {
    table.setMonth(`${year}-${month}`)
    table.setPageIndex(0)
  }

  function resetMonth(table: ExtendedTable<EventEntry>) {
    table.setMonth('')
    table.setPageIndex(0)
  }

  function getYears() {
    const year = new Date().getFullYear();
    return [year, year+1]
  }

  function getYearsAndMonths(earliest: string | null, latest: string | null) {
    const years = getYears();
    const data: Record<number, string[]> = {
      [years[0]]: getMonthsFirst(earliest),
      [years[1]]: getMonthsLast(latest),
    };
    return data;
  }

  return (
    <div className="border border-gray-700 rounded-md overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
      >
        <span>Filter by Month</span>
        <span className="transform transition-transform duration-200">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-gray-800 text-white flex flex-col sm:flex-row sm:justify-start sm:gap-12">
          {Object.entries(getYearsAndMonths(earliest, latest)).map(([year, months]) => (
            <div key={year} className="flex flex-col mb-4 sm:mb-0">
              <span className="font-bold text-gray-300 mb-2">{year}</span>
              <div className="flex flex-wrap gap-2">
                {months.map((month) => {
                  const isSelected = table.month === `${year}-${month}`

                  return (
                    <button key={month} className={`px-3 py-1.5 rounded-md border text-sm transition-colors duration-200
                      ${isSelected
                        ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" }`}
                      onClick={isSelected ? () => resetMonth(table) : () => filterByMonth(table, year, month)}>
                        {month}
                    </button>
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

function TypeFilterControls({ table }: { table: ExtendedTable<EventEntry> }) {
  const searchParams = useSearchParams()
  const currentType = searchParams.get("type") || ""
  const types = Array.from( new Set(table.getOriginalData().map(e => e.type)))

  return (
    <div className="border border-gray-700 rounded-md overflow-hidden mb-4 bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
      <label htmlFor="type-filter" className="font-semibold">Filter by Type:</label>
      <select
        id="type-filter"
        className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
        value={currentType}
        onChange={(e) => table.setType(e.target.value)}
      >
        <option value="">All</option>
        {types.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </div>
  )
}

export interface EventEntry {
  name: string;
  date: string;
  location: string;
  type: string;
  eventId: string;
  url?: string;
}

type ExtendedTable<T> = Table<T> & {
  getEarliest: () => string | null,
  getLatest: () => string | null,
  month: string,
  setMonth: (newMonth: string) => void,
  type: string,
  setType: (newType: string) => void,
  getOriginalData: () => EventEntry[],
}

export default function EventsTable({ events }: { events: EventEntry[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()


  const pageParam = parseInt(searchParams.get("page") || "0", 10)
  const [month, setMonth] = useState(searchParams.get('month') || "")
  const [type, setType] = useState(searchParams.get('type') || "")

  const columns = useMemo<ColumnDef<EventEntry>[]>( () => [
    { accessorKey: "name", header: "Event Name" },
    {
      accessorKey: "date",
      header: "Date",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const rowDate = row.getValue<string>(columnId)
        if (!rowDate) return false
        return rowDate.startsWith(filterValue)
      },
      cell: (info: any) => {
        const val: string = info.getValue()
        if (!val) return ""
        const [year, month, day] = val.split("-")
        return `${day}/${month}/${year}`
      },
    },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "type", header: "Type", 
        filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const rowType = row.getValue<string>(columnId)
        if (!rowType) return false

        return rowType === filterValue
      },
    },
  ],
  []
);

const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: pageParam,
  pageSize: 10,
})
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
  const filters: ColumnFiltersState = []
    filters.push({ id: "type", value: type })
    filters.push({ id: "date", value: month })
  return filters
})


  const table = useReactTable({
    data: events,
    columns,
    state: { pagination, columnFilters },
    initialState: {
      sorting: [{ id: "date", desc: false }],
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const extendedTable: ExtendedTable<EventEntry> = {
    ...table,
    getEarliest: () => {
      if (events.length === 0) return null;
      return events.map((e) => e.date).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    },
    getLatest: () => {
      if (events.length === 0) return null;
      return events.map((e) => e.date).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())[0];
    },
    month,
    type,
    setMonth: (newMonth: string) => {
      setMonth(newMonth)
      setColumnFilters((old) => {
        const otherFilters = old.filter(f => f.id !== "date")
        if (!newMonth) return otherFilters
        return [...otherFilters, { id: "date", value: newMonth }]
      })
    },
    setType: (newType: string) => {
      setType(newType)
      setColumnFilters((old) => {
        const otherFilters = old.filter(f => f.id !== "type")
        if (!newType || newType === 'All') return otherFilters
        return [...otherFilters, { id: "type", value: newType }]
      })
    },
    getOriginalData: () => {return events},
  }

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("page", String(pagination.pageIndex))
    newParams.set("month", extendedTable.month);
    newParams.set('type', extendedTable.type);
    router.replace(`?${newParams.toString()}`)
  }, [pagination.pageIndex, month, type])


  return (
    <div>
      <MonthFilterControls table = {extendedTable} />
      <TypeFilterControls table = {extendedTable} />
      <div className="block sm:hidden">
        <Pagination table = {extendedTable} />
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full table-fixed border-collapse text-sm text-gray-200">
          <colgroup>
            <col className="w-1/3 sm:w-2/5" />
            <col className="w-1/3 sm:w-1/10" />
            <col className="w-1/3 sm:w-3/10" />
            <col className="w-1/3 sm:w-1/5" />
          </colgroup>

          <thead className="bg-sky-700 text-gray-300">
            {extendedTable.getHeaderGroups().map(headerGroup => (
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
            {Array.from({ length: pagination.pageSize }).map((_, rowIndex) => {
              const row = extendedTable.getRowModel().rows[rowIndex]

              return (
                <tr
                  key={row ? row.id : `empty-${rowIndex}`}
                  className={row ? "hover:bg-gray-800 transition-colors duration-200" : ""}
                >
                  {columns.map((column, cellIndex) => {
                  const hideOnMobile = cellIndex === 3 ? "hidden sm:table-cell" : ""
                    if (row) {
                      const cell = row.getVisibleCells()[cellIndex]
                      return (
                        <td key={cell.id} className={`px-4 py-2 border-b border-gray-700 ${hideOnMobile}`}>
                          {cell.column.id === "name" ? (
                            <Link
                              href={row.original.url || `/event/${row.original.eventId}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-150"
                              prefetch={false}
                            >
                              {String(cell.getValue())}
                            </Link>
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      )
                    } else {
                      return <td key={`empty-${cellIndex}`} className={`px-4 py-2 border-b border-gray-700 ${hideOnMobile}`}>&nbsp;</td>
                    }
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="hidden sm:block">
        <Pagination table = {extendedTable}/>
      </div>
    </div>
  )
}
