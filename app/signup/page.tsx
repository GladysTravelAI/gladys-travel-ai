import ClientOnly from '@/components/ClientOnly';
import SignUpClient from './SignUpClient';

export default function SignUpPage() {
  return (
    <ClientOnly>
      <SignUpClient />
    </ClientOnly>
  );
}