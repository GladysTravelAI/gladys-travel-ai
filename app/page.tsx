import ClientOnly from '@/components/ClientOnly';
import HomeClient from './HomeClient';

export default function Home() {
  return (
    <ClientOnly>
      <HomeClient />
    </ClientOnly>
  );
}