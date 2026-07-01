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
  isFiltered?: boolean;
  onClearFilters?: () => void;
  totalEvents?: number;
}

export default function Timeline({ 
  events, 
  onEdit, 
  isFiltered = false, 
  onClearFilters,
  totalEvents = 0
}: TimelineProps) {
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

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>
        <h2 className={styles.sectionTitle}>
          Atividades Recentes
          {totalEvents > 0 && (
            <span className={styles.counterBadge}>{events.length}/{totalEvents}</span>
          )}
        </h2>
        {events.length > 0 && (
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
        )}
      </div>

      {events.length === 0 ? (
        <div className={styles.empty}>
          {isFiltered ? (
            <div className={styles.noResults}>
              <p>Nenhum evento encontrado para os filtros aplicados.</p>
              {onClearFilters && (
                <button 
                  onClick={onClearFilters}
                  className={styles.clearFiltersLink}
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            "Nenhum evento registrado ainda."
          )}
        </div>
      ) : (
        events.map((event, index) => {
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
        })
      )}
    </div>
  );
}
