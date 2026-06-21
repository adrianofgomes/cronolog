'use client';

import React from 'react';
import { Event, Category } from '@/types/event';
import { Clock, AlertTriangle } from 'lucide-react';
import styles from './Timeline.module.css';
import { getIconComponent } from '@/lib/iconUtils';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
  category?: Category;
  viewMode?: 'summary' | 'detailed';
  onClick?: () => void;
  showStatus?: boolean;
  noBorder?: boolean;
}

export default function EventCard({ 
  event, 
  category, 
  viewMode = 'detailed', 
  onClick, 
  showStatus = false,
  noBorder = false
}: EventCardProps) {
  const color = category?.color || '#6b7280';
  const Icon = getIconComponent(category?.icon || 'tag');
  const eventDate = new Date(event.eventDate);
  
  const overdue = event.status === 'pending' && isBefore(eventDate, startOfDay(new Date())) && !isToday(eventDate);
  const dueToday = event.status === 'pending' && isToday(eventDate);

  const formatValue = (key: string, value: any) => {
    const k = key.toLowerCase();
    if (k.includes('valor') || k.includes('total') || k.includes('custo') || k.includes('preço') || k.includes('preco')) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    }
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }
    return String(value);
  };

  return (
    <div 
      className={`${styles.eventCard} ${overdue ? styles.overdue : ''} ${dueToday ? styles.dueToday : ''} ${noBorder ? styles.noBorder : ''}`}
      onClick={onClick}
    >
      <div className={styles.eventIcon} style={{ color: color, backgroundColor: `${color}15` }}>
        <Icon size={18} />
      </div>
      <div className={styles.eventContent}>
        <div className={styles.eventHeader}>
          <div className={styles.titleGroup}>
            <span className={styles.categoryBadge} style={{ backgroundColor: `${color}20`, color: color }}>
              {event.categoryName || category?.name || 'Geral'}
            </span>
            <h3 className={styles.eventTitle}>
              {event.title}
              {overdue && <AlertTriangle size={14} style={{ color: '#ef4444', marginLeft: '8px', verticalAlign: 'middle' }} />}
            </h3>
          </div>
          <div className={styles.headerRight}>
             {showStatus && event.status === 'pending' && (
                <span className={styles.statusBadge}>
                  {overdue ? 'Atrasado' : dueToday ? 'Hoje' : 'Pendente'}
                </span>
             )}
             <span className={`${styles.eventTime} ${overdue ? styles.overdueText : ''}`}>
                <Clock size={12} />
                {format(eventDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
             </span>
          </div>
        </div>
        
        {viewMode === 'detailed' && (
          <>
            {event.description && <p className={styles.eventDescription}>{event.description}</p>}
            
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className={styles.metadataGrid}>
                {Object.entries(event.metadata).map(([key, value]) => (
                  <div key={key} className={styles.metadataItem}>
                    <span className={styles.metadataKey}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.metadataValue}>
                      {formatValue(key, value)}
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
}
