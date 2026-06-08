export const serviceCategories = [
  { id: 'nails',   label: 'Нігті'      },
  { id: 'hair',    label: 'Волосся'    },
  { id: 'brows',   label: 'Брови/Вії'  },
  { id: 'makeup',  label: 'Макіяж'     },
  { id: 'massage', label: 'Масаж'      },
  { id: 'barber',  label: 'Барбер'     },
  { id: 'other',   label: 'Інше'       },
] as const;

export type ServiceCategoryId = (typeof serviceCategories)[number]['id'];
