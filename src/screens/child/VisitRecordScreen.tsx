import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraphStrip } from '../../components/OdOsChart';
import { PrimaryButton, SecondaryButton, TopBar } from '../../components/ui';
import { MGMT_LABELS, PLAN_LABELS, PROGRESS_LABELS } from '../../constants/clinical';
import { visitsApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { downloadPdf, sharePdfFile, viewPdf } from '../../utils/sharePdf';

function fmtVisitLabel(iso: string) {
  const m = String(iso || '')
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(iso || '—').slice(0, 10);
}

/** Keep only visits on or before the opened visit (same rule as PDF). */
function historyUpToVisit(history: any[], visit: any) {
  const cutoffDate = String(visit?.visit_date || '').slice(0, 10);
  const cutoffId = Number(visit?.id || 0);
  const rows = Array.isArray(history) ? history : [];
  const filtered = rows.filter((v: any) => {
    const d = String(v.visit_date || '').slice(0, 10);
    const id = Number(v.id || 0);
    if (!d) return false;
    if (d < cutoffDate) return true;
    if (d > cutoffDate) return false;
    return id <= cutoffId;
  });
  if (filtered.length) return filtered;
  return visit ? [visit] : [];
}

export default function VisitRecordScreen({ navigation, route }: any) {
  const visitId = route.params.visitId;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await visitsApi.get(visitId);
        setData(res.data);
      } catch {
        setData(null);
      }
    })();
  }, [visitId]);

  const historyRows = useMemo(
    () => (data ? historyUpToVisit(data.history, data) : []),
    [data],
  );

  const graphPts = useMemo(() => {
    const toPts = (odKey: string, osKey: string) =>
      historyRows.map((v: any) => ({
        label: fmtVisitLabel(v.visit_date),
        age: v.age_years,
        od: v[odKey],
        os: v[osKey],
      }));
    return {
      vaPts: toPts('va_od', 'va_os'),
      sePts: toPts('se_od', 'se_os'),
      alPts: toPts('al_od', 'al_os'),
    };
  }, [historyRows]);

  const withPdfLink = async (mode: 'view' | 'download' | 'share') => {
    setExporting(true);
    try {
      const res = await visitsApi.pdfLink(visitId);
      const publicId =
        data?.public_id ||
        (data?.child_id ? `VGC${String(data.child_id).padStart(5, '0')}` : visitId);
      const assessDate = String(data?.visit_date || '').slice(0, 10) || 'date';
      const urls = {
        url: res.data!.url,
        downloadUrl: res.data!.downloadUrl,
        filename:
          res.data!.filename || `VisionGrowth_${publicId}_${assessDate}.pdf`,
      };
      if (!urls.url) throw new Error('No PDF link returned from server');

      if (mode === 'share') {
        await sharePdfFile(
          urls,
          `VISION Growth Card — ${data?.child_name || ''} (${data?.public_id || ''})`,
        );
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

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  const treatLabel = (list: string[] | undefined, other?: string) => {
    const names = (list || []).map(k => MGMT_LABELS[k] || PLAN_LABELS[k] || k);
    const base = names.join(', ') || '—';
    return other?.trim() ? `${base} (${other.trim()})` : base;
  };

  return (
    <View style={styles.root}>
      <TopBar title="Visit record" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40 + insets.bottom,
        }}>
        <Text style={styles.idChip}>
          {data.public_id ||
            (data.child_id ? `VGC${String(data.child_id).padStart(5, '0')}` : '')}
        </Text>
        <Text style={styles.sub}>{data.child_name}</Text>

        <Text style={styles.section}>
          Visit tracking (up to {fmtVisitLabel(data.visit_date)})
        </Text>
        <Text style={styles.hint}>
          Showing {historyRows.length} visit{historyRows.length === 1 ? '' : 's'} — same range as
          the Growth Card PDF for this record
        </Text>

        {historyRows.map((v: any) => {
          const isCurrent = Number(v.id) === Number(data.id);
          return (
            <View
              key={v.id || v.visit_date}
              style={[styles.card, isCurrent && styles.cardCurrent]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardDate}>{fmtVisitLabel(v.visit_date)}</Text>
                {isCurrent ? (
                  <View style={styles.thisPill}>
                    <Text style={styles.thisPillText}>This visit</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.row}>Age: {v.age_years ?? '—'}</Text>
              <Text style={styles.row}>
                OD: VA {v.va_od || '—'} · SE {v.se_od || '—'} · AL {v.al_od || '—'}
              </Text>
              <Text style={styles.row}>
                OS: VA {v.va_os || '—'} · SE {v.se_os || '—'} · AL {v.al_os || '—'}
              </Text>
              <Text style={styles.row}>
                Progress:{' '}
                {PROGRESS_LABELS[v.progress] ||
                  (v.progress
                    ? String(v.progress).charAt(0).toUpperCase() + String(v.progress).slice(1)
                    : '—')}
              </Text>
              {isCurrent && (
                <>
                  <Text style={styles.row}>
                    Compliance: {data.compliance_score || '—'}
                  </Text>
                  <Text style={styles.row}>
                    Treatments: {treatLabel(data.treatments, data.other_treatment)}
                  </Text>
                  <Text style={styles.row}>
                    Plans: {treatLabel(data.plans, data.plan_other)}
                  </Text>
                  {!!data.notes && <Text style={styles.row}>Notes: {data.notes}</Text>}
                </>
              )}
            </View>
          );
        })}

        <Text style={styles.section}>Visit tracking graphs</Text>
        <Text style={styles.hint}>
          Points for visits up to {fmtVisitLabel(data.visit_date)} only — tap for full screen
        </Text>
        <GraphStrip
          vaPts={graphPts.vaPts}
          sePts={graphPts.sePts}
          alPts={graphPts.alPts}
        />

        <Text style={styles.section}>VISION Growth Card PDF</Text>
        <Text style={styles.hint}>
          PDF includes visit tracking and graphs only up to this visit.
        </Text>
        {exporting ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.exportCol}>
            <SecondaryButton title="Print / View PDF" onPress={() => withPdfLink('view')} />
            <SecondaryButton title="Download PDF" onPress={() => withPdfLink('download')} />
            <PrimaryButton title="Share PDF" onPress={() => withPdfLink('share')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  sub: { color: colors.muted, marginBottom: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  cardCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardDate: { fontWeight: '800', color: colors.navy, fontSize: 15 },
  thisPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  thisPillText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  row: { color: colors.text, marginBottom: 4, lineHeight: 20, fontSize: 13 },
  section: { fontWeight: '800', color: colors.text, marginBottom: 4, marginTop: 8 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 8, lineHeight: 17 },
  exportCol: { gap: 10, marginTop: 4 },
});
