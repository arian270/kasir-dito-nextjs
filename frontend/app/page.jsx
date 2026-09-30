'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace('/login');
    else router.replace(user?.role === 'admin' ? '/admin' : '/kasir');
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p className="text-sm text-slate-300">Memuat...</p>
    </div>
  );
}
