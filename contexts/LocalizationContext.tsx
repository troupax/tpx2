import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { translations } from '../translations';

export type Language = 'pt' | 'en';
export type Currency = 'BRL' | 'USD' | 'EUR';

export interface FormatCurrencyOptions {
  notation?: 'standard' | 'compact';
  currency?: Currency;
}

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: (key: keyof typeof translations.pt) => string;
  formatCurrency: (value: number, options?: FormatCurrencyOptions) => string;
  currencySymbol: string;
  convertCurrency: (value: number, from: Currency, to: Currency) => number;
  isLoadingRates: boolean;
  ratesError: string | null;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const currencySymbols: { [key in Currency]: string } = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      setRatesError(null);
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.result === 'success' && data.rates) {
          setRates(data.rates);
        } else {
          throw new Error(data['error-type'] || 'Failed to parse exchange rates');
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setRatesError('Could not load conversion rates.');
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  const t = (key: keyof typeof translations.pt): string => {
    return translations[language][key] || key;
  };

  const formatCurrency = (value: number, options: FormatCurrencyOptions = {}): string => {
    const { notation = 'standard', currency: targetCurrency = currency } = options;
    const locale = {
        BRL: 'pt-BR',
        USD: 'en-US',
        EUR: 'de-DE'
    }[targetCurrency];
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      notation,
      maximumFractionDigits: notation === 'compact' ? 1 : 2,
      minimumFractionDigits: notation === 'compact' ? 0 : 2,
    }).format(value);
  };
  
  const convertCurrency = useCallback((value: number, from: Currency, to: Currency): number => {
    if (from === to || isLoadingRates || ratesError || !rates[from] || !rates[to]) {
      return value; // Return original value if conversion isn't possible
    }
    // Convert 'from' currency to base currency (USD)
    const valueInUsd = value / rates[from];
    // Convert from base currency (USD) to 'to' currency
    return valueInUsd * rates[to];
  }, [rates, isLoadingRates, ratesError]);

  const currencySymbol = useMemo(() => currencySymbols[currency], [currency]);

  const value = {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    formatCurrency,
    currencySymbol,
    convertCurrency,
    isLoadingRates,
    ratesError,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};