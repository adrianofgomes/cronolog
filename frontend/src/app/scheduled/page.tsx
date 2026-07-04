'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './scheduled.module.css';
import { ChevronLeft, ArrowLeft, Calendar, CheckCircle, Clock, Trash2, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Event, Category } from '@/types/event';
import DynamicEventForm from '@/components/events/DynamicEventForm';
import EventCard from '@/components/events/EventCard';
import { getIconComponent } from '@/lib/iconUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Header from '@/components/common/Header';

export default function ScheduledPage() {
  const { user, logout, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, categoriesRes] = await Promise.all([
        api.get('/events', { params: { status: 'pending' } }),
        api.get('/categories')
      ]);
      
      const { items: pendingEvents } = eventsRes.data.data;
      const sortedEvents = [...(pendingEvents || [])].sort((a, b) => 
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
      
      setEvents(sortedEvents);
      setCategories(categoriesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Falha ao carregar eventos agendados.');
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
    if (user && user.status === 'active') {
      fetchData();
    }
  }, [user]);

  const handleEdit = (event: Event) => {
    const category = categories.find(c => c.id === event.categoryId);
    if (category) {
      setEditingEvent(event);
      setSelectedCategory(category);
      setShowForm(true);
    }
  };

  const handleMarkAsDone = async (id: number) => {
    try {
      await api.put(`/events/${id}`, { status: 'completed' });
      fetchData();
    } catch (err) {
      console.error('Error marking as done:', err);
      alert('Falha ao atualizar status.');
    }
  };

  const handleDelete = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir agendamento',
      message: 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await api.delete(`/events/${id}`);
          fetchData();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Falha ao excluir.');
        } finally {
          setModalConfig(null);
        }
      }
    });
  };

  if (isLoading || !user) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={18} /> Voltar ao Dashboard
          </Link>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Agendados</h1>
            <p className={styles.subtitle}>Acompanhe e conclua suas tarefas pendentes.</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando agendamentos...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={64} className={styles.emptyIcon} />
            <h3>Tudo em dia!</h3>
            <p>Você não possui agendamentos pendentes no momento.</p>
            <Link href="/" className={styles.actionButton}>
              Voltar ao Dashboard
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {events.map(event => {
              const category = categories.find(c => c.id === event.categoryId);

              return (
                <div key={event.id} className={styles.cardContainer}>
                  <EventCard 
                    event={event}
                    category={category}
                    viewMode="detailed"
                    onClick={() => handleEdit(event)}
                    showStatus={true}
                    noBorder={true}
                  />
                  <div className={styles.cardActionsRow}>
                    <button 
                      className={`${styles.actionButton} ${styles.doneButton}`} 
                      onClick={(e) => { e.stopPropagation(); handleMarkAsDone(event.id!); }}
                    >
                      <CheckCircle size={16} /> Concluir
                    </button>
                    <button 
                      className={styles.actionButton} 
                      onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                    >
                      Editar
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`} 
                      onClick={(e) => { e.stopPropagation(); handleDelete(event.id!); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && selectedCategory && (
        <DynamicEventForm 
          category={selectedCategory}
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSelectedCategory(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSelectedCategory(null);
            fetchData();
          }}
        />
      )}

      {modalConfig && (
        <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
