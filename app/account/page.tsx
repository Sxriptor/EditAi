"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '../tabs/Account';
import { useAuth } from '@/lib/auth-context';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show nothing while loading or if not authenticated
  if (loading || !user) {
    return null;
  }

  return (
    <Account
      user={user}
      exportQueue={[]}
      batchProcessing={false}
      processingProgress={0}
      projectTemplates={[]}
      navigateToAuth={() => router.push('/auth')}
      loadTemplate={() => {}}
    />
  );
} 