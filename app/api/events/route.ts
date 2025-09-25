import { db } from "@/lib/firestore";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const sortParam = searchParams.get('sort') || "date_asc";
    const [sortBy, sortDir] = sortParam.split("_")

    const type = searchParams.get("type");
    console.log(type)
    const city = searchParams.get("city");
    const after = searchParams.get("after");
    const before = searchParams.get("before");

    const snapshot = await db.collection("cache").get();

    if (snapshot.empty) {
    return Response.json({ error: "No cached data" }, { status: 404 });
    }

    let events = snapshot.docs.map(doc => doc.data());
    const types = Array.from(new Set(events.map(event => event.type))).sort()

    const dates = events.map(event => event.date);
    const earliest = dates.reduce((min, d) => d < min ? d : min, dates[0]);
    const latest = dates.reduce((max, d) => d > max ? d : max, dates[0]);

    if (after) {
        const afterDate = new Date(after);
        events = events.filter(e => new Date(e.date) >= afterDate);
    }

    if (before) {
        const beforeDate = new Date(before);
        events = events.filter(e => new Date(e.date) <= beforeDate);
    }
    
    if (type) {
        events = events.filter(e => e.type?.toLowerCase() === type.toLowerCase());
    }

    events.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
    });

    const start = (page - 1) * pageSize;
    const paginated = events.slice(start, start + pageSize);

    return Response.json({
        page,
        pageSize,
        total: events.length,
        events: paginated,
        earliest,
        latest,
        types,
    });
    }
