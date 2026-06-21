'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category } from '@/types/event';
import { Clock } from 'lucide-react';
import styles from './Timeline.module.css';
import { getIconComponent } from '@/lib/iconUtils';
import api from '@/lib/api';
import EventCard from './EventCard';

interface TimelineProps {
  events: Event[];
  onEdit?: (event: Event) => void;
}

export default function Timeline({ events, onEdit }: TimelineProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories for timeline:', err);
      }
    };
    fetchCategories();
  }, []);

  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        Nenhum evento registrado ainda.
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>
        <h2 className={styles.sectionTitle}>Atividades Recentes</h2>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'summary' ? styles.active : ''}`}
            onClick={() => setViewMode('summary')}
          >
            Resumido
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'detailed' ? styles.active : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            Detalhado
          </button>
        </div>
      </div>

      {events.map((event, index) => {
        const category = categories.find(c => c.id === event.categoryId);

        return (
          <EventCard 
            key={event.id || index}
            event={event}
            category={category}
            viewMode={viewMode}
            onClick={() => onEdit?.(event)}
          />
        );
      })}
    </div>
  );
}
