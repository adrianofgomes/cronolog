'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category } from '@/types/event';
import styles from './Timeline.module.css';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getIconComponent } from '@/lib/iconUtils';
import api from '@/lib/api';

interface UpcomingEventsListProps {
  events: Event[];
  onEdit: (event: Event) => void;
}

export default function UpcomingEventsList({ events, onEdit }: UpcomingEventsListProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories for upcoming list:', err);
      }
    };
    fetchCategories();
  }, []);

  if (events.length === 0) return null;

  return (
    <div className={styles.upcomingContainer}>
      <h2 className={styles.sectionTitle}>Próximos Compromissos</h2>
      <div className={styles.upcomingList}>
        {events.map((event) => {
          const category = categories.find(c => c.id === event.categoryId);
          const color = category?.color || '#6b7280';
          const Icon = getIconComponent(category?.icon || 'tag');
          const eventDate = new Date(event.eventDate);
          
          const overdue = isBefore(eventDate, startOfDay(new Date())) && !isToday(eventDate);
          const dueToday = isToday(eventDate);
          
          return (
            <div 
              key={event.id} 
              className={`${styles.upcomingItem} ${overdue ? styles.overdue : ''} ${dueToday ? styles.dueToday : ''}`}
              onClick={() => onEdit(event)}
            >
              <div 
                className={styles.upcomingIcon} 
                style={{ backgroundColor: `${color}15`, color: color }}
              >
                <Icon size={20} />
              </div>
              <div className={styles.upcomingInfo}>
                <span className={styles.upcomingTitle}>
                  {event.title}
                  {overdue && <AlertTriangle size={14} style={{ color: '#ef4444', marginLeft: '8px', verticalAlign: 'middle' }} />}
                </span>
                <span className={styles.upcomingDate}>
                  <Clock size={12} style={{ marginRight: '4px' }} />
                  {format(eventDate, "dd 'de' MMMM", { locale: ptBR })}
                  {overdue && <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: '8px' }}>(Atrasado)</span>}
                  {dueToday && <span style={{ color: '#d97706', fontWeight: 600, marginLeft: '8px' }}>(Vence hoje)</span>}
                </span>
              </div>
              <div className={styles.upcomingStatus}>
                <span className={styles.statusBadge}>
                  {overdue ? 'Atrasado' : dueToday ? 'Hoje' : 'Pendente'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
