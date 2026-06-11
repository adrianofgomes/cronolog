'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Save, X, FileText, User, Stethoscope, Calendar, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface MedicalExamFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: any;
}

export default function MedicalExamForm({ onClose, onSuccess, event }: MedicalExamFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
  const [metadata, setMetadata] = useState(event?.metadata || {
    descricao: '',
    paciente: '',
    medico: '',
    laudo: ''
  });
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
  const [attachments, setAttachments] = useState<any[]>(event?.attachments || []);

  const handleDownload = async (filename: string, fileType: string) => {
    try {
      const url = `/events/${event.id}/attachments/${filename}`;
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
          await api.delete(`/events/${event.id}/attachments/${attId}`);
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

  const handleUpdateDescription = async (attId: number, description: string) => {
    try {
      await api.patch(`/events/${event.id}/attachments/${attId}`, { description });
      setAttachments(attachments.map(a => a.id === attId ? { ...a, description } : a));
    } catch (error) {
      console.error('Update error:', error);
      alert('Erro ao atualizar descrição');
    }
  };

  const handleDeleteEvent = () => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir exame',
      message: 'Tem certeza que deseja excluir este exame?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/events/${event.id}`);
          onSuccess();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Falha ao excluir exame.');
        } finally {
          setLoading(false);
          setModalConfig(null);
        }
      }
    });
  };

  const [suggestions, setSuggestions] = useState({
    descricoes: [] as string[],
    pacientes: [] as string[],
    medicos: [] as string[]
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/events', { params: { categoryName: 'Exame Médico' } });
        const events = response.data.data || [];
        
        const descricoes = new Set<string>();
        const pacientes = new Set<string>();
        const medicos = new Set<string>();

        events.forEach((e: any) => {
          if (e.metadata) {
            if (e.metadata.descricao) descricoes.add(e.metadata.descricao);
            if (e.metadata.paciente) pacientes.add(e.metadata.paciente);
            if (e.metadata.medico) medicos.add(e.metadata.medico);
          }
        });

        setSuggestions({
          descricoes: Array.from(descricoes),
          pacientes: Array.from(pacientes),
          medicos: Array.from(medicos)
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
      const payload = {
        categoryName: 'Exame Médico',
        title: metadata.descricao || 'Exame Médico',
        eventDate: toUTCISOString(eventDate),
        metadata: metadata
      };

      if (event?.id) {
        await api.put(`/events/${event.id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Submission error:', error);
      setError('Erro ao salvar exame. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon}>
            <Stethoscope size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Exame' : 'Novo Exame'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Calendar size={14} /> Data e Hora
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
            <label className={styles.label}>Descrição do Exame</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Hemograma"
              value={metadata.descricao}
              onChange={e => setMetadata({...metadata, descricao: e.target.value})}
              list="descricoes-list"
              required
            />
            <datalist id="descricoes-list">
              {suggestions.descricoes.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <User size={14} /> Paciente
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: João Silva"
                value={metadata.paciente}
                onChange={e => setMetadata({...metadata, paciente: e.target.value})}
                list="pacientes-list"
                required
              />
              <datalist id="pacientes-list">
                {suggestions.pacientes.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Stethoscope size={14} /> Médico
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Dra. Ana Souza"
                value={metadata.medico}
                onChange={e => setMetadata({...metadata, medico: e.target.value})}
                list="medicos-list"
                required
              />
              <datalist id="medicos-list">
                {suggestions.medicos.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FileText size={14} /> Resumo do Laudo
            </label>
            <textarea
              className={styles.input}
              placeholder="Descreva brevemente o resultado..."
              value={metadata.laudo}
              onChange={e => setMetadata({...metadata, laudo: e.target.value})}
              rows={4}
            />
          </div>

          {event?.id && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Anexos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
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
              </div>
              <AttachmentComponent 
                eventId={event.id} 
                onAttachmentUploaded={(a) => setAttachments([...attachments, a])} 
              />
            </div>
          )}
          
          <div className={styles.actions}>
            {event?.id && (
              <button type="button" onClick={handleDeleteEvent} className={styles.deleteButton} disabled={loading}>
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
                  <Save size={18} /> Salvar Exame
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
