import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../services/profileService';
import { CurrencyCode, DEFAULT_CURRENCY_CODE, getCurrencyByCode, isSupportedCurrencyCode } from '../constants/currencies';

type FormatOptions = {
  signed?: boolean;
  absolute?: boolean;
};

type CurrencyContextValue = {
  currencyCode: CurrencyCode;
  currency: ReturnType<typeof getCurrencyByCode>;
  setCurrencyCode: (code: CurrencyCode) => Promise<void>;
  refreshCurrencyFromProfile: () => Promise<void>;
  clearCurrency: () => Promise<void>;
  formatCurrency: (amount: number, options?: FormatOptions) => string;
};

const STORAGE_KEY = 'preferred_currency_code';

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider(props: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>(DEFAULT_CURRENCY_CODE);

  const persistCurrency = useCallback(async function (code: CurrencyCode) {
    setCurrencyCodeState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const setCurrencyCode = useCallback(async function (code: CurrencyCode) {
    await persistCurrency(code);
  }, [persistCurrency]);

  const clearCurrency = useCallback(async function () {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCurrencyCodeState(DEFAULT_CURRENCY_CODE);
  }, []);

  const refreshCurrencyFromProfile = useCallback(async function () {
    try {
      const profile = await profileService.getProfile();
      const code = profile.currency;
      if (isSupportedCurrencyCode(code)) {
        await persistCurrency(code);
      }
    } catch (_error) {
      // ignore when logged out or profile unavailable
    }
  }, [persistCurrency]);

  useEffect(function () {
    const boot = async function () {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (isSupportedCurrencyCode(cached)) {
        setCurrencyCodeState(cached);
      }
      await refreshCurrencyFromProfile();
    };
    void boot();
  }, [refreshCurrencyFromProfile]);

  const currency = useMemo(function () {
    return getCurrencyByCode(currencyCode);
  }, [currencyCode]);

  const formatCurrency = useCallback(function (amount: number, options?: FormatOptions) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const abs = Math.abs(safeAmount);

    if (options?.signed) {
      const sign = safeAmount > 0 ? '+' : safeAmount < 0 ? '-' : '';
      return sign + currency.symbol + abs.toFixed(2);
    }

    if (options?.absolute) {
      return currency.symbol + abs.toFixed(2);
    }

    const sign = safeAmount < 0 ? '-' : '';
    return sign + currency.symbol + abs.toFixed(2);
  }, [currency.symbol]);

  const value = useMemo(function () {
    return {
      currencyCode,
      currency,
      setCurrencyCode,
      refreshCurrencyFromProfile,
      clearCurrency,
      formatCurrency,
    };
  }, [currencyCode, currency, setCurrencyCode, refreshCurrencyFromProfile, clearCurrency, formatCurrency]);

  return <CurrencyContext.Provider value={value}>{props.children}</CurrencyContext.Provider>;
}

export function useAppCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useAppCurrency must be used within CurrencyProvider');
  }
  return ctx;
}