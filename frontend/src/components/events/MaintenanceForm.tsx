'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Save, X, Calendar, Wrench, Trash2, DollarSign, FileText } from 'lucide-react';
import api from '@/lib/api';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import VehicleHeaderForm from './VehicleHeaderForm';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface MaintenanceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: Event | null;
}

export default function MaintenanceForm({ onClose, onSuccess, event }: MaintenanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(event?.title || '');
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
  const [metadata, setMetadata] = useState({
    carro: event?.metadata?.carro || '',
    km_atual: event?.metadata?.km_atual?.toString() || '',
    servico: event?.metadata?.servico || '',
    pecas: event?.metadata?.pecas || '',
    custo_mao_obra: event?.metadata?.custo_mao_obra?.toString() || '',
    custo_pecas: event?.metadata?.custo_pecas?.toString() || ''
  });
  const [attachments, setAttachments] = useState<any[]>(event?.attachments || []);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const [suggestions, setSuggestions] = useState({
    carros: [] as string[],
    servicos: [] as string[]
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/events');
        const events = response.data.data || [];
        
        const carros = new Set<string>();
        const servicos = new Set<string>();

        events.forEach((e: any) => {
          if (e.metadata) {
            if (e.metadata.carro) carros.add(e.metadata.carro);
            if (e.metadata.servico) servicos.add(e.metadata.servico);
          }
        });

        setSuggestions({
          carros: Array.from(carros),
          servicos: Array.from(servicos)
        });
      } catch (err) {
        console.error('Error fetching suggestions:', err);
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
          if (['km_atual', 'custo_mao_obra', 'custo_pecas'].includes(key)) {
            cleanMetadata[key] = parseFloat(value as string);
          } else {
            cleanMetadata[key] = value;
          }
        }
      });

      const payload = {
        categoryName: 'Manutenção',
        title: title || metadata.servico || 'Manutenção',
        eventDate: toUTCISOString(eventDate),
        metadata: cleanMetadata
      };

      if (event?.id) {
        await api.put(`/events/${event.id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error saving:', err);
      setError('Falha ao salvar manutenção.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = async (filename: string, fileType: string) => {
    const url = `/events/${event?.id}/attachments/${filename}`;
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDeleteAttachment = (attId: number) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir anexo',
      message: 'Tem certeza que deseja excluir este anexo?',
      onConfirm: async () => {
        await api.delete(`/events/${event?.id}/attachments/${attId}`);
        setAttachments(attachments.filter(a => a.id !== attId));
        setModalConfig(null);
      }
    });
  };

  const handleUpdateDescription = async (attId: number, description: string) => {
    await api.patch(`/events/${event?.id}/attachments/${attId}`, { description });
    setAttachments(attachments.map(a => a.id === attId ? { ...a, description } : a));
  };

  const handleDeleteEvent = () => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir manutenção',
      message: 'Tem certeza que deseja excluir esta manutenção?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/events/${event?.id}`);
          onSuccess();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Falha ao excluir.');
        } finally {
          setLoading(false);
          setModalConfig(null);
        }
      }
    });
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon} style={{ background: '#f59e0b' }}>
            <Wrench size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Manutenção' : 'Nova Manutenção'}</h2>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Título</label>
            <input type="text" className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Calendar size={14} /> Data e Hora</label>
            <input type="datetime-local" className={styles.input} value={eventDate} onChange={e => setEventDate(e.target.value)} required />
          </div>
          
          <VehicleHeaderForm metadata={metadata} onChange={handleMetadataChange} suggestions={{ carros: suggestions.carros }} />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Serviço</label>
            <input type="text" name="servico" className={styles.input} value={metadata.servico} onChange={handleMetadataChange} list="servicos-list" />
            <datalist id="servicos-list">{suggestions.servicos.map(s => <option key={s} value={s} />)}</datalist>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}><FileText size={14} /> Peças</label>
            <input type="text" name="pecas" className={styles.input} value={metadata.pecas} onChange={handleMetadataChange} />
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}><DollarSign size={14} /> Mão de Obra (R$)</label>
              <input type="number" name="custo_mao_obra" step="0.01" className={styles.input} value={metadata.custo_mao_obra} onChange={handleMetadataChange} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}><DollarSign size={14} /> Peças (R$)</label>
              <input type="number" name="custo_pecas" step="0.01" className={styles.input} value={metadata.custo_pecas} onChange={handleMetadataChange} />
            </div>
          </div>

          {event?.id && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Anexos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                {attachments.map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" onClick={() => handleDownload(a.filename, a.fileType)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, textAlign: 'left', flex: 1, fontSize: '14px' }}>
                        {a.fileType === 'pdf' ? '📄 ' : '🖼️ '} {a.description || a.filename.split('_').slice(1).join('_') || a.filename}
                      </button>
                      <button type="button" onClick={() => handleDeleteAttachment(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                    </div>
                    <input type="text" defaultValue={a.description} placeholder="Descrição..." onBlur={(e) => handleUpdateDescription(a.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                  </div>
                ))}
              </div>
              <AttachmentComponent eventId={event.id} onAttachmentUploaded={(a) => setAttachments([...attachments, a])} />
            </div>
          )}

          <div className={styles.actions}>
            {event?.id && (
              <button type="button" onClick={handleDeleteEvent} className={styles.deleteButton} disabled={loading}>
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" disabled={loading} className={styles.saveButton}>{loading ? 'Salvando...' : <> <Save size={18} /> Salvar Manutenção</>}</button>
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
