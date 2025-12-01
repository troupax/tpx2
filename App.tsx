
import React, { useState, useCallback } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { calculateCompoundInterest } from './services/investmentCalculator';
import type { SimulationInput, SimulationResult } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LandingPage } from './components/LandingPage';

const App: React.FC = () => {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showLanding, setShowLanding] = useState(true);

  const handleCalculate = useCallback((inputs: SimulationInput) => {
    const result = calculateCompoundInterest(inputs);
    setSimulationResult(result);
  }, []);

  const handleClear = useCallback(() => {
    setSimulationResult(null);
  }, []);

  const handleStart = useCallback(() => {
    setShowLanding(false);
  }, []);

  return (
    <LocalizationProvider>
      <AnimatedBackground />
      <div className="min-h-screen text-gray-200 font-sans flex flex-col relative z-10">
        <Header />
        {showLanding ? (
          <LandingPage onStart={handleStart} />
        ) : (
          <main className="flex-grow container mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <CalculatorForm onCalculate={handleCalculate} onClear={handleClear} />
              </div>
              <div className="lg:col-span-8">
                <ResultsDisplay data={simulationResult} />
              </div>
            </div>
          </main>
        )}
        <Footer />
      </div>
    </LocalizationProvider>
  );
};

export default App;
