
import React from 'react';
import type { SimulationResult } from '../types';
import { SummaryCard } from './SummaryCard';
import { GrowthChart } from './GrowthChart';
import { BreakdownTable } from './BreakdownTable';
import { useLocalization } from '../contexts/LocalizationContext';
import { EventLog } from './EventLog';
import { GeminiAnalysisCard } from './GeminiAnalysisCard';

interface ResultsDisplayProps {
  data: SimulationResult | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  const { t, formatCurrency } = useLocalization();

  if (!data) {
    return (
      <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border flex flex-col items-center justify-center h-full min-h-[300px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-300">{t('waitingForSimulation')}</h3>
        <p className="text-gray-400 mt-2 text-center">{t('waitingForSimulationDesc')}</p>
      </div>
    );
  }

  const { summary, yearlyData, investmentType, switchToFixedYear, mixedInvestmentOrder, enableSplit, splitMode, splitPercentage, annualInterestRate, annualInterestRatePhase2, eventLog } = data;
  const { initialRetainedBalance, initialMigratedBalance } = summary;
  const isFixedFamily = investmentType === 'fixed' || investmentType === 'mixed';

  const hasReinvestment = isFixedFamily && (
    (summary.reinvestmentValue != null && summary.reinvestmentValue > 0) ||
    (summary.reinvestmentPercentage != null && summary.reinvestmentPercentage > 0) ||
    (summary.reinvestmentThreshold != null)
  );
  const monthlyIncomeTitle = hasReinvestment ? t('finalMonthlyIncome') : t('fixedMonthlyIncome');

  const hasPercentageReinvestment = isFixedFamily && summary.reinvestmentPercentage != null && summary.reinvestmentPercentage > 0;
  const hasValueReinvestment = isFixedFamily && summary.reinvestmentValue != null && summary.reinvestmentValue > 0;
  const hasThresholdReinvestment = isFixedFamily && summary.reinvestmentThreshold != null;

  const getProjectionTitle = () => {
    switch (investmentType) {
      case 'fixed': return t('incomeAndBalanceProjection');
      case 'mixed': return t('mixedProjection');
      default: return t('growthProjection');
    }
  };

  const getEvolutionTitle = () => {
    switch (investmentType) {
      case 'fixed': return t('incomeEvolution');
      case 'mixed': return t('mixedEvolution');
      default: return t('annualEvolution');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isFixedFamily && summary.monthlyIncome != null && (
          <SummaryCard title={monthlyIncomeTitle} value={summary.monthlyIncome} isInterest={true} />
        )}
        <SummaryCard title={t('finalGrossValue')} value={summary.finalBalance} isFinal={true} />
        <SummaryCard 
          title={isFixedFamily ? t('totalEarnings') : t('totalInterest')} 
          value={summary.totalInterest} 
          isInterest={true}
          tooltipText={t('tooltipTotalEarnings')}
        />
        <SummaryCard 
            title={t('totalInvested')} 
            value={summary.totalInvested} 
            tooltipText={t('tooltipTotalInvested')}
        />
        {investmentType === 'mixed' && annualInterestRatePhase2 != null && (
            <SummaryCard title={t('interestRatesP1P2')} displayValue={`${annualInterestRate.toFixed(1)}% / ${annualInterestRatePhase2.toFixed(1)}%`} />
        )}
        {hasPercentageReinvestment && (
            <SummaryCard title={t('monthlyReinvestment')} displayValue={`${summary.reinvestmentPercentage}%`} />
        )}
        {hasValueReinvestment && (
            <SummaryCard title={t('monthlyReinvestment')} value={summary.reinvestmentValue} />
        )}
        {hasThresholdReinvestment && (
            <SummaryCard title={t('reinvestmentThresholdCardTitle')} value={summary.reinvestmentThreshold} />
        )}
        {enableSplit && initialRetainedBalance != null && initialMigratedBalance != null && (
          splitMode === 'amount'
              ? <SummaryCard title={t('capitalSplit')} displayValue={`${formatCurrency(initialRetainedBalance, {notation: 'compact'})} / ${formatCurrency(initialMigratedBalance, {notation: 'compact'})}`} />
              : <SummaryCard title={t('capitalSplit')} displayValue={`${100 - (splitPercentage ?? 0)}% / ${splitPercentage}%`} />
        )}
      </div>

      <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border">
         <h3 className="text-xl font-bold text-brand-primary mb-4">
           {getProjectionTitle()}
         </h3>
        <GrowthChart data={yearlyData} investmentType={investmentType} switchToFixedYear={switchToFixedYear} mixedInvestmentOrder={mixedInvestmentOrder} />
      </div>
      
      {investmentType === 'mixed' && eventLog && eventLog.length > 0 && (
         <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border">
            <h3 className="text-xl font-bold text-brand-primary mb-4">
              {t('eventLogTitle')}
            </h3>
           <EventLog log={eventLog} />
         </div>
      )}

      <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border">
        <h3 className="text-xl font-bold text-brand-primary mb-4">
          {getEvolutionTitle()}
        </h3>
        <BreakdownTable data={yearlyData} investmentType={investmentType} mixedInvestmentOrder={mixedInvestmentOrder} />
      </div>

      <GeminiAnalysisCard data={data} />
    </div>
  );
};