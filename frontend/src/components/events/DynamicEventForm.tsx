'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Event, Category } from '@/types/event';
import styles from './EventForm.module.css';
import { Save, X, Trash2, Calendar, RefreshCw, Loader2, Paperclip, ChevronDown, ChevronUp, Download, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toDateTimeLocal, toUTCISOString } from '@/lib/dateUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import AttachmentComponent from '@/components/common/AttachmentComponent';
import { getIconComponent } from '@/lib/iconUtils';
import VehicleHeaderForm from './VehicleHeaderForm';
import HealthHeaderForm from './HealthHeaderForm';

interface DynamicEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  category: Category;
  event?: Event | null;
  prefillData?: {
    date?: string;
    description?: string;
    status?: 'pending' | 'completed';
    metadata?: Record<string, any>;
  } | null;
}

export default function DynamicEventForm({ onClose, onSuccess, category, event, prefillData }: DynamicEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Schema extraction
  const schema = category.metadataSchema || {};
  const fields = schema.fields || [];
  
  // Default features: attachments and recurrence are TRUE unless explicitly FALSE
  const features = {
    attachments: true,
    recurrence: true,
    ...(schema.features || {})
  };

  // Form State
  const [title, setTitle] = useState(event?.title || prefillData?.description || '');
  const [eventDate, setEventDate] = useState(() => {
    if (event) return toDateTimeLocal(new Date(event.eventDate));
    if (prefillData?.date) return toDateTimeLocal(new Date(prefillData.date));
    return toDateTimeLocal(new Date());
  });
  
  // Dynamic metadata state
  const [metadata, setMetadata] = useState<Record<string, any>>(() => {
    const initialMetadata: Record<string, any> = {};
    fields.forEach((field: any) => {
      initialMetadata[field.name] = event?.metadata?.[field.name] ?? prefillData?.metadata?.[field.name] ?? '';
    });
    // Preserve any existing metadata not in schema
    return { ...(event?.metadata || {}), ...(prefillData?.metadata || {}), ...initialMetadata };
  });

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>(event?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; description: string; id: string }[]>([]);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(event?.recurrenceInterval?.toString() || '1');
  const [recurrenceType, setRecurrenceType] = useState(event?.recurrenceType || 'months');

  // Suggestions (Autocomplete)
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});

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

  useEffect(() => {
    const fetchSuggestions = async () => {
      const suggestFields = fields.filter((f: any) => f.suggest).map((f: any) => f.name);

      try {
        // Fetch all events for the user to aggregate suggestions globally
        const response = await api.get('/events');
        const events = response.data.data || [];
        
        const newSuggestions: Record<string, Set<string>> = {};
        suggestFields.forEach((fieldName: string) => {
          newSuggestions[fieldName] = new Set<string>();
        });
        newSuggestions['title'] = new Set<string>();

        events.forEach((e: any) => {
          if (e.title) {
            newSuggestions['title'].add(e.title);
          }
          if (e.metadata) {
            suggestFields.forEach((fieldName: string) => {
              if (e.metadata[fieldName]) {
                newSuggestions[fieldName].add(e.metadata[fieldName]);
              }
            });
          }
        });

        const finalSuggestions: Record<string, string[]> = {};
        Object.keys(newSuggestions).forEach(key => {
          finalSuggestions[key] = Array.from(newSuggestions[key]);
        });
        setSuggestions(finalSuggestions);
      } catch (err) {
        console.error('Error fetching global suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [fields]); // Removed category.id from dependencies to be global

  const handleMetadataChange = (name: string, value: any) => {
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelected = (file: File, description: string) => {
    setPendingFiles(prev => [...prev, { file, description, id: Math.random().toString(36).substring(7) }]);
  };

  const handleDownload = async (filename: string) => {
    if (!event?.id) return;
    try {
      const response = await api.get(`/events/${event.id}/attachments/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Falha ao baixar arquivo.');
    }
  };

  const handleView = async (filename: string) => {
    if (!event?.id) return;
    try {
      const response = await api.get(`/events/${event.id}/attachments/${filename}`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: response.headers['content-type'] as string });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    } catch (err) {
      console.error('Error viewing file:', err);
      alert('Falha ao visualizar arquivo.');
    }
  };

  const handleDeleteAttachment = async (attId: number) => {
    if (!event?.id) return;
    
    setModalConfig({
        isOpen: true,
        title: 'Excluir Anexo',
        message: 'Tem certeza que deseja excluir este anexo permanentemente?',
        onConfirm: async () => {
            try {
                setLoading(true);
                await api.delete(`/events/${event.id}/attachments/${attId}`);
                setAttachments(prev => prev.filter(a => a.id !== attId));
                setModalConfig(null);
            } catch (err) {
                console.error('Error deleting attachment:', err);
                alert('Falha ao excluir anexo.');
            } finally {
                setLoading(false);
            }
        }
    });
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
      const cleanMetadata: any = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          const field = fields.find((f: any) => f.name === key);
          if (field?.type === 'number') {
            cleanMetadata[key] = parseFloat(value as string);
          } else {
            cleanMetadata[key] = value;
          }
        }
      });

      const payload = {
        categoryId: category.id,
        title: title || category.name,
        eventDate: toUTCISOString(eventDate),
        metadata: cleanMetadata,
        status: event?.status || prefillData?.status || (features.status_tracking ? 'pending' : 'completed'),
        isRecurring,
        recurrenceInterval: isRecurring ? parseInt(recurrenceInterval) : null,
        recurrenceType: isRecurring ? recurrenceType : null
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
      setError('Falha ao salvar registro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir registro',
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

  const handleMarkAsDone = async () => {
    setLoading(true);
    try {
      await api.put(`/events/${event?.id}`, { status: 'completed' });
      onSuccess();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Falha ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = useMemo(() => getIconComponent(category.icon || 'tag'), [category.icon]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
            <Icon size={20} color="#fff" />
          </div>
          <h2 className={styles.modalTitle}>{event ? `Editar ${category.name}` : `Novo Lançamento: ${category.name}`}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Título</label>
            <input
              type="text"
              className={styles.input}
              placeholder={`Ex: ${category.name}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              list="title-suggestions"
            />
            <datalist id="title-suggestions">
              {(suggestions['title'] || []).map(s => <option key={s} value={s} />)}
            </datalist>
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

          {/* Preset Headers */}
          {schema.preset === 'vehicle' && (
            <VehicleHeaderForm 
              metadata={metadata as { carro: string; km_atual: string; [key: string]: any }} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetadataChange(e.target.name, e.target.value)}
              suggestions={{ carros: suggestions['carro'] || [] }}
            />
          )}

          {schema.preset === 'health' && (
            <HealthHeaderForm 
              paciente={metadata.paciente}
              onPacienteChange={(val) => handleMetadataChange('paciente', val)}
              suggestions={{ pacientes: suggestions['paciente'] || [] }}
            />
          )}

          <div className={styles.grid}>
            {/* Render fields from schema that are NOT handled by presets */}
            {fields.map((field: any) => {
              if (schema.preset === 'vehicle' && ['carro', 'km_atual'].includes(field.name)) return null;
              if (schema.preset === 'health' && field.name === 'paciente') return null;

              const isFullWidth = field.width === 'full' || fields.length === 1;

              return (
                <div key={field.name} className={styles.fieldGroup} style={{ gridColumn: isFullWidth ? 'span 2' : 'auto' }}>
                  <label className={styles.label}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className={styles.input}
                      name={field.name}
                      value={metadata[field.name]}
                      onChange={e => handleMetadataChange(field.name, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <>
                      <input
                        type={field.type}
                        step={field.step}
                        className={styles.input}
                        name={field.name}
                        value={metadata[field.name]}
                        onChange={e => handleMetadataChange(field.name, e.target.value)}
                        list={field.suggest ? `${field.name}-list` : undefined}
                      />
                      {field.suggest && (
                        <datalist id={`${field.name}-list`}>
                          {(suggestions[field.name] || []).map(s => <option key={s} value={s} />)}
                        </datalist>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Features: Recurrence */}
          {features.recurrence && (
            <div className={styles.recurringSection}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)} 
                />
                <RefreshCw size={14} style={{ marginLeft: '8px', marginRight: '4px' }} />
                Este lançamento se repete
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
          )}

          {/* Features: Attachments */}
          {features.attachments && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Paperclip size={14} /> Anexos
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                {/* Existing Attachments */}
                {attachments.map((a: any) => (
                  <div key={a.id} className={styles.attachmentItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {a.fileType === 'pdf' ? '📄 ' : '🖼️ '} {a.description || a.filename}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="button" title="Visualizar" onClick={() => handleView(a.filename)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Eye size={16} />
                            </button>
                            <button type="button" title="Baixar" onClick={() => handleDownload(a.filename)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Download size={16} />
                            </button>
                            <button type="button" title="Excluir" onClick={() => handleDeleteAttachment(a.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                  </div>
                ))}

                {/* Pending Attachments */}
                {pendingFiles.map((pf) => (
                  <div key={pf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#92400e' }}>{pf.file.type === 'application/pdf' ? '📄 ' : '🖼️ '}{pf.file.name}</span>
                    <button type="button" onClick={() => removePendingFile(pf.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <AttachmentComponent 
                eventId={event?.id} 
                onFileSelected={handleFileSelected}
              />
            </div>
          )}

          <div className={styles.actions}>
            {event?.id && (
              <button type="button" onClick={handleDelete} className={styles.deleteButton} disabled={loading}>
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div style={{ flex: 1 }} />
            {event?.status === 'pending' && features.status_tracking && (
              <button type="button" onClick={handleMarkAsDone} className={styles.secondaryButton} disabled={loading}>
                Marcar como Concluído
              </button>
            )}
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? <Loader2 className={styles.spinner} size={18} /> : (
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
