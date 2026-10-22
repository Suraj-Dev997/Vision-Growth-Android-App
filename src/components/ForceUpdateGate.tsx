import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { APP_VERSION_CODE } from '../config/appVersion';
import { appApi, AppConfig } from '../services/api';
import { colors } from '../theme/colors';

/**
 * Soft prompt or full-screen block based on /app/config vs local APP_VERSION_CODE.
 */
export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await appApi.config();
        if (cancelled) return;
        const cfg = res.data;
        if (!cfg) {
          setReady(true);
          return;
        }
        setConfig(cfg);
        const min = Number(cfg.android_min_version_code || 1);
        const latest = Number(cfg.android_latest_version_code || min);
        const force = Boolean(cfg.force_update);
        const belowMin = APP_VERSION_CODE < min;
        const behindLatest = APP_VERSION_CODE < latest;

        // Force: below min always, or force_update=1 and behind latest — no "Later"
        if (belowMin || (force && behindLatest)) {
          setBlocked(true);
        } else if (behindLatest) {
          Alert.alert(
            cfg.update_title || 'Update available',
            cfg.update_message || 'A new version is available on Play Store.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Update',
                onPress: () => openStore(cfg.android_store_url),
              },
            ],
          );
        }
      } catch {
        // Offline / API down — allow app use
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      {children}
      <Modal visible={blocked} animationType="fade" transparent={false}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{config?.update_title || 'Update required'}</Text>
          <Text style={styles.blockMsg}>
            {config?.update_message ||
              'Please update VISION Growth from the Play Store to continue.'}
          </Text>
          <Text style={styles.ver}>
            Your version code: {APP_VERSION_CODE}
            {config
              ? ` · Required: ${Math.max(
                  Number(config.android_min_version_code || 1),
                  Number(config.android_latest_version_code || 1),
                )}+`
              : ''}
          </Text>
          <Pressable
            style={styles.btn}
            onPress={() => openStore(config?.android_store_url)}>
            <Text style={styles.btnText}>Update now</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function openStore(url?: string) {
  const target =
    url || 'https://play.google.com/store/apps/details?id=com.visiongrowth';
  Linking.openURL(target).catch(() => {
    Alert.alert('Open Play Store', 'Could not open the store link. Search for VISION Growth.');
  });
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  block: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: 28,
    justifyContent: 'center',
  },
  blockTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  blockMsg: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  ver: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 28 },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 16 },
});
