import React, { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton, SecondaryButton, TopBar } from '../../components/ui';
import { authApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { digitsOnly, isValidOtp } from '../../utils/validation';

export default function VerifyOtpScreen({ navigation, route }: any) {
  const email = route.params?.email || '';
  const initial = route.params?.debugOtp ? String(route.params.debugOtp).slice(0, 4) : '';
  const [digits, setDigits] = useState<string[]>(
    initial.padEnd(4, ' ').slice(0, 4).split('').map(c => (c === ' ' ? '' : c)),
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [hint, setHint] = useState(route.params?.debugOtp ? `Dev OTP: ${route.params.debugOtp}` : '');
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const otp = digits.join('');

  const setDigit = (index: number, value: string) => {
    const d = digitsOnly(value, 1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    if (d && index < 3) refs[index + 1].current?.focus();
  };

  const verify = async () => {
    if (!isValidOtp(otp)) {
      Alert.alert('Invalid OTP', 'Enter the 4-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      navigation.replace('Success');
    } catch (e: any) {
      Alert.alert('OTP failed', e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const res = await authApi.resendOtp(email);
      if (res.data?.otp) {
        setHint(`Dev OTP: ${res.data.otp}`);
        const code = String(res.data.otp).slice(0, 4);
        setDigits(code.split(''));
      } else {
        Alert.alert('OTP sent', 'Check your email');
      }
    } catch (e: any) {
      Alert.alert('Resend failed', e.message || 'Try again');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Verify Email" onBack={() => navigation.goBack()} />
      <View style={styles.wrap}>
        <Text style={styles.sub}>Enter the OTP sent to your email address.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email OTP</Text>
          <Text style={styles.cardSub}>Check your inbox for the 4-digit code</Text>
          <Text style={styles.email}>{email}</Text>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={refs[i]}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={v => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                    refs[i - 1].current?.focus();
                  }
                }}
              />
            ))}
          </View>
          <SecondaryButton
            title="Resend OTP"
            onPress={resend}
            loading={resending}
            style={{ marginTop: 8 }}
          />
        </View>
        <PrimaryButton
          title="Verify & Continue"
          onPress={verify}
          loading={loading}
          disabled={resending}
        />
        <Pressable onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20, flex: 1 },
  sub: { color: colors.muted, marginBottom: 16, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
  },
  cardTitle: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  cardSub: { color: colors.muted, marginTop: 4, marginBottom: 10, fontSize: 13 },
  email: { color: colors.primary, fontWeight: '600', marginBottom: 12 },
  hint: { color: colors.skyDeep, marginBottom: 10, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.ice,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  link: {
    marginTop: 18,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '700',
  },
});
