import * as Icons from 'lucide-react';

export const getIconComponent = (iconName: string): Icons.LucideIcon => {
  // Map kebab-case or other formats if necessary, but icons are stored as kebab in DB (usually)
  // Phinx seed uses: fuel, wrench, stethoscope, clipboard-list, syringe, pill, banknote, tag
  
  const iconMap: Record<string, keyof typeof Icons> = {
    'fuel': 'Fuel',
    'wrench': 'Wrench',
    'stethoscope': 'Stethoscope',
    'clipboard-list': 'ClipboardList',
    'syringe': 'Syringe',
    'pill': 'Pill',
    'banknote': 'Banknote',
    'tag': 'Tag',
    'heart': 'Heart'
  };

  const componentName = iconMap[iconName] || 'Tag';
  return (Icons as any)[componentName] || Icons.Tag;
};
