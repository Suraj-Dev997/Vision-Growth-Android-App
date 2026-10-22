import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraphStrip } from '../../components/OdOsChart';
import { PrimaryButton, TopBar } from '../../components/ui';
import { childrenApi } from '../../services/api';
import { colors } from '../../theme/colors';

export default function ChildDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const childId = route.params.childId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await childrenApi.get(childId);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Child not found</Text>
      </View>
    );
  }

  // Newest visit first for list; graphs show last (most recent) visit only
  const visitsChrono = [...(data.visits || [])].sort((a: any, b: any) => {
    const da = String(a.visit_date || '');
    const db = String(b.visit_date || '');
    if (da !== db) return da.localeCompare(db);
    return Number(a.id || 0) - Number(b.id || 0);
  });
  const lastVisit = visitsChrono.length ? visitsChrono[visitsChrono.length - 1] : null;
  const lastVisitDate = lastVisit
    ? String(lastVisit.visit_date || '').slice(0, 10)
    : '';
  const lastVisitLabel = (() => {
    const m = lastVisitDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return lastVisitDate;
    return `${m[3]}-${m[2]}-${m[1]}`;
  })();
  // Graphs = all visit-tracking points only (baseline clinical data excluded)
  const fmtVisitLabel = (iso: string) => {
    const m = String(iso || '')
      .slice(0, 10)
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : String(iso || 'Visit').slice(0, 10);
  };
  const toPts = (odKey: string, osKey: string) =>
    visitsChrono.map((v: any) => ({
      label: fmtVisitLabel(v.visit_date),
      age: v.age_years,
      od: v[odKey],
      os: v[osKey],
    }));
  const vaPts = toPts('va_od', 'va_os');
  const sePts = toPts('se_od', 'se_os');
  const alPts = toPts('al_od', 'al_os');

  return (
    <View style={styles.root}>
      <TopBar title={data.child_name || 'Child'} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40 + insets.bottom,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.publicId}>{data.public_id || `VGC${String(data.id).padStart(5, '0')}`}</Text>
      <Text style={styles.title}>{data.child_name}</Text>
      <Text style={styles.meta}>
        Age {data.age} · {data.child_type} · {data.parent_mobile}
        {data.school ? ` · ${data.school}` : ''}
      </Text>
      {data.risk_category ? (
        <Text style={styles.risk}>Risk: {data.risk_category}</Text>
      ) : null}

      <Text style={styles.section}>Visit tracking graphs</Text>
      {visitsChrono.length ? (
        <Text style={styles.hint}>
          {visitsChrono.length} visit{visitsChrono.length === 1 ? '' : 's'}
          {lastVisitLabel ? ` · latest ${lastVisitLabel}` : ''} — tap chart for full screen
        </Text>
      ) : (
        <Text style={styles.hint}>No visits yet</Text>
      )}
      {visitsChrono.length ? <GraphStrip vaPts={vaPts} sePts={sePts} alPts={alPts} /> : null}

      <Text style={styles.section}>Visits</Text>
      {[...(data.visits || [])]
        .sort((a: any, b: any) => String(b.visit_date || '').localeCompare(String(a.visit_date || '')))
        .map((v: any) => (
        <Pressable
          key={v.id}
          style={styles.card}
          onPress={() => navigation.navigate('VisitRecord', { visitId: v.id })}>
          <Text style={styles.cardTitle}>{String(v.visit_date).slice(0, 10)}</Text>
          <Text style={styles.meta}>
            Age {v.age_years}
            {v.progress ? ` · ${v.progress}` : ''}
            {v.compliance_score ? ` · compliance ${v.compliance_score}` : ''}
          </Text>
        </Pressable>
      ))}

      <PrimaryButton
        title="Add follow-up visit"
        onPress={() => navigation.navigate('FollowUp', { childId: data.id, age: data.age })}
        style={{ marginTop: 8 }}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  publicId: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4, marginBottom: 4 },
  risk: { color: colors.warn, fontWeight: '700', marginBottom: 12 },
  section: { fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 4, fontSize: 16 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '700', color: colors.text },
});
