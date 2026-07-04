'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import styles from './CategoryFilterModal.module.css';
import { Category } from '@/types/event';
import { getIconComponent } from '@/lib/iconUtils';

interface CategoryFilterModalProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onApply: (selectedIds: string[]) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function CategoryFilterModal({ 
  categories, 
  selectedCategoryIds, 
  onApply, 
  onClose,
  loading = false
}: CategoryFilterModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedCategoryIds);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const groupedCategories = useMemo(() => {
    const filtered = categories.filter(cat => {
      const term = searchTerm.toLowerCase();
      return cat.name.toLowerCase().includes(term) || 
             cat.metadataSchema?.group?.toLowerCase().includes(term);
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

  const toggleCategory = (id: string) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGroup = (categoryIds: number[]) => {
    const stringIds = categoryIds.map(id => String(id));
    const allSelected = stringIds.every(id => tempSelectedIds.includes(id));

    if (allSelected) {
      // Unselect all in group
      setTempSelectedIds(prev => prev.filter(id => !stringIds.includes(id)));
    } else {
      // Select all in group (keeping existing selections from other groups)
      setTempSelectedIds(prev => {
        const otherIds = prev.filter(id => !stringIds.includes(id));
        return [...otherIds, ...stringIds];
      });
    }
  };

  const handleSelectAll = () => {
    setTempSelectedIds(categories.map(c => String(c.id)));
  };

  const handleClearAll = () => {
    setTempSelectedIds([]);
  };

  const handleApply = () => {
    onApply(tempSelectedIds);
  };

  const hasResults = groupedCategories.length > 0;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Filtrar Categorias</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar categoria ou grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.bulkActions}>
          <button type="button" className={styles.bulkButton} onClick={handleSelectAll}>
            Marcar Todas
          </button>
          <button type="button" className={styles.bulkButton} onClick={handleClearAll}>
            Desmarcar Todas
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} size={32} />
              <p>Carregando categorias...</p>
            </div>
          ) : hasResults ? (
            groupedCategories.map((group) => {
                const groupCategoryIds = group.types.map(c => c.id);
                const selectedInGroup = group.types.filter(c => tempSelectedIds.includes(String(c.id)));
                const isAllGroupSelected = selectedInGroup.length === group.types.length;
                const isPartialGroupSelected = selectedInGroup.length > 0 && !isAllGroupSelected;

                return (
                    <div key={group.name} className={styles.group}>
                        <div 
                            className={`${styles.groupHeader} ${isAllGroupSelected ? styles.allSelected : isPartialGroupSelected ? styles.partialSelected : ''}`}
                            onClick={() => toggleGroup(groupCategoryIds)}
                        >
                            <div className={styles.groupCheckbox}>
                                {isAllGroupSelected && <Check size={12} />}
                            </div>
                            <h3 className={styles.groupName}>{group.name}</h3>
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                {selectedInGroup.length}/{group.types.length}
                            </span>
                        </div>
                        <div className={styles.grid}>
                        {group.types.map((cat) => {
                            const Icon = getIconComponent(cat.icon || 'tag');
                            const isSelected = tempSelectedIds.includes(String(cat.id));
                            return (
                            <button
                                key={cat.id}
                                className={`${styles.categoryCard} ${isSelected ? styles.selected : ''}`}
                                onClick={() => toggleCategory(String(cat.id))}
                            >
                                <div className={styles.checkboxWrapper}>
                                {isSelected && <Check size={14} />}
                                </div>
                                <div 
                                className={styles.categoryIcon} 
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                >
                                <Icon size={20} />
                                </div>
                                <div className={styles.categoryInfo}>
                                <span className={styles.categoryLabel}>{cat.name}</span>
                                </div>
                            </button>
                            );
                        })}
                        </div>
                    </div>
                );
            })
          ) : (
            <div className={styles.noResults}>
              <p>Nenhuma categoria encontrada para "{searchTerm}".</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.applyButton} onClick={handleApply}>
            Aplicar Filtros ({tempSelectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
