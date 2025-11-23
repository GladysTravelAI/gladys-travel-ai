import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, mode = "driving" } = await req.json();

    // If Google Maps API key is available, use it
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();

        if (data.status === "OK" && data.routes.length > 0) {
          const route = data.routes[0];
          const leg = route.legs[0];

          return NextResponse.json({
            directions: {
              distance: leg.distance.text,
              duration: leg.duration.text,
              mode: mode,
              steps: leg.steps.map((step: any) => 
                step.html_instructions.replace(/<[^>]*>/g, '')
              )
            }
          });
        }
      } catch (error) {
        console.error("Google Maps API error:", error);
      }
    }

    // Return mock directions if API not available
    return NextResponse.json({
      directions: getMockDirections(origin, destination, mode)
    });

  } catch (error) {
    console.error("Error fetching directions:", error);
    return NextResponse.json(
      { error: "Failed to fetch directions" },
      { status: 500 }
    );
  }
}

function getMockDirections(origin: string, destination: string, mode: string) {
  const modeData = {
    driving: {
      distance: "45.2 km",
      duration: "38 mins",
      steps: [
        `Head north on Main Street toward Central Avenue`,
        `Turn right onto Highway 1/N1`,
        `Continue on N1 for 35 km`,
        `Take exit 12 toward ${destination}`,
        `Turn left onto City Boulevard`,
        `Destination will be on the right`
      ]
    },
    transit: {
      distance: "42.8 km",
      duration: "1 hour 15 mins",
      steps: [
        `Walk to ${origin} Station (5 min walk)`,
        `Take the Blue Line train toward City Center`,
        `Transfer at Central Station to Red Line`,
        `Take Red Line for 8 stops`,
        `Exit at ${destination} Station`,
        `Walk 3 minutes to destination`
      ]
    },
    walking: {
      distance: "8.5 km",
      duration: "1 hour 45 mins",
      steps: [
        `Head east on Park Street`,
        `Turn right onto River Road`,
        `Continue straight for 2.5 km`,
        `Turn left onto Beach Avenue`,
        `Follow the coastal path for 4 km`,
        `Destination will be on your left`
      ]
    }
  };

  return modeData[mode as keyof typeof modeData] || modeData.driving;
}