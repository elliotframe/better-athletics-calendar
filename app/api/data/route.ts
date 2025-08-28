import { db } from "@/lib/firestore";

export async function GET() {
  const doc = await db.collection("cache").doc("latest").get();

  if (!doc.exists) {
    return Response.json({ error: "No cached data found" }, { status: 404 });
  }

  return Response.json(doc.data());
}