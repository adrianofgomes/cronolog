'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import styles from './EventForm.module.css';
import { Save, X, Pill, Trash2, Clock, Calendar, User, FileText, Activity } from 'lucide-react';
import api from '@/lib/api';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import HealthHeaderForm from './HealthHeaderForm';

interface MedicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: any;
}

export default function MedicationForm({ onClose, onSuccess, event }: MedicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
  const [metadata, setMetadata] = useState(event?.metadata || {
    medicamento: '',
    dosagem: '',
    frequencia: '',
    paciente: '',
    prescrito_por: '',
    duracao: '',
    observacoes: ''
  });
  const [eventDate, setEventDate] = useState(
    event ? toDateTimeLocal(new Date(event.eventDate)) : toDateTimeLocal(new Date())
  );
  const [attachments, setAttachments] = useState<any[]>(event?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; description: string; id: string }[]>([]);

  const [suggestions, setSuggestions] = useState({
    medicamentos: [] as string[],
    dosagens: [] as string[],
    frequencias: [] as string[],
    pacientes: [] as string[],
    medicos: [] as string[]
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/events', { params: { categoryName: 'Remédios' } });
        const events = response.data.data || [];
        
        // Also fetch from other health categories for patient/doctor names
        const [examsRes, vaccinesRes] = await Promise.all([
          api.get('/events', { params: { categoryName: 'Exame Médico' } }),
          api.get('/events', { params: { categoryName: 'Vacina' } })
        ]);

        const allHealthEvents = [...events, ...(examsRes.data.data || []), ...(vaccinesRes.data.data || [])];
        
        const medicamentos = new Set<string>();
        const dosagens = new Set<string>();
        const frequencias = new Set<string>();
        const pacientes = new Set<string>();
        const medicos = new Set<string>();

        allHealthEvents.forEach((e: any) => {
          if (e.metadata) {
            if (e.metadata.paciente) pacientes.add(e.metadata.paciente);
            if (e.metadata.medico) medicos.add(e.metadata.medico);
            if (e.metadata.prescrito_por) medicos.add(e.metadata.prescrito_por);
            
            if (e.categoryName === 'Remédios') {
              if (e.metadata.medicamento) medicamentos.add(e.metadata.medicamento);
              if (e.metadata.dosagem) dosagens.add(e.metadata.dosagem);
              if (e.metadata.frequencia) frequencias.add(e.metadata.frequencia);
            }
          }
        });

        setSuggestions({
          medicamentos: Array.from(medicamentos),
          dosagens: Array.from(dosagens),
          frequencias: Array.from(frequencias),
          pacientes: Array.from(pacientes),
          medicos: Array.from(medicos)
        });
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

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
        categoryName: 'Remédios',
        title: metadata.medicamento || 'Remédio',
        eventDate: toUTCISOString(eventDate),
        metadata: metadata
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
      setError('Erro ao salvar registro de remédio. Tente novamente.');
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
      message: 'Tem certeza que deseja excluir este registro de remédio?',
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
          <div className={styles.categoryIcon} style={{ background: '#ef4444' }}>
            <Pill size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? 'Editar Registro' : 'Novo Registro de Remédio'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <HealthHeaderForm 
            eventDate={eventDate}
            onDateChange={setEventDate}
            paciente={metadata.paciente}
            onPacienteChange={(val) => setMetadata({...metadata, paciente: val})}
            suggestions={{ pacientes: suggestions.pacientes }}
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Medicamento</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Paracetamol"
              value={metadata.medicamento}
              onChange={e => setMetadata({...metadata, medicamento: e.target.value})}
              list="medicamentos-list"
              required
            />
            <datalist id="medicamentos-list">
              {suggestions.medicamentos.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Dosagem</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: 500mg, 1 comprimido"
                value={metadata.dosagem}
                onChange={e => setMetadata({...metadata, dosagem: e.target.value})}
                list="dosagens-list"
              />
              <datalist id="dosagens-list">
                {suggestions.dosagens.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Clock size={14} /> Frequência
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: 8 em 8 horas"
                value={metadata.frequencia}
                onChange={e => setMetadata({...metadata, frequencia: e.target.value})}
                list="frequencias-list"
              />
              <datalist id="frequencias-list">
                {suggestions.frequencias.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Prescrito por
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Dr. Carlos"
                value={metadata.prescrito_por}
                onChange={e => setMetadata({...metadata, prescrito_por: e.target.value})}
                list="medicos-list"
              />
              <datalist id="medicos-list">
                {suggestions.medicos.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Duração
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: 7 dias, contínuo"
                value={metadata.duracao}
                onChange={e => setMetadata({...metadata, duracao: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <FileText size={14} /> Observações
            </label>
            <textarea
              className={styles.input}
              placeholder="Alguma observação importante..."
              value={metadata.observacoes}
              onChange={e => setMetadata({...metadata, observacoes: e.target.value})}
              rows={2}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Anexos (Receitas, etc.)</label>
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
