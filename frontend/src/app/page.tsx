'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { LogOut, Plus, Fuel, Heart, User as UserIcon, ShieldCheck, Wrench, Loader2 } from 'lucide-react';
import styles from './dashboard.module.css';
import DynamicEventForm from '@/components/events/DynamicEventForm';
import EventTypeSelectorModal from '@/components/events/EventTypeSelectorModal';
import MagicBox from '@/components/events/MagicBox';
import Timeline from '@/components/events/Timeline';
import UpcomingEventsList from '@/components/events/UpcomingEventsList';
import Header from '@/components/common/Header';
import EventFilters, { TimeRange } from '@/components/events/EventFilters';
import { Event, Category } from '@/types/event';
import { subDays, formatISO, startOfDay, endOfDay } from 'date-fns';

const EVENTS_PER_PAGE = 20;

export default function HomePage() {
  const { user, logout, isLoading, refreshUserStatus } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDynamicForm, setShowDynamicForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [prefillData, setPrefillData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setPrefillData(null);
    const category = categories.find(c => c.id === event.categoryId);
    if (category) {
      setSelectedCategory(category);
      setShowDynamicForm(true);
    } else {
      console.error('Category not found for event:', event.categoryId);
    }
  };

  const handleAddNew = (cat?: Category, prefill?: any) => {
    setEditingEvent(null);
    setPrefillData(prefill || null);
    
    if (!cat) {
      setShowSelector(true);
      return;
    }

    setShowSelector(false);
    setSelectedCategory(cat);
    setShowDynamicForm(true);
  };

  const handleMagicParse = (data: any) => {
    const categoryId = data.category_id;
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      handleAddNew(category, {
        date: data.date,
        description: data.description,
        status: data.status,
        metadata: data.metadata
      });
    } else {
      setPrefillData({
        date: data.date,
        description: data.description,
        status: data.status,
        metadata: data.metadata
      });
      setShowSelector(true);
    }
  };

  const handleCloseForm = () => {
    setShowDynamicForm(false);
    setShowSelector(false);
    setEditingEvent(null);
    setSelectedCategory(null);
    setPrefillData(null);
  };

  const getFilterParams = (currentPage: number) => {
    const params: any = {
        status: 'completed',
        limit: EVENTS_PER_PAGE,
        page: currentPage
    };

    if (searchQuery) params.q = searchQuery;
    if (activeCategoryIds.length > 0) params.categoryIds = activeCategoryIds.join(',');

    let start: Date | null = null;
    let end: Date | null = null;

    const now = new Date();

    if (timeRange === '30days') start = subDays(now, 30);
    else if (timeRange === '3months') start = subDays(now, 90);
    else if (timeRange === '6months') start = subDays(now, 180);
    else if (timeRange === 'custom') {
        if (customDates.start) start = startOfDay(new Date(customDates.start));
        if (customDates.end) end = endOfDay(new Date(customDates.end));
    }

    if (start) params.startDate = formatISO(start);
    if (end) params.endDate = formatISO(end);

    return params;
  };

  const fetchEvents = async (reset = true) => {
    if (user?.status !== 'active') return;
    
    const targetPage = reset ? 1 : page + 1;
    if (reset) {
        setPage(1);
        setIsFetchingMore(false);
    } else {
        setIsFetchingMore(true);
    }

    try {
      const [completedRes, pendingRes] = await Promise.all([
        api.get('/events', { params: getFilterParams(targetPage) }),
        reset ? api.get('/events', { params: { status: 'pending' } }) : Promise.resolve(null)
      ]);
      
      const newEvents = completedRes.data.data || [];
      if (reset) {
          setEvents(newEvents);
      } else {
          setEvents(prev => [...prev, ...newEvents]);
          setPage(targetPage);
      }

      setHasMore(newEvents.length === EVENTS_PER_PAGE);

      if (reset && pendingRes) {
        const pending = pendingRes.data.data || [];
        setTotalPending(pending.length);
        const sortedPending = [...pending].sort((a, b) => 
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );
        setUpcomingEvents(sortedPending.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Não foi possível carregar os eventos.');
    } finally {
        setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (user && user.status === 'active') {
        fetchEvents(true);
    }
  }, [searchQuery, activeCategoryIds, timeRange, customDates.start, customDates.end]);

  useEffect(() => {
    if (user && user.status === 'active') {
      fetchCategories();
    }
    if (user && user.isAdmin) {
      fetchPendingCount();
    }
  }, [user]);

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

  if (isLoading || !user) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  const isPending = user.status === 'pending';
  const isBlocked = user.status === 'blocked';

  return (
    <div className={styles.container}>
      <Header />

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
            <div className={styles.welcomeActions}>
              <button
                className={styles.addEventButton}
                onClick={() => handleAddNew()}
              >
                <Plus size={20} /> Novo Lançamento
              </button>
            </div>
          )}
        </section>

        {!isPending && !isBlocked && (
          <MagicBox onParse={handleMagicParse} />
        )}

        <section className={styles.dashboardGrid}>
          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Atalhos</h2>
            <div className={styles.actionCards}>
              <div 
                className={`${styles.actionCard} ${styles.refuelCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => {
                  if (!isPending && !isBlocked) {
                    const cat = categories.find(c => c.name === 'Abastecimento');
                    if (cat) handleAddNew(cat);
                  }
                }}
              >
                <Fuel size={24} />
                <span>Abastecimento</span>
              </div>
              <div 
                className={`${styles.actionCard} ${styles.healthCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => {
                   if (!isPending && !isBlocked) {
                    const cat = categories.find(c => c.name === 'Exame Médico');
                    if (cat) handleAddNew(cat);
                  }
                }}
              >
                <Heart size={24} />
                <span>Saúde</span>
              </div>
              <div 
                className={`${styles.actionCard} ${styles.maintenanceCard} ${(isPending || isBlocked) ? styles.disabledCard : ''}`}
                onClick={() => {
                  if (!isPending && !isBlocked) {
                    const cat = categories.find(c => c.name === 'Manutenção');
                    if (cat) handleAddNew(cat);
                  }
                }}
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
              <>
                <EventFilters 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  categories={categories}
                  activeCategoryIds={activeCategoryIds}
                  onCategoryChange={setActiveCategoryIds}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  customDates={customDates}
                  onCustomDatesChange={setCustomDates}
                />

                <UpcomingEventsList 
                  events={upcomingEvents} 
                  totalEvents={totalPending} 
                  onEdit={handleEdit} 
                />

                <Timeline 
                  events={events} 
                  onEdit={handleEdit} 
                  isFiltered={searchQuery !== '' || activeCategoryIds.length > 0 || timeRange !== '30days'}
                  onClearFilters={() => { 
                    setSearchQuery(''); 
                    setActiveCategoryIds([]); 
                    setTimeRange('30days');
                    setCustomDates({ start: '', end: '' });
                  }}
                  totalEvents={events.length}
                />

                {hasMore && (
                    <div className={styles.loadMoreWrapper}>
                        <button 
                            className={styles.loadMoreButton}
                            onClick={() => fetchEvents(false)}
                            disabled={isFetchingMore}
                        >
                            {isFetchingMore ? (
                                <><Loader2 className={styles.spinner} size={18} /> Carregando...</>
                            ) : (
                                'Carregar Mais Atividades'
                            )}
                        </button>
                    </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {showDynamicForm && selectedCategory && (
        <DynamicEventForm
          onClose={handleCloseForm} 
          onSuccess={() => {
            handleCloseForm();
            fetchEvents();
          }} 
          category={selectedCategory}
          event={editingEvent}
          prefillData={prefillData}
        />
      )}
      {showSelector && (
        <EventTypeSelectorModal
          onClose={() => setShowSelector(false)}
          onSelect={(cat) => handleAddNew(cat, prefillData)}
        />
      )}
    </div>
  );
}
