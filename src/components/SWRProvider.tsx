"use client";

import { SWRConfig } from 'swr';
import { useEffect, useState } from 'react';

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000, // 5 seconds
        errorRetryCount: 3,
        errorRetryInterval: 1000,
      }}
    >
      {children}
    </SWRConfig>
  );
}