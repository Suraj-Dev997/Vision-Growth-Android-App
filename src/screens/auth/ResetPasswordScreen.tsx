import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, TopBar } from '../../components/ui';
import { authApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { isValidPassword } from '../../utils/validation';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const email = route.params?.email || '';
  const resetToken = route.params?.resetToken || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isValidPassword(password)) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Password and confirm password do not match');
      return;
    }
    if (!resetToken) {
      Alert.alert('Session expired', 'Please request OTP again');
      navigation.replace('ForgotPassword');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        reset_token: resetToken,
        password,
        confirm_password: confirm,
      });
      Alert.alert('Password updated', 'Please login with your new password.', [
        { text: 'Login', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Reset failed', e.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="New password" onBack={() => navigation.replace('Login')} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.sub}>{email}</Text>
        <Field
          icon="🔒"
          placeholder="New password *"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Field
          icon="🔒"
          placeholder="Confirm password *"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <PrimaryButton title="Update password →" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  sub: { color: colors.muted, marginBottom: 18, fontWeight: '600' },
});
