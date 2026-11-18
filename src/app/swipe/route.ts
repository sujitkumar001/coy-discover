import { NextRequest, NextResponse } from "next/server";
import { recordSwipe } from "@/lib/db";



export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be an object" },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;
  const { profileId, action } = data;

  if (
    typeof profileId !== "number" ||
    !Number.isSafeInteger(profileId) ||
    (action !== "LIKE" && action !== "PASS")
  ) {
    return NextResponse.json(
      { error: "Valid profileId and LIKE or PASS required" },
      { status: 400 }
    );
  }

  try {
    const result = recordSwipe(profileId, action);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message === "ALREADY_SWIPED") {
      return NextResponse.json(
        { error: "Profile already swiped" },
        { status: 409 }
      );
    }

    if (message === "PROFILE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (message === "INVALID_PROFILE") {
      return NextResponse.json(
        { error: "Invalid profile" },
        { status: 400 }
      );
    }

    console.error("Swipe API error:", error);

    return NextResponse.json(
      { error: "Unable to save swipe" },
      { status: 500 }
    );
  }
}