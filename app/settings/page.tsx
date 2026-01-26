import { Metadata } from 'next';
import ClientOnly from '@/components/ClientOnly';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings - Gladys Travel AI',
  description: 'Manage your account settings, preferences, and travel defaults',
};

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsClient />
    </ClientOnly>
  );
}