import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, Circle } from 'react-native-svg';
import { optionsForClinicalKind } from '../constants/clinicalCharts';
import { useLayout } from '../hooks/useLayout';
import { colors } from '../theme/colors';
import { sanitizeBv, sanitizeClinical } from '../utils/validation';

const visionLogo = require('../assets/visionlogo.png');

export function BrandMark({
  size = 42,
  light: _light = false,
}: {
  size?: number;
  /** Kept for call-site compatibility; logo asset is already light-on-dark. */
  light?: boolean;
}) {
  const height = size;
  const width = Math.round(size * 3.2);
  return (
    <View style={styles.brandRow}>
      <Image
        source={visionLogo}
        accessibilityLabel="VISION"
        resizeMode="contain"
        style={{ width, height }}
      />
    </View>
  );
}

export function GradientHero({
  height = 220,
  children,
  style,
}: {
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const { contentWidth: w } = useLayout();
  const totalH = height + insets.top;
  return (
    <View style={[{ height: totalH, overflow: 'hidden' }, style]}>
      <Svg width={w} height={totalH} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1E3A8A" />
            <Stop offset="0.48" stopColor="#2F5BFF" />
            <Stop offset="1" stopColor="#60A5FA" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={totalH} fill="url(#heroGrad)" />
        <Circle cx={w * 0.92} cy={totalH * 0.08} r="90" fill="rgba(255,255,255,0.08)" />
      </Svg>
      <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>{children}</View>
    </View>
  );
}

export function SplashBackground({ children }: { children: React.ReactNode }) {
  const { windowWidth: w, windowHeight: h } = useLayout();
  return (
    <View style={styles.splashRoot}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="splashGrad" x1="0" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor="#0B1B4D" />
            <Stop offset="0.55" stopColor="#1E3A8A" />
            <Stop offset="1" stopColor="#152A5C" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill="url(#splashGrad)" />
        <Circle cx={w * 0.1} cy={0} r="140" fill="rgba(47,91,255,0.35)" />
        <Circle cx={w} cy={h} r="160" fill="rgba(96,165,250,0.2)" />
      </Svg>
      {children}
    </View>
  );
}

export function TopBar({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { contentWidth: w } = useLayout();
  const barH = 52 + Math.max(insets.top, 8);
  return (
    <View style={[styles.topbar, { height: barH, paddingTop: Math.max(insets.top, 8) }]}>
      <Svg width={w} height={barH} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="topBarGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#1E3A8A" />
            <Stop offset="0.55" stopColor="#2F5BFF" />
            <Stop offset="1" stopColor="#4C7DFF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={barH} fill="url(#topBarGrad)" />
      </Svg>
      <View style={styles.topbarRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtnCircle} hitSlop={10}>
            <Text style={styles.backTextLight}>‹</Text>
          </Pressable>
        ) : null}
        <Text
          style={[styles.topbarTitleLight, !onBack && { marginLeft: 4 }]}
          numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.eyeMark}>
          <View style={styles.eyeOuter}>
            <View style={styles.eyeInner}>
              <View style={styles.eyeGlint} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        (disabled || loading) && styles.btnDisabled,
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnText} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  style,
  light,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  light?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        styles.btnSecondary,
        light && styles.btnSecondaryLight,
        blocked && styles.btnSecondaryDisabled,
        pressed && !blocked && { opacity: 0.85 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={light ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.btnSecondaryText, light && { color: '#fff' }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  icon,
  containerStyle,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  icon?: string;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.iconField, error ? styles.iconFieldError : null]}>
        {!!icon && <Text style={styles.ifi}>{icon}</Text>}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          {...props}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function clinicalPlaceholder(kind?: string, label?: string) {
  const k = String(kind || '').toLowerCase();
  const l = String(label || '').toLowerCase();
  if (k === 'bv' || l.includes('binocular')) return 'e.g. N · 2 · 6/6';
  if (k === 'va' || l.includes('(va)') || l.includes('vision')) return 'Select VA';
  if (k === 'se' || l.includes('(se)') || l.includes('refraction')) return 'Select SE';
  if (k === 'al' || l.includes('(al)') || l.includes('axial')) return 'Select AL';
  return 'Select';
}

function selectHint(kind?: string): string {
  const k = String(kind || '').toLowerCase();
  if (k === 'va') return 'Snellen VA';
  if (k === 'se') return 'Diopters (D)';
  if (k === 'al') return 'Millimetres (mm)';
  return 'Select a value';
}

function OdOsSelect({
  value,
  options,
  placeholder,
  borderStyle,
  eyeColor,
  accessibilityLabel,
  kind,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  borderStyle: ViewStyle;
  eyeColor: string;
  accessibilityLabel: string;
  kind?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex(o => o === value)),
    [options, value],
  );

  useEffect(() => {
    if (!open || !value || selectedIndex < 0) return;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
          viewPosition: 0.35,
        });
      } catch {
        // list may not be ready yet
      }
    }, 50);
    return () => clearTimeout(t);
  }, [open, selectedIndex, value]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.iconField, borderStyle, styles.selectPress]}>
        <Text
          style={[styles.selectValue, !value && styles.selectPlaceholder]}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={[styles.selectChevron, { color: eyeColor }]}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.selectModalRoot}>
          <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.selectSheet,
              {
                maxHeight: height * 0.72,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}>
            <View style={styles.selectHandle} />
            <View style={styles.selectSheetHead}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.selectSheetTitle} numberOfLines={2}>
                  {accessibilityLabel}
                </Text>
                <Text style={styles.selectSheetSub}>{selectHint(kind)}</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.selectCloseBtn}>
                <Text style={styles.selectSheetClose}>Close</Text>
              </Pressable>
            </View>
            <FlatList
              ref={listRef}
              data={options}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.selectListContent}
              getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
              onScrollToIndexFailed={info => {
                setTimeout(() => {
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                    viewPosition: 0.35,
                  });
                }, 100);
              }}
              renderItem={({ item }) => {
                const on = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    style={[styles.selectRow, on && styles.selectRowOn]}>
                    <Text style={[styles.selectRowText, on && styles.selectRowTextOn]}>
                      {item}
                    </Text>
                    {on ? <Text style={styles.selectTick}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function OdOsFields({
  label,
  od,
  os,
  onChangeOd,
  onChangeOs,
  kind,
}: {
  label: string;
  od: string;
  os: string;
  onChangeOd: (v: string) => void;
  onChangeOs: (v: string) => void;
  /** va | se | al | bv — dropdown for va/se/al; text for bv */
  kind?: string;
}) {
  const example = clinicalPlaceholder(kind, label);
  const isBv = kind === 'bv';
  const selectOptions = optionsForClinicalKind(kind);
  const useSelect = !!selectOptions && !isBv;

  const sanitize = (v: string) => (isBv ? sanitizeBv(v) : sanitizeClinical(v));
  const finalize = (side: 'od' | 'os', raw: string) => {
    const cleaned = sanitize(raw);
    let next = cleaned;
    if (isBv && /^n$/i.test(cleaned)) next = 'N';
    if (side === 'od') onChangeOd(next);
    else onChangeOs(next);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.odOsRow}>
        <View style={styles.odOsCol}>
          <Text style={[styles.odOsEyeLabel, { color: colors.od }]}>Right eye</Text>
          {useSelect ? (
            <OdOsSelect
              value={od}
              options={selectOptions!}
              placeholder={example}
              borderStyle={styles.odBorder}
              eyeColor={colors.od}
              accessibilityLabel={`${label} · Right eye`}
              kind={kind}
              onChange={onChangeOd}
            />
          ) : (
            <View style={[styles.iconField, styles.odBorder]}>
              <TextInput
                value={od}
                onChangeText={v => onChangeOd(sanitize(v))}
                onBlur={() => finalize('od', od)}
                placeholder={example}
                placeholderTextColor={colors.muted}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                accessibilityLabel={`${label} Right eye`}
                style={styles.input}
              />
            </View>
          )}
        </View>
        <View style={styles.odOsCol}>
          <Text style={[styles.odOsEyeLabel, { color: colors.os }]}>Left eye</Text>
          {useSelect ? (
            <OdOsSelect
              value={os}
              options={selectOptions!}
              placeholder={example}
              borderStyle={styles.osBorder}
              eyeColor={colors.os}
              accessibilityLabel={`${label} · Left eye`}
              kind={kind}
              onChange={onChangeOs}
            />
          ) : (
            <View style={[styles.iconField, styles.osBorder]}>
              <TextInput
                value={os}
                onChangeText={v => onChangeOs(sanitize(v))}
                onBlur={() => finalize('os', os)}
                placeholder={example}
                placeholderTextColor={colors.muted}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                accessibilityLabel={`${label} Left eye`}
                style={styles.input}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.fsIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  splashRoot: { flex: 1 },
  heroContent: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: 'flex-end',
  },
  topbar: {
    backgroundColor: colors.navy,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    height: 52,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 32, color: colors.navy, lineHeight: 34, fontWeight: '300' },
  backTextLight: { fontSize: 28, color: '#fff', lineHeight: 30, fontWeight: '300', marginTop: -2 },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  topbarTitleLight: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  eyeMark: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  eyeOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(191,219,254,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E3A8A',
    alignItems: 'flex-end',
    paddingTop: 3,
    paddingRight: 3,
  },
  eyeGlint: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  screen: { flex: 1, backgroundColor: colors.bg },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  btnSecondaryLight: {
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'transparent',
  },
  btnSecondaryDisabled: { opacity: 0.55 },
  btnSecondaryText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  field: { marginBottom: 14 },
  label: { color: colors.muted, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  iconField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  iconFieldError: { borderColor: colors.danger },
  ifi: { fontSize: 16, marginRight: 8, width: 22, textAlign: 'center' },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  inputWithIcon: { paddingLeft: 0 },
  error: { color: colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: '#fff' },
  odOsRow: { flexDirection: 'row', gap: 10 },
  odOsCol: { flex: 1 },
  odOsEyeLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  odBorder: { borderColor: colors.od, borderWidth: 1.5 },
  osBorder: { borderColor: colors.os, borderWidth: 1.5 },
  selectPress: { justifyContent: 'space-between' },
  selectValue: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 12,
  },
  selectPlaceholder: { color: colors.muted, fontWeight: '500' },
  selectChevron: { fontSize: 14, fontWeight: '800', marginLeft: 6 },
  selectModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 27, 77, 0.45)',
  },
  selectBackdrop: { ...StyleSheet.absoluteFillObject },
  selectSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  selectHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginTop: 10,
    marginBottom: 4,
  },
  selectSheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  selectSheetTitle: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  selectSheetSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  selectCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  selectSheetClose: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  selectListContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  selectRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: colors.ice,
  },
  selectRowOn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectRowText: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  selectRowTextOn: { color: colors.navy },
  selectTick: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  sectionSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
