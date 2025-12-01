
import React from 'react';
import { useLocalization, Language, Currency } from '../contexts/LocalizationContext';

export const Header: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, t } = useLocalization();

  return (
    <header className="bg-dark-card shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h1 className="text-xl font-bold text-white ml-3">{t('headerTitle')}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-gray-700 border border-dark-border hover:border-brand-primary text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5 appearance-none pr-8 transition-all duration-300 ease-in-out"
                aria-label={t('language')}
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {/* Currency Selector */}
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-gray-700 border border-dark-border hover:border-brand-primary text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5 appearance-none pr-8 transition-all duration-300 ease-in-out"
                aria-label={t('currency')}
              >
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};