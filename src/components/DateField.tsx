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
  const date = useMemo(() => parseISO(value), [value]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseISO(value));

  const close = () => setOpen(false);

  const openPicker = () => {
    setDraft(parseISO(value));
    setOpen(true);
  };

  const onValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      onChange(toISO(selected));
      return;
    }
    // iOS spinner: keep open while scrolling; commit on Done.
    setDraft(selected);
  };

  const confirmIOS = () => {
    onChange(toISO(draft));
    setOpen(false);
  };

  return (
    <View style={[styles.field, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={openPicker}
        style={[styles.box, error ? styles.boxError : null]}>
        {!!icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? toDisplay(value) : 'Select date'}
        </Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onValueChange={onValueChange}
          onDismiss={close}
          onNeutralButtonPress={close}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <View style={styles.iosPickerWrap}>
          <View style={styles.iosPickerToolbar}>
            <Pressable onPress={close} hitSlop={8}>
              <Text style={styles.iosToolbarBtn}>Cancel</Text>
            </Pressable>
            <Pressable onPress={confirmIOS} hitSlop={8}>
              <Text style={[styles.iosToolbarBtn, styles.iosToolbarDone]}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            themeVariant="light"
            textColor={colors.text}
            onValueChange={onValueChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            style={styles.iosPicker}
          />
        </View>
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
  iosPickerWrap: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  iosPickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.ice,
  },
  iosToolbarBtn: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  iosToolbarDone: {
    color: colors.primary,
  },
  iosPicker: {
    height: 180,
    alignSelf: 'stretch',
  },
});
