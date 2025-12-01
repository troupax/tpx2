
import React from 'react';
import type { YearlyData, InvestmentType, MixedInvestmentOrder } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { useLocalization } from '../contexts/LocalizationContext';

interface GrowthChartProps {
  data: YearlyData[];
  investmentType: InvestmentType;
  switchToFixedYear?: number;
  mixedInvestmentOrder?: MixedInvestmentOrder;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t, formatCurrency } = useLocalization();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const interestLabel = data.monthlyIncome != null ? t('chartAccumulatedEarnings') : t('chartInterestGains');
    return (
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border shadow-lg text-sm">
        <p className="font-bold text-brand-light mb-2">{`${t('chartYear')} ${label}`}</p>
        <p className="text-blue-400">{`${t('chartTotalInvested')}: ${formatCurrency(data.totalInvested)}`}</p>
        <p className="text-green-400">{`${interestLabel}: ${formatCurrency(data.interestGains)}`}</p>
        {data.monthlyIncome != null && (
           <p style={{ color: '#fbbf24' }}>{`${t('chartMonthlyIncome')}: ${formatCurrency(data.monthlyIncome)}`}</p>
        )}
        {data.retainedBalance != null && (
            <p className="text-purple-400 mt-1">{`${t('retainedPortion')}: ${formatCurrency(data.retainedBalance)}`}</p>
        )}
        {data.migratedBalance != null && (
            <p className="text-pink-400">{`${t('migratedPortion')}: ${formatCurrency(data.migratedBalance)}`}</p>
        )}
        <p className="text-brand-primary font-semibold mt-1">{`${t('chartFinalBalance')}: ${formatCurrency(data.finalBalance)}`}</p>
      </div>
    );
  }
  return null;
};

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, investmentType, switchToFixedYear, mixedInvestmentOrder }) => {
  const { t, formatCurrency } = useLocalization();
  const isFixedFamily = investmentType === 'fixed' || investmentType === 'mixed';
  const interestLineName = isFixedFamily ? t('chartAccumulatedEarnings') : t('chartInterestGains');
  const isSplit = data.some(d => d.retainedBalance != null);

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="year" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
          <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(value) => formatCurrency(value, {notation: 'compact'})} tick={{ fill: '#9ca3af' }} />
          {isFixedFamily && (
            <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" tickFormatter={(value) => formatCurrency(value, {notation: 'compact'})} tick={{ fill: '#fbbf24' }} />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#d1d5db' }} />

          {/* Lines for the left Y-axis */}
          <Line yAxisId="left" type="monotone" dataKey="totalInvested" name={t('chartTotalInvestedLegend')} stroke="#38bdf8" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="interestGains" name={interestLineName} stroke="#4ade80" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="finalBalance" name={t('chartFinalBalanceLegend')} stroke="#f97316" strokeWidth={3} dot={false} />
          
          {isSplit && (
            <>
              <Line yAxisId="left" type="monotone" dataKey="retainedBalance" name={t('retainedPortion')} stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls={false} strokeDasharray="5 5"/>
              <Line yAxisId="left" type="monotone" dataKey="migratedBalance" name={t('migratedPortion')} stroke="#f472b6" strokeWidth={2} dot={false} connectNulls={false} strokeDasharray="5 5"/>
            </>
          )}

          {/* Line for the right Y-axis (only for fixed income or mixed) */}
          {isFixedFamily && (
             <Line yAxisId="right" type="monotone" dataKey="monthlyIncome" name={t('chartMonthlyIncome')} stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls={false} />
          )}

          {/* Reference line for mixed mode switch */}
          {investmentType === 'mixed' && switchToFixedYear && switchToFixedYear < data[data.length -1].year && (
            <ReferenceLine yAxisId="left" x={switchToFixedYear} stroke="#a78bfa" strokeDasharray="4 4" label={{ value: t('switchLabel'), position: 'insideTopRight', fill: '#a78bfa', fontSize: 12 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};