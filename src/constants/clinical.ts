export const RISK_OPTIONS = ['no', 'low', 'moderate', 'high'] as const;

export const RISK_LABELS: Record<string, { title: string; desc: string }> = {
  no: { title: 'NO', desc: 'No risk of Myopia Progression' },
  low: { title: 'Low', desc: 'Low risk of Myopia Progression' },
  moderate: { title: 'Moderate', desc: 'Moderate risk of Progression' },
  high: { title: 'High', desc: 'High risk of Progression' },
};

export const PROGRESS_OPTIONS = ['stable', 'slow', 'moderate', 'rapid'] as const;

export const PROGRESS_LABELS: Record<string, string> = {
  stable: 'Stable',
  slow: 'Slow',
  moderate: 'Moderate',
  rapid: 'Rapid',
};

export const COMPLIANCE_OPTIONS = ['excellent', 'good', 'fair', 'poor'] as const;

export const COMPLIANCE_LABELS: Record<string, { title: string; desc: string }> = {
  excellent: { title: 'Excellent', desc: 'Following plan every day' },
  good: { title: 'Good', desc: 'Mostly followed plan' },
  fair: { title: 'Fair', desc: 'Sometimes followed plan' },
  poor: { title: 'Poor', desc: 'Hardly followed plan' },
};

/** Max chars so "Other" text fits on Growth Card PDF underlines */
export const OTHER_MANAGEMENT_MAX = 28;
export const OTHER_PLAN_MAX = 32;
export const OTHER_TREATMENT_MAX = 40;

export const MGMT_OPTIONS = [
  'observation',
  'spectacles',
  'dims_miyosmart',
  'contact_lens',
  'atropine',
  'orthokeratology',
  'lifestyle',
  'nutritional',
  'other',
] as const;

export const MGMT_LABELS: Record<string, string> = {
  observation: 'Observation',
  spectacles: 'Spectacles',
  dims_miyosmart: 'DIMS / MiyoSmart',
  contact_lens: 'Contact Lens',
  atropine: 'Atropine Therapy',
  orthokeratology: 'Orthokeratology',
  lifestyle: 'Lifestyle Modification',
  nutritional: 'Nutritional Support',
  other: 'Other',
};

export const MGMT_ICONS: Record<string, string> = {
  observation: '👁',
  spectacles: '👓',
  dims_miyosmart: '◉',
  contact_lens: '◐',
  atropine: '💧',
  orthokeratology: '🌙',
  lifestyle: '🚶',
  nutritional: '🍎',
  other: '✎',
};

export const MGMT_SUB: Record<string, string> = {
  lifestyle: 'Outdoor, Screen time, Near work habits',
  other: 'Please specify',
};

export const PLAN_OPTIONS = [
  'wear_glasses',
  'outdoor_activity',
  'reduce_screen',
  'start_atropine',
  'start_dims',
  'follow_up',
  'other',
] as const;

export const PLAN_LABELS: Record<string, string> = {
  wear_glasses: 'Wear Glasses Regularly',
  outdoor_activity: 'Increase Outdoor Activity',
  reduce_screen: 'Reduce the Screen time',
  start_atropine: 'Start Atropine',
  start_dims: 'Start DIMS lens',
  follow_up: 'Follow up',
  other: 'Other',
};

export const PLAN_ICONS: Record<string, string> = {
  wear_glasses: '👓',
  outdoor_activity: '🌳',
  reduce_screen: '📱',
  start_atropine: '💧',
  start_dims: '◐',
  follow_up: '📅',
  other: '✎',
};
