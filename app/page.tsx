'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts';
import Loading from './loading';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/books');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <Loading />;
}
