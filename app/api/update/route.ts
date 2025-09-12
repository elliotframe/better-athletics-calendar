import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

const getHeaders = () => ({
    accept: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "content-type": "application/json",
    dnt: "1",
    origin: "https://scottishathletics.justgo.com",
    priority: "u=1, i",
    referer:
        "https://scottishathletics.justgo.com/Workbench/r/public/EventsAndBookingsPublic/browse/",
    "x-requested-with": "XMLHttpRequest",
});

const getAddress = () => "https://scottishathletics.justgo.com/WidgetService.mvc/ExecuteWidgetCommandAlt";

const getAllEventsPayload = () => ({
    payload: {
        commands: [
        {
            Id: 1,
            Service: "GDE",
            Method: "FetchObjectsPublic",
            Arguments: [
            "Event",
            {
                Method: "FindEvents",
                key: "",
                Categories: {},
                Provider: [],
                OrderBy: "asc",
                SortBy: "distance",
                PageNumber: 1,
                NumberOfRows: 10000,
                IsShop: false,
                InstallmentAvailable: false,
                SortByRegion: { Lat: "0", Lng: "0" },
            },
            ],
        },
        ],
    },
    paths: ["commands"],
});

const getEventPayload = (eventHash: string) => {
    const json_data = {
        payload: {
        commands: [
            {
            Id: 1,
            Service: "GDE",
            Method: "FetchObjectsPublic",
            Arguments: [
                "Event",
                {
                Method: "GetEventDetails",
                IsShop: false,
                EventDocIdHash: eventHash,
                PreviewMode: false,
                PastEvent: false,
                },
            ],
            },
        ],
        },
        paths: ["commands"],
    };
    return json_data;
};

const formatAddress = (addr: any) => {
    if (!addr) return "";
    return [
      addr.Address1,
      addr.Address2,
      addr.Address3,
      addr.Town,
      addr.County,
      addr.Postcode,
      addr.Country,
    ]
      .filter(Boolean) // remove empty parts
      .join(", ");
};

function parseDateStringToISO(str: string) {
    const match = str.match(/Date\((\d+),(\d+),(\d+)\)/)
    if (!match) return ""
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10)
    const dateObj = new Date(year, month, day)
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,"0")}-${String(dateObj.getDate()).padStart(2,"0")}`
}

export async function GET(req: Request) {

    if (req.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.UPDATE_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = getHeaders();
    const address = getAddress();

    const response = await fetch(address, {
        method: "POST",
        headers,
        body: JSON.stringify(getAllEventsPayload()),
    });
    const allEventsJson = await response.json();

    const eventsSummary: any[] =
        allEventsJson[0]?.Result?.Result?.Data?.map((e: any) => ({
        id: e.DocId,
        name: e.EventName ?? "",
        date: parseDateStringToISO(e.Starts?.Date),
        location: e.Location ?? "",
        type: e.EventCategory ?? "",
        docHash: e.EventDocIdHash,
        })) || [];

    for (const event of eventsSummary) {
        const detailPayload = getEventPayload(event.docHash);
        const detailRes = await fetch(address, {
        method: "POST",
        headers,
        body: JSON.stringify(detailPayload),
        });
        const detailJson = await detailRes.json();
        const detail =
        detailJson[0]?.Result?.Result?.EventInfo;

        if (!detail) continue;

    await db.collection("cache").doc(detail.EventDocIdHash).set({
        id: detail.DocId,
        name: detail.EventName ?? "",
        date: parseDateStringToISO(detail.Starts?.Date),
        location: detail.EventLocation ?? "",
        type: detail.EventCategory ?? "",
        docHash: detail.EventDocIdHash,
        });

    await db.collection("events").doc(detail.EventDocIdHash).set({
        id: detail.DocId,
        name: detail.EventName ?? "",
        starts: parseDateStringToISO(detail.Starts?.Date),
        ends: parseDateStringToISO(detail.Ends?.Date),
        location: detail.EventLocation ?? "",
        latlng: detail.Latlng ?? "",
        address: {
            raw: detail.Address,
            formatted: formatAddress(detail.Address),
          },
        detail: detail.EventDetail ?? "",
        category: detail.EventCategory ?? "",
        directLink: detail.DirectLink ?? "",
        docHash: detail.EventDocIdHash,
      });
  }

    return NextResponse.json({
        success: true,
        totalEvents: eventsSummary.length,
    });
}
