'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';
import styles from './dashboard.module.css';

export default function HomePage() {
  const { user, logout, isLoading } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api.get('/status')
        .then(response => {
          setStatus(response.data);
        })
        .catch(err => {
          console.error('Error fetching status:', err);
          setError('Não foi possível conectar ao backend.');
        });
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Cronolog</div>
        <div className={styles.userInfo}>
          <img src={user.picture} alt={user.name} className={styles.avatar} />
          <span className={styles.userName}>{user.name}</span>
          <button onClick={logout} className={styles.logoutButton} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Olá, {user.name.split(' ')[0]}!</h1>
          <p className={styles.statusText}>Bem-vindo ao painel do Cronolog.</p>
        </section>

        <div className={styles.statusCard}>
          <h2 className={styles.cardTitle}>
            <Activity size={20} color="#2563eb" />
            Status do Sistema
          </h2>
          {error ? (
            <p className={styles.statusText} style={{ color: '#dc2626' }}>{error}</p>
          ) : status ? (
            <div className={styles.statusText}>
              <p><strong>API:</strong> {status.status || 'Online'}</p>
              <p><strong>Versão:</strong> {status.version || '1.0.0'}</p>
              <p><strong>Ambiente:</strong> {status.environment || 'Desenvolvimento'}</p>
            </div>
          ) : (
            <p className={styles.statusText}>Verificando conexão...</p>
          )}
        </div>
      </main>
    </div>
  );
}
