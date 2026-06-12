'use client';

import React, { useState } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Save, X, Tag, Trash2, Calendar, FileText } from 'lucide-react';
import api from '@/lib/api';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface GeneralEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: any;
}

export default function GeneralEventForm({ onClose, onSuccess, event }: GeneralEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        categoryName: 'Geral',
        title: title || 'Evento Geral',
        description: description,
        eventDate: toUTCISOString(eventDate),
        metadata: {}
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
    } catch (error: any) {
      console.error('Submission error:', error);
      setError('Erro ao salvar registro geral. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Excluir registro',
      message: 'Tem certeza que deseja excluir este registro geral?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/events/${event.id}`);
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

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon} style={{ background: '#6b7280' }}>
            <Tag size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Registro Geral' : 'Novo Registro Geral'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Título do Registro</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Anotação importante"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
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
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FileText size={14} /> Descrição / Notas
            </label>
            <textarea
              className={styles.input}
              placeholder="Descreva aqui os detalhes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

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
