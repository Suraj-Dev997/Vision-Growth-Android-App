import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type TabKey = 'home' | 'children' | 'visits' | 'followups' | 'profile';

/** Blank calendar mark — no day number (📅 shows today's date on Android). */
function FollowUpsIcon({ color }: { color: string }) {
  return (
    <View style={[cal.box, { borderColor: color }]}>
      <View style={[cal.top, { backgroundColor: color }]} />
      <View style={cal.grid}>
        <View style={[cal.dot, { backgroundColor: color }]} />
        <View style={[cal.dot, { backgroundColor: color }]} />
        <View style={[cal.dot, { backgroundColor: color }]} />
        <View style={[cal.dot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

/** Consistent solid icons for active + inactive tab states */
export function TabIcon({
  name,
  focused,
  color,
}: {
  name: TabKey;
  focused: boolean;
  color: string;
}) {
  const tint = focused ? colors.primary : color;

  if (name === 'followups') {
    return (
      <View style={[styles.wrap, focused && styles.wrapOn]}>
        <FollowUpsIcon color={tint} />
      </View>
    );
  }

  const glyph =
    name === 'home' ? '⌂' : name === 'children' ? '👥' : name === 'visits' ? '▤' : '👤';
  const emoji = name === 'children' || name === 'profile';

  return (
    <View style={[styles.wrap, focused && styles.wrapOn]}>
      <Text style={[styles.icon, emoji && styles.iconEmoji, { color: tint }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapOn: { backgroundColor: colors.primarySoft },
  icon: { fontSize: 16, fontWeight: '700' },
  iconEmoji: { fontSize: 18, lineHeight: 20 },
});

const cal = StyleSheet.create({
  box: {
    width: 18,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  top: {
    height: 4,
    width: '100%',
    opacity: 0.95,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingTop: 1,
    gap: 2,
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1,
    opacity: 0.85,
  },
});
