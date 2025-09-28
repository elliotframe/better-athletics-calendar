"use client"

import { useEffect, useState } from "react"
import EventsTable, { EventEntry } from "@/components/EventsTable"

const CACHE_KEY = "eventsCache"
const CACHE_TIMESTAMP_KEY = "eventsCacheTimestamp"
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24h

export default function Page() {
  const [events, setEvents] = useState<EventEntry[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const cached = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const now = Date.now()

      if (cached && cachedTimestamp && now - parseInt(cachedTimestamp) < CACHE_DURATION) {
        // Use cached data if less than 24h old
        setEvents(JSON.parse(cached))
        setLoading(false)
        return
      }

      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        const res = await fetch(`${baseUrl}/api/events`)
        if (!res.ok) throw new Error("Failed to fetch events")
        const data = await res.json()
        const eventsData = data.events as EventEntry[]

        // Save to state and localStorage
        setEvents(eventsData)
        localStorage.setItem(CACHE_KEY, JSON.stringify(eventsData))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString())
      } catch (err) {
        console.error("Error fetching events:", err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) return <div>Loading events table…</div>
  if (!events) return <div>No events found</div>

  return (
    <div>
      <EventsTable events={events} />
    </div>
  )
}
