import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui';
import { visitsApi } from '../../services/api';
import { colors } from '../../theme/colors';

const PAGE_SIZE = 20;

function progressStyle(p?: string) {
  const v = String(p || '').toLowerCase();
  if (v === 'rapid') return { bg: '#FEE2E2', fg: '#B91C1C' };
  if (v === 'moderate') return { bg: '#FFEDD5', fg: '#C2410C' };
  if (v === 'slow') return { bg: '#FEF9C3', fg: '#A16207' };
  if (v === 'stable') return { bg: '#DCFCE7', fg: '#15803D' };
  return { bg: colors.primarySoft, fg: colors.primary };
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export default function VisitsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number, q: string, replace: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (replace) setRefreshing(true);
    else setLoadingMore(true);
    try {
      const res = await visitsApi.list({ search: q, page: pageNum, limit: PAGE_SIZE });
      const rows = res.data || [];
      setItems(prev => (replace ? rows : [...prev, ...rows]));
      setPage(pageNum);
      setHasMore(Boolean(res.meta?.hasMore));
    } catch {
      if (replace) setItems([]);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPage(1, query, true);
    }, [loadPage, query]),
  );

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const onEndReached = () => {
    if (!hasMore || loadingRef.current) return;
    loadPage(page + 1, query, false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Visits" />
      <Text style={styles.sub}>Recent assessments & follow-ups</Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, mobile or ID"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, query, true)} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          refreshing ? null : (
            <Text style={styles.empty}>
              {query ? 'No visits match your search' : 'No visits yet'}
            </Text>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : hasMore ? (
            <Text style={styles.footerHint}>Scroll for more</Text>
          ) : items.length > 0 ? (
            <Text style={styles.footerHint}>End of list</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const prog = progressStyle(item.progress);
          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('VisitRecord', { visitId: item.id })}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.idChip}>
                    {item.public_id || `VGC${String(item.child_id).padStart(5, '0')}`}
                  </Text>
                  <Text style={styles.name}>{item.child_name}</Text>
                  <Text style={styles.meta}>
                    {formatDate(item.visit_date)} · Age {item.age_years ?? '—'}
                  </Text>
                  {(item.se_od || item.se_os) && (
                    <Text style={styles.meta}>
                      SE {item.se_od || '—'} / {item.se_os || '—'}
                    </Text>
                  )}
                </View>
                <View style={styles.rightCol}>
                  {!!item.progress && (
                    <View style={[styles.badge, { backgroundColor: prog.bg }]}>
                      <Text style={[styles.badgeText, { color: prog.fg }]}>
                        {String(item.progress)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sub: {
    color: colors.muted,
    marginBottom: 10,
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 10, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
    shadowColor: '#0F1B3D',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.muted, marginTop: 3, fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '700', fontSize: 11, textTransform: 'capitalize' },
  chevron: { color: colors.muted, fontSize: 22 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  footerHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginVertical: 12,
  },
});
