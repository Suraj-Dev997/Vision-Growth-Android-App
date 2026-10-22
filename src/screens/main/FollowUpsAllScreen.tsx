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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateField } from '../../components/DateField';
import { TopBar } from '../../components/ui';
import { visitsApi } from '../../services/api';
import { colors } from '../../theme/colors';

const PAGE_SIZE = 20;

function formatDate(iso?: string) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export default function FollowUpsAllScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const loadingRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (replace) setRefreshing(true);
      else setLoadingMore(true);
      try {
        const res = await visitsApi.followUps({
          from: from || undefined,
          to: to || undefined,
          search: query,
          page: pageNum,
          limit: PAGE_SIZE,
        });
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
    },
    [from, to, query],
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  const onEndReached = () => {
    if (!hasMore || loadingRef.current) return;
    loadPage(page + 1, false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="All follow-ups" onBack={() => navigation.goBack()} />
      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search child name or ID"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.dateRow}>
          <DateField
            label="From"
            value={from}
            onChange={setFrom}
            containerStyle={{ flex: 1 }}
          />
          <DateField
            label="To"
            value={to}
            onChange={setTo}
            containerStyle={{ flex: 1, marginLeft: 10 }}
          />
        </View>
        {(from || to) && (
          <Pressable
            onPress={() => {
              setFrom('');
              setTo('');
            }}>
            <Text style={styles.clear}>Clear dates</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, true)} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          refreshing ? null : <Text style={styles.empty}>No follow-ups found</Text>
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
        renderItem={({ item }) => (
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
                  Follow-up {formatDate(item.follow_up_date)}
                  {item.follow_up_interval ? ` · ${item.follow_up_interval} mo` : ''}
                </Text>
                <Text style={styles.meta}>Visit {formatDate(item.visit_date)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filters: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start' },
  clear: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
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
  chevron: { color: colors.muted, fontSize: 22 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  footerHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginVertical: 12,
  },
});
