"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function EventDetailPageClient() {
  const params = useParams()
  const id = params.id

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  function formatDate(date: string) {
    const [year, month, day] = date.split("-")
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    if (loading) {
      document.title = "Loading event…"
    } else if (error) {
      document.title = "Event not found"
    } else if (event) {
      document.title = event.name
    }
  }, [loading, error, event])

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/event/${id}`)
        if (!res.ok) throw new Error("Event not found")
        const data = await res.json()
        setEvent(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  if (error) return <div className="text-red-500">{error}</div>
  if (!event) return <div>No event data</div>

  return (
    <div>
      <div className="p-4 max-w-2xl mx-auto text-gray-50">

        <button
          onClick={() => window.location.href = typeof window !== "undefined" ? window.location.origin : ""}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-sm">Home</span>
        </button>

        <div className="mt-4 bg-neutral-900 p-3 rounded-md">
          <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
          <p><strong>Date:</strong> {formatDate(event.starts)}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Address:</strong> {event.address.formatted}</p>
          <p><strong>Category:</strong> {event.category}</p>
          <p className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <strong>Source:</strong>{" "}
            <a href={event.directLink} target="_blank"
               className="text-blue-500 overflow-hidden text-ellipsis whitespace-nowrap block max-w-full">
              {event.directLink}
            </a>
          </p>
        </div>
        <div className="mt-4 bg-neutral-900 p-3 rounded-md">
          <h1 className="text-xl font-semibold mb-2">Details:</h1>
          <hr className="my-2 border-sky-700 mb-6 w-8 border-t-2" />
          <div
            className="
              prose max-w-none
              [&_p]:mb-6
              [&_*]:!text-gray-200
              [&_a]:!text-blue-400
              [&_a:hover]:!text-blue-300
              [&_a:hover]:underline
              [&_*]:!whitespace-normal
            "
            dangerouslySetInnerHTML={{ __html: event.detail }}
          />
        </div>
      </div>
    </div>
  )
}
