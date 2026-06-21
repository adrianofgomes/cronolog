'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user?.isAdmin) return;
      try {
        const response = await api.get('/users/admin/pending');
        setPendingCount(response.data.data?.length || 0);
      } catch (err) {
        console.error('Error fetching pending users count:', err);
      }
    };

    fetchPendingCount();
  }, [user]);

  if (!user) return null;

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <img src="/cronolog_logo.svg" alt="Cronolog Logo" className={styles.logoImage} />
        <span>Cronolog</span>
      </Link>
      <div className={styles.userInfo}>
        {user.isAdmin && (
          <Link href="/admin" className={styles.adminLink} title="Painel Administrativo">
            <ShieldCheck size={20} />
            <span>Admin</span>
            {pendingCount > 0 && (
              <span className={styles.badge}>{pendingCount}</span>
            )}
          </Link>
        )}

        {user.picture ? (
          <img src={user.picture} alt={user.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback}><UserIcon size={20} /></div>
        )}
        <span className={styles.userName}>{user.name}</span>
        <button onClick={logout} className={styles.logoutButton} title="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
