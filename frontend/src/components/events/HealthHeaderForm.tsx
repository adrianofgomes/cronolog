'use client';

import React from 'react';
import { Calendar, User } from 'lucide-react';
import styles from './EventForm.module.css';

interface HealthHeaderFormProps {
  eventDate: string;
  onDateChange: (value: string) => void;
  paciente: string;
  onPacienteChange: (value: string) => void;
  suggestions: {
    pacientes: string[];
  };
}

export default function HealthHeaderForm({
  eventDate,
  onDateChange,
  paciente,
  onPacienteChange,
  suggestions
}: HealthHeaderFormProps) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          <Calendar size={14} /> Data e Hora
        </label>
        <input
          type="datetime-local"
          className={styles.input}
          value={eventDate}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          <User size={14} /> Paciente
        </label>
        <input
          type="text"
          className={styles.input}
          placeholder="Ex: João Silva"
          value={paciente}
          onChange={(e) => onPacienteChange(e.target.value)}
          list="pacientes-list"
          required
        />
        <datalist id="pacientes-list">
          {suggestions.pacientes.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
    </>
  );
}
