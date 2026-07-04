'use client';

import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown, Calendar } from 'lucide-react';
import { Category } from '@/types/event';
import styles from './EventFilters.module.css';
import CategoryFilterModal from './CategoryFilterModal';

export type TimeRange = '30days' | '3months' | '6months' | 'all' | 'custom';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  activeCategoryIds: string[];
  onCategoryChange: (categoryIds: string[]) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  customDates: { start: string; end: string };
  onCustomDatesChange: (dates: { start: string; end: string }) => void;
}

export default function EventFilters({
  searchQuery,
  onSearchChange,
  categories,
  activeCategoryIds,
  onCategoryChange,
  timeRange,
  onTimeRangeChange,
  customDates,
  onCustomDatesChange
}: EventFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasActiveFilters = searchQuery !== '' || activeCategoryIds.length > 0 || timeRange !== '30days';
  
  const filterLabel = activeCategoryIds.length === 0 
    ? 'Todas as Categorias' 
    : activeCategoryIds.length === 1
      ? categories.find(c => String(c.id) === activeCategoryIds[0])?.name || '1 Categoria'
      : `${activeCategoryIds.length} Categorias`;

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
        <div className={styles.dateFilterWrapper}>
          <Calendar size={16} color="#6b7280" />
          <select 
            className={styles.periodSelect}
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          >
            <option value="30days">Últimos 30 dias</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="all">Todo o histórico</option>
            <option value="custom">Personalizado...</option>
          </select>
        </div>

        <button 
          className={`${styles.filterButton} ${activeCategoryIds.length > 0 ? styles.active : ''}`}
          onClick={() => setIsModalOpen(true)}
        >
          <Filter size={16} />
          <span>{filterLabel}</span>
          {activeCategoryIds.length > 0 && (
            <span className={styles.categoryBadge}>{activeCategoryIds.length}</span>
          )}
          <ChevronDown size={14} />
        </button>

        {hasActiveFilters && (
          <button 
            className={styles.clearButton}
            onClick={() => {
              onSearchChange('');
              onCategoryChange([]);
              onTimeRangeChange('30days');
            }}
          >
            <X size={14} />
            Limpar tudo
          </button>
        )}
      </div>

      {timeRange === 'custom' && (
        <div className={styles.customDateContainer}>
            <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>De</span>
                <input 
                    type="date" 
                    className={styles.dateInput}
                    value={customDates.start}
                    onChange={(e) => onCustomDatesChange({ ...customDates, start: e.target.value })}
                />
            </div>
            <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>Até</span>
                <input 
                    type="date" 
                    className={styles.dateInput}
                    value={customDates.end}
                    onChange={(e) => onCustomDatesChange({ ...customDates, end: e.target.value })}
                />
            </div>
        </div>
      )}

      {isModalOpen && (
        <CategoryFilterModal
          categories={categories}
          selectedCategoryIds={activeCategoryIds}
          onApply={(ids) => {
            onCategoryChange(ids);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
