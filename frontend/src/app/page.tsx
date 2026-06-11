'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { LogOut, Plus, Fuel, Heart, User as UserIcon, ShieldCheck, Wrench } from 'lucide-react';
import styles from './dashboard.module.css';
import EventForm from '@/components/events/EventForm';
import MedicalExamForm from '@/components/events/MedicalExamForm';
import MaintenanceForm from '@/components/events/MaintenanceForm';
import Timeline from '@/components/events/Timeline';
import { Event } from '@/types/event';

export default function HomePage() {
  const { user, logout, isLoading, refreshUserStatus } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    if (event.categoryName === 'Exame Médico') {
      setShowMedicalForm(true);
    } else if (event.categoryName === 'Manutenção') {
      setShowMaintenanceForm(true);
    } else {
      setShowEventForm(true);
    }
  };

  const handleAddNew = (type: 'fuel' | 'health' | 'maintenance' = 'fuel') => {
    setEditingEvent(null);
    if (type === 'health') {
      setShowMedicalForm(true);
    } else if (type === 'maintenance') {
      setShowMaintenanceForm(true);
    } else {
      setShowEventForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowEventForm(false);
    setShowMedicalForm(false);
    setShowMaintenanceForm(false);
    setEditingEvent(null);
  };

  const fetchEvents = async () => {
    if (user?.status !== 'active') return;
    try {
      const response = await api.get('/events');
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Não foi possível carregar os eventos.');
    }
  };

  const fetchPendingCount = async () => {
    if (!user?.isAdmin) return;
    try {
      const response = await api.get('/users/admin/pending');
      setPendingCount(response.data.data?.length || 0);
    } catch (err) {
      console.error('Error fetching pending users count:', err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.status === 'active') {
      fetchEvents();
    }
    if (user && user.isAdmin) {
      fetchPendingCount();
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  const isPending = user.status === 'pending';
  const isBlocked = user.status === 'blocked';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Cronolog</div>
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

      <main className={styles.main}>
        {isPending && (
          <div className={styles.pendingBanner}>
            <div className={styles.bannerIcon}>⏳</div>
            <div className={styles.bannerContent}>
              <h3>Cadastro em Análise</h3>
              <p>Seu acesso está aguardando aprovação de um administrador. Por enquanto, as funcionalidades estão bloqueadas.</p>
              <button onClick={refreshUserStatus} className={styles.refreshButton}>
                Verificar novamente
              </button>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className={`${styles.pendingBanner} ${styles.blockedBanner}`}>
            <div className={styles.bannerIcon}>🚫</div>
            <div className={styles.bannerContent}>
              <h3>Acesso Bloqueado</h3>
              <p>Sua conta foi bloqueada. Entre em contato com o suporte para mais informações.</p>
            </div>
          </div>
        )}

        <section className={styles.welcomeSection}>
          <div className={styles.welcomeInfo}>
            <h1 className={styles.welcomeTitle}>Olá, {user.name.split(' ')[0]}!</h1>
            <p className={styles.statusText}>
              {isPending ? 'Seu cadastro está sendo revisado.' : 'Como está o seu dia hoje?'}
            </p>
          </div>
          {!isPending && !isBlocked && (
            <button 
              className={styles.addEventButton}
              onClick={() => handleAddNew('fuel')}
            >
              <Plus size={20} /> Novo Lançamento
            </button>
          )}
        </section>

        <section className={styles.dashboardGrid}>
          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Atalhos</h2>
            <div className={styles.actionCards}>
              <div 
                className={`${styles.actionCard} ${styles.refuelCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => !isPending && !isBlocked && handleAddNew('fuel')}
              >
                <Fuel size={24} />
                <span>Abastecimento</span>
              </div>
              <div 
                className={`${styles.actionCard} ${styles.healthCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => !isPending && !isBlocked && handleAddNew('health')}
              >
                <Heart size={24} />
                <span>Saúde</span>
              </div>
              <div 
                className={`${styles.actionCard} ${styles.maintenanceCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => !isPending && !isBlocked && handleAddNew('maintenance')}
              >
                <Wrench size={24} />
                <span>Manutenção</span>
              </div>
            </div>
          </div>

          <div className={styles.timelineSection}>
            {error && <p className={styles.errorText}>{error}</p>}
            {(isPending || isBlocked) ? (
              <div className={styles.lockedTimeline}>
                As atividades aparecerão aqui assim que seu acesso for liberado.
              </div>
            ) : (
              <Timeline events={events} onEdit={handleEdit} />
            )}
          </div>
        </section>
      </main>

      {showEventForm && (
        <EventForm 
          onClose={handleCloseForm} 
          onSuccess={() => {
            handleCloseForm();
            fetchEvents();
          }} 
          event={editingEvent}
        />
      )}
      {showMedicalForm && (
        <MedicalExamForm
          onClose={handleCloseForm} 
          onSuccess={() => {
            handleCloseForm();
            fetchEvents();
          }} 
          event={editingEvent}
        />
      )}
      {showMaintenanceForm && (
        <MaintenanceForm
          onClose={handleCloseForm} 
          onSuccess={() => {
            handleCloseForm();
            fetchEvents();
          }} 
          event={editingEvent}
        />
      )}
    </div>
  );
}
