import EventsPageClient from "./EventsPageClient"
import { EventEntry } from "@/components/EventsTable"

export const metadata = {
  title: "Events Calendar",
}

export default function Page() {
  return <EventsPageClient/>
}
