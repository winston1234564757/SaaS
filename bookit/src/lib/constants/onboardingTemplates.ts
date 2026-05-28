export type ServiceTemplateType = 'express' | 'standard' | 'premium';

export interface ServiceTemplateDefinition {
  name: string;
  time: number;
  priceMult: number;
}

export interface CategoryTemplate {
  id: string;
  emoji: string;
  label: string;
  baseName: string;
  express: ServiceTemplateDefinition;
  standard: ServiceTemplateDefinition;
  premium: ServiceTemplateDefinition;
}

export interface CategoryGroup {
  id: string;
  label: string;
  categories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'nails',  label: 'Нігті',      categories: ['nails', 'pedicure', 'nail_art'] },
  { id: 'hair',   label: 'Волосся',    categories: ['hair', 'hair_color', 'barbershop', 'hair_care'] },
  { id: 'face',   label: 'Обличчя',    categories: ['brows', 'lashes', 'makeup', 'cosmetology', 'pmu'] },
  { id: 'body',   label: 'Тіло',       categories: ['massage', 'depilation', 'spa', 'fitness'] },
  { id: 'art',    label: 'Тату / Пірс', categories: ['tattoo', 'piercing'] },
];

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  // ── Нігті ────────────────────────────────────────────────────────────────
  nails: {
    id: 'nails',
    emoji: '💅',
    label: 'Манікюр',
    baseName: 'Манікюр',
    express:  { name: 'Експрес (без покриття)',          time: 45,  priceMult: 0.6 },
    standard: { name: 'Манікюр з гель-лаком',            time: 90,  priceMult: 1.0 },
    premium:  { name: 'Нарощення / Укріплення нігтів',   time: 150, priceMult: 1.5 },
  },
  pedicure: {
    id: 'pedicure',
    emoji: '🦶',
    label: 'Педикюр',
    baseName: 'Педикюр',
    express:  { name: 'Педикюр без покриття',            time: 45,  priceMult: 0.65 },
    standard: { name: 'Педикюр з гель-лаком',            time: 75,  priceMult: 1.0  },
    premium:  { name: 'SPA-педикюр з парафіном',         time: 100, priceMult: 1.4  },
  },
  nail_art: {
    id: 'nail_art',
    emoji: '🎨',
    label: 'Нейл-арт',
    baseName: 'Дизайн нігтів',
    express:  { name: 'Простий дизайн (2-5 нігтів)',     time: 20,  priceMult: 0.4 },
    standard: { name: 'Дизайн на всі нігті',             time: 45,  priceMult: 1.0 },
    premium:  { name: 'Авторський арт / Вітраж',         time: 90,  priceMult: 2.0 },
  },

  // ── Волосся ───────────────────────────────────────────────────────────────
  hair: {
    id: 'hair',
    emoji: '✂️',
    label: 'Стрижки',
    baseName: 'Жіноча стрижка',
    express:  { name: 'Кінчики / Чубчик',                time: 30,  priceMult: 0.4 },
    standard: { name: 'Жіноча стрижка з укладкою',       time: 75,  priceMult: 1.0 },
    premium:  { name: 'Складна авторська стрижка',        time: 120, priceMult: 1.6 },
  },
  hair_color: {
    id: 'hair_color',
    emoji: '🌈',
    label: 'Фарбування',
    baseName: 'Фарбування волосся',
    express:  { name: 'Тонування (коренева зона)',        time: 60,  priceMult: 0.5 },
    standard: { name: 'Однотонне фарбування',             time: 120, priceMult: 1.0 },
    premium:  { name: 'Балаяж / Омбре / Шатуш',          time: 210, priceMult: 2.2 },
  },
  barbershop: {
    id: 'barbershop',
    emoji: '💈',
    label: 'Барбершоп',
    baseName: 'Чоловіча стрижка',
    express:  { name: 'Підрівнювання контуру',            time: 20,  priceMult: 0.5 },
    standard: { name: 'Стрижка + Укладка',                time: 45,  priceMult: 1.0 },
    premium:  { name: 'Стрижка + Борода + Гоління',       time: 75,  priceMult: 1.6 },
  },
  hair_care: {
    id: 'hair_care',
    emoji: '✨',
    label: 'Догляд за волоссям',
    baseName: 'Кератинове випрямлення',
    express:  { name: 'Ботокс для волосся',               time: 90,  priceMult: 0.6 },
    standard: { name: 'Кератинове випрямлення',           time: 150, priceMult: 1.0 },
    premium:  { name: 'Кератин + Стрижка + Укладка',     time: 210, priceMult: 1.5 },
  },

  // ── Обличчя ───────────────────────────────────────────────────────────────
  brows: {
    id: 'brows',
    emoji: '🌿',
    label: 'Брови',
    baseName: 'Корекція брів',
    express:  { name: 'Корекція форми',                   time: 30, priceMult: 0.5 },
    standard: { name: 'Корекція + Фарбування хною',       time: 60, priceMult: 1.0 },
    premium:  { name: 'Ламінування + Ботокс брів',        time: 90, priceMult: 1.4 },
  },
  lashes: {
    id: 'lashes',
    emoji: '👁️',
    label: 'Вії',
    baseName: 'Нарощення вій',
    express:  { name: 'Класика (80-100 вій)',              time: 90,  priceMult: 0.7 },
    standard: { name: "Об'єм 2D-3D",                      time: 120, priceMult: 1.0 },
    premium:  { name: "Мегаоб'єм / Голівуд",              time: 150, priceMult: 1.5 },
  },
  makeup: {
    id: 'makeup',
    emoji: '💄',
    label: 'Макіяж',
    baseName: 'Вечірній макіяж',
    express:  { name: 'Нюд / Денний макіяж',              time: 45,  priceMult: 0.7 },
    standard: { name: 'Вечірній макіяж',                  time: 90,  priceMult: 1.0 },
    premium:  { name: 'Весільний / Авторський',           time: 120, priceMult: 1.5 },
  },
  cosmetology: {
    id: 'cosmetology',
    emoji: '🧖',
    label: 'Косметологія',
    baseName: 'Чистка обличчя',
    express:  { name: 'Поверхнева чистка',                time: 45,  priceMult: 0.6 },
    standard: { name: 'Комбінована чистка',               time: 80,  priceMult: 1.0 },
    premium:  { name: 'Ультразвук + Пілінг + Маска',      time: 120, priceMult: 1.7 },
  },
  pmu: {
    id: 'pmu',
    emoji: '🖌️',
    label: 'ПМ Макіяж',
    baseName: 'Перманентний макіяж',
    express:  { name: 'Корекція (від 4 тижнів)',          time: 90,  priceMult: 0.5 },
    standard: { name: 'Брови (пудрове напилення)',         time: 150, priceMult: 1.0 },
    premium:  { name: 'Губи / Стрілки (повна робота)',    time: 180, priceMult: 1.3 },
  },

  // ── Тіло ─────────────────────────────────────────────────────────────────
  massage: {
    id: 'massage',
    emoji: '💆',
    label: 'Масаж',
    baseName: 'Масаж тіла',
    express:  { name: 'Шийно-комірцева зона',             time: 30,  priceMult: 0.5 },
    standard: { name: 'Загальний розслаблюючий',           time: 60,  priceMult: 1.0 },
    premium:  { name: 'Релакс SPA (все тіло)',            time: 120, priceMult: 1.8 },
  },
  depilation: {
    id: 'depilation',
    emoji: '🌊',
    label: 'Депіляція',
    baseName: 'Цукрова депіляція',
    express:  { name: 'Підпахи / Зона бікіні',           time: 30,  priceMult: 0.55 },
    standard: { name: 'Ноги повністю (шугаринг)',         time: 60,  priceMult: 1.0  },
    premium:  { name: 'Все тіло (SHR лазер)',            time: 120, priceMult: 2.0  },
  },
  spa: {
    id: 'spa',
    emoji: '🛁',
    label: 'SPA',
    baseName: 'SPA-програма',
    express:  { name: 'Розслаблюючий ритуал 30хв',        time: 30,  priceMult: 0.5 },
    standard: { name: 'SPA-програма «Відновлення»',       time: 90,  priceMult: 1.0 },
    premium:  { name: 'Royal SPA (2+ години)',            time: 150, priceMult: 1.9 },
  },
  fitness: {
    id: 'fitness',
    emoji: '🏋️',
    label: 'Фітнес',
    baseName: 'Персональне тренування',
    express:  { name: 'Розминка / Стретчинг 30хв',        time: 30,  priceMult: 0.5 },
    standard: { name: 'Персональне тренування',           time: 60,  priceMult: 1.0 },
    premium:  { name: 'Тренування + Складання програми', time: 90,  priceMult: 1.5 },
  },

  // ── Тату / Пірсинг ───────────────────────────────────────────────────────
  tattoo: {
    id: 'tattoo',
    emoji: '🖋️',
    label: 'Татуювання',
    baseName: 'Татуювання',
    express:  { name: 'Міні-тату (до 5 см)',              time: 60,  priceMult: 0.5 },
    standard: { name: 'Середній елемент (5-15 см)',       time: 180, priceMult: 1.0 },
    premium:  { name: 'Велика / Кольорова робота',        time: 360, priceMult: 2.5 },
  },
  piercing: {
    id: 'piercing',
    emoji: '💎',
    label: 'Пірсинг',
    baseName: 'Пірсинг',
    express:  { name: 'Вушна мочка',                     time: 15,  priceMult: 0.6 },
    standard: { name: 'Хрящ / Ніс / Пупок',              time: 30,  priceMult: 1.0 },
    premium:  { name: 'Складні зони + ювелірка',          time: 45,  priceMult: 1.8 },
  },
};
