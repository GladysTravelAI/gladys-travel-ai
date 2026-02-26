import { Metadata } from 'next';
import ClientOnly from '@/components/ClientOnly';
import ItineraryPageClient from './ItineraryPageClient';

export const metadata: Metadata = {
  title: 'Your Itinerary - Gladys Travel AI',
  description: 'Your AI-generated event travel itinerary — day-by-day plan, budget breakdown, dining and tips.',
};

export default function ItineraryPage() {
  return (
    <ClientOnly>
      <ItineraryPageClient />
    </ClientOnly>
  );
}