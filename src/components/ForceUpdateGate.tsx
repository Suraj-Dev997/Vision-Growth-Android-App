import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { APP_VERSION_CODE, IOS_BUILD_NUMBER } from '../config/appVersion';
import { appApi, AppConfig } from '../services/api';
import { colors } from '../theme/colors';

const PLAY_STORE_FALLBACK =
  'https://play.google.com/store/apps/details?id=com.visiongrowth';
const APP_STORE_FALLBACK = 'https://apps.apple.com/app/id000000000';

/**
 * Soft prompt or full-screen block based on /app/config vs local build.
 * Android uses android_* fields + Play Store; iOS uses ios_* + App Store.
 * Live Play builds that only know android_* keep working unchanged.
 */
export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const isIos = Platform.OS === 'ios';
  const localBuild = isIos ? IOS_BUILD_NUMBER : APP_VERSION_CODE;

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

        const min = Number(
          isIos ? cfg.ios_min_version_code ?? 1 : cfg.android_min_version_code || 1,
        );
        const latest = Number(
          isIos
            ? cfg.ios_latest_version_code ?? min
            : cfg.android_latest_version_code || min,
        );
        const force = Boolean(cfg.force_update);
        const belowMin = localBuild < min;
        const behindLatest = localBuild < latest;
        const storeName = isIos ? 'App Store' : 'Play Store';

        // Force: below min always, or force_update=1 and behind latest — no "Later"
        if (belowMin || (force && behindLatest)) {
          setBlocked(true);
        } else if (behindLatest) {
          Alert.alert(
            cfg.update_title || 'Update available',
            cfg.update_message || `A new version is available on ${storeName}.`,
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Update',
                onPress: () => openStore(cfg, isIos),
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
  }, [isIos, localBuild]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const requiredMin = config
    ? Math.max(
        Number(
          isIos
            ? config.ios_min_version_code ?? 1
            : config.android_min_version_code || 1,
        ),
        Number(
          isIos
            ? config.ios_latest_version_code ?? 1
            : config.android_latest_version_code || 1,
        ),
      )
    : null;

  return (
    <>
      {children}
      <Modal visible={blocked} animationType="fade" transparent={false}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{config?.update_title || 'Update required'}</Text>
          <Text style={styles.blockMsg}>
            {config?.update_message ||
              `Please update VISION Growth from the ${
                isIos ? 'App Store' : 'Play Store'
              } to continue.`}
          </Text>
          <Text style={styles.ver}>
            Your {isIos ? 'build' : 'version code'}: {localBuild}
            {requiredMin != null ? ` · Required: ${requiredMin}+` : ''}
          </Text>
          <Pressable style={styles.btn} onPress={() => openStore(config, isIos)}>
            <Text style={styles.btnText}>Update now</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function openStore(cfg: AppConfig | null | undefined, isIos: boolean) {
  const target = isIos
    ? cfg?.ios_store_url || APP_STORE_FALLBACK
    : cfg?.android_store_url || PLAY_STORE_FALLBACK;
  Linking.openURL(target).catch(() => {
    Alert.alert(
      isIos ? 'Open App Store' : 'Open Play Store',
      'Could not open the store link. Search for VISION Growth.',
    );
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
