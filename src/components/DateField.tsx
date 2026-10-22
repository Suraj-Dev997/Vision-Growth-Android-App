import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { isValidDateISO } from '../utils/validation';

function parseISO(value?: string): Date {
  if (value && isValidDateISO(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDisplay(value?: string): string {
  if (!value || !isValidDateISO(value)) return '';
  const [y, m, d] = value.split('-');
  return `${d}-${m}-${y}`;
}

/** Tap-to-open date picker. Stores YYYY-MM-DD, shows DD-MM-YYYY. */
export function DateField({
  label,
  value,
  onChange,
  error,
  icon = '📅',
  maximumDate,
  minimumDate,
  containerStyle,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  icon?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
}) {
  const [open, setOpen] = useState(false);
  const date = useMemo(() => parseISO(value), [value]);

  const close = () => setOpen(false);

  const onValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    onChange(toISO(selected));
    if (Platform.OS === 'ios') setOpen(false);
  };

  return (
    <View style={[styles.field, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, error ? styles.boxError : null]}>
        {!!icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? toDisplay(value) : 'Select date'}
        </Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={onValueChange}
          onDismiss={close}
          onNeutralButtonPress={close}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { color: colors.muted, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  boxError: { borderColor: colors.danger },
  icon: { fontSize: 16, marginRight: 8, width: 22, textAlign: 'center' },
  value: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  placeholder: { color: colors.muted, fontWeight: '500' },
  error: { color: colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
});
