'use client';

import { AuthProvider } from '@/lib/AuthContext';
import { ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}