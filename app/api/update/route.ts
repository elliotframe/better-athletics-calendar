import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import * as admin from "firebase-admin";

export async function GET() {
  // Fetch from external API
  const res = await fetch("https://example.com/data.json");
  const data = await res.json();

  // Store latest data in Firestore
  await db.collection("cache").doc("latest").set({
    data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}