export interface Category {
  id: number;
  userId: number;
  name: string;
  icon?: string;
  color?: string;
  metadataSchema?: Record<string, any>;
}

export interface Event {
  id?: number;
  userId?: number;
  profileId?: number;
  categoryId: number;
  categoryName?: string; // Virtual field for display
  title: string;
  eventDate: string;
  description?: string;
  metadata: Record<string, any>;
  tags?: string[];
  source?: 'manual' | 'ai_voice' | 'ai_text';
  rawInput?: string;
  attachments?: any[];
  status?: 'pending' | 'completed' | 'cancelled';
  isRecurring?: boolean;
  recurrenceInterval?: number;
  recurrenceType?: 'days' | 'weeks' | 'months' | 'years';
}

export interface RefuelingMetadata {
  carro?: string;
  posto?: string;
  tipo_combustivel?: string;
  km_atual?: number;
  valor_total?: number;
  quantidade_litros?: number;
  valor_litro?: number;
}
