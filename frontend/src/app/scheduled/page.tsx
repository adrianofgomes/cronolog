'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ChevronLeft, Filter, Calendar as CalendarIcon, Search, AlertTriangle } from 'lucide-react';
import styles from './scheduled.module.css';
import dashboardStyles from '../dashboard.module.css';
import BillToPayForm from '@/components/events/BillToPayForm';
import { Event } from '@/types/event';
import { getCategoryConfig } from '@/lib/eventConfigs';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ScheduledEventsPage() {
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showBillForm, setShowBillForm] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const router = useRouter();

  const fetchScheduledEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get('/events', { 
        params: { 
          status: 'pending'
        } 
      });
      let fetchedEvents = response.data.data || [];
      
      // Sort ASC (closer dates first)
      fetchedEvents.sort((a: Event, b: Event) => 
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );

      // Client-side filtering for simplicity, or we could update API to handle date range
      if (startDate) {
        const start = new Date(startDate).getTime();
        fetchedEvents = fetchedEvents.filter((e: Event) => new Date(e.eventDate).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        fetchedEvents = fetchedEvents.filter((e: Event) => new Date(e.eventDate).getTime() <= end);
      }

      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Error fetching scheduled events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchScheduledEvents();
    }
  }, [user, startDate, endDate]);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowBillForm(true);
  };

  if (isLoading || !user) {
    return <div className={dashboardStyles.loading}>Carregando...</div>;
  }

  return (
    <div className={dashboardStyles.container}>
      <header className={dashboardStyles.header}>
        <div className={dashboardStyles.logo} onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <img src="/cronolog_logo.svg" alt="Cronolog Logo" className={dashboardStyles.logoImage} />
          <span>Cronolog</span>
        </div>
        <div className={dashboardStyles.userInfo}>
           <button onClick={() => router.push('/')} className={styles.backButton}>
            <ChevronLeft size={20} /> Voltar
          </button>
        </div>
      </header>

      <main className={dashboardStyles.main}>
        <section className={dashboardStyles.welcomeSection}>
          <div className={dashboardStyles.welcomeInfo}>
            <h1 className={dashboardStyles.welcomeTitle}>Eventos Agendados</h1>
            <p className={dashboardStyles.statusText}>Consulte seus compromissos futuros e contas a pagar.</p>
          </div>
        </section>

        <section className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <CalendarIcon size={14} /> De
            </label>
            <input 
              type="date" 
              className={styles.filterInput} 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <CalendarIcon size={14} /> Até
            </label>
            <input 
              type="date" 
              className={styles.filterInput} 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <button className={styles.clearButton} onClick={() => { setStartDate(''); setEndDate(''); }}>
            Limpar
          </button>
        </section>

        <section className={styles.eventsGrid}>
          {loading ? (
            <div className={styles.loading}>Carregando compromissos...</div>
          ) : events.length > 0 ? (
            <div className={styles.scheduledList}>
              {events.map((event) => {
                const config = getCategoryConfig(event.categoryName || 'Geral');
                const Icon = config.icon;
                const eventDate = new Date(event.eventDate);
                
                const overdue = isBefore(eventDate, startOfDay(new Date())) && !isToday(eventDate);
                const dueToday = isToday(eventDate);

                return (
                  <div 
                    key={event.id} 
                    className={`${styles.scheduledCard} ${overdue ? styles.overdue : ''} ${dueToday ? styles.dueToday : ''}`}
                    onClick={() => handleEdit(event)}
                  >
                    <div className={styles.cardHeader}>
                      <div 
                        className={styles.iconBox}
                        style={{ backgroundColor: `${config.color}15`, color: config.color }}
                      >
                        <Icon size={24} />
                      </div>
                      <div className={styles.titleInfo}>
                        <h3 className={styles.eventTitle}>
                          {event.title}
                          {overdue && <AlertTriangle size={16} style={{ color: '#ef4444', marginLeft: '8px', verticalAlign: 'middle' }} />}
                        </h3>
                        <span className={styles.eventCategory}>{event.categoryName}</span>
                      </div>
                      <div className={styles.dateBadge}>
                        <span className={styles.day}>{format(eventDate, 'dd')}</span>
                        <span className={styles.month}>{format(eventDate, 'MMM', { locale: ptBR })}</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardContent}>
                      {event.metadata?.valor && (
                        <div className={styles.metadataItem}>
                          <span className={styles.metaLabel}>Valor</span>
                          <span className={styles.metaValue}>R$ {event.metadata.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {event.metadata?.beneficiario && (
                        <div className={styles.metadataItem}>
                          <span className={styles.metaLabel}>Beneficiário</span>
                          <span className={styles.metaValue}>{event.metadata.beneficiario}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      {event.isRecurring && (
                        <span className={styles.recurringLabel}>
                           Recorrente
                        </span>
                      )}
                      <span className={styles.statusLabel}>
                        {overdue ? 'Atrasado' : dueToday ? 'Vence Hoje' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Search size={48} color="#e5e7eb" />
              <p>Nenhum evento agendado encontrado para este período.</p>
            </div>
          )}
        </section>
      </main>

      {showBillForm && (
        <BillToPayForm 
          onClose={() => {
            setShowBillForm(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowBillForm(false);
            setEditingEvent(null);
            fetchScheduledEvents();
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
}
