'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import styles from './MagicBox.module.css';
import api from '@/lib/api';

interface MagicBoxProps {
  onParse: (data: any) => void;
  disabled?: boolean;
}

const MagicBox: React.FC<MagicBoxProps> = ({ onParse, disabled }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing || disabled) return;

    setIsProcessing(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await api.post('/events/parse-nll', { text, timezone });
      onParse(response.data.data);
      setText('');
    } catch (err) {
      console.error('Error parsing natural language:', err);
      alert('Não foi possível processar o seu pedido. Tente ser mais específico ou verifique sua conexão.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <Sparkles size={18} color="#3b82f6" />
        <span>Magic Box — O que você quer registrar?</span>
      </div>
      <form className={styles.inputWrapper} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.input}
          placeholder='Ex: "abasteci 150 reais no posto jurema"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isProcessing || disabled}
        />
        <button 
          type="submit" 
          className={styles.button}
          disabled={!text.trim() || isProcessing || disabled}
        >
          {isProcessing ? (
            <Loader2 className={styles.loadingSpinner} size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
      <div className={styles.hint}>
        Use linguagem natural para incluir eventos rapidamente.
      </div>
    </div>
  );
};

export default MagicBox;
