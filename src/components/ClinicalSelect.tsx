import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/** Full-width clinical row (prototype .c-row) — multi-select checklist */
export function ClinicalRow({
  icon,
  label,
  sub,
  selected,
  onPress,
}: {
  icon?: string;
  label: string;
  sub?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowOn]}>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      {!!icon && (
        <Text style={styles.ico} allowFontScaling={false}>
          {icon}
        </Text>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.txt, selected && styles.txtOn]}>{label}</Text>
        {!!sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

export function OptionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

/** Prototype risk radio cards */
export function RadioCard({
  title,
  desc,
  selected,
  onPress,
}: {
  title: string;
  desc: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.radioCard, selected && styles.radioCardOn]}>
      <View style={[styles.radioDot, selected && styles.radioDotOn]} />
      <Text style={styles.radioText}>
        <Text style={styles.radioTitle}>{title}</Text>
        {desc ? ` — ${desc}` : ''}
      </Text>
    </Pressable>
  );
}

/** Prototype 2×2 progress pills */
export function ProgressPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillOn]}>
      <Text style={[styles.pillText, selected && styles.pillTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressPillGrid({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  labels: Record<string, string>;
}) {
  return (
    <View style={styles.pillGrid}>
      {options.map(k => (
        <ProgressPill
          key={k}
          label={labels[k] || k}
          selected={value === k}
          onPress={() => onChange(k)}
        />
      ))}
    </View>
  );
}

const SCORE_META: Record<
  string,
  { face: string; title: string; desc: string; color: string; bg: string }
> = {
  excellent: {
    face: '☺',
    title: 'EXCELLENT',
    desc: 'Following plan every day',
    color: '#22A06B',
    bg: '#ECFDF5',
  },
  good: {
    face: '🙂',
    title: 'GOOD',
    desc: 'Mostly followed plan',
    color: '#CA8A04',
    bg: '#FEFCE8',
  },
  fair: {
    face: '😐',
    title: 'FAIR',
    desc: 'Sometimes followed plan',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
  poor: {
    face: '☹',
    title: 'POOR',
    desc: 'Hardly followed plan',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
};

/** Prototype 2×2 compliance score cards */
export function ComplianceScoreGrid({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.scoreGrid}>
      {options.map(k => {
        const m = SCORE_META[k] || SCORE_META.good;
        const on = value === k;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[
              styles.scoreCard,
              on && { borderColor: m.color, backgroundColor: m.bg, borderWidth: 2 },
            ]}>
            <View style={[styles.scoreFace, { borderColor: m.color }]}>
              <Text style={{ fontSize: 18, color: m.color }}>{m.face}</Text>
            </View>
            <Text style={[styles.scoreTitle, { color: m.color }]}>{m.title}</Text>
            <Text style={styles.scoreDesc}>{m.desc}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const INTERVAL_OPTS: { key: '3' | '6' | '12'; label: string; color: string; icon: string }[] = [
  { key: '3', label: '3 Months', color: '#16A34A', icon: '📅' },
  { key: '6', label: '6 Months', color: '#EA580C', icon: '📅' },
  { key: '12', label: '12 Months', color: '#1E3A8A', icon: '📅' },
];

/** Optional recommended follow-up interval (3 / 6 / 12 months) */
export function FollowUpIntervalPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.intervalWrap}>
      <Text style={styles.intervalTitle}>Recommended Follow-Up Interval</Text>
      <Text style={styles.intervalSub}>(Doctor to tick one · optional)</Text>
      {INTERVAL_OPTS.map(opt => {
        const on = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(on ? '' : opt.key)}
            style={[styles.intervalRow, on && { borderColor: opt.color, backgroundColor: `${opt.color}12` }]}>
            <Text style={[styles.intervalIcon, { color: opt.color }]}>{opt.icon}</Text>
            <Text style={[styles.intervalLabel, { color: opt.color }]}>{opt.label}</Text>
            <View style={[styles.intervalCheck, on && { borderColor: opt.color, backgroundColor: opt.color }]}>
              {on ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7D2FE',
    backgroundColor: colors.white,
  },
  rowOn: { backgroundColor: '#F5F8FF' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  ico: {
    fontSize: 16,
    lineHeight: 20,
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  txt: { color: colors.text, fontWeight: '600', fontSize: 15 },
  txtOn: { color: colors.navy },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  radioCardOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.line,
    marginRight: 12,
  },
  radioDotOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  radioTitle: { fontWeight: '800', color: colors.navy },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  pill: {
    width: '47%',
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pillOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: { fontWeight: '700', color: colors.text, fontSize: 15 },
  pillTextOn: { color: '#fff' },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  scoreCard: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  scoreFace: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scoreTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4 },
  scoreDesc: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },
  intervalWrap: { marginTop: 8, marginBottom: 12 },
  intervalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  intervalSub: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  intervalIcon: { fontSize: 18, marginRight: 10 },
  intervalLabel: { flex: 1, fontSize: 15, fontWeight: '800' },
  intervalCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
