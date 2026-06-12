'use client';

import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import styles from './EventTypeSelectorModal.module.css';
import { EVENT_GROUPS, EventGroup, EventType } from '@/lib/eventConfigs';

interface EventTypeSelectorModalProps {
  onClose: () => void;
  onSelect: (typeId: string) => void;
}

export default function EventTypeSelectorModal({ onClose, onSelect }: EventTypeSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return EVENT_GROUPS;

    const term = searchTerm.toLowerCase();
    
    return EVENT_GROUPS.map(group => ({
      ...group,
      types: group.types.filter(type => 
        type.label.toLowerCase().includes(term) || 
        type.description.toLowerCase().includes(term)
      )
    })).filter(group => group.types.length > 0);
  }, [searchTerm]);

  const hasResults = filteredGroups.length > 0;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Novo Lançamento</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="O que você deseja registrar?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.content}>
          {hasResults ? (
            filteredGroups.map((group: EventGroup) => (
              <div key={group.name} className={styles.group}>
                <h3 className={styles.groupName}>{group.name}</h3>
                <div className={styles.grid}>
                  {group.types.map((type: EventType) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        className={styles.typeCard}
                        onClick={() => onSelect(type.id)}
                      >
                        <div 
                          className={styles.typeIcon} 
                          style={{ backgroundColor: `${type.color}15`, color: type.color }}
                        >
                          <Icon size={24} />
                        </div>
                        <div className={styles.typeInfo}>
                          <span className={styles.typeLabel}>{type.label}</span>
                          <span className={styles.typeDescription}>{type.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <p>Nenhum tipo de lançamento encontrado para "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
