"use client"

import { useEffect, useState } from "react"
import EventsTable, { EventEntry } from "@/components/EventsTable"

const CACHE_KEY = "eventsCache"
const CACHE_TIMESTAMP_KEY = "eventsCacheTimestamp"
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24h

export default function Page() {
  const [events, setEvents] = useState<EventEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const now = Date.now()
      const cached = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
  
      if (cached && cachedTimestamp && now - parseInt(cachedTimestamp) < CACHE_DURATION) {
        try {
          const parsed = JSON.parse(cached)
          setEvents(Array.isArray(parsed) ? parsed : Array.isArray(parsed.events) ? parsed.events : [])
          setLoading(false)
          return
        } catch {
          localStorage.removeItem(CACHE_KEY)
          localStorage.removeItem(CACHE_TIMESTAMP_KEY)
        }
      }
  
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const res = await fetch(`${origin}/api/events`)
        if (!res.ok) throw new Error("Failed to fetch events")
        const data = await res.json()
        const eventsData = Array.isArray(data) ? data : Array.isArray(data.events) ? data.events : []
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
  if (events.length === 0) return <div>No events found</div>


  return <EventsTable events={events} />
}
