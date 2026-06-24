'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, ShieldCheck, Menu, X, Calendar, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className={styles.leftSection}>
        <button className={styles.menuButton} onClick={() => setIsMenuOpen(true)}>
          <Menu size={24} />
        </button>

        <Link href="/" className={styles.logo}>
          <img src="/cronolog_logo.svg" alt="Cronolog Logo" className={styles.logoImage} />
          <span>Cronolog</span>
        </Link>
      </div>
      
      {isMenuOpen && (
        <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div className={styles.menuContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.menuTopHeader}>
              <h2 className={styles.menuTitle}>Menu</h2>
              <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.menuUser}>
              {user.picture ? (
                <img src={user.picture} alt={user.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}><UserIcon size={20} /></div>
              )}
              <div className={styles.userInfoWrapper}>
                <span className={styles.userName}>{user.name}</span>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className={styles.menuLogoutButton}>
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
            
            <Link href="/" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/scheduled" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
              <Calendar size={20} />
              <span>Agendados</span>
            </Link>

            {user.isAdmin && (
              <Link href="/admin" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
                <ShieldCheck size={20} />
                <span>Painel Administrativo</span>
                {pendingCount > 0 && (
                  <span className={styles.badge}>{pendingCount}</span>
                )}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
