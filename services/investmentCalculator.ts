
import type { SimulationInput, SimulationResult, YearlyData, EventLogItem } from '../types';
import { round } from '../utils';

const calculateCompound = (inputs: SimulationInput): SimulationResult => {
  const { initialInvestment, monthlyContribution, annualInterestRate, years } = inputs;
  const yearlyData: YearlyData[] = [];
  const monthlyRate = annualInterestRate / 100 / 12;
  const months = years * 12;

  let currentBalance = initialInvestment;

  for (let m = 1; m <= months; m++) {
    currentBalance += monthlyContribution;
    currentBalance *= (1 + monthlyRate);

    if (m % 12 === 0 || m === months) {
      const year = Math.ceil(m / 12);
      const currentTotalInvested = initialInvestment + (monthlyContribution * m);
      const interestGains = currentBalance - currentTotalInvested;
      yearlyData.push({
        year,
        totalInvested: round(currentTotalInvested),
        interestGains: round(interestGains),
        finalBalance: round(currentBalance),
      });
    }
  }

  const finalTotalInvested = initialInvestment + monthlyContribution * months;
  const finalBalance = currentBalance;
  const totalInterest = finalBalance - finalTotalInvested;

  return {
    yearlyData,
    summary: {
      totalInvested: round(finalTotalInvested),
      totalInterest: round(totalInterest),
      finalBalance: round(finalBalance),
    },
    investmentType: 'compound',
    annualInterestRate,
  };
};

const calculateFixedIncome = (inputs: SimulationInput): SimulationResult => {
    const { initialInvestment, annualInterestRate, years, reinvestmentValue = 0, reinvestmentPercentage = 0, reinvestmentMode = 'amount', reinvestmentThreshold = 0 } = inputs;
    const yearlyData: YearlyData[] = [];
    const monthlyRate = annualInterestRate / 100 / 12;
    const months = years * 12;
  
    let currentBalance = initialInvestment;
    const totalInvested = initialInvestment;
    let lastMonthlyPayout = 0;
  
    for (let m = 1; m <= months; m++) {
      const interestForMonth = currentBalance * monthlyRate;
  
      let reinvestAmount = 0;
      if (reinvestmentMode === 'percentage') {
        reinvestAmount = interestForMonth * (reinvestmentPercentage / 100);
      } else if (reinvestmentMode === 'above_threshold') {
        reinvestAmount = Math.max(0, interestForMonth - reinvestmentThreshold);
      } else { // 'amount' mode
        reinvestAmount = Math.min(interestForMonth, reinvestmentValue);
      }
      
      reinvestAmount = round(reinvestAmount);
      lastMonthlyPayout = interestForMonth - reinvestAmount;
      
      currentBalance += reinvestAmount;
  
      if (m % 12 === 0 || m === months) {
        const year = Math.ceil(m / 12);
        const interestGainsForYear = currentBalance - totalInvested;
        yearlyData.push({
          year,
          totalInvested: round(totalInvested),
          interestGains: round(interestGainsForYear),
          finalBalance: round(currentBalance),
          monthlyIncome: round(lastMonthlyPayout),
        });
      }
    }
  
    const finalInterestGains = currentBalance - totalInvested;

    return {
      yearlyData,
      summary: {
        totalInvested: round(totalInvested),
        totalInterest: round(finalInterestGains),
        finalBalance: round(currentBalance),
        monthlyIncome: round(lastMonthlyPayout),
        reinvestmentValue: reinvestmentMode === 'amount' ? reinvestmentValue : undefined,
        reinvestmentPercentage: reinvestmentMode === 'percentage' ? reinvestmentPercentage : undefined,
        reinvestmentThreshold: reinvestmentMode === 'above_threshold' ? reinvestmentThreshold : undefined,
      },
      investmentType: 'fixed',
      annualInterestRate,
    };
  };

const calculateMixed = (inputs: SimulationInput): SimulationResult => {
    const { years, switchToFixedYear = 1, mixedInvestmentOrder = 'compound_first', enableSplit = false, splitMode = 'percentage', splitValue = 0, splitPercentage = 100, annualInterestRate, annualInterestRatePhase2 } = inputs;
    const eventLog: EventLogItem[] = [];

    const phase1Years = switchToFixedYear;
    const phase2Years = years - switchToFixedYear;

    const phase1Type = mixedInvestmentOrder === 'compound_first' ? 'compound' : 'fixed';
    const phase2Type = mixedInvestmentOrder === 'compound_first' ? 'fixed' : 'compound';
    const phase1TypeKey = phase1Type === 'compound' ? 'compoundInterest' : 'fixedIncome';
    const phase2TypeKey = phase2Type === 'compound' ? 'compoundInterest' : 'fixedIncome';

    eventLog.push({ year: 0, type: 'start', titleKey: 'eventStartTitle', descriptionKey: 'eventStartDesc', descriptionValues: { amount: inputs.initialInvestment, type: phase1TypeKey }});

    const phase2Rate = annualInterestRatePhase2 ?? annualInterestRate;

    const phase1Contribution = phase1Type === 'compound' ? inputs.monthlyContribution : 0;
    const phase2Contribution = phase2Type === 'compound' ? inputs.monthlyContribution : 0;
    
    const phase1Result = calculateCompoundInterest({
      ...inputs,
      years: phase1Years,
      monthlyContribution: phase1Contribution,
      investmentType: phase1Type,
    });

    if (phase2Years <= 0) {
        eventLog.push({ year: years, type: 'end', titleKey: 'eventEndTitle', descriptionKey: 'eventEndDesc', descriptionValues: { amount: phase1Result.summary.finalBalance }});
        return { ...phase1Result, eventLog, investmentType: 'mixed', switchToFixedYear, mixedInvestmentOrder, enableSplit, splitMode, splitValue, splitPercentage, annualInterestRate, annualInterestRatePhase2 };
    }
    
    eventLog.push({ year: switchToFixedYear, type: 'switch', titleKey: 'eventSwitchTitle', descriptionKey: 'eventSwitchDesc', descriptionValues: { fromType: phase1TypeKey, toType: phase2TypeKey }});

    const balanceAtSwitch = phase1Result.summary.finalBalance;
    const totalInvestedAtSwitch = phase1Result.summary.totalInvested;

    let isActualSplit = false;
    if (enableSplit) {
        if (splitMode === 'amount') {
            isActualSplit = splitValue > 0 && splitValue < balanceAtSwitch;
        } else { // percentage
            isActualSplit = splitPercentage > 0 && splitPercentage < 100;
        }
    }

    if (isActualSplit) {
        let migratedBalance = 0;
        let retainedBalance = 0;
        let retainedPercentage = 0;

        if (splitMode === 'amount') {
            migratedBalance = splitValue;
            retainedBalance = balanceAtSwitch - splitValue;
            retainedPercentage = (retainedBalance / balanceAtSwitch) * 100;
        } else { // percentage mode
            migratedBalance = balanceAtSwitch * (splitPercentage / 100);
            retainedBalance = balanceAtSwitch * (1 - splitPercentage / 100);
            retainedPercentage = 100 - splitPercentage;
        }

        eventLog.push({ year: switchToFixedYear, type: 'split', titleKey: 'eventSplitTitle', descriptionKey: 'eventSplitDesc', descriptionValues: { 
            migratedAmount: migratedBalance, migratedPercentage: splitPercentage, toType: phase2TypeKey,
            retainedAmount: retainedBalance, retainedPercentage: retainedPercentage, fromType: phase1TypeKey,
        }});

        const migratedResult = calculateCompoundInterest({
            ...inputs,
            initialInvestment: migratedBalance,
            years: phase2Years,
            monthlyContribution: phase2Contribution,
            investmentType: phase2Type,
            annualInterestRate: phase2Rate,
        });
        const retainedResult = calculateCompoundInterest({
            ...inputs,
            initialInvestment: retainedBalance,
            years: phase2Years,
            monthlyContribution: 0, 
            investmentType: phase1Type,
            annualInterestRate: annualInterestRate, 
        });

        const combinedYearlyData: YearlyData[] = [...phase1Result.yearlyData];
        for(let i = 0; i < phase2Years; i++) {
            const retainedData = retainedResult.yearlyData[i];
            const migratedData = migratedResult.yearlyData[i];
            
            const totalFinalBalance = retainedData.finalBalance + migratedData.finalBalance;
            const contributionsThisPhase = phase2Contribution * 12 * (i + 1);
            const currentTotalInvested = totalInvestedAtSwitch + contributionsThisPhase;
            const totalInterest = totalFinalBalance - currentTotalInvested;

            const getMonthlyIncome = () => {
              let income = 0;
              if (phase1Type === 'fixed' && retainedData.monthlyIncome) income += retainedData.monthlyIncome;
              if (phase2Type === 'fixed' && migratedData.monthlyIncome) income += migratedData.monthlyIncome;
              return income > 0 ? income : undefined;
            }

            combinedYearlyData.push({
                year: phase1Years + i + 1,
                totalInvested: round(currentTotalInvested),
                interestGains: round(totalInterest),
                finalBalance: round(totalFinalBalance),
                monthlyIncome: getMonthlyIncome() ? round(getMonthlyIncome()!) : undefined,
                retainedBalance: retainedData.finalBalance,
                migratedBalance: migratedData.finalBalance,
            });
        }
        
        const lastData = combinedYearlyData[combinedYearlyData.length - 1];
        eventLog.push({ year: years, type: 'end', titleKey: 'eventEndTitle', descriptionKey: 'eventEndDesc', descriptionValues: { amount: lastData.finalBalance }});

        return {
            yearlyData: combinedYearlyData,
            summary: {
                totalInvested: lastData.totalInvested,
                totalInterest: lastData.interestGains,
                finalBalance: lastData.finalBalance,
                monthlyIncome: lastData.monthlyIncome,
                initialRetainedBalance: retainedBalance,
                initialMigratedBalance: migratedBalance,
            },
            eventLog,
            investmentType: 'mixed',
            annualInterestRate,
            annualInterestRatePhase2,
            switchToFixedYear, 
            mixedInvestmentOrder, 
            enableSplit, 
            splitPercentage: splitMode === 'percentage' ? splitPercentage : undefined,
            splitValue: splitMode === 'amount' ? splitValue : undefined,
            splitMode,
        }
    }

    const phase2Result = calculateCompoundInterest({
        ...inputs,
        initialInvestment: balanceAtSwitch,
        years: phase2Years,
        monthlyContribution: phase2Contribution,
        investmentType: phase2Type,
        annualInterestRate: phase2Rate,
    });
    
    const combinedYearlyData = [
        ...phase1Result.yearlyData,
        ...phase2Result.yearlyData.map(data => {
            const contributionsThisPhase = phase2Contribution * 12 * data.year;
            const currentTotalInvested = totalInvestedAtSwitch + contributionsThisPhase;
            return {
                ...data,
                year: data.year + phase1Years,
                totalInvested: round(currentTotalInvested),
                interestGains: round(data.finalBalance - currentTotalInvested),
            };
        })
    ];
    const lastDataFull = combinedYearlyData[combinedYearlyData.length-1];

    eventLog.push({ year: years, type: 'end', titleKey: 'eventEndTitle', descriptionKey: 'eventEndDesc', descriptionValues: { amount: lastDataFull.finalBalance }});

    return {
        yearlyData: combinedYearlyData,
        summary: {
            totalInvested: lastDataFull.totalInvested,
            totalInterest: lastDataFull.interestGains,
            finalBalance: lastDataFull.finalBalance,
            monthlyIncome: phase2Result.summary.monthlyIncome,
        },
        eventLog,
        investmentType: 'mixed',
        annualInterestRate,
        annualInterestRatePhase2,
        switchToFixedYear, 
        mixedInvestmentOrder, 
        enableSplit, 
        splitPercentage: splitMode === 'percentage' ? splitPercentage : undefined,
        splitValue: splitMode === 'amount' ? splitValue : undefined,
        splitMode,
    };
};

export const calculateCompoundInterest = (inputs: SimulationInput): SimulationResult => {
    switch(inputs.investmentType) {
        case 'fixed':
            return calculateFixedIncome(inputs);
        case 'mixed':
            return calculateMixed(inputs);
        case 'compound':
        default:
            return calculateCompound(inputs);
    }
};