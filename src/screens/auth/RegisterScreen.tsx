import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Field, PrimaryButton, SectionHeader, TopBar } from '../../components/ui';
import { authApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { digitsOnly, firstError, validateRegister } from '../../utils/validation';

const empty = {
  doctor_name: '',
  center_name: '',
  address: '',
  mobile: '',
  email: '',
  mci_registration_no: '',
  speciality: '',
  password: '',
  confirm_password: '',
};

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof empty, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const onSubmit = async () => {
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    const msg = firstError(nextErrors);
    if (msg) {
      Alert.alert('Check your details', msg);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        ...form,
        doctor_name: form.doctor_name.trim(),
        center_name: form.center_name.trim(),
        address: form.address.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        mci_registration_no: form.mci_registration_no.trim(),
        speciality: form.speciality.trim() || undefined,
      });
      navigation.navigate('VerifyOtp', {
        email: form.email.trim().toLowerCase(),
        debugOtp: res.data?.otp,
      });
    } catch (e: any) {
      Alert.alert('Registration failed', e.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopBar title="Doctor Registration" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <SectionHeader icon="🩺" title="Create account" subtitle="Doctor & center details" />
        <Field
          icon="👤"
          placeholder="Doctor name *"
          value={form.doctor_name}
          onChangeText={v => set('doctor_name', v)}
          error={errors.doctor_name}
          maxLength={150}
        />
        <Field
          icon="🏥"
          placeholder="Center name *"
          value={form.center_name}
          onChangeText={v => set('center_name', v)}
          error={errors.center_name}
          maxLength={200}
        />
        <Field
          icon="📍"
          placeholder="Address *"
          value={form.address}
          onChangeText={v => set('address', v)}
          error={errors.address}
          multiline
          style={{ minHeight: 64, textAlignVertical: 'top' }}
        />
        <Field
          icon="☎"
          placeholder="Mobile * (10 digits)"
          keyboardType="phone-pad"
          value={form.mobile}
          onChangeText={v => set('mobile', digitsOnly(v, 10))}
          error={errors.mobile}
          maxLength={10}
        />
        <Field
          icon="✉"
          placeholder="Email *"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={v => set('email', v)}
          error={errors.email}
          maxLength={180}
        />
        <Field
          icon="#"
          placeholder="Registration number *"
          value={form.mci_registration_no}
          onChangeText={v => set('mci_registration_no', v)}
          error={errors.mci_registration_no}
          maxLength={80}
        />
        <Field
          icon="★"
          placeholder="Speciality (optional)"
          value={form.speciality}
          onChangeText={v => set('speciality', v)}
          maxLength={120}
        />
        <Field
          icon="🔒"
          placeholder="Password * (min 8 chars)"
          secureTextEntry
          value={form.password}
          onChangeText={v => set('password', v)}
          error={errors.password}
        />
        <Field
          icon="🔒"
          placeholder="Confirm password *"
          secureTextEntry
          value={form.confirm_password}
          onChangeText={v => set('confirm_password', v)}
          error={errors.confirm_password}
        />
        <PrimaryButton title="Continue to Verify →" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20, paddingBottom: 40 },
});
