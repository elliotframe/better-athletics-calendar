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
        <div className="p-4 max-w-2xl mx-auto">
            <div className="mt-4 bg-neutral-900 p-3 rounded-md">
                <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
                <p><strong>Date:</strong> {event.starts}</p>
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
                <hr className="my-2 border-sky-700 mb-6 w-8 border-t-2"></hr>
                <div
                    className="
                        prose max-w-none 
                        [&>p]:mb-6 
                        [&_a]:text-blue-400 
                        [&_a]:hover:text-blue-300 
                        [&_a]:hover:underline
                    "
                    dangerouslySetInnerHTML={{ __html: event.detail }}
                />
            </div>
        </div>
    )
}
