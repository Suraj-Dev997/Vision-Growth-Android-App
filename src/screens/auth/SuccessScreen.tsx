import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui';
import { colors } from '../../theme/colors';

export default function SuccessScreen({ navigation }: any) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.title}>Registration successful</Text>
      <Text style={styles.sub}>
        Your email is verified. Please login with your email and password.
      </Text>
      <PrimaryButton title="Go to Login" onPress={() => navigation.replace('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 28,
    justifyContent: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ok,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.ok,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: { color: '#fff', fontSize: 34, fontWeight: '800' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
});
