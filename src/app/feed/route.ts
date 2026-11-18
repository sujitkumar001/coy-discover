import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getFeed } from "@/lib/db";




export async function GET() {
  await connection();
  try {
    return NextResponse.json(
      { profiles: getFeed() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Feed API error:", error);

    return NextResponse.json(
      { error: "Unable to load profiles" },
      { status: 500 }
    );
  }
}