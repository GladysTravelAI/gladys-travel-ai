import { Metadata } from 'next';
import ClientOnly from '@/components/ClientOnly';
import ItineraryPageClient from './ItineraryPageClient';

export const metadata: Metadata = {
  title: 'Your Trip Itinerary — Gladys Travel',
  description: 'Your AI-generated event travel itinerary — complete day-by-day plan, budget breakdown, dining recommendations and insider tips.',
  openGraph: {
    title: 'My Trip Itinerary — Gladys Travel',
    description: 'AI-planned event travel itinerary with flights, hotels, dining and event tickets — all in one place.',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Gladys Travel Itinerary' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Trip Itinerary — Gladys Travel',
    description: 'AI-planned event travel itinerary — day-by-day plan, budget, dining and tickets.',
    images: ['/api/og'],
  },
};

export default function ItineraryPage() {
  return (
    <ClientOnly>
      <ItineraryPageClient />
    </ClientOnly>
  );
}