import { Fuel, Wrench, Stethoscope, Heart, Syringe, Pill, ClipboardList, Tag } from 'lucide-react';

export interface EventType {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

export interface EventGroup {
  name: string;
  types: EventType[];
}

export const EVENT_GROUPS: EventGroup[] = [
  {
    name: 'Veículo',
    types: [
      { 
        id: 'fuel', 
        label: 'Abastecimento', 
        description: 'Registro de combustível, KM e valores pagos.', 
        icon: Fuel, 
        color: '#3b82f6' 
      },
      { 
        id: 'maintenance', 
        label: 'Manutenção', 
        description: 'Revisões, trocas de óleo, peças e serviços mecânicos.', 
        icon: Wrench, 
        color: '#f59e0b' 
      },
    ]
  },
  {
    name: 'Saúde',
    types: [
      { 
        id: 'health', 
        label: 'Exame Médico', 
        description: 'Resultados de exames, laudos e arquivos PDF/Imagens.', 
        icon: Stethoscope, 
        color: '#10b981' 
      },
      { 
        id: 'appointment', 
        label: 'Consulta', 
        description: 'Agendamentos e registros de visitas ao médico.', 
        icon: ClipboardList, 
        color: '#8b5cf6' 
      },
      { 
        id: 'vaccine', 
        label: 'Vacina', 
        description: 'Controle de imunizações e doses tomadas.', 
        icon: Syringe, 
        color: '#ec4899' 
      },
      { 
        id: 'medication', 
        label: 'Remédios', 
        description: 'Uso de medicamentos e tratamentos contínuos.', 
        icon: Pill, 
        color: '#ef4444' 
      },
    ]
  },
  {
    name: 'Outros',
    types: [
      { 
        id: 'general', 
        label: 'Geral', 
        description: 'Outros tipos de registros e anotações gerais.', 
        icon: Tag, 
        color: '#6b7280' 
      },
    ]
  }
];

// Map category names to their configurations for easy lookup in lists/timeline
export const CATEGORY_CONFIGS: Record<string, { icon: any, color: string }> = {
  'Abastecimento': { icon: Fuel, color: '#3b82f6' },
  'Manutenção': { icon: Wrench, color: '#f59e0b' },
  'Exame Médico': { icon: Stethoscope, color: '#10b981' },
  'Vacina': { icon: Syringe, color: '#ec4899' },
  'Remédios': { icon: Pill, color: '#ef4444' },
  'Consulta': { icon: ClipboardList, color: '#8b5cf6' },
  // Legacy or default mappings
  'Saúde': { icon: Heart, color: '#ef4444' },
  'Geral': { icon: Tag, color: '#6b7280' }
};

export const getCategoryConfig = (categoryName: string) => {
  return CATEGORY_CONFIGS[categoryName] || 
         CATEGORY_CONFIGS[Object.keys(CATEGORY_CONFIGS).find(k => k.toLowerCase() === (categoryName || 'Geral').toLowerCase()) || 'Geral'];
};
