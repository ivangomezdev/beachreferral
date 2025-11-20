'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar/Navbar';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);

  if (loading) return <div>Loading session...</div>;
  return <div><Navbar /><main className="main-container">{children}</main></div>;
}