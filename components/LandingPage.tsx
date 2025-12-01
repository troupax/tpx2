
import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

interface LandingPageProps {
  onStart: () => void;
}

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => {
    return (
        <div className="bg-dark-card/50 border border-dark-border p-6 rounded-lg text-center flex flex-col items-center transform transition-transform duration-300 hover:scale-105 hover:border-brand-primary">
            <div className="text-brand-primary mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useLocalization();

  return (
    <main className="flex-grow container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
          <span className="text-brand-primary">{t('landingTitle')}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          {t('landingSubtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <FeatureCard 
                title={t('feature1Title')}
                description={t('feature1Desc')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
            <FeatureCard 
                title={t('feature2Title')}
                description={t('feature2Desc')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
            />
             <FeatureCard 
                title={t('feature3Title')}
                description={t('feature3Desc')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            />
        </div>

        <button
          onClick={onStart}
          className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100 shadow-lg text-xl"
        >
          {t('landingCTA')}
        </button>
      </div>
    </main>
  );
};