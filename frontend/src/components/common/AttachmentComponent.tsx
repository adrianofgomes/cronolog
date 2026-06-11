'use client';

import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText } from 'lucide-react';
import api from '@/lib/api';

interface Attachment {
  id: number;
  filename: string;
  description?: string;
  fileType: 'pdf' | 'image';
  url?: string;
}

interface AttachmentComponentProps {
  eventId: number;
  onAttachmentUploaded: (attachment: Attachment) => void;
}

export default function AttachmentComponent({ eventId, onAttachmentUploaded }: AttachmentComponentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');

  const uploadFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }
      
      const response = await api.post(`/events/${eventId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAtt = response.data.data;
      onAttachmentUploaded({
        id: newAtt.id,
        filename: newAtt.filename,
        description: newAtt.description,
        fileType: newAtt.fileType,
        url: newAtt.url
      });
      setDescription('');
    } catch (error) {
      console.error('Upload failed', error);
      alert('Falha ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', padding: '12px', background: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={16} color="#6b7280" />
        <input 
          type="text" 
          placeholder="Descrição do anexo (ex: Nota Fiscal, Foto do Painel)" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>
          <Upload size={16} /> Arquivo
        </button>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && uploadFile(e.target.files[0])} style={{ display: 'none' }} accept="image/*,.pdf" />
        
        <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>
          <Camera size={16} /> Foto
        </button>
        <input type="file" ref={cameraInputRef} onChange={(e) => e.target.files && uploadFile(e.target.files[0])} style={{ display: 'none' }} accept="image/*" capture="environment" />
      </div>
      {loading && <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>Enviando...</span>}
    </div>
  );
}
