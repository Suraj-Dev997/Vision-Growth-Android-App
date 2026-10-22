import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui';
import { visitsApi } from '../../services/api';
import { colors } from '../../theme/colors';

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function nextSevenRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: toISO(start), to: toISO(end), start, end };
}

export default function FollowUpsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const range = useMemo(() => nextSevenRange(), []);
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await visitsApi.followUps({
        from: range.from,
        to: range.to,
        page: 1,
        limit: 50,
      });
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setRefreshing(false);
    }
  }, [range.from, range.to]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const rangeLabel = `${formatDate(range.from)} – ${formatDate(range.to)}`;

  return (
    <View style={styles.root}>
      <TopBar title="Follow-ups" />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sub}>Next 7 days</Text>
          <Text style={styles.range}>{rangeLabel}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('FollowUpsAll')}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          refreshing ? null : (
            <Text style={styles.empty}>No follow-ups in the next 7 days</Text>
          )
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
                {!!item.parent_mobile && (
                  <Text style={styles.meta}>Contact {item.parent_mobile}</Text>
                )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
  },
  sub: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  range: { color: colors.navy, fontWeight: '800', fontSize: 15, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 14 },
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
  chevron: { color: colors.muted, fontSize: 22 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
