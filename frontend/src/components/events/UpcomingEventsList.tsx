'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category } from '@/types/event';
import styles from './Timeline.module.css';
import api from '@/lib/api';
import EventCard from './EventCard';

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
        })}
      </div>
    </div>
  );
}
