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
import { childrenApi } from '../../services/api';
import { colors } from '../../theme/colors';

const PAGE_SIZE = 20;

function riskStyle(risk?: string) {
  const r = String(risk || '').toLowerCase();
  if (r === 'high') return { bg: '#FEE2E2', fg: '#B91C1C', label: 'High risk' };
  if (r === 'moderate') return { bg: '#FFEDD5', fg: '#C2410C', label: 'Moderate' };
  if (r === 'low') return { bg: '#DCFCE7', fg: '#15803D', label: 'Low risk' };
  if (r === 'no') return { bg: '#E5E7EB', fg: '#374151', label: 'No risk' };
  return null;
}

export default function ChildrenScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, q: string, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (replace) setRefreshing(true);
      else setLoadingMore(true);
      try {
        const res = await childrenApi.list({ search: q, page: pageNum, limit: PAGE_SIZE });
        const rows = res.data || [];
        setItems(prev => (replace ? rows : [...prev, ...rows]));
        setPage(pageNum);
        setTotal(res.meta?.total ?? rows.length);
        setHasMore(Boolean(res.meta?.hasMore));
      } catch {
        if (replace) setItems([]);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

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
      <TopBar title="Children" />
      <Text style={styles.sub}>
        {total} registered patient{total === 1 ? '' : 's'}
      </Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search name, mobile or ID"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, query, true)} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          refreshing ? null : <Text style={styles.empty}>No children found</Text>
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
          const risk = riskStyle(item.risk_category);
          const initials = String(item.child_name || '?')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p: string) => p[0]?.toUpperCase())
            .join('');
          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.idChip}>
                    {item.public_id || `VGC${String(item.id).padStart(5, '0')}`}
                  </Text>
                  <Text style={styles.name}>{item.child_name}</Text>
                  <Text style={styles.meta}>{item.parent_mobile}</Text>
                  <Text style={styles.meta}>
                    Age {item.age ?? '—'} ·{' '}
                    {item.child_type === 'pre_existing' ? 'Pre-existing' : 'New'} ·{' '}
                    {item.visit_count || 0} visits
                  </Text>
                  {!!risk && (
                    <View style={[styles.riskChip, { backgroundColor: risk.bg }]}>
                      <Text style={[styles.riskText, { color: risk.fg }]}>{risk.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable
        style={[styles.fab, { bottom: 20 + Math.max(insets.bottom, 0) }]}
        onPress={() => navigation.navigate('Assessment')}>
        <Text style={styles.fabText}>＋ Add child</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sub: {
    color: colors.muted,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 8,
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
  search: { flex: 1, color: colors.text, paddingVertical: 10, fontSize: 14 },
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
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '800' },
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
  riskChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskText: { fontWeight: '700', fontSize: 11 },
  chevron: { color: colors.muted, fontSize: 22, marginLeft: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  footerHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginVertical: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '800' },
});
