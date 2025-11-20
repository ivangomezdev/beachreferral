'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm/LoginForm';
import styles from './page.module.css';

export default function LoginPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className={styles.loginPage__loading}>Loading...</div>;
  if (user) {
    if (userRole === 'vendedor') router.replace('/vendedor/dashboard');
    else if (userRole === 'admin') router.replace('/admin/dashboard');
    else if (userRole === 'owner') router.replace('/owner/dashboard');
    return <div className={styles.loginPage__loading}>Redirecting...</div>;
  }
  return (
    <main className={styles.loginPage}>
      <div className={styles.loginPage__container}>
        <h1>Sales Tracker</h1>
        <LoginForm />
      </div>
    </main>
  );
}