import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, TopBar } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { firstError, validateLogin } from '../../utils/validation';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    const msg = firstError(nextErrors);
    if (msg) {
      Alert.alert('Check your details', msg);
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      if (e?.body?.code === 'EMAIL_NOT_VERIFIED') {
        Alert.alert('Email not verified', 'Please complete OTP verification.', [
          { text: 'Verify', onPress: () => navigation.navigate('VerifyOtp', { email: email.trim() }) },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Login failed', e.message || 'Try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Login" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.eye}>◉</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in with your registered email & password</Text>
        <Field
          icon="✉"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={v => {
            setEmail(v);
            if (errors.email) setErrors(e => ({ ...e, email: '' }));
          }}
          error={errors.email}
        />
        <Field
          icon="🔒"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={v => {
            setPassword(v);
            if (errors.password) setErrors(e => ({ ...e, password: '' }));
          }}
          error={errors.password}
        />
        <PrimaryButton title="Login →" onPress={onSubmit} loading={loading} />
        <Text style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
          Forgot password?
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          New doctor? Register
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20, paddingBottom: 40 },
  eye: { fontSize: 36, color: colors.primary, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 22, fontSize: 14 },
  forgot: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  link: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
