'use client';

import React, { useState } from 'react';
import { Event } from '@/types/event';
import { Fuel, Heart, Utensils, Plane, Dumbbell, Music, Tag, Clock, Stethoscope, Wrench } from 'lucide-react';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: Event[];
  onEdit?: (event: Event) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'abastecimento': <Fuel size={18} />,
  'saúde': <Heart size={18} />,
  'exame médico': <Stethoscope size={18} />,
  'manutenção': <Wrench size={18} />,
  'alimentação': <Utensils size={18} />,
  'viagem': <Plane size={18} />,
  'exercício': <Dumbbell size={18} />,
  'cultura': <Music size={18} />,
};

const getCategoryIcon = (categoryName: string) => {
  return CATEGORY_ICONS[categoryName.toLowerCase()] || <Tag size={18} />;
};

export default function Timeline({ events, onEdit }: TimelineProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

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

      {events.map((event, index) => (
        <div 
          key={event.id || index} 
          className={styles.eventCard}
          onClick={() => onEdit?.(event)}
        >
          <div className={styles.eventIcon}>
            {getCategoryIcon(event.categoryName || 'Geral')}
          </div>
          <div className={styles.eventContent}>
            <div className={styles.eventHeader}>
              <div className={styles.titleGroup}>
                <span className={styles.categoryBadge}>{event.categoryName || 'Geral'}</span>
                <h3 className={styles.eventTitle}>{event.title}</h3>
              </div>
              <span className={styles.eventTime}>
                <Clock size={12} />
                {new Date(event.eventDate).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {viewMode === 'detailed' && (
              <>
                {event.description && <p className={styles.eventDescription}>{event.description}</p>}
                
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className={styles.metadataGrid}>
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className={styles.metadataItem}>
                        <span className={styles.metadataKey}>{key.replace('_', ' ')}</span>
                        <span className={styles.metadataValue}>
                          {key.includes('valor') || key.includes('total') || key.includes('preco')
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
                            : typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
