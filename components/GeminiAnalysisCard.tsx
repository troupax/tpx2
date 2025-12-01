import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { SimulationResult } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

/**
 * A simple and safe markdown-to-HTML converter.
 * - Converts **bold** text to styled <h3> headers.
 * - Converts *italic* text to <em> tags.
 * - Wraps other lines in <p> tags for proper paragraph spacing.
 * @param text The raw markdown text from the API.
 * @returns An HTML string.
 */
const markdownToHtml = (text: string) => {
    return text
      .split('\n') // Split by newlines to process each line
      .map(line => line.trim()) // Trim whitespace
      .filter(line => line) // Remove empty lines
      .map(line => `<p>${line}</p>`) // Wrap each line in a paragraph tag
      .join('')
      // Replace paragraphs containing only bolded text with a styled header
      .replace(/<p>\*\*(.*?)\*\*<\/p>/g, '<h3 class="text-lg font-semibold text-brand-light mt-4 mb-2">$1</h3>')
      // Handle any remaining bold/italic formatting inside paragraphs
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

export const GeminiAnalysisCard: React.FC<{ data: SimulationResult }> = ({ data }) => {
    const { t, language, formatCurrency } = useLocalization();
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');

    const generatePrompt = useCallback(() => {
        const langMap = { pt: 'Português do Brasil', en: 'English' };
        const simulationTypeName = t(data.investmentType === 'compound' ? 'compoundInterest' : data.investmentType === 'fixed' ? 'fixedIncome' : 'mixedInvestment');
        const finalYear = data.yearlyData[data.yearlyData.length - 1]?.year;

        let details = `
- Simulation Type: ${simulationTypeName} for ${finalYear} years.
- Total Amount Invested (initial + contributions): ${formatCurrency(data.summary.totalInvested)}.
- Final Gross Balance: ${formatCurrency(data.summary.finalBalance)}.
- Total Earnings/Interest: ${formatCurrency(data.summary.totalInterest)}.
        `;

        if (data.investmentType === 'mixed') {
            const phase1Type = data.mixedInvestmentOrder === 'compound_first' ? t('compoundInterest') : t('fixedIncome');
            const phase2Type = data.mixedInvestmentOrder === 'compound_first' ? t('fixedIncome') : t('compoundInterest');
            details += `
- Mixed Strategy Details:
  - Phase 1 (${data.switchToFixedYear} years): ${phase1Type} at ${data.annualInterestRate}% rate.
  - Phase 2 (${finalYear - (data.switchToFixedYear || 0)} years): ${phase2Type} at ${data.annualInterestRatePhase2}% rate.
            `;
            if (data.enableSplit) {
                const splitDesc = data.splitMode === 'amount'
                    ? `${formatCurrency(data.summary.initialMigratedBalance || 0)} moved to Phase 2.`
                    : `${data.splitPercentage}% of capital moved to Phase 2.`;
                details += `  - Capital was split at transition: ${splitDesc}\n`;
            }
        } else {
             details += `- Annual Interest Rate: ${data.annualInterestRate}%\n`;
        }

        if (data.investmentType === 'fixed' || (data.investmentType === 'mixed' && data.summary.monthlyIncome)) {
            details += `- Monthly income at the end of the period: ${formatCurrency(data.summary.monthlyIncome || 0)}\n`;
        }
        
        const systemInstruction = `You are a financial advisor AI. Analyze the investment simulation data and provide clear, encouraging, and actionable insights. Use simple markdown with bold for headers. The entire response must be in ${langMap[language]}.`;
        const userPrompt = `
Please analyze this investment simulation:
${details}

Provide an analysis covering these points. Use the exact titles below in bold as headers for each section:
**Strengths of this Plan**
**Risks and Considerations**
**Suggestions for Optimization**
`;
        return { systemInstruction, userPrompt };
    }, [data, t, language, formatCurrency]);


    const handleAnalyze = async () => {
        setIsLoading(true);
        setError('');
        setAnalysis('');
        if (!process.env.API_KEY) {
            setError("API Key for Gemini not found. Please ensure it is configured.");
            setIsLoading(false);
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const { systemInstruction, userPrompt } = generatePrompt();

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            
            const text = response.text;
            if (text) {
                setAnalysis(markdownToHtml(text));
            } else {
                throw new Error("Empty response from AI.");
            }

        } catch (err) {
            console.error("Gemini API error:", err);
            setError(t('geminiAnalysisError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-dark-border">
            <h3 className="text-xl font-bold text-brand-primary mb-4 flex items-center">
                <SparklesIcon />
                {t('geminiAnalysisTitle')}
            </h3>
            
            {analysis ? (
                <div>
                  <div className="text-gray-300 space-y-2" dangerouslySetInnerHTML={{ __html: analysis }} />
                  <p className="text-xs text-gray-500 mt-4 italic">{t('geminiAnalysisDisclaimer')}</p>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center">
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full max-w-xs bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                <span className="ml-2">{t('geminiAnalyzing')}</span>
                            </>
                        ) : (
                            t('geminiAnalyzeButton')
                        )}
                    </button>
                 </div>
            )}
        </div>
    );
};
