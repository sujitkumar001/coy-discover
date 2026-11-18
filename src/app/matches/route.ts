import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getMatches } from "@/lib/db";




export async function GET() {
  await connection();
  try {
    return NextResponse.json(
      { matches: getMatches() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Matches API error:", error);

    return NextResponse.json(
      { error: "Unable to load matches" },
      { status: 500 }
    );
  }
}