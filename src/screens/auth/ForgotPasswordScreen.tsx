import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, TopBar } from '../../components/ui';
import { authApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { isValidEmail } from '../../utils/validation';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      Alert.alert('Check email', 'Enter a valid registered email');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(trimmed);
      Alert.alert('OTP sent', res.message || 'OTP has been sent to your email.', [
        {
          text: 'Enter OTP',
          onPress: () =>
            navigation.navigate('ResetOtp', {
              email: trimmed,
              debugOtp: res.data?.otp,
            }),
        },
      ]);
    } catch (e: any) {
      const code = e?.body?.code;
      const title =
        code === 'NOT_REGISTERED'
          ? 'Not registered'
          : code === 'EMAIL_NOT_VERIFIED'
            ? 'Email not verified'
            : 'Request failed';
      Alert.alert(title, e.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Forgot password" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          Enter your registered email. We will send a 4-digit OTP to reset your password.
        </Text>
        <Field
          icon="✉"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton title="Send OTP →" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 8 },
  sub: { color: colors.muted, marginBottom: 18, lineHeight: 20, fontSize: 14 },
});
