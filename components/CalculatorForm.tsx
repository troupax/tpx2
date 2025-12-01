
import React, { useState, useEffect, useCallback } from 'react';
import type { SimulationInput, InvestmentType, ReinvestmentMode, MixedInvestmentOrder, SplitMode, RateMode } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { fetchIndicators } from '../services/financialData';
import { round } from '../utils';
import { Tooltip } from './Tooltip';

interface CalculatorFormProps {
  onCalculate: (inputs: SimulationInput) => void;
  onClear: () => void;
}

const DEFAULT_VALUES: Omit<SimulationInput, 'annualInterestRatePhase2'> & { annualInterestRatePhase2: number } = {
    initialInvestment: 1000,
    monthlyContribution: 200,
    annualInterestRate: 10, // Default slightly adjusted for Brazil
    annualInterestRatePhase2: 6,
    years: 20,
    investmentType: 'compound' as InvestmentType,
    reinvestmentValue: 0,
    reinvestmentMode: 'amount' as ReinvestmentMode,
    reinvestmentPercentage: 50,
    reinvestmentThreshold: 0, // Default threshold
    switchToFixedYear: 10,
    mixedInvestmentOrder: 'compound_first' as MixedInvestmentOrder,
    enableSplit: false,
    splitMode: 'percentage' as SplitMode,
    splitValue: 10000,
    splitPercentage: 80,
};

interface RateConfig {
    mode: RateMode;
    type: 'cdi' | 'ipca_plus';
    cdiPercent: number;
    ipcaFixed: number;
}

const DEFAULT_RATE_CONFIG: RateConfig = {
    mode: 'manual',
    type: 'cdi',
    cdiPercent: 100,
    ipcaFixed: 6
};

// Reusable component for Rate Inputs
const RateInputSection: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    config: RateConfig;
    onConfigChange: (cfg: RateConfig) => void;
    marketData: { cdi: number; ipca: number };
    isLoadingData: boolean;
    t: any;
}> = ({ label, value, onChange, config, onConfigChange, marketData, isLoadingData, t }) => {
    
    const calculateEffectiveRate = useCallback(() => {
        if (config.mode === 'manual') return null;
        let effectiveRate = 0;
        if (config.type === 'cdi') {
            effectiveRate = marketData.cdi * (config.cdiPercent / 100);
        } else {
            // (1 + IPCA) * (1 + Fixed) - 1
            const ipcaDecimal = marketData.ipca / 100;
            const fixedDecimal = config.ipcaFixed / 100;
            effectiveRate = ((1 + ipcaDecimal) * (1 + fixedDecimal) - 1) * 100;
        }
        return round(effectiveRate);
    }, [config, marketData]);

    // Update parent value when config changes
    useEffect(() => {
        const newRate = calculateEffectiveRate();
        if (newRate !== null && newRate !== value) {
            onChange(newRate);
        }
    }, [calculateEffectiveRate, onChange, value]);

    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <div className="flex bg-gray-800 rounded-md p-1">
                    <button
                        type="button"
                        onClick={() => onConfigChange({ ...config, mode: 'manual' })}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${config.mode === 'manual' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        {t('manualRate')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfigChange({ ...config, mode: 'cdi' })} // Set mode to indicator (stored as 'cdi' or 'ipca_plus' in logic, but let's use generic 'indicator' concept mapped to type)
                        className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${config.mode !== 'manual' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        {config.mode !== 'manual' && <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></span>}
                        {t('marketIndicators')}
                    </button>
                </div>
            </div>

            {config.mode === 'manual' ? (
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs text-gray-400">{t('annualInterestRate')}</span>
                        <span className="text-brand-primary font-semibold">{value.toFixed(2)}%</span>
                    </div>
                    <input
                        type="range"
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer range-thumb"
                        min="1"
                        max="30"
                        step="0.1"
                    />
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onConfigChange({ ...config, type: 'cdi' })}
                            className={`flex-1 py-1.5 text-xs rounded border flex justify-center items-center ${config.type === 'cdi' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            {t('percentOfCDI')}
                            <Tooltip content={t('tooltipCdi')} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onConfigChange({ ...config, type: 'ipca_plus' })}
                            className={`flex-1 py-1.5 text-xs rounded border flex justify-center items-center ${config.type === 'ipca_plus' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            {t('ipcaPlus')}
                            <Tooltip content={t('tooltipIpca')} />
                        </button>
                    </div>

                    {config.type === 'cdi' && (
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{t('cdiCurrent')}</span>
                                <span className="font-mono text-green-400">{isLoadingData ? '...' : `${marketData.cdi}%`}</span>
                            </div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">{t('percentage')}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={config.cdiPercent}
                                    onChange={(e) => onConfigChange({ ...config, cdiPercent: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-dark-border rounded p-2 text-sm text-right"
                                />
                                <span className="text-gray-400">%</span>
                            </div>
                        </div>
                    )}

                    {config.type === 'ipca_plus' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>{t('ipcaProjected')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className={`w-full bg-gray-800 border border-dark-border rounded p-2 text-sm text-right cursor-not-allowed ${isLoadingData ? 'text-gray-500' : 'text-gray-300'}`}>
                                        {isLoadingData ? (
                                            <span className="animate-pulse">...</span>
                                        ) : (
                                            marketData.ipca
                                        )}
                                    </div>
                                    <span className="text-gray-400 text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>{t('fixedPortion')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={config.ipcaFixed}
                                        onChange={(e) => onConfigChange({ ...config, ipcaFixed: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-dark-border rounded p-2 text-sm text-right"
                                        step="0.1"
                                    />
                                    <span className="text-gray-400 text-xs">%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-xs text-gray-400">{t('finalRate')}</span>
                        <span className="text-lg font-bold text-brand-primary">{value.toFixed(2)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};


export const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate, onClear }) => {
  const { t, currencySymbol, formatCurrency } = useLocalization();
  const [formState, setFormState] = useState(DEFAULT_VALUES);
  
  // Independent configurations for Phase 1 (Main) and Phase 2
  const [phase1Config, setPhase1Config] = useState<RateConfig>(DEFAULT_RATE_CONFIG);
  const [phase2Config, setPhase2Config] = useState<RateConfig>(DEFAULT_RATE_CONFIG);

  const [marketData, setMarketData] = useState({ cdi: 10.65, ipca: 4.5 });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch market data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      const data = await fetchIndicators();
      setMarketData({ cdi: data.cdi, ipca: data.ipca });
      setIsLoadingData(false);
    };
    loadData();
  }, []);

  const handleInputChange = <K extends keyof typeof DEFAULT_VALUES>(field: K, value: (typeof DEFAULT_VALUES)[K]) => {
    setFormState(prevState => {
      const newState = { ...prevState, [field]: value };
      
      // Enforce constraints for mixed investment type
      if (newState.investmentType === 'mixed') {
        // Ensure minimum years for mixed mode to function reasonably
        if (newState.years <= 1) {
            newState.years = 2;
        }
        // Ensure Phase 1 duration is strictly less than total years
        if (newState.switchToFixedYear >= newState.years) {
            newState.switchToFixedYear = Math.max(1, newState.years - 1);
        }
      }
      
      return newState;
    });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
        const { investmentType, monthlyContribution, annualInterestRatePhase2, reinvestmentMode, reinvestmentValue, reinvestmentPercentage, reinvestmentThreshold, switchToFixedYear, mixedInvestmentOrder, enableSplit, splitMode, splitValue, splitPercentage, years } = formState;

        const calculationInputs: SimulationInput = {
          ...formState,
          monthlyContribution: investmentType !== 'fixed' ? monthlyContribution : 0,
          annualInterestRatePhase2: investmentType === 'mixed' ? annualInterestRatePhase2 : undefined,
          reinvestmentValue: (investmentType === 'fixed' || investmentType === 'mixed') && reinvestmentMode === 'amount' ? reinvestmentValue : undefined,
          reinvestmentPercentage: (investmentType === 'fixed' || investmentType === 'mixed') && reinvestmentMode === 'percentage' ? reinvestmentPercentage : undefined,
          reinvestmentThreshold: (investmentType === 'fixed' || investmentType === 'mixed') && reinvestmentMode === 'above_threshold' ? reinvestmentThreshold : undefined,
          reinvestmentMode: (investmentType === 'fixed' || investmentType === 'mixed') ? reinvestmentMode : undefined,
          switchToFixedYear: investmentType === 'mixed' ? switchToFixedYear : undefined,
          mixedInvestmentOrder: investmentType === 'mixed' ? mixedInvestmentOrder : undefined,
          enableSplit: investmentType === 'mixed' ? enableSplit : undefined,
          splitMode: investmentType === 'mixed' && enableSplit ? splitMode : undefined,
          splitValue: investmentType === 'mixed' && enableSplit && splitMode === 'amount' ? splitValue : undefined,
          splitPercentage: investmentType === 'mixed' && enableSplit && splitMode === 'percentage' ? splitPercentage : undefined,
        };
        onCalculate(calculationInputs);
    }, 500); // Debounce time

    return () => {
        clearTimeout(handler);
    };
  }, [formState, onCalculate]);

  const handleReset = () => {
    setFormState(DEFAULT_VALUES);
    setPhase1Config(DEFAULT_RATE_CONFIG);
    setPhase2Config(DEFAULT_RATE_CONFIG);
    onClear();
  };
  
  const { investmentType, years, switchToFixedYear, annualInterestRate, mixedInvestmentOrder, annualInterestRatePhase2, enableSplit, splitMode, splitPercentage, reinvestmentMode } = formState;

  const buttonClass = (type: string, current: string) => 
    `w-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center ${
      current === type
        ? 'bg-brand-primary text-white'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
    }`;

  const contributionHelpText = mixedInvestmentOrder === 'compound_first' ? t('contributionStopsAfterSwitch') : t('contributionStartsAfterSwitch');

  // Helper calculation for threshold feedback
  const monthlyRate = annualInterestRate / 100 / 12;
  const estimatedMonthlyInterest = formState.initialInvestment * monthlyRate;

  return (
    <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-brand-primary mb-2">{t('investmentSimulator')}</h2>
        
        {/* Investment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('simulationType')}</label>
          <div className="flex rounded-md shadow-sm">
            <button type="button" onClick={() => handleInputChange('investmentType', 'compound')} className={`${buttonClass('compound', investmentType)} rounded-l-md`}>
              {t('compoundInterest')}
            </button>
            <button type="button" onClick={() => handleInputChange('investmentType', 'fixed')} className={`${buttonClass('fixed', investmentType)}`}>
              {t('fixedIncome')}
            </button>
            <button type="button" onClick={() => handleInputChange('investmentType', 'mixed')} className={`${buttonClass('mixed', investmentType)} rounded-r-md`}>
              {t('mixedInvestment')}
            </button>
          </div>
        </div>

        {/* Initial Investment */}
        <div>
          <label htmlFor="initialInvestment" className="block text-sm font-medium text-gray-300 mb-2">{t('initialInvestment')}</label>
          <div className="relative">
             <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
             <input
                type="number"
                id="initialInvestment"
                value={formState.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', Number(e.target.value))}
                className="w-full bg-gray-900 border border-dark-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300 focus:shadow-lg focus:shadow-brand-primary/20"
                min="0"
                step="100"
              />
          </div>
        </div>

        {/* Monthly Contribution */}
        {investmentType !== 'fixed' && (
          <div>
            <label htmlFor="monthlyContribution" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                {t('monthlyContribution')}
                <Tooltip content={t('tooltipMonthlyContribution')} />
            </label>
            <div className="relative">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
              <input
                type="number"
                id="monthlyContribution"
                value={formState.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', Number(e.target.value))}
                className="w-full bg-gray-900 border border-dark-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300 focus:shadow-lg focus:shadow-brand-primary/20"
                min="0"
                step="50"
              />
            </div>
            {investmentType === 'mixed' && (
                <p className="text-xs text-gray-400 mt-2">{contributionHelpText}</p>
            )}
          </div>
        )}

        {/* INTEREST RATE - Single (Compound or Fixed) */}
        {investmentType !== 'mixed' && (
            <RateInputSection 
                label={t('annualInterestRate')}
                value={annualInterestRate}
                onChange={(val) => handleInputChange('annualInterestRate', val)}
                config={phase1Config}
                onConfigChange={setPhase1Config}
                marketData={marketData}
                isLoadingData={isLoadingData}
                t={t}
            />
        )}
        
        {/* Mixed Investment Options */}
        {investmentType === 'mixed' && (
            <div className="bg-gray-900/50 p-4 rounded-lg border border-dark-border flex flex-col gap-4">
                {/* Phase 1 Block */}
                <div className="border border-dark-border rounded-lg p-4 flex flex-col gap-4 bg-dark-card/30">
                    <h3 className="text-lg font-semibold text-brand-light flex items-center gap-2">
                        <span className="bg-brand-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">1</span>
                        {t('phase1Setup')}
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('phase1Type')}</label>
                        <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => handleInputChange('mixedInvestmentOrder', 'compound_first')} className={`${buttonClass('compound_first', mixedInvestmentOrder)} rounded-l-md`}>
                                {t('compoundInterest')}
                            </button>
                            <button type="button" onClick={() => handleInputChange('mixedInvestmentOrder', 'fixed_first')} className={`${buttonClass('fixed_first', mixedInvestmentOrder)} rounded-r-md`}>
                                {t('fixedIncome')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="switchToFixedYear" className="text-sm font-medium text-gray-300">{t('phase1Duration')}</label>
                            <span className="text-brand-primary font-semibold">{switchToFixedYear} {switchToFixedYear > 1 ? t('years') : t('year')}</span>
                        </div>
                        <input
                            type="range"
                            id="switchToFixedYear"
                            value={switchToFixedYear}
                            onChange={(e) => handleInputChange('switchToFixedYear', Number(e.target.value))}
                            className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer"
                            min="1"
                            max={years > 1 ? years - 1 : 1}
                            step="1"
                            disabled={years <= 1}
                        />
                    </div>
                    
                    <RateInputSection 
                        label={t('annualInterestRatePhase1')}
                        value={annualInterestRate}
                        onChange={(val) => handleInputChange('annualInterestRate', val)}
                        config={phase1Config}
                        onConfigChange={setPhase1Config}
                        marketData={marketData}
                        isLoadingData={isLoadingData}
                        t={t}
                    />
                </div>

                {/* Separator */}
                <div className="flex justify-center items-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                {/* Phase 2 Block */}
                <div className="border border-dark-border rounded-lg p-4 flex flex-col gap-4 bg-dark-card/30">
                     <h3 className="text-lg font-semibold text-brand-light flex items-center gap-2">
                        <span className="bg-brand-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">2</span>
                        {t('phase2Setup')}
                    </h3>
                    
                    <RateInputSection 
                        label={t('annualInterestRatePhase2')}
                        value={annualInterestRatePhase2}
                        onChange={(val) => handleInputChange('annualInterestRatePhase2', val)}
                        config={phase2Config}
                        onConfigChange={setPhase2Config}
                        marketData={marketData}
                        isLoadingData={isLoadingData}
                        t={t}
                    />

                    {/* Split Capital Options */}
                    <div className="pt-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enableSplit}
                                onChange={(e) => handleInputChange('enableSplit', e.target.checked)}
                                className="form-checkbox h-5 w-5 rounded bg-gray-700 border-dark-border text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm font-medium text-gray-300">{t('enableSplitCapital')}</span>
                            <Tooltip content={t('tooltipSplitCapital')} />
                        </label>
                    </div>
                    {enableSplit && (
                        <div className="flex flex-col gap-4 pl-2 border-l-2 border-dark-border">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('splitCapitalMode')}</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button type="button" onClick={() => handleInputChange('splitMode', 'percentage')} className={`${buttonClass('percentage', splitMode)} rounded-l-md`}>
                                        {t('percentage')}
                                    </button>
                                    <button type="button" onClick={() => handleInputChange('splitMode', 'amount')} className={`${buttonClass('amount', splitMode)} rounded-r-md`}>
                                        {t('fixedValue')}
                                    </button>
                                </div>
                            </div>

                            {splitMode === 'percentage' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="splitPercentage" className="text-sm font-medium text-gray-300">{t('percentageToPhase2')}</label>
                                        <span className="text-brand-primary font-semibold">{splitPercentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        id="splitPercentage"
                                        value={splitPercentage}
                                        onChange={(e) => handleInputChange('splitPercentage', Number(e.target.value))}
                                        className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer"
                                        min="0"
                                        max="100"
                                        step="1"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="splitValue" className="block text-sm font-medium text-gray-300 mb-2">{t('amountToPhase2')}</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            id="splitValue"
                                            value={formState.splitValue}
                                            onChange={(e) => handleInputChange('splitValue', Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-dark-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300 focus:shadow-lg focus:shadow-brand-primary/20"
                                            min="0"
                                            step="1000"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Reinvestment options */}
        {(investmentType === 'fixed' || investmentType === 'mixed') && (
          <div className="bg-gray-900/50 p-4 rounded-md border border-dark-border flex flex-col gap-4">
            <div className="flex items-center">
                <label className="text-sm font-medium text-gray-300">{t('reinvestmentOption')}</label>
                <Tooltip content={t('tooltipReinvestment')} />
            </div>
            <div className="flex rounded-md shadow-sm">
              <button type="button" onClick={() => handleInputChange('reinvestmentMode', 'amount')} className={`${buttonClass('amount', reinvestmentMode)} rounded-l-md`}>
                {t('fixedValue')}
                <Tooltip content={t('tooltipReinvestFixed')} iconClassName={reinvestmentMode === 'amount' ? "text-white opacity-75 hover:opacity-100" : undefined} />
              </button>
              <button type="button" onClick={() => handleInputChange('reinvestmentMode', 'percentage')} className={`${buttonClass('percentage', reinvestmentMode)}`}>
                {t('percentage')}
                <Tooltip content={t('tooltipReinvestPercentage')} iconClassName={reinvestmentMode === 'percentage' ? "text-white opacity-75 hover:opacity-100" : undefined} />
              </button>
              <button type="button" onClick={() => handleInputChange('reinvestmentMode', 'above_threshold')} className={`${buttonClass('above_threshold', reinvestmentMode)} rounded-r-md`}>
                {t('reinvestAbove')}
                <Tooltip content={t('tooltipReinvestAbove')} iconClassName={reinvestmentMode === 'above_threshold' ? "text-white opacity-75 hover:opacity-100" : undefined} />
              </button>
            </div>
            
            {reinvestmentMode === 'amount' && (
              <div>
                <label htmlFor="reinvestmentValue" className="block text-sm font-medium text-gray-300 mb-2">{t('reinvestValueMonthly')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                  <input
                    type="number"
                    id="reinvestmentValue"
                    value={formState.reinvestmentValue}
                    onChange={(e) => handleInputChange('reinvestmentValue', Number(e.target.value))}
                    className="w-full bg-gray-900 border border-dark-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300 focus:shadow-lg focus:shadow-brand-primary/20"
                    min="0"
                    step="50"
                  />
                </div>
              </div>
            )}
            {reinvestmentMode === 'percentage' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="reinvestmentPercentage" className="text-sm font-medium text-gray-300">{t('reinvestPercentageLabel')}</label>
                    <span className="text-brand-primary font-semibold">{formState.reinvestmentPercentage}%</span>
                </div>
                <input
                    type="range"
                    id="reinvestmentPercentage"
                    value={formState.reinvestmentPercentage}
                    onChange={(e) => handleInputChange('reinvestmentPercentage', Number(e.target.value))}
                    className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer"
                    min="0"
                    max="100"
                    step="1"
                />
              </div>
            )}
            {reinvestmentMode === 'above_threshold' && (
              <div>
                <label htmlFor="reinvestmentThreshold" className="block text-sm font-medium text-gray-300 mb-2">{t('reinvestAboveThresholdLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                  <input
                    type="number"
                    id="reinvestmentThreshold"
                    value={formState.reinvestmentThreshold}
                    onChange={(e) => handleInputChange('reinvestmentThreshold', Number(e.target.value))}
                    className="w-full bg-gray-900 border border-dark-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300 focus:shadow-lg focus:shadow-brand-primary/20"
                    min="0"
                    step="50"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                   {t('estimatedMonthlyIncome')}: {formatCurrency(estimatedMonthlyInterest)}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400">{t('reinvestmentHelpText')}</p>
          </div>
        )}
        
        {/* Years */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="years" className="text-sm font-medium text-gray-300">{t('periodYears')}</label>
                <span className="text-brand-primary font-semibold">{years} {years > 1 ? t('years') : t('year')}</span>
            </div>
            <input
                type="range"
                id="years"
                value={years}
                onChange={(e) => handleInputChange('years', Number(e.target.value))}
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer"
                min="1"
                max="40"
                step="1"
            />
        </div>

        <div className="flex gap-4 pt-2">
            <button 
                type="button" 
                onClick={handleReset}
                className="w-full bg-gray-600 hover:bg-gray-500 text-gray-200 font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100"
            >
                {t('reset')}
            </button>
        </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #f97316;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #ffedd5;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        input[type=range]:hover::-webkit-slider-thumb {
          transform: scale(1.1);
          box-shadow: 0 0 10px #f97316, 0 0 5px #ffedd5;
        }

        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #f97316;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #ffedd5;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        input[type=range]:hover::-moz-range-thumb {
          transform: scale(1.1);
          box-shadow: 0 0 10px #f97316, 0 0 5px #ffedd5;
        }
        
        .form-checkbox:checked {
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
