import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, feature, integrations, monthlyPrice, earlyTesting } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // TODO: Wire to actual backend
    console.log("[Waitlist] New signup:", {
      name,
      email,
      feature,
      integrations,
      monthlyPrice,
      earlyTesting,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist",
    });
  } catch (error) {
    console.error("[Waitlist] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
