export const serviceCategories = [
  { id: 'nails', label: 'Нігті', emoji: '💅' },
  { id: 'hair', label: 'Волосся', emoji: '✂️' },
  { id: 'brows', label: 'Брови/Вії', emoji: '👁️' },
  { id: 'makeup', label: 'Макіяж', emoji: '💄' },
  { id: 'massage', label: 'Масаж', emoji: '💆' },
  { id: 'barber', label: 'Барбер', emoji: '💈' },
  { id: 'other', label: 'Інше', emoji: '✨' },
] as const;

export type ServiceCategoryId = (typeof serviceCategories)[number]['id'];
