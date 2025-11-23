import ClientOnly from '@/components/ClientOnly';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <ClientOnly>
      <DashboardClient />
    </ClientOnly>
  );
}