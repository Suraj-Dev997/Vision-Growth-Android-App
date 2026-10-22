import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BrandMark, GradientHero } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { childrenApi } from '../../services/api';
import { colors } from '../../theme/colors';

const HOME_LIMIT = 12;

function riskStyle(risk?: string) {
  const r = String(risk || '').toLowerCase();
  if (r === 'high') return { bg: '#FEE2E2', fg: '#B91C1C', label: 'High risk' };
  if (r === 'moderate') return { bg: '#FFEDD5', fg: '#C2410C', label: 'Moderate risk' };
  if (r === 'low') return { bg: '#DCFCE7', fg: '#15803D', label: 'Low risk' };
  if (r === 'no') return { bg: '#E5E7EB', fg: '#374151', label: 'No risk' };
  return null;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export default function HomeScreen({ navigation }: any) {
  const { doctor } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const lastName = doctor?.doctor_name?.split(' ').slice(-1)[0] || 'Doctor';
  const initials = (doctor?.doctor_name || 'DR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('');

  const load = useCallback(async (q = query) => {
    setRefreshing(true);
    try {
      const res = await childrenApi.list({ search: q, page: 1, limit: HOME_LIMIT });
      setItems(res.data || []);
      setTotal(res.meta?.total ?? (res.data || []).length);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      load(query);
    }, [load, query]),
  );

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <View style={styles.root}>
      <GradientHero height={210}>
        <View style={styles.topRow}>
          <BrandMark size={34} light />
          <View style={styles.topRight}>
            <Pressable style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.hello}>
          {greeting}, Dr. {lastName}
        </Text>
        <Text style={styles.banner}>Eye Care Specialist · VISION</Text>
        <View style={styles.promo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Clearer vision for every child</Text>
            <Text style={styles.promoSub}>
              Follow each child’s eye health, visits, and care plan in one place.
            </Text>
          </View>
          <View style={styles.promoIcon}>
            <Text style={{ fontSize: 22 }}>👁</Text>
          </View>
        </View>
      </GradientHero>

      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>Children List</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{total}</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('Children')}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by child name or mobile no."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(query)} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No children yet. Tap + Add child to start.</Text>
          }
          renderItem={({ item }) => {
            const risk = riskStyle(item.risk_category || item.latest_risk);
            const childInitials = String(item.child_name || '?')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0]?.toUpperCase())
              .join('');
            return (
              <View style={styles.card}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}>
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>{childInitials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.idChip}>
                      {item.public_id || `VGC${String(item.id).padStart(5, '0')}`}
                    </Text>
                    <Text style={styles.cardTitle}>{item.child_name}</Text>
                    <Text style={styles.cardMeta}>
                      Age {item.age ?? '—'}
                      {item.parent_name ? ` · Parent: ${item.parent_name}` : ''}
                    </Text>
                    <Text style={styles.cardMeta}>
                      First assessment: {formatDate(item.first_assessment_date)}
                    </Text>
                    {!!risk && (
                      <View style={[styles.riskChip, { backgroundColor: risk.bg }]}>
                        <Text style={[styles.riskText, { color: risk.fg }]}>{risk.label}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}>
                    <Text style={styles.actionText}>Vision data</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnAlt]}
                    onPress={() => {
                      if (item.latest_visit_id) {
                        navigation.navigate('VisitRecord', { visitId: item.latest_visit_id });
                      } else {
                        navigation.navigate('ChildDetail', { childId: item.id });
                      }
                    }}>
                    <Text style={[styles.actionText, { color: colors.primary }]}>Report</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('Assessment')}>
        <Text style={styles.fabText}>＋ Add child</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  hello: { color: '#fff', fontSize: 24, fontWeight: '800' },
  banner: { color: 'rgba(255,255,255,0.88)', marginTop: 4, fontSize: 13 },
  promo: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoTitle: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  promoSub: { color: colors.muted, fontSize: 11, marginTop: 2, lineHeight: 15 },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: 16,
    marginTop: -10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.bg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { fontWeight: '800', color: colors.text, fontSize: 16 },
  countPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  link: { color: colors.primary, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
    shadowColor: '#0F1B3D',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardMain: { flexDirection: 'row', gap: 12 },
  childAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: { color: colors.primary, fontWeight: '800' },
  idChip: { color: colors.primary, fontWeight: '800', fontSize: 11, marginBottom: 2 },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 16 },
  cardMeta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  riskChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskText: { fontWeight: '700', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.ice,
  },
  actionBtnAlt: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  actionText: { fontWeight: '700', color: colors.navy, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
