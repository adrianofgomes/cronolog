'use client';

import React, { useState } from 'react';
import { Event } from '@/types/event';
import { Clock } from 'lucide-react';
import styles from './Timeline.module.css';
import { getCategoryConfig } from '@/lib/eventConfigs';

interface TimelineProps {
  events: Event[];
  onEdit?: (event: Event) => void;
}

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

      {events.map((event, index) => {
        const config = getCategoryConfig(event.categoryName || 'Geral');
        const Icon = config.icon;

        return (
          <div 
            key={event.id || index} 
            className={styles.eventCard}
            onClick={() => onEdit?.(event)}
          >
            <div className={styles.eventIcon} style={{ color: config.color, backgroundColor: `${config.color}15` }}>
              <Icon size={18} />
            </div>
            <div className={styles.eventContent}>
              <div className={styles.eventHeader}>
                <div className={styles.titleGroup}>
                  <span className={styles.categoryBadge} style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                    {event.categoryName || 'Geral'}
                  </span>
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
        );
      })}
    </div>
  );
}
