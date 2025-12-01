
import React from 'react';
import { useLocalization, Currency } from '../contexts/LocalizationContext';
import { Tooltip } from './Tooltip';

interface SummaryCardProps {
  title: string;
  value?: number;
  displayValue?: string;
  isInterest?: boolean;
  isFinal?: boolean;
  tooltipText?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, displayValue, isInterest = false, isFinal = false, tooltipText }) => {
  const { currency, formatCurrency, convertCurrency, t, isLoadingRates, ratesError } = useLocalization();

  const cardClasses = `bg-dark-card p-5 rounded-lg shadow-md border border-dark-border transition duration-300 hover:border-brand-primary hover:scale-105 ${isFinal ? 'border-brand-primary' : ''}`;
  const valueClasses = `text-3xl font-bold mt-2 ${isInterest ? 'text-green-400' : ''} ${isFinal ? 'text-brand-primary' : 'text-gray-100'}`;

  const mainDisplayValue = displayValue ?? (value != null ? formatCurrency(value) : 'N/A');

  const getConversionCurrencies = (): [Currency, Currency] | null => {
    switch (currency) {
      case 'BRL':
        return ['USD', 'EUR'];
      case 'USD':
        return ['BRL', 'EUR'];
      case 'EUR':
        return ['BRL', 'USD'];
      default:
        return null;
    }
  };

  const conversionCurrencies = getConversionCurrencies();

  return (
    <div className={cardClasses}>
      <div className="flex items-center">
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
        {tooltipText && <Tooltip content={tooltipText} />}
      </div>
      <p className={valueClasses}>{mainDisplayValue}</p>
      
      {/* Display conversions to other major currencies */}
      {value != null && conversionCurrencies && (
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t border-dark-border/50 min-h-[18px]">
          {isLoadingRates ? (
            <span className="w-full text-center animate-pulse">{t('loadingRates')}...</span>
          ) : !ratesError ? (
            <>
              <span>
                {formatCurrency(convertCurrency(value, currency, conversionCurrencies[0]), { currency: conversionCurrencies[0] })}
              </span>
              <span>
                {formatCurrency(convertCurrency(value, currency, conversionCurrencies[1]), { currency: conversionCurrencies[1] })}
              </span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
