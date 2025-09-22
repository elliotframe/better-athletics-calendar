import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import crypto from "crypto";
import fetch from "node-fetch";
import cheerio from "cheerio";
import { getBMCFixtures, scrapeBMCEvent } from "@/lib/getBMC";


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
      .filter(Boolean)
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

function makeEventIdSA(name: string, date: string, dochash: string) {
    return crypto
      .createHash("md5") // or sha256
      .update((name ?? "") + (date ?? "") + (dochash ?? ""))
      .digest("hex");
  }

function makeEventIdBMC(name: string, date: string) {
    return crypto
      .createHash("md5") // or sha256
      .update((name ?? "") + (date ?? ""))
      .digest("hex");
  }

export async function GET(req: Request) {

    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("key");
    if (apiKey !== process.env.UPDATE_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

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
        
        const eventId = makeEventIdSA(detail.EventName, parseDateStringToISO(detail.Starts?.Date), detail.EventDocIdHash)

        await db.collection("cache").doc(eventId).set({
            name: detail.EventName ?? "",
            date: parseDateStringToISO(detail.Starts?.Date),
            location: detail.EventLocation ?? "",
            type: detail.EventCategory ?? "",
            url: `${baseUrl}/events/${eventId}`,
            eventId: eventId,
            });

        await db.collection("events").doc(eventId).set({
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

    const links = await getBMCFixtures();

    for (const url of links){
        const event = await scrapeBMCEvent(url);
        
        const eventId = makeEventIdBMC(event.name, event.date)

        await db.collection("cache").doc(eventId).set({
            name: event.name,
            date: event.date,
            location: event.location,
            type: event.type,
            url: event.url,
            eventId: eventId,
        })
    }


    return NextResponse.json({
        success: true,
        totalEvents: eventsSummary.length,
    });
}
