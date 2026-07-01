'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category } from '@/types/event';
import styles from './Timeline.module.css';
import api from '@/lib/api';
import EventCard from './EventCard';
import Link from 'next/link';

interface UpcomingEventsListProps {
  events: Event[];
  totalEvents?: number;
  onEdit: (event: Event) => void;
}

export default function UpcomingEventsList({ events, totalEvents = 0, onEdit }: UpcomingEventsListProps) {
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

  return (
    <div className={styles.upcomingContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Próximos Compromissos
          <span className={styles.counterBadge}>{events.length}/{totalEvents}</span>
        </h2>
        <Link href="/scheduled" className={styles.viewAllLink}>
          Ver todos
        </Link>
      </div>
      <div className={styles.upcomingList}>
        {events.length === 0 ? (
          <p className={styles.noEventsMessage}>Nenhum compromisso correspondente aos filtros.</p>
        ) : (
          events.map((event) => {
            const category = categories.find(c => c.id === event.categoryId);
            
            return (
              <EventCard 
                key={event.id}
                event={event}
                category={category}
                viewMode="summary"
                onClick={() => onEdit(event)}
                showStatus={true}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
