'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/admin' : '/kasir');
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
        <p className="text-slate-300 font-medium text-sm">Memeriksa autentikasi...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
