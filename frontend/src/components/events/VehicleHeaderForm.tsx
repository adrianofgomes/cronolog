import React from 'react';
import { Car, Gauge } from 'lucide-react';
import styles from './EventForm.module.css';

interface VehicleHeaderFormProps {
  metadata: {
    carro: string;
    km_atual: string;
    [key: string]: any;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions: {
    carros: string[];
  };
}

export default function VehicleHeaderForm({ metadata, onChange, suggestions }: VehicleHeaderFormProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          <Car size={14} /> Veículo
        </label>
        <input
          type="text"
          name="carro"
          className={styles.input}
          placeholder="Ex: Civic"
          value={metadata.carro}
          onChange={onChange}
          list="carros-list"
        />
        <datalist id="carros-list">
          {suggestions.carros.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          <Gauge size={14} /> KM Atual
        </label>
        <input
          type="number"
          name="km_atual"
          className={styles.input}
          placeholder="Ex: 55000"
          value={metadata.km_atual}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
