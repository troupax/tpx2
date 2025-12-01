
import React from 'react';
import type { YearlyData, InvestmentType, MixedInvestmentOrder } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface BreakdownTableProps {
  data: YearlyData[];
  investmentType: InvestmentType;
  mixedInvestmentOrder?: MixedInvestmentOrder;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({ data, investmentType, mixedInvestmentOrder }) => {
  const { t, formatCurrency } = useLocalization();
  const isFixedFamily = investmentType === 'fixed' || investmentType === 'mixed';
  const isSplit = data.some(d => d.retainedBalance != null);

  const retainedHeader = mixedInvestmentOrder === 'compound_first' ? t('balanceCompound') : t('balanceFixed');
  const migratedHeader = mixedInvestmentOrder === 'compound_first' ? t('balanceFixed') : t('balanceCompound');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-dark-border">
          <tr>
            <th className="p-4 text-sm font-semibold text-gray-400">{t('tableYear')}</th>
            <th className="p-4 text-sm font-semibold text-gray-400">{t('tableTotalInvested')}</th>
            <th className="p-4 text-sm font-semibold text-gray-400">{t('tableEarningsInYear')}</th>
            {isFixedFamily && <th className="p-4 text-sm font-semibold text-gray-400">{t('tableMonthlyIncome')}</th>}
            {isSplit && <th className="p-4 text-sm font-semibold text-gray-400">{retainedHeader}</th>}
            {isSplit && <th className="p-4 text-sm font-semibold text-gray-400">{migratedHeader}</th>}
            <th className="p-4 text-sm font-semibold text-gray-400">{t('tableFinalBalance')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const previousGains = index > 0 ? data[index - 1].interestGains : 0;
            const annualGains = row.interestGains - previousGains;
            
            return (
              <tr key={row.year} className="border-b border-dark-border last:border-0 hover:bg-gray-800 transition-colors">
                <td className="p-4 font-medium">{row.year}</td>
                <td className="p-4">{formatCurrency(row.totalInvested)}</td>
                <td className="p-4 text-green-400">{formatCurrency(annualGains)}</td>
                {isFixedFamily && <td className="p-4 text-gray-300">{row.monthlyIncome != null ? formatCurrency(row.monthlyIncome) : '—'}</td>}
                {isSplit && <td className="p-4 text-purple-400">{row.retainedBalance != null ? formatCurrency(row.retainedBalance) : '—'}</td>}
                {isSplit && <td className="p-4 text-pink-400">{row.migratedBalance != null ? formatCurrency(row.migratedBalance) : '—'}</td>}
                <td className="p-4 font-bold text-brand-primary">{formatCurrency(row.finalBalance)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};