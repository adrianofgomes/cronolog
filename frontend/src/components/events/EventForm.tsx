'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Fuel, Save, X, Calendar, MapPin, Gauge, Droplets, CreditCard, Car, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import VehicleHeaderForm from './VehicleHeaderForm';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface EventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: Event | null;
}

export default function EventForm({ onClose, onSuccess, event }: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Form State
  const [title, setTitle] = useState(event?.title || '');
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
  const [metadata, setMetadata] = useState({
    carro: event?.metadata?.carro || '',
    posto: event?.metadata?.posto || '',
    tipo_combustivel: event?.metadata?.tipo_combustivel || '',
    km_atual: event?.metadata?.km_atual?.toString() || '',
    valor_total: event?.metadata?.valor_total?.toString() || '',
    quantidade_litros: event?.metadata?.quantidade_litros?.toString() || '',
    valor_litro: event?.metadata?.valor_litro?.toString() || ''
  });
  const [attachments, setAttachments] = useState<any[]>(event?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; description: string; id: string }[]>([]);

  const handleFileSelected = (file: File, description: string) => {
    setPendingFiles(prev => [...prev, { file, description, id: Math.random().toString(36).substring(7) }]);
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadPendingFiles = async (eventId: number) => {
    for (const pending of pendingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', pending.file);
        if (pending.description) {
          formData.append('description', pending.description);
        }
        await api.post(`/events/${eventId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (error) {
        console.error('Failed to upload pending file:', error);
      }
    }
  };

  const handleUpdateDescription = async (attId: number, description: string) => {
    try {
      await api.patch(`/events/${event?.id}/attachments/${attId}`, { description });
      setAttachments(attachments.map(a => a.id === attId ? { ...a, description } : a));
    } catch (error) {
      console.error('Update error:', error);
      alert('Erro ao atualizar descrição');
    }
  };

  const handleDownload = async (filename: string, fileType: string) => {
    try {
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
    } catch (error) {
      console.error('Download error:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleDeleteAttachment = (attId: number) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir anexo',
      message: 'Tem certeza que deseja excluir este anexo?',
      onConfirm: async () => {
        try {
          await api.delete(`/events/${event?.id}/attachments/${attId}`);
          setAttachments(attachments.filter(a => a.id !== attId));
        } catch (error) {
          console.error('Delete error:', error);
          alert('Erro ao excluir anexo');
        } finally {
          setModalConfig(null);
        }
      }
    });
  };

  const handleDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir evento',
      message: 'Tem certeza que deseja excluir este evento?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/events/${event?.id}`);
          onSuccess();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Falha ao excluir evento.');
        } finally {
          setLoading(false);
          setModalConfig(null);
        }
      }
    });
  };

  // Autocomplete data
  const [suggestions, setSuggestions] = useState({
    carros: [] as string[],
    postos: [] as string[],
    combustiveis: [] as string[]
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/events', { params: { categoryName: 'Abastecimento' } });
        const events = response.data.data || [];
        
        const carros = new Set<string>();
        const postos = new Set<string>();
        const combustiveis = new Set<string>();

        events.forEach((e: any) => {
          if (e.metadata) {
            if (e.metadata.carro) carros.add(e.metadata.carro);
            if (e.metadata.posto) postos.add(e.metadata.posto);
            if (e.metadata.tipo_combustivel) combustiveis.add(e.metadata.tipo_combustivel);
          }
        });

        setSuggestions({
          carros: Array.from(carros),
          postos: Array.from(postos),
          combustiveis: Array.from(combustiveis)
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
      // Clean up metadata: convert strings to numbers where appropriate
      const cleanMetadata: any = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== '') {
          if (['km_atual', 'valor_total', 'quantidade_litros', 'valor_litro'].includes(key)) {
            cleanMetadata[key] = parseFloat(value as string);
          } else {
            cleanMetadata[key] = value;
          }
        }
      });

      const payload = {
        categoryName: 'Abastecimento',
        title: title || 'Abastecimento',
        eventDate: toUTCISOString(eventDate),
        metadata: cleanMetadata
      };

      if (event?.id) {
        await api.put(`/events/${event.id}`, payload);
        onSuccess();
      } else {
        const response = await api.post('/events', payload);
        const newEventId = response.data.data.id;
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(newEventId);
        }
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError('Falha ao salvar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon}>
            <Fuel size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Título (opcional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Abastecimento Viagem"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Calendar size={14} /> Data e Hora
            </label>
            <input
              type="datetime-local"
              className={styles.input}
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
            />
          </div>

          <VehicleHeaderForm metadata={metadata} onChange={handleMetadataChange} suggestions={{ carros: suggestions.carros }} />

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <MapPin size={14} /> Posto
              </label>
              <input
                type="text"
                name="posto"
                className={styles.input}
                placeholder="Ex: Ipiranga Centro"
                value={metadata.posto}
                onChange={handleMetadataChange}
                list="postos-list"
              />
              <datalist id="postos-list">
                {suggestions.postos.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Combustível</label>
              <input
                type="text"
                name="tipo_combustivel"
                className={styles.input}
                placeholder="Ex: Gasolina Comum"
                value={metadata.tipo_combustivel}
                onChange={handleMetadataChange}
                list="combustiveis-list"
              />
              <datalist id="combustiveis-list">
                {suggestions.combustiveis.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <CreditCard size={14} /> Valor Total (R$)
              </label>
              <input
                type="number"
                name="valor_total"
                step="0.01"
                className={styles.input}
                placeholder="Ex: 250.00"
                value={metadata.valor_total}
                onChange={handleMetadataChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Droplets size={14} /> Litros
              </label>
              <input
                type="number"
                name="quantidade_litros"
                step="0.01"
                className={styles.input}
                placeholder="Ex: 40.5"
                value={metadata.quantidade_litros}
                onChange={handleMetadataChange}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Anexos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              {/* Existing Attachments */}
              {attachments.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="button" onClick={() => handleDownload(a.filename, a.fileType)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, textAlign: 'left', flex: 1, fontSize: '14px' }}>
                      {a.fileType === 'pdf' ? '📄 ' : '🖼️ '}
                      {a.filename.split('_').slice(1).join('_') || a.filename}
                    </button>
                    <button type="button" onClick={() => handleDeleteAttachment(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    defaultValue={a.description}
                    placeholder="Descrição..."
                    onBlur={(e) => handleUpdateDescription(a.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                </div>
              ))}

              {/* Pending Attachments */}
              {pendingFiles.map((pf) => (
                <div key={pf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', gap: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#92400e' }}>
                      {pf.file.type === 'application/pdf' ? '📄 ' : '🖼️ '}
                      {pf.file.name}
                    </span>
                    {pf.description && <span style={{ fontSize: '12px', color: '#b45309' }}>{pf.description}</span>}
                  </div>
                  <button type="button" onClick={() => removePendingFile(pf.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <AttachmentComponent 
              eventId={event?.id} 
              onAttachmentUploaded={(a) => setAttachments([...attachments, a])}
              onFileSelected={handleFileSelected}
            />
          </div>

          <div className={styles.actions}>
            {event?.id && (
              <button type="button" onClick={handleDelete} className={styles.deleteButton} disabled={loading}>
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div style={{ flex: 1 }} />
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
