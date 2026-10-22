import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const splashImage = require('../../assets/splash.jpg');

export default function SplashScreen({ navigation }: any) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.imageWrap}>
          <Image
            source={splashImage}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="VISION Growth Card"
          />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.actionsSafe} edges={['bottom']}>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Register</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already registered? <Text style={styles.loginBold}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#262857',
  },
  safe: {
    flex: 1,
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionsSafe: {
    backgroundColor: '#262857',
  },
  actions: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    alignItems: 'stretch',
  },
  registerBtn: {
    width: '100%',
    backgroundColor: '#DCEBFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 16,
  },
  loginBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  loginBold: {
    fontWeight: '800',
    color: colors.sky,
  },
  pressed: {
    opacity: 0.9,
  },
});
