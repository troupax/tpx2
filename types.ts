
import { translations } from './translations';

export type InvestmentType = 'compound' | 'fixed' | 'mixed';
export type ReinvestmentMode = 'amount' | 'percentage' | 'above_threshold';
export type MixedInvestmentOrder = 'compound_first' | 'fixed_first';
export type SplitMode = 'amount' | 'percentage';
export type RateMode = 'manual' | 'cdi' | 'ipca_plus';

export interface SimulationInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualInterestRate: number;
  annualInterestRatePhase2?: number;
  years: number;
  investmentType: InvestmentType;
  reinvestmentValue?: number; // Fixed amount to reinvest
  reinvestmentPercentage?: number; // Percentage to reinvest
  reinvestmentThreshold?: number; // Reinvest amount above this threshold
  reinvestmentMode?: ReinvestmentMode;
  switchToFixedYear?: number;
  mixedInvestmentOrder?: MixedInvestmentOrder;
  enableSplit?: boolean;
  splitMode?: SplitMode;
  splitValue?: number;
  splitPercentage?: number;
}

export interface YearlyData {
  year: number;
  totalInvested: number;
  interestGains: number; // Cumulative gains
  finalBalance: number;
  monthlyIncome?: number; // For fixed income type, this would be the final month's payout of that year
  retainedBalance?: number; // Balance of the portion that stayed in phase 1 type
  migratedBalance?: number; // Balance of the portion that moved to phase 2 type
}

export interface EventLogItem {
  year: number;
  type: 'start' | 'switch' | 'split' | 'end';
  titleKey: keyof typeof translations.pt;
  descriptionKey: keyof typeof translations.pt;
  descriptionValues?: { [key: string]: string | number | undefined };
}

export interface SimulationResult {
  yearlyData: YearlyData[];
  summary: {
    totalInvested: number;
    totalInterest: number; // Total gains
    finalBalance: number;
    monthlyIncome?: number; // For fixed income type, this is the final payout
    reinvestmentValue?: number;
    reinvestmentPercentage?: number;
    reinvestmentThreshold?: number;
    initialRetainedBalance?: number;
    initialMigratedBalance?: number;
  };
  investmentType: InvestmentType;
  annualInterestRate: number;
  annualInterestRatePhase2?: number;
  switchToFixedYear?: number;
  mixedInvestmentOrder?: MixedInvestmentOrder;
  enableSplit?: boolean;
  splitMode?: SplitMode;
  splitValue?: number;
  splitPercentage?: number;
  eventLog?: EventLogItem[];
}