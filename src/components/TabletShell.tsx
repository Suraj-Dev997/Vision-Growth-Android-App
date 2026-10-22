import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLayout } from '../hooks/useLayout';
import { colors } from '../theme/colors';

/**
 * Centers content on tablets. On phones this is a plain flex:1 wrapper
 * with no max-width, so existing mobile layout is unchanged.
 */
export function TabletShell({
  children,
  backgroundColor = colors.bg,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  const { shellStyle } = useLayout();

  return (
    <View style={[styles.outer, { backgroundColor }]}>
      <View style={shellStyle}>{children}</View>
    </View>
  );
}

export function withTabletShell<P extends object>(
  Component: React.ComponentType<P>,
  backgroundColor?: string,
) {
  function Wrapped(props: P) {
    return (
      <TabletShell backgroundColor={backgroundColor}>
        <Component {...props} />
      </TabletShell>
    );
  }
  Wrapped.displayName = `withTabletShell(${Component.displayName || Component.name || 'Screen'})`;
  return Wrapped;
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
});
