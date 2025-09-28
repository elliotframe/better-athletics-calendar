import { db } from "@/lib/firestore";

export async function GET(req: Request) {

    const snapshot = await db.collection("cache").get();

    if (snapshot.empty) {
    return Response.json({ error: "No cached data" }, { status: 404 });
    }

    let events = snapshot.docs.map(doc => doc.data());

    return Response.json(events);
}
