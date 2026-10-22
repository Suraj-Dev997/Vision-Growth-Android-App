import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SecondaryButton, TopBar } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { doctor, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const initials = (doctor?.doctor_name || 'DR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('');

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Profile" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 40 + insets.bottom,
          paddingHorizontal: 16,
        }}>
      <Text style={styles.sub}>Your clinic account</Text>

      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doctor?.doctor_name || 'Doctor'}</Text>
          <Text style={styles.center}>{doctor?.center_name || 'Vision clinic'}</Text>
          {!!doctor?.speciality && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{doctor.speciality}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Contact</Text>
        <Row label="Email" value={doctor?.email} />
        <Row label="Mobile" value={doctor?.mobile} />
        <Row label="Address" value={doctor?.address} />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Registration</Text>
        <Row label="Registration no." value={doctor?.mci_registration_no} />
        <Row label="Speciality" value={doctor?.speciality} />
      </View>

      <SecondaryButton title="Logout" onPress={confirmLogout} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sub: { color: colors.muted, marginBottom: 16, marginTop: 2, fontSize: 13, fontWeight: '600' },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#0F1B3D',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  center: { color: colors.skyDeep, marginTop: 2, fontWeight: '700', fontSize: 13 },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.ice,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 11 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  section: {
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', width: 110 },
  rowValue: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
});
