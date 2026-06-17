'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toDateTimeLocal } from '@/lib/dateUtils';
import styles from './scheduled.module.css';
import { ChevronLeft, Calendar, CheckCircle, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Event, Category } from '@/types/event';
import DynamicEventForm from '@/components/events/DynamicEventForm';

export default function ScheduledPage() {
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [eventsRes, categoriesRes] = await Promise.all([
        api.get('/events', { params: { status: 'pending' } }),
        api.get('/categories')
      ]);
      
      const pendingEvents = eventsRes.data.data || [];
      const sortedEvents = [...pendingEvents].sort((a, b) => 
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

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Falha ao excluir.');
    }
  };

  if (isLoading || !user) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ChevronLeft size={20} /> Voltar
        </Link>
        <h1 className={styles.title}>Agendados & Pendentes</h1>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}>Carregando agendamentos...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} className={styles.emptyIcon} />
            <p>Você não possui agendamentos pendentes.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {events.map(event => (
              <div key={event.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <span className={styles.categoryBadge}>{event.categoryName}</span>
                  </div>
                  <div className={styles.dateInfo}>
                    <Clock size={14} />
                    <span>{new Date(event.eventDate).toLocaleDateString()} {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {event.description && <p className={styles.description}>{event.description}</p>}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className={styles.metadata}>
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className={styles.metaItem}>
                          <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.actionButton} 
                    onClick={() => handleMarkAsDone(event.id!)}
                    title="Marcar como concluído"
                  >
                    <CheckCircle size={18} /> Concluir
                  </button>
                  <button 
                    className={styles.actionButton} 
                    onClick={() => handleEdit(event)}
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`} 
                    onClick={() => handleDelete(event.id!)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && selectedCategory && (
        <DynamicEventForm 
          category={selectedCategory}
          event={editingEvent}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
