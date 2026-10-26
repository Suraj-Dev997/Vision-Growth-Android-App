import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ClinicalRow,
  ComplianceScoreGrid,
  FollowUpIntervalPicker,
  OptionCard,
  ProgressPillGrid,
} from '../../components/ClinicalSelect';
import { DateField } from '../../components/DateField';
import { GraphStrip } from '../../components/OdOsChart';
import { Chip, Field, OdOsFields, PrimaryButton, SecondaryButton, TopBar } from '../../components/ui';
import {
  COMPLIANCE_LABELS,
  COMPLIANCE_OPTIONS,
  MGMT_ICONS,
  MGMT_LABELS,
  MGMT_OPTIONS,
  MGMT_SUB,
  OTHER_PLAN_MAX,
  OTHER_TREATMENT_MAX,
  PLAN_ICONS,
  PLAN_LABELS,
  PLAN_OPTIONS,
  PROGRESS_LABELS,
  PROGRESS_OPTIONS,
} from '../../constants/clinical';
import { childrenApi, visitsApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { downloadPdf, sharePdfFile, viewPdf } from '../../utils/sharePdf';
import {
  ageFormatError,
  canonicalizeVaPair,
  clinicalFormatError,
  digitsOnly,
  isValidDateISO,
} from '../../utils/validation';

const STEPS = ['compliance', 'visit', 'treatment', 'progress', 'plan', 'summary'] as const;

function emptyVisitForm(age?: string | number) {
  return {
    visit_date: new Date().toISOString().slice(0, 10),
    age_years: age != null && age !== '' ? String(age) : '',
    compliance_score: '' as string,
    va_od: '',
    va_os: '',
    se_od: '',
    se_os: '',
    al_od: '',
    al_os: '',
    progress: '' as string,
    follow_up_date: '',
    follow_up_interval: '',
    other_treatment: '',
    plan_other: '',
    notes: '',
  };
}

function formatDisplayDate(iso: string) {
  const m = String(iso || '')
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso || '—';
}

function SumMetric({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.sumMetric}>
      <Text style={styles.sumMetricLabel}>{label}</Text>
      <Text style={styles.sumMetricValue}>{value?.trim() ? value : '—'}</Text>
    </View>
  );
}

export default function FollowUpScreen({ navigation, route }: any) {
  const { childId, age } = route.params;
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState(() => emptyVisitForm(age));
  const [treatments, setTreatments] = useState<string[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [annualFundus, setAnnualFundus] = useState<'yes' | 'no' | ''>('');
  const [childName, setChildName] = useState('');
  const [publicId, setPublicId] = useState<string | null>(null);
  const [savedVisitId, setSavedVisitId] = useState<number | null>(null);

  // Fresh blank visit every time this screen opens (unless already saved on summary)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await childrenApi.get(childId);
          if (cancelled) return;
          setChildName(res.data?.child_name || '');
          setPublicId(res.data?.public_id || null);
        } catch {
          /* keep empty name */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [childId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (savedVisitId) return;
      setStepIndex(0);
      setForm(emptyVisitForm(age));
      setTreatments([]);
      setPlans([]);
      setAnnualFundus('');
      setLoading(false);
      setExporting(false);
    }, [childId, age, savedVisitId]),
  );

  const step = STEPS[stepIndex];

  const graphPts = useMemo(() => {
    const ageNow = Number(form.age_years) || age;
    const pt = { label: 'Now', age: ageNow };
    return {
      vaPts: [{ ...pt, od: form.va_od, os: form.va_os }],
      sePts: [{ ...pt, od: form.se_od, os: form.se_os }],
      alPts: [{ ...pt, od: form.al_od, os: form.al_os }],
    };
  }, [
    form.va_od,
    form.va_os,
    form.se_od,
    form.se_os,
    form.al_od,
    form.al_os,
    form.age_years,
    age,
  ]);

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const validateVisit = () => {
    if (!isValidDateISO(form.visit_date)) return 'Please select a visit date';
    const ageErr = ageFormatError(form.age_years, true);
    if (ageErr) return ageErr;
    const va = canonicalizeVaPair(form.va_od, form.va_os);
    return (
      clinicalFormatError('VA', va.od, va.os, true, 'va') ||
      clinicalFormatError('SE', form.se_od, form.se_os, true, 'se') ||
      clinicalFormatError('Axial length', form.al_od, form.al_os, true, 'al')
    );
  };

  const next = () => {
    if (step === 'compliance' && !form.compliance_score) {
      Alert.alert('Required', 'Please select a compliance score');
      return;
    }
    if (step === 'visit') {
      const va = canonicalizeVaPair(form.va_od, form.va_os);
      if (va.od !== form.va_od || va.os !== form.va_os) {
        setForm({ ...form, va_od: va.od, va_os: va.os });
      }
      const msg = validateVisit();
      if (msg) {
        Alert.alert('Required fields', msg);
        return;
      }
    }
    if (step === 'progress' && !form.progress) {
      Alert.alert('Required', 'Please select a progression rate');
      return;
    }
    if (step === 'plan' && form.follow_up_date && !isValidDateISO(form.follow_up_date)) {
      Alert.alert('Check your details', 'Please select a valid follow-up date');
      return;
    }
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex(i => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const back = () => {
    if (savedVisitId) {
      navigation.goBack();
      return;
    }
    if (stepIndex === 0) navigation.goBack();
    else {
      setStepIndex(i => i - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const save = async () => {
    const msg = validateVisit();
    if (msg) {
      Alert.alert('Required fields', msg);
      setStepIndex(STEPS.indexOf('visit'));
      return;
    }
    if (!form.progress) {
      Alert.alert('Required', 'Please select a progression rate');
      setStepIndex(STEPS.indexOf('progress'));
      return;
    }
    setLoading(true);
    try {
      const res = await childrenApi.addVisit(childId, {
        ...form,
        age_years: Number(form.age_years) || age,
        other_treatment: treatments.includes('other')
          ? form.other_treatment.trim() || null
          : null,
        plan_other: plans.includes('other') ? form.plan_other.trim() || null : null,
        treatments,
        plans,
        annual_fundus_required: annualFundus || null,
      });
      const visitId = res.data?.visitId ?? null;
      setSavedVisitId(visitId);
      Alert.alert(
        'Saved',
        'Follow-up visit added. You can download or share the Growth Card PDF below.',
      );
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not save visit');
    } finally {
      setLoading(false);
    }
  };

  const withPdfLink = async (mode: 'view' | 'download' | 'share') => {
    if (!savedVisitId) {
      Alert.alert('Save first', 'Save the visit before exporting the PDF.');
      return;
    }
    setExporting(true);
    try {
      const res = await visitsApi.pdfLink(savedVisitId);
      const assessDate = String(form.visit_date || '').slice(0, 10) || 'date';
      const urls = {
        url: res.data!.url,
        downloadUrl: res.data!.downloadUrl,
        filename:
          res.data!.filename ||
          `VisionGrowth_${publicId || savedVisitId}_${assessDate}.pdf`,
      };
      if (!urls.url) throw new Error('No PDF link returned from server');
      if (mode === 'share') {
        await sharePdfFile(urls, `VISION Growth Card — ${childName || 'Visit'}`);
      } else if (mode === 'download') {
        await downloadPdf(urls);
        Alert.alert(
          Platform.OS === 'ios' ? 'Save PDF' : 'Downloaded',
          Platform.OS === 'ios'
            ? 'Choose “Save to Files” in the share sheet to keep the PDF on your iPhone.'
            : `${urls.filename} is in your Downloads folder. Open the Files or Downloads app to view it.`,
        );
      } else {
        await viewPdf(urls);
      }
    } catch (e: any) {
      if (e?.message === 'User did not share') return;
      Alert.alert('PDF export failed', e.message || 'Could not generate Growth Card PDF');
    } finally {
      setExporting(false);
    }
  };

  const titles: Record<(typeof STEPS)[number], string> = {
    compliance: 'Add Visit',
    visit: 'Visit Tracking',
    treatment: 'Treatment Management',
    progress: 'Progress',
    plan: 'Current Plan',
    summary: 'Summary',
  };

  return (
    <View style={styles.root}>
      <TopBar
        title={titles[step]}
        onBack={step === 'summary' && savedVisitId ? undefined : back}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {step === 'compliance' && (
            <>
              <Text style={styles.formTitle}>Compliance score</Text>
              <Text style={styles.formSub}>Select one — how well was the plan followed?</Text>
              <ComplianceScoreGrid
                options={COMPLIANCE_OPTIONS}
                value={form.compliance_score}
                onChange={c => setForm({ ...form, compliance_score: c })}
              />
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Returning visit — continue with measurements, treatment, progress, plan, then
                  summary.
                </Text>
              </View>
            </>
          )}

          {step === 'visit' && (
            <>
              <Text style={styles.formSub}>Enter today’s measurements</Text>
              <DateField
                label="Visit date *"
                value={form.visit_date}
                onChange={iso => setForm({ ...form, visit_date: iso })}
              />
              <Field
                label="Age (years) * — 2 to 18"
                keyboardType="numeric"
                value={form.age_years}
                onChangeText={v => setForm({ ...form, age_years: digitsOnly(v, 2) })}
              />
              <OdOsFields
                kind="va"
                label="Vision (VA) *"
                od={form.va_od}
                os={form.va_os}
                onChangeOd={v => setForm({ ...form, va_od: v })}
                onChangeOs={v => setForm({ ...form, va_os: v })}
              />
              <OdOsFields
                kind="se"
                label="Refraction under Cycloplegia (SE) *"
                od={form.se_od}
                os={form.se_os}
                onChangeOd={v => setForm({ ...form, se_od: v })}
                onChangeOs={v => setForm({ ...form, se_os: v })}
              />
              <OdOsFields
                kind="al"
                label="Axial length (AL) *"
                od={form.al_od}
                os={form.al_os}
                onChangeOd={v => setForm({ ...form, al_od: v })}
                onChangeOs={v => setForm({ ...form, al_os: v })}
              />
              <Text style={styles.label}>New visit graphs (from today’s inputs)</Text>
              <Text style={styles.hint}>
                Graphs stay blank until you enter values. Prior visits: open the child’s record.
              </Text>
              <GraphStrip vaPts={graphPts.vaPts} sePts={graphPts.sePts} alPts={graphPts.alPts} />
              <Field
                label="Notes"
                value={form.notes}
                onChangeText={v => setForm({ ...form, notes: v })}
              />
            </>
          )}

          {step === 'treatment' && (
            <>
              <Text style={styles.formSub}>Select all that apply for this visit</Text>
              <OptionCard>
                {MGMT_OPTIONS.map(k => (
                  <ClinicalRow
                    key={k}
                    icon={MGMT_ICONS[k]}
                    label={MGMT_LABELS[k]}
                    sub={MGMT_SUB[k]}
                    selected={treatments.includes(k)}
                    onPress={() => toggle(treatments, setTreatments, k)}
                  />
                ))}
              </OptionCard>
              {treatments.includes('other') && (
                <Field
                  icon="✎"
                  placeholder={`Other treatment (max ${OTHER_TREATMENT_MAX} chars)`}
                  value={form.other_treatment}
                  onChangeText={v => setForm({ ...form, other_treatment: v })}
                  maxLength={OTHER_TREATMENT_MAX}
                />
              )}
            </>
          )}

          {step === 'progress' && (
            <>
              <Text style={styles.formTitle}>Progression rate</Text>
              <Text style={styles.formSub}>Select one for this visit</Text>
              <ProgressPillGrid
                options={PROGRESS_OPTIONS}
                value={form.progress}
                onChange={p => setForm({ ...form, progress: p })}
                labels={PROGRESS_LABELS}
              />
            </>
          )}

          {step === 'plan' && (
            <>
              <Text style={styles.formSub}>Advice for the family — select all that apply</Text>
              <OptionCard>
                {PLAN_OPTIONS.map(k => (
                  <ClinicalRow
                    key={k}
                    icon={PLAN_ICONS[k]}
                    label={PLAN_LABELS[k]}
                    selected={plans.includes(k)}
                    onPress={() => toggle(plans, setPlans, k)}
                  />
                ))}
              </OptionCard>
              {plans.includes('other') && (
                <Field
                  icon="✎"
                  placeholder={`Other plan (max ${OTHER_PLAN_MAX} chars)`}
                  value={form.plan_other}
                  onChangeText={v => setForm({ ...form, plan_other: v })}
                  maxLength={OTHER_PLAN_MAX}
                />
              )}
              {plans.includes('follow_up') && (
                <>
                  <DateField
                    label="Follow-up date"
                    value={form.follow_up_date}
                    onChange={iso =>
                      setForm({
                        ...form,
                        follow_up_date: iso,
                        follow_up_interval: iso ? form.follow_up_interval : '',
                      })
                    }
                  />
                  {!!form.follow_up_date && (
                    <FollowUpIntervalPicker
                      value={form.follow_up_interval}
                      onChange={v => setForm({ ...form, follow_up_interval: v })}
                    />
                  )}
                </>
              )}
              <View style={styles.fundusCard}>
                <Text style={styles.fundusTitle}>Annual Fundus Examination required</Text>
                <View style={styles.row}>
                  <Chip
                    label="Yes"
                    selected={annualFundus === 'yes'}
                    onPress={() => setAnnualFundus('yes')}
                  />
                  <Chip
                    label="No"
                    selected={annualFundus === 'no'}
                    onPress={() => setAnnualFundus('no')}
                  />
                </View>
              </View>
            </>
          )}

          {step === 'summary' && (
            <>
              <View style={styles.summary}>
                <View style={styles.sumHeader}>
                  <Text style={styles.sumTitle}>{childName || 'Follow-up visit'}</Text>
                  <View style={styles.sumTypePill}>
                    <Text style={styles.sumTypeText}>Follow-up</Text>
                  </View>
                </View>

                <View style={styles.sumMetaGrid}>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>Date</Text>
                    <Text style={styles.sumMetaValue}>
                      {formatDisplayDate(form.visit_date)}
                    </Text>
                  </View>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>Age</Text>
                    <Text style={styles.sumMetaValue}>{form.age_years || '—'} yrs</Text>
                  </View>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>Compliance</Text>
                    <Text style={styles.sumMetaValue}>
                      {form.compliance_score
                        ? COMPLIANCE_LABELS[form.compliance_score]?.title ||
                          form.compliance_score
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.sumBlock}>
                  <Text style={styles.sumSection}>Visit tracking</Text>
                  <View style={styles.sumEyeCard}>
                    <Text style={[styles.sumEyeTag, { color: colors.od }]}>OD · Right</Text>
                    <View style={styles.sumMetrics}>
                      <SumMetric label="VA" value={form.va_od} />
                      <SumMetric label="SE" value={form.se_od} />
                      <SumMetric label="AL" value={form.al_od} />
                    </View>
                  </View>
                  <View style={styles.sumEyeCard}>
                    <Text style={[styles.sumEyeTag, { color: colors.os }]}>OS · Left</Text>
                    <View style={styles.sumMetrics}>
                      <SumMetric label="VA" value={form.va_os} />
                      <SumMetric label="SE" value={form.se_os} />
                      <SumMetric label="AL" value={form.al_os} />
                    </View>
                  </View>
                  <View style={styles.sumRiskRow}>
                    <Text style={styles.sumMetaLabel}>Progress</Text>
                    <View style={styles.sumProgressPill}>
                      <Text style={styles.sumProgressText}>
                        {form.progress
                          ? PROGRESS_LABELS[form.progress] ||
                            form.progress.charAt(0).toUpperCase() + form.progress.slice(1)
                          : '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                {treatments.length > 0 && (
                  <View style={styles.sumBlock}>
                    <Text style={styles.sumSection}>Treatment</Text>
                    <View style={styles.sumChipRow}>
                      {treatments.map(k => (
                        <View key={k} style={styles.sumChip}>
                          <Text style={styles.sumChipText}>{MGMT_LABELS[k] || k}</Text>
                        </View>
                      ))}
                    </View>
                    {treatments.includes('other') && !!form.other_treatment.trim() && (
                      <Text style={styles.sumOtherNote}>{form.other_treatment.trim()}</Text>
                    )}
                  </View>
                )}

                {plans.length > 0 && (
                  <View style={styles.sumBlock}>
                    <Text style={styles.sumSection}>Plan</Text>
                    <View style={styles.sumChipRow}>
                      {plans.map(k => (
                        <View key={k} style={styles.sumChip}>
                          <Text style={styles.sumChipText}>{PLAN_LABELS[k] || k}</Text>
                        </View>
                      ))}
                    </View>
                    {plans.includes('other') && !!form.plan_other.trim() && (
                      <Text style={styles.sumOtherNote}>{form.plan_other.trim()}</Text>
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Visit trend graphs (tap for full screen)</Text>
              <GraphStrip
                vaPts={graphPts.vaPts}
                sePts={graphPts.sePts}
                alPts={graphPts.alPts}
              />

              {savedVisitId ? (
                <>
                  <Text style={styles.formTitle}>VISION Growth Card PDF</Text>
                  <Text style={styles.formSub}>
                    Print, download or share the filled Growth Card
                  </Text>
                  {exporting ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : (
                    <View style={styles.pdfRow}>
                      <SecondaryButton
                        title="Print / View"
                        onPress={() => withPdfLink('view')}
                        style={{ flex: 1 }}
                      />
                      <SecondaryButton
                        title="Download PDF"
                        onPress={() => withPdfLink('download')}
                        style={{ flex: 1, marginLeft: 8 }}
                      />
                    </View>
                  )}
                  {!exporting && (
                    <PrimaryButton
                      title="Share PDF"
                      onPress={() => withPdfLink('share')}
                      style={{ marginTop: 10 }}
                    />
                  )}
                  <SecondaryButton
                    title="Back to Home"
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                    style={{ marginTop: 14 }}
                  />
                </>
              ) : (
                <View style={styles.actions}>
                  <SecondaryButton title="Back" onPress={back} style={{ flex: 1 }} />
                  <PrimaryButton
                    title="Save visit"
                    onPress={save}
                    loading={loading}
                    style={{ flex: 1, marginLeft: 10 }}
                  />
                </View>
              )}
            </>
          )}

          {step !== 'summary' &&
            (step === 'compliance' ? (
              <View style={styles.actionsCol}>
                <PrimaryButton title="Continue →" onPress={next} loading={loading} />
                <SecondaryButton title="Back" onPress={back} style={{ marginTop: 10 }} />
              </View>
            ) : (
              <View style={styles.actions}>
                <SecondaryButton title="Back" onPress={back} style={{ flex: 1 }} />
                <PrimaryButton
                  title="Next →"
                  onPress={next}
                  loading={loading}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </View>
            ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 16, paddingBottom: 120, backgroundColor: colors.bg, flexGrow: 1 },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 4 },
  formSub: { color: colors.muted, marginBottom: 14, fontSize: 13 },
  label: { color: colors.muted, fontWeight: '700', marginBottom: 4, marginTop: 4 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 8, lineHeight: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  infoBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoText: { color: colors.navy, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 16, marginBottom: 24 },
  actionsCol: { marginTop: 18, marginBottom: 24 },
  fundusCard: {
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fundusTitle: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  sumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  sumTitle: { fontWeight: '800', fontSize: 20, color: colors.text, flex: 1 },
  sumTypePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sumTypeText: { color: colors.primary, fontWeight: '800', fontSize: 11 },
  sumMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  sumMetaItem: {
    flexGrow: 1,
    minWidth: '28%',
    backgroundColor: colors.ice,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sumMetaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sumMetaValue: { color: colors.text, fontWeight: '700', fontSize: 14 },
  sumBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  sumSection: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.navy,
    marginBottom: 10,
  },
  sumRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sumProgressPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sumProgressText: { color: '#92400E', fontWeight: '800', fontSize: 12 },
  sumEyeCard: {
    backgroundColor: colors.ice,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  sumEyeTag: { fontWeight: '800', fontSize: 12, marginBottom: 8 },
  sumMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sumMetric: {
    minWidth: '22%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sumMetricLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  sumMetricValue: { color: colors.text, fontWeight: '800', fontSize: 13 },
  sumChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  sumChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sumChipText: { color: colors.navy, fontWeight: '700', fontSize: 11 },
  sumOtherNote: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  pdfRow: { flexDirection: 'row', marginTop: 4 },
});
