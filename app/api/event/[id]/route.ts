import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // ✅ must await

  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const doc = await db.collection("events").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(doc.data());
}
