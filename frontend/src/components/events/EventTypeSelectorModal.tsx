'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import styles from './EventTypeSelectorModal.module.css';
import api from '@/lib/api';
import { Category } from '@/types/event';
import { getIconComponent } from '@/lib/iconUtils';

interface EventTypeSelectorModalProps {
  onClose: () => void;
  onSelect: (category: Category) => void;
}

export default function EventTypeSelectorModal({ onClose, onSelect }: EventTypeSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    // Lock background scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      // Restore background scroll
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  const groupedCategories = useMemo(() => {
    const filtered = categories.filter(cat => {
      const term = searchTerm.toLowerCase();
      return cat.name.toLowerCase().includes(term) || 
             cat.metadataSchema?.description?.toLowerCase().includes(term);
    });

    const groups: Record<string, Category[]> = {};
    filtered.forEach(cat => {
      const groupName = cat.metadataSchema?.group || 'Outros';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(cat);
    });

    return Object.entries(groups)
      .map(([name, types]) => ({ name, types }))
      .sort((a, b) => {
        if (a.name === 'Outros') return 1;
        if (b.name === 'Outros') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [categories, searchTerm]);

  const hasResults = groupedCategories.length > 0;

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
          {loading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} size={32} />
              <p>Carregando categorias...</p>
            </div>
          ) : hasResults ? (
            groupedCategories.map((group) => (
              <div key={group.name} className={styles.group}>
                <h3 className={styles.groupName}>{group.name}</h3>
                <div className={styles.grid}>
                  {group.types.map((cat) => {
                    const Icon = getIconComponent(cat.icon || 'tag');
                    return (
                      <button
                        key={cat.id}
                        className={styles.typeCard}
                        onClick={() => onSelect(cat)}
                      >
                        <div 
                          className={styles.typeIcon} 
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <Icon size={24} />
                        </div>
                        <div className={styles.typeInfo}>
                          <span className={styles.typeLabel}>{cat.name}</span>
                          <span className={styles.typeDescription}>{cat.metadataSchema?.description}</span>
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
