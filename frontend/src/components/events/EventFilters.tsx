'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Category } from '@/types/event';
import styles from './EventFilters.module.css';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  activeCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export default function EventFilters({
  searchQuery,
  onSearchChange,
  categories,
  activeCategoryId,
  onCategoryChange
}: EventFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || activeCategoryId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Pesquisar por descrição ou categoria..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button 
            className={styles.clearSearchButton} 
            onClick={() => onSearchChange('')}
            title="Limpar pesquisa"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.selectWrapper}>
          <Filter className={styles.selectIcon} size={16} />
          <select 
            className={styles.categorySelect}
            value={activeCategoryId || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
          >
            <option value="">Filtrar por Categoria (Todas)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button 
            className={styles.clearButton}
            onClick={() => {
              onSearchChange('');
              onCategoryChange(null);
            }}
          >
            <X size={14} />
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}
