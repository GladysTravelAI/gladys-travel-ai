import { NextRequest, NextResponse } from "next/server";
import { getUserBookings } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    // Get userId from headers or query params
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const bookings = await getUserBookings(userId);

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}