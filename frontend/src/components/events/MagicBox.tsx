'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Mic, MicOff } from 'lucide-react';
import styles from './MagicBox.module.css';
import api from '@/lib/api';

interface MagicBoxProps {
  onParse: (data: unknown) => void;
  disabled?: boolean;
}

const MagicBox: React.FC<MagicBoxProps> = ({ onParse, disabled }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      // Defer state update to avoid lint error about synchronous setState in effect
      const timer = setTimeout(() => setIsSupported(true), 0);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transcript = Array.from(event.results as any[])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result.transcript)
          .join('');
        setText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setText('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

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
          disabled={isProcessing || disabled || isListening}
        />
        
        {isSupported && (
          <button
            type="button"
            className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
            onClick={toggleListening}
            disabled={isProcessing || disabled}
            title={isListening ? 'Parar de ouvir' : 'Ouvir voz'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={!text.trim() || isProcessing || disabled || isListening}
        >
          {isProcessing ? (
            <Loader2 className={styles.loadingSpinner} size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
      <div className={styles.hint}>
        {isListening ? 'Ouvindo... fale agora' : 'Use linguagem natural ou voz para incluir eventos rapidamente.'}
      </div>
    </div>
  );
};

export default MagicBox;
