import * as Icons from 'lucide-react';

export const getIconComponent = (iconName: string): Icons.LucideIcon => {
  // Map kebab-case or other formats if necessary, but icons are stored as kebab in DB
  const iconMap: Record<string, keyof typeof Icons> = {
    'fuel': 'Fuel',
    'wrench': 'Wrench',
    'stethoscope': 'Stethoscope',
    'clipboard-list': 'ClipboardList',
    'syringe': 'Syringe',
    'pill': 'Pill',
    'banknote': 'Banknote',
    'tag': 'Tag',
    'heart': 'Heart',
    'scissors': 'Scissors',
    'sparkles': 'Sparkles',
    'user': 'User',
    'zap': 'Zap'
  };

  const componentName = iconMap[iconName];
  if (componentName && (Icons as any)[componentName]) {
    return (Icons as any)[componentName];
  }

  // Fallback: try to convert kebab-case to PascalCase (e.g., 'clipboard-list' -> 'ClipboardList')
  const pascalName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return (Icons as any)[pascalName] || Icons.Tag;
};
