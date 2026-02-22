'use client';

import { useAuth } from '@/components/provider/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    const savedWorkspace = localStorage.getItem('selectedWorkspace');
    if (savedWorkspace) {
      router.replace(`/dashboard/workspace/${savedWorkspace}`);
    } else {
      router.replace('/dashboard/workspace');
    }
  }, [session, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}
