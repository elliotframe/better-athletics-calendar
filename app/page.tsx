import { Suspense } from "react"
import EventsTable from "@/components/EventsTable"

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      <Suspense fallback={<div>Loading events table...</div>}>
        <EventsTable />
      </Suspense>
    </div>
  )
}