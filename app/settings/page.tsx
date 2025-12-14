import ClientOnly from '@/components/ClientOnly';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsClient />
    </ClientOnly>
  );
}