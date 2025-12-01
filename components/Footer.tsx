import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

export const Footer: React.FC = () => {
    const { t } = useLocalization();
    const email = 'troupax@gmail.com';
    return (
        <footer className="bg-dark-card mt-8">
            <div className="container mx-auto py-4 px-4 md:px-8 text-center text-gray-500 text-sm">
                <p>{t('footerRights')}</p>
                <p className="mt-1">{t('footerSlogan')}</p>
                <p className="mt-2">
                    {t('footerContactPrefix')}{' '}
                    <a href={`mailto:${email}`} className="text-brand-secondary hover:text-brand-primary hover:underline">
                        {email}
                    </a>
                </p>
            </div>
        </footer>
    );
};