import React, { useMemo, useRef, useState } from 'react';
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
import {
  ClinicalRow,
  FollowUpIntervalPicker,
  OptionCard,
  ProgressPillGrid,
  RadioCard,
} from '../../components/ClinicalSelect';
import { DateField } from '../../components/DateField';
import { GraphStrip } from '../../components/OdOsChart';
import {
  Chip,
  Field,
  OdOsFields,
  PrimaryButton,
  SecondaryButton,
  TopBar,
} from '../../components/ui';
import { visitsApi } from '../../services/api';
import { downloadPdf, sharePdfFile, viewPdf } from '../../utils/sharePdf';
import {
  MGMT_ICONS,
  MGMT_LABELS,
  MGMT_OPTIONS,
  MGMT_SUB,
  PLAN_ICONS,
  PLAN_LABELS,
  PLAN_OPTIONS,
  PROGRESS_LABELS,
  OTHER_MANAGEMENT_MAX,
  OTHER_PLAN_MAX,
  OTHER_TREATMENT_MAX,
  PROGRESS_OPTIONS,
  RISK_LABELS,
  RISK_OPTIONS,
} from '../../constants/clinical';
import { childrenApi } from '../../services/api';
import { colors } from '../../theme/colors';
import {
  AGE_MAX,
  AGE_MIN,
  ageYearsFromDob,
  canonicalizeVaPair,
  clinicalFormatError,
  digitsOnly,
  dobPickerBounds,
  firstError,
  isValidDateISO,
  validateChildInfo,
} from '../../utils/validation';

const STEPS_NEW = ['info', 'type', 'visit', 'treatment', 'progress', 'plan', 'summary'] as const;
const STEPS_PRE = [
  'info',
  'type',
  'baseline',
  'risk',
  'management',
  'visit',
  'treatment',
  'progress',
  'plan',
  'summary',
] as const;

/** Age from DOB — empty if outside ${AGE_MIN}–${AGE_MAX} (no silent clamp). */
function ageFromDob(iso: string, asOfIso?: string): string {
  const years = ageYearsFromDob(iso, asOfIso);
  if (years == null || years < AGE_MIN || years > AGE_MAX) return '';
  return String(years);
}

function formatDisplayDate(iso: string) {
  if (!isValidDateISO(iso)) return iso || '—';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function SumMetric({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.sumMetric}>
      <Text style={styles.sumMetricLabel}>{label}</Text>
      <Text style={styles.sumMetricValue}>{value?.trim() ? value : '—'}</Text>
    </View>
  );
}

export default function AssessmentScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [childType, setChildType] = useState<'new' | 'pre_existing'>('new');
  const [info, setInfo] = useState({
    child_name: '',
    parent_mobile: '',
    dob: '',
    age: '',
    school: '',
    first_assessment_date: new Date().toISOString().slice(0, 10),
  });
  const [baseline, setBaseline] = useState({
    va_od: '',
    va_os: '',
    se_od: '',
    se_os: '',
    al_od: '',
    al_os: '',
    bv_od: '',
    bv_os: '',
    risk_category: 'low',
  });
  const [management, setManagement] = useState<string[]>([]);
  const [managementOther, setManagementOther] = useState('');
  const [annualFundus, setAnnualFundus] = useState<'yes' | 'no' | ''>('');
  const [savedVisitId, setSavedVisitId] = useState<number | null>(null);
  const [savedPublicId, setSavedPublicId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [visit, setVisit] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    va_od: '',
    va_os: '',
    se_od: '',
    se_os: '',
    al_od: '',
    al_os: '',
    progress: '',
    follow_up_date: '',
    follow_up_interval: '',
    other_treatment: '',
    plan_other: '',
    notes: '',
    treatments: [] as string[],
    plans: [] as string[],
  });

  const steps = useMemo(
    () => (childType === 'pre_existing' ? STEPS_PRE : STEPS_NEW),
    [childType],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const next = () => {
    if (step === 'info') {
      const errs = validateChildInfo(info);
      const msg = firstError(errs);
      if (msg) {
        Alert.alert('Check your details', msg);
        return;
      }
    }
    if (step === 'baseline') {
      const va = canonicalizeVaPair(baseline.va_od, baseline.va_os);
      const clinicalErr =
        clinicalFormatError('VA', va.od, va.os, true, 'va') ||
        clinicalFormatError('SE', baseline.se_od, baseline.se_os, true, 'se') ||
        clinicalFormatError('Axial length', baseline.al_od, baseline.al_os, true, 'al') ||
        clinicalFormatError('Binocular vision', baseline.bv_od, baseline.bv_os, false, 'bv');
      if (clinicalErr) {
        Alert.alert('Check format', clinicalErr);
        return;
      }
      if (va.od !== baseline.va_od || va.os !== baseline.va_os) {
        setBaseline({ ...baseline, va_od: va.od, va_os: va.os });
      }
    }
    if (step === 'visit') {
      if (!isValidDateISO(visit.visit_date)) {
        Alert.alert('Check your details', 'Please select a visit date');
        return;
      }
      const va = canonicalizeVaPair(visit.va_od, visit.va_os);
      const clinicalErr =
        clinicalFormatError('VA', va.od, va.os, true, 'va') ||
        clinicalFormatError('SE', visit.se_od, visit.se_os, true, 'se') ||
        clinicalFormatError('Axial length', visit.al_od, visit.al_os, true, 'al');
      if (clinicalErr) {
        Alert.alert('Check format', clinicalErr);
        return;
      }
      if (va.od !== visit.va_od || va.os !== visit.va_os) {
        setVisit({ ...visit, va_od: va.od, va_os: va.os });
      }
    }
    if (step === 'progress' && !visit.progress) {
      Alert.alert('Required', 'Please select a progression rate');
      return;
    }
    if (step === 'plan' && visit.follow_up_date && !isValidDateISO(visit.follow_up_date)) {
      Alert.alert('Check your details', 'Please select a valid follow-up date');
      return;
    }
    setStepIndex(i => Math.min(i + 1, steps.length - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const back = () => {
    if (stepIndex === 0) navigation.goBack();
    else setStepIndex(i => i - 1);
  };

  const chooseType = (t: 'new' | 'pre_existing') => {
    setChildType(t);
    setStepIndex(1);
  };

  const save = async () => {
    const errs = validateChildInfo(info);
    const msg = firstError(errs);
    if (msg) {
      Alert.alert('Check your details', msg);
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        ...info,
        age: info.age ? Number(info.age) : undefined,
        child_type: childType,
        visit: {
          ...visit,
          age_years: info.age ? Number(info.age) : undefined,
          other_treatment: visit.treatments.includes('other')
            ? visit.other_treatment.trim() || null
            : null,
          plan_other: visit.plans.includes('other') ? visit.plan_other.trim() || null : null,
        },
      };
      if (childType === 'pre_existing') {
        payload.baseline = baseline;
        payload.management = management;
        payload.management_other = management.includes('other')
          ? managementOther.trim() || null
          : null;
      }
      payload.annual_fundus_required = annualFundus || null;
      const res = await childrenApi.createAssessment(payload);
      const visitId = res.data?.visitId ?? null;
      setSavedVisitId(visitId);
      setSavedPublicId(res.data?.public_id || res.data?.publicId || null);
      Alert.alert('Saved', 'Assessment created. You can download or share the Growth Card PDF below.');
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not save assessment');
    } finally {
      setLoading(false);
    }
  };

  const withPdfLink = async (mode: 'view' | 'download' | 'share') => {
    if (!savedVisitId) {
      Alert.alert('Save first', 'Save the assessment before exporting the PDF.');
      return;
    }
    setExporting(true);
    try {
      const res = await visitsApi.pdfLink(savedVisitId);
      const assessDate = String(visit.visit_date || '').slice(0, 10) || 'date';
      const urls = {
        url: res.data!.url,
        downloadUrl: res.data!.downloadUrl,
        filename:
          res.data!.filename ||
          `VisionGrowth_${savedPublicId || savedVisitId}_${assessDate}.pdf`,
      };
      if (!urls.url) throw new Error('No PDF link returned from server');
      if (mode === 'share') {
        await sharePdfFile(urls, `VISION Growth Card — ${info.child_name}`);
      } else if (mode === 'download') {
        await downloadPdf(urls);
        Alert.alert(
          'Downloaded',
          `${urls.filename} is in your Downloads folder. Open the Files or Downloads app to view it.`,
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

  // Graphs = visit tracking only (baseline clinical data is study-only, not plotted)
  const summaryGraphs = {
    vaPts: [{ label: 'Visit', age: info.age, od: visit.va_od, os: visit.va_os }],
    sePts: [{ label: 'Visit', age: info.age, od: visit.se_od, os: visit.se_os }],
    alPts: [{ label: 'Visit', age: info.age, od: visit.al_od, os: visit.al_os }],
  };

  const stepTitles: Record<string, string> = {
    info: 'Child Information',
    type: 'Child Type',
    baseline: 'Baseline Data',
    risk: 'Risk Category',
    management: 'Baseline Management',
    visit: 'Visit Tracking',
    treatment: 'Treatment Management',
    progress: 'Progress',
    plan: 'Current Plan',
    summary: 'Summary',
  };

  return (
    <View style={styles.root}>
      <TopBar
        title={stepTitles[step] || 'New assessment'}
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
          <Text style={styles.step}>{stepTitles[step] || 'New assessment'}</Text>

          {step === 'info' && (
            <>
              <Field
                icon="👤"
                placeholder="Child name *"
                value={info.child_name}
                onChangeText={v => setInfo({ ...info, child_name: v })}
                maxLength={150}
              />
              <Field
                icon="☎"
                placeholder="Contact number * (10 digits)"
                keyboardType="phone-pad"
                value={info.parent_mobile}
                onChangeText={v => setInfo({ ...info, parent_mobile: digitsOnly(v, 10) })}
                maxLength={10}
              />
              <DateField
                label={`Date of birth * (age ${AGE_MIN}–${AGE_MAX})`}
                value={info.dob}
                {...dobPickerBounds(info.first_assessment_date)}
                onChange={iso => {
                  const age = ageFromDob(iso, info.first_assessment_date);
                  setInfo({
                    ...info,
                    dob: iso,
                    age, // empty if DOB is outside 2–18 — do not clamp
                  });
                  if (!age && isValidDateISO(iso)) {
                    Alert.alert(
                      'Invalid date of birth',
                      `Child must be between ${AGE_MIN} and ${AGE_MAX} years old.`,
                    );
                  }
                }}
              />
              <DateField
                label="First assessment date *"
                value={info.first_assessment_date}
                maximumDate={new Date()}
                onChange={iso =>
                  setInfo({
                    ...info,
                    first_assessment_date: iso,
                    age: info.dob ? ageFromDob(info.dob, iso) : info.age,
                  })
                }
              />
              <Field
                label={`Age (years) * — ${AGE_MIN} to ${AGE_MAX}`}
                icon="#"
                placeholder={`${AGE_MIN}–${AGE_MAX}`}
                keyboardType="number-pad"
                value={info.age}
                onChangeText={v => setInfo({ ...info, age: digitsOnly(v, 2) })}
                maxLength={2}
              />
              <Field
                label="School name"
                icon="🏫"
                placeholder="School name (optional)"
                value={info.school}
                onChangeText={v => setInfo({ ...info, school: v })}
                maxLength={200}
              />
            </>
          )}

          {step === 'type' && (
            <>
              <Text style={styles.formTitle}>Child type</Text>
              <Text style={styles.formSub}>Is this a new or pre-existing child?</Text>
              <View style={styles.row}>
                <Chip label="New" selected={childType === 'new'} onPress={() => chooseType('new')} />
                <Chip
                  label="Pre-existing"
                  selected={childType === 'pre_existing'}
                  onPress={() => chooseType('pre_existing')}
                />
              </View>
            </>
          )}

          {step === 'baseline' && (
            <>
              <Text style={styles.formTitle}>Baseline data</Text>
              <Text style={styles.formSub}>Enter OD (Right) / OS (Left) values</Text>
              <OdOsFields
                kind="va"
                label="Vision (VA) *"
                od={baseline.va_od}
                os={baseline.va_os}
                onChangeOd={v => setBaseline({ ...baseline, va_od: v })}
                onChangeOs={v => setBaseline({ ...baseline, va_os: v })}
              />
              <OdOsFields
                kind="se"
                label="Refraction under Cycloplegia (SE) *"
                od={baseline.se_od}
                os={baseline.se_os}
                onChangeOd={v => setBaseline({ ...baseline, se_od: v })}
                onChangeOs={v => setBaseline({ ...baseline, se_os: v })}
              />
              <OdOsFields
                kind="al"
                label="Axial length (AL) *"
                od={baseline.al_od}
                os={baseline.al_os}
                onChangeOd={v => setBaseline({ ...baseline, al_od: v })}
                onChangeOs={v => setBaseline({ ...baseline, al_os: v })}
              />
              <OdOsFields
                kind="bv"
                label="Binocular vision (optional)"
                od={baseline.bv_od}
                os={baseline.bv_os}
                onChangeOd={v => setBaseline({ ...baseline, bv_od: v })}
                onChangeOs={v => setBaseline({ ...baseline, bv_os: v })}
              />
            </>
          )}

          {step === 'risk' && (
            <>
              <Text style={styles.formTitle}>Risk category</Text>
              <Text style={styles.formSub}>Mark one option for myopia progression risk</Text>
              {RISK_OPTIONS.map(r => (
                <RadioCard
                  key={r}
                  title={RISK_LABELS[r].title}
                  desc={RISK_LABELS[r].desc}
                  selected={baseline.risk_category === r}
                  onPress={() => setBaseline({ ...baseline, risk_category: r })}
                />
              ))}
            </>
          )}

          {step === 'management' && (
            <>
              <Text style={styles.formTitle}>Baseline management</Text>
              <Text style={styles.formSub}>Select all that apply</Text>
              <OptionCard>
                {MGMT_OPTIONS.map(k => (
                  <ClinicalRow
                    key={k}
                    icon={MGMT_ICONS[k]}
                    label={MGMT_LABELS[k]}
                    sub={MGMT_SUB[k]}
                    selected={management.includes(k)}
                    onPress={() => toggle(management, setManagement, k)}
                  />
                ))}
              </OptionCard>
              {management.includes('other') && (
                <Field
                  icon="✎"
                  placeholder={`Other management (max ${OTHER_MANAGEMENT_MAX} chars)`}
                  value={managementOther}
                  onChangeText={setManagementOther}
                  maxLength={OTHER_MANAGEMENT_MAX}
                />
              )}
            </>
          )}

          {step === 'visit' && (
            <>
              <Text style={styles.formSub}>Enter today’s measurements</Text>
              <DateField
                label="Visit date *"
                value={visit.visit_date}
                onChange={iso => setVisit({ ...visit, visit_date: iso })}
              />
              <OdOsFields
                kind="va"
                label="Vision (VA) *"
                od={visit.va_od}
                os={visit.va_os}
                onChangeOd={v => setVisit({ ...visit, va_od: v })}
                onChangeOs={v => setVisit({ ...visit, va_os: v })}
              />
              <OdOsFields
                kind="se"
                label="Refraction under Cycloplegia (SE) *"
                od={visit.se_od}
                os={visit.se_os}
                onChangeOd={v => setVisit({ ...visit, se_od: v })}
                onChangeOs={v => setVisit({ ...visit, se_os: v })}
              />
              <OdOsFields
                kind="al"
                label="Axial length (AL) *"
                od={visit.al_od}
                os={visit.al_os}
                onChangeOd={v => setVisit({ ...visit, al_od: v })}
                onChangeOs={v => setVisit({ ...visit, al_os: v })}
              />
              <Text style={styles.label}>New visit graphs (from today’s inputs)</Text>
              <Text style={styles.hint}>
                Graphs stay blank until you enter values. Prior visits: open the child’s record.
              </Text>
              <GraphStrip
                vaPts={[{ label: 'Now', age: info.age, od: visit.va_od, os: visit.va_os }]}
                sePts={[{ label: 'Now', age: info.age, od: visit.se_od, os: visit.se_os }]}
                alPts={[{ label: 'Now', age: info.age, od: visit.al_od, os: visit.al_os }]}
              />
              <Field
                label="Notes"
                value={visit.notes}
                onChangeText={v => setVisit({ ...visit, notes: v })}
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
                    selected={visit.treatments.includes(k)}
                    onPress={() =>
                      setVisit({
                        ...visit,
                        treatments: visit.treatments.includes(k)
                          ? visit.treatments.filter(x => x !== k)
                          : [...visit.treatments, k],
                      })
                    }
                  />
                ))}
              </OptionCard>
              {visit.treatments.includes('other') && (
                <Field
                  icon="✎"
                  placeholder={`Other treatment (max ${OTHER_TREATMENT_MAX} chars)`}
                  value={visit.other_treatment}
                  onChangeText={v => setVisit({ ...visit, other_treatment: v })}
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
                value={visit.progress}
                onChange={p => setVisit({ ...visit, progress: p })}
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
                    selected={visit.plans.includes(k)}
                    onPress={() =>
                      setVisit({
                        ...visit,
                        plans: visit.plans.includes(k)
                          ? visit.plans.filter(x => x !== k)
                          : [...visit.plans, k],
                      })
                    }
                  />
                ))}
              </OptionCard>
              {visit.plans.includes('other') && (
                <Field
                  icon="✎"
                  placeholder={`Other plan (max ${OTHER_PLAN_MAX} chars)`}
                  value={visit.plan_other}
                  onChangeText={v => setVisit({ ...visit, plan_other: v })}
                  maxLength={OTHER_PLAN_MAX}
                />
              )}
              {visit.plans.includes('follow_up') && (
                <>
                  <DateField
                    label="Follow-up date"
                    value={visit.follow_up_date}
                    onChange={iso =>
                      setVisit({
                        ...visit,
                        follow_up_date: iso,
                        follow_up_interval: iso ? visit.follow_up_interval : '',
                      })
                    }
                  />
                  {!!visit.follow_up_date && (
                    <FollowUpIntervalPicker
                      value={visit.follow_up_interval}
                      onChange={v => setVisit({ ...visit, follow_up_interval: v })}
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
                  <Text style={styles.sumTitle}>{info.child_name || 'Child'}</Text>
                  <View style={styles.sumTypePill}>
                    <Text style={styles.sumTypeText}>
                      {childType === 'pre_existing' ? 'Pre-existing' : 'New'}
                    </Text>
                  </View>
                </View>

                <View style={styles.sumMetaGrid}>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>Contact</Text>
                    <Text style={styles.sumMetaValue}>{info.parent_mobile || '—'}</Text>
                  </View>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>DOB</Text>
                    <Text style={styles.sumMetaValue}>{formatDisplayDate(info.dob)}</Text>
                  </View>
                  <View style={styles.sumMetaItem}>
                    <Text style={styles.sumMetaLabel}>Age</Text>
                    <Text style={styles.sumMetaValue}>{info.age || '—'} yrs</Text>
                  </View>
                </View>

                {childType === 'pre_existing' && (
                  <View style={styles.sumBlock}>
                    <Text style={styles.sumSection}>Baseline data</Text>
                    <View style={styles.sumRiskRow}>
                      <Text style={styles.sumMetaLabel}>Risk</Text>
                      <View style={styles.sumRiskPill}>
                        <Text style={styles.sumRiskText}>
                          {(baseline.risk_category || '—').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sumEyeCard}>
                      <Text style={[styles.sumEyeTag, { color: colors.od }]}>OD · Right</Text>
                      <View style={styles.sumMetrics}>
                        <SumMetric label="VA" value={baseline.va_od} />
                        <SumMetric label="SE" value={baseline.se_od} />
                        <SumMetric label="AL" value={baseline.al_od} />
                        <SumMetric label="BV" value={baseline.bv_od} />
                      </View>
                    </View>
                    <View style={styles.sumEyeCard}>
                      <Text style={[styles.sumEyeTag, { color: colors.os }]}>OS · Left</Text>
                      <View style={styles.sumMetrics}>
                        <SumMetric label="VA" value={baseline.va_os} />
                        <SumMetric label="SE" value={baseline.se_os} />
                        <SumMetric label="AL" value={baseline.al_os} />
                        <SumMetric label="BV" value={baseline.bv_os} />
                      </View>
                    </View>

                    {management.length > 0 && (
                      <View style={styles.sumMgmtWrap}>
                        <Text style={styles.sumMetaLabel}>Management</Text>
                        <View style={styles.sumChipRow}>
                          {management.map(k => (
                            <View key={k} style={styles.sumChip}>
                              <Text style={styles.sumChipText}>{MGMT_LABELS[k] || k}</Text>
                            </View>
                          ))}
                        </View>
                        {management.includes('other') && !!managementOther.trim() && (
                          <Text style={styles.sumOtherNote}>{managementOther.trim()}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.sumBlock}>
                  <Text style={styles.sumSection}>Visit tracking</Text>
                  <View style={styles.sumEyeCard}>
                    <Text style={[styles.sumEyeTag, { color: colors.od }]}>OD · Right</Text>
                    <View style={styles.sumMetrics}>
                      <SumMetric label="VA" value={visit.va_od} />
                      <SumMetric label="SE" value={visit.se_od} />
                      <SumMetric label="AL" value={visit.al_od} />
                    </View>
                  </View>
                  <View style={styles.sumEyeCard}>
                    <Text style={[styles.sumEyeTag, { color: colors.os }]}>OS · Left</Text>
                    <View style={styles.sumMetrics}>
                      <SumMetric label="VA" value={visit.va_os} />
                      <SumMetric label="SE" value={visit.se_os} />
                      <SumMetric label="AL" value={visit.al_os} />
                    </View>
                  </View>
                  <View style={styles.sumRiskRow}>
                    <Text style={styles.sumMetaLabel}>Progress</Text>
                    <View style={styles.sumProgressPill}>
                      <Text style={styles.sumProgressText}>
                        {visit.progress
                          ? visit.progress.charAt(0).toUpperCase() + visit.progress.slice(1)
                          : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Visit trend graphs (tap for full screen)</Text>
              <GraphStrip
                vaPts={summaryGraphs.vaPts}
                sePts={summaryGraphs.sePts}
                alPts={summaryGraphs.alPts}
              />

              {savedVisitId ? (
                <>
                  <Text style={styles.formTitle}>VISION Growth Card PDF</Text>
                  <Text style={styles.formSub}>Print, download or share the filled Growth Card</Text>
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
                    title="Save"
                    onPress={save}
                    loading={loading}
                    style={{ flex: 1, marginLeft: 10 }}
                  />
                </View>
              )}
            </>
          )}

          {step !== 'summary' && (
            <View style={styles.actions}>
              <SecondaryButton title="Back" onPress={back} style={{ flex: 1 }} />
              <PrimaryButton title="Next →" onPress={next} style={{ flex: 1, marginLeft: 10 }} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 16, paddingBottom: 120, backgroundColor: colors.bg, flexGrow: 1 },
  step: { color: colors.muted, marginBottom: 10, textTransform: 'capitalize', fontWeight: '700' },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 4 },
  formSub: { color: colors.muted, marginBottom: 14, fontSize: 13 },
  label: { color: colors.muted, fontWeight: '700', marginBottom: 4 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 8, lineHeight: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  actions: { flexDirection: 'row', marginTop: 16, marginBottom: 24 },
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
  sumRiskPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sumRiskText: { color: colors.navy, fontWeight: '800', fontSize: 12 },
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
  sumMgmtWrap: { marginTop: 4 },
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
  fundusCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fundusTitle: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  pdfRow: { flexDirection: 'row', marginTop: 4 },
});
