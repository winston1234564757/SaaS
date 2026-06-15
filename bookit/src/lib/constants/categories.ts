export const serviceCategories = [
  { id: 'nails',       label: 'Нігті'         },
  { id: 'hair',        label: 'Волосся'        },
  { id: 'brows',       label: 'Брови і вії'    },
  { id: 'makeup',      label: 'Макіяж'         },
  { id: 'massage',     label: 'Масаж'          },
  { id: 'barber',      label: 'Барбер'         },
  { id: 'cosmetology', label: 'Косметологія'   },
  { id: 'spa',         label: 'СПА'            },
  { id: 'waxing',      label: 'Депіляція'      },
  { id: 'piercing',    label: 'Пірсинг'        },
  { id: 'tattoo',      label: 'Тату'           },
  { id: 'other',       label: 'Інше'           },
] as const;

export type ServiceCategoryId = (typeof serviceCategories)[number]['id'];
