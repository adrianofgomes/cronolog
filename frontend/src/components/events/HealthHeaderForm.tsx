'use client';

import React from 'react';
import { User } from 'lucide-react';
import styles from './EventForm.module.css';

interface HealthHeaderFormProps {
  paciente: string;
  onPacienteChange: (value: string) => void;
  suggestions: {
    pacientes: string[];
  };
}

export default function HealthHeaderForm({
  paciente,
  onPacienteChange,
  suggestions
}: HealthHeaderFormProps) {
  return (
    <>
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
