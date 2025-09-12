"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function EventDetailPage() {
    const params = useParams()
    const id = params.id

    const [event, setEvent] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

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

    if (loading) return <div>Loading event details...</div>
    if (error) return <div className="text-red-500">{error}</div>
    if (!event) return <div>No event data</div>

    return (
        <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
        <p><strong>Date:</strong> {event.starts} – {event.ends}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Address:</strong> {event.address.formatted}</p>
        <p><strong>Category:</strong> {event.category}</p>
        <p>
            <strong>Direct link:</strong>{" "}
            <a href={event.directLink} target="_blank" className="text-blue-500">
            {event.directLink}
            </a>
        </p>
        <div className="mt-4">
            <h2 className="font-semibold mb-1">Details:</h2>
            <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: event.detail }}
            />
            </div>
        </div>
    )
}
