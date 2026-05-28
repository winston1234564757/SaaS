export type RetentionStatusValue = 'active' | 'sleeping' | 'at_risk' | 'lost';

export type SegmentField =
  | 'retention_status'
  | 'total_visits'
  | 'total_spent'
  | 'average_check'
  | 'days_since_last_visit'
  | 'is_vip';

export type SegmentOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'in';

export type ConditionJoin = 'AND' | 'OR';

export interface SegmentCondition {
  field: SegmentField;
  operator: SegmentOperator;
  value: string | number | string[];
  joinNext?: ConditionJoin;
}

export interface CustomSegment {
  id: string;
  name: string;
  icon: string;
  color: string;
  conditions: SegmentCondition[];
}

export const SEGMENT_FIELD_LABELS: Record<SegmentField, string> = {
  retention_status:      'Статус утримання',
  total_visits:          'Кількість візитів',
  total_spent:           'Загальна сума (₴)',
  average_check:         'Середній чек (₴)',
  days_since_last_visit: 'Днів без візиту',
  is_vip:                'VIP-статус',
};

export const SEGMENT_OPERATOR_LABELS: Record<SegmentOperator, string> = {
  eq:  'точно',
  neq: 'не',
  gt:  'більше',
  gte: 'від',
  lt:  'менше',
  lte: 'до',
  in:  'є одним з',
};

export const OPERATORS_FOR_FIELD: Record<SegmentField, SegmentOperator[]> = {
  retention_status:      ['in', 'eq', 'neq'],
  total_visits:          ['gte', 'lte', 'gt', 'lt', 'eq'],
  total_spent:           ['gte', 'lte', 'gt', 'lt', 'eq'],
  average_check:         ['gte', 'lte', 'gt', 'lt', 'eq'],
  days_since_last_visit: ['gte', 'lte', 'gt', 'lt', 'eq'],
  is_vip:                ['eq'],
};

export const SEGMENT_PRESET_COLORS = [
  '#A8896A', '#5C9E7A', '#D4935A', '#C05B5B',
  '#789A99', '#A87BC4', '#4A90D9', '#E06B8B',
];

export const SEGMENT_PRESET_ICONS = [
  'Star', 'Crown', 'Gem', 'Heart', 'Zap', 'Target',
  'TrendingUp', 'TrendingDown', 'AlertTriangle', 'Clock',
  'UserCheck', 'UserX', 'Sparkles', 'Flame', 'Shield', 'Gift',
];
