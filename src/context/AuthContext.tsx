import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DOCTOR_KEY, TOKEN_KEY } from '../config/api';
import { authApi } from '../services/api';

type Doctor = {
  id: number;
  doctor_name: string;
  center_name: string;
  address: string;
  mobile: string;
  email: string;
  mci_registration_no: string;
  speciality?: string | null;
  email_verified?: boolean;
};

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  doctor: Doctor | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, doctor: Doctor) => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, d] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(DOCTOR_KEY),
        ]);
        if (t) {
          setToken(t);
          if (d) setDoctor(JSON.parse(d));
          try {
            const me = await authApi.me();
            if (me.data) {
              setDoctor(me.data);
              await AsyncStorage.setItem(DOCTOR_KEY, JSON.stringify(me.data));
            }
          } catch {
            await Promise.all([
              AsyncStorage.removeItem(TOKEN_KEY),
              AsyncStorage.removeItem(DOCTOR_KEY),
            ]);
            setToken(null);
            setDoctor(null);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setSession = useCallback(async (t: string, d: Doctor) => {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    await AsyncStorage.setItem(DOCTOR_KEY, JSON.stringify(d));
    setToken(t);
    setDoctor(d);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email.trim(), password);
      if (!res.data?.token) throw new Error(res.message || 'Login failed');
      await setSession(res.data.token, res.data.doctor);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(DOCTOR_KEY),
    ]);
    setToken(null);
    setDoctor(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await authApi.me();
    if (me.data) {
      setDoctor(me.data);
      await AsyncStorage.setItem(DOCTOR_KEY, JSON.stringify(me.data));
    }
  }, []);

  const value = useMemo(
    () => ({ ready, token, doctor, login, logout, setSession, refreshMe }),
    [ready, token, doctor, login, logout, setSession, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
