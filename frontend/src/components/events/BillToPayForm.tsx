'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Banknote, Save, X, Calendar, CreditCard, Trash2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface BillToPayFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: Event | null;
}

export default function BillToPayForm({ onClose, onSuccess, event }: BillToPayFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Form State
  const [title, setTitle] = useState(event?.title || '');
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
  const [metadata, setMetadata] = useState({
    valor: event?.metadata?.valor?.toString() || '',
    beneficiario: event?.metadata?.beneficiario || '',
    categoria_pagamento: event?.metadata?.categoria_pagamento || ''
  });
  
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(event?.recurrenceInterval?.toString() || '1');
  const [recurrenceType, setRecurrenceType] = useState(event?.recurrenceType || 'months');

  // Autocomplete data
  const [suggestions, setSuggestions] = useState({
    beneficiarios: [] as string[],
    categorias: [] as string[]
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/events', { params: { categoryName: 'Conta a Pagar' } });
        const events = response.data.data || [];
        
        const beneficiarios = new Set<string>();
        const categorias = new Set<string>();

        events.forEach((e: any) => {
          if (e.metadata) {
            if (e.metadata.beneficiario) beneficiarios.add(e.metadata.beneficiario);
            if (e.metadata.categoria_pagamento) categorias.add(e.metadata.categoria_pagamento);
          }
        });

        setSuggestions({
          beneficiarios: Array.from(beneficiarios),
          categorias: Array.from(categorias)
        });
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      }
    };

    fetchSuggestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanMetadata: any = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== '') {
          if (key === 'valor') {
            cleanMetadata[key] = parseFloat(value as string);
          } else {
            cleanMetadata[key] = value;
          }
        }
      });

      const payload = {
        categoryName: 'Conta a Pagar',
        title: title || 'Conta a Pagar',
        eventDate: toUTCISOString(eventDate),
        metadata: cleanMetadata,
        status: event?.status || 'pending',
        isRecurring,
        recurrenceInterval: isRecurring ? parseInt(recurrenceInterval) : null,
        recurrenceType: isRecurring ? recurrenceType : null
      };

      if (event?.id) {
        await api.put(`/events/${event.id}`, payload);
        onSuccess();
      } else {
        await api.post('/events', payload);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError('Falha ao salvar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir conta',
      message: 'Tem certeza que deseja excluir este registro?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/events/${event?.id}`);
          onSuccess();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Falha ao excluir registro.');
        } finally {
          setLoading(false);
          setModalConfig(null);
        }
      }
    });
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      await api.put(`/events/${event?.id}`, { status: 'completed' });
      onSuccess();
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert('Falha ao marcar como pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon} style={{ backgroundColor: '#059669' }}>
            <Banknote size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Conta' : 'Nova Conta a Pagar'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Título (Ex: Aluguel, Internet)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Aluguel"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Calendar size={14} /> Vencimento
              </label>
              <input
                type="datetime-local"
                className={styles.input}
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <CreditCard size={14} /> Valor (R$)
              </label>
              <input
                type="number"
                name="valor"
                step="0.01"
                className={styles.input}
                placeholder="0.00"
                value={metadata.valor}
                onChange={handleMetadataChange}
              />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Beneficiário</label>
              <input
                type="text"
                name="beneficiario"
                className={styles.input}
                placeholder="Ex: Imobiliária"
                value={metadata.beneficiario}
                onChange={handleMetadataChange}
                list="beneficiarios-list"
              />
              <datalist id="beneficiarios-list">
                {suggestions.beneficiarios.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Categoria</label>
              <input
                type="text"
                name="categoria_pagamento"
                className={styles.input}
                placeholder="Ex: Moradia"
                value={metadata.categoria_pagamento}
                onChange={handleMetadataChange}
                list="categorias-list"
              />
              <datalist id="categorias-list">
                {suggestions.categorias.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div className={styles.recurringSection}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={isRecurring} 
                onChange={(e) => setIsRecurring(e.target.checked)} 
              />
              <RefreshCw size={14} style={{ marginLeft: '8px', marginRight: '4px' }} />
              Esta conta se repete
            </label>

            {isRecurring && (
              <div className={styles.recurringOptions}>
                <span>Repetir a cada</span>
                <input 
                  type="number" 
                  className={styles.smallInput} 
                  value={recurrenceInterval} 
                  onChange={(e) => setRecurrenceInterval(e.target.value)}
                  min="1"
                />
                <select 
                  className={styles.select} 
                  value={recurrenceType} 
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                >
                  <option value="days">Dias</option>
                  <option value="weeks">Semanas</option>
                  <option value="months">Meses</option>
                  <option value="years">Anos</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {event?.id && (
              <button type="button" onClick={handleDelete} className={styles.deleteButton} disabled={loading}>
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div style={{ flex: 1 }} />
            {event?.status === 'pending' && (
              <button type="button" onClick={handleMarkAsPaid} className={styles.secondaryButton} disabled={loading}>
                Marcar como Pago
              </button>
            )}
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? 'Salvando...' : (
                <>
                  <Save size={18} /> Salvar Registro
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {modalConfig && (
        <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
