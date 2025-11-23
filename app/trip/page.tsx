'use client';

import { useState } from "react";
import TripPlannerForm from "@/components/TripPlannerForm";
import type { Itinerary } from '@/components/TripPlannerForm';

export default function Page() {
  const [plan, setPlan] = useState<Itinerary | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Trip Planner</h1>
      <TripPlannerForm onPlan={setPlan} />

      {plan && (
        <div className="mt-6 bg-gray-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Itinerary:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}