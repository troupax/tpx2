import React from 'react';
import { EventLogItem } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface EventLogProps {
  log: EventLogItem[];
}

const icons: { [key in EventLogItem['type']]: React.ReactNode } = {
  start: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  switch: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  split: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10l7-7m0 0l-7 7m7-7v4m0 6l-7 7m7-7h-4" />
    </svg>
  ),
  end: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const iconColors: { [key in EventLogItem['type']]: string } = {
    start: 'bg-blue-500',
    switch: 'bg-purple-500',
    split: 'bg-pink-500',
    end: 'bg-green-500',
}

export const EventLog: React.FC<EventLogProps> = ({ log }) => {
  const { t, formatCurrency } = useLocalization();

  const formatDescription = (item: EventLogItem) => {
    let desc = t(item.descriptionKey);
    if (!item.descriptionValues) return desc;

    // Special handling for split percentage vs amount
    if(item.type === 'split' && typeof item.descriptionValues.migratedPercentage === 'undefined') {
        desc = t('eventSplitDescAmount');
    }

    Object.entries(item.descriptionValues).forEach(([key, value]) => {
      let formattedValue = value;
      if (typeof value === 'number') {
        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('retained') || key.toLowerCase().includes('migrated')) {
            formattedValue = formatCurrency(value);
        }
      }
      if (typeof value === 'string' && ['type', 'fromType', 'toType'].includes(key)) {
        formattedValue = t(value as any);
      }
      desc = desc.replace(`{${key}}`, String(formattedValue));
    });

    return desc;
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {log.map((item, eventIdx) => (
          <li key={eventIdx}>
            <div className="relative pb-8">
              {eventIdx !== log.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-dark-border" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`${iconColors[item.type]} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-dark-card text-white`}>
                    {icons[item.type]}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-300 font-semibold">{t(item.titleKey)}</p>
                    <p className="text-sm text-gray-400">{formatDescription(item)}</p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time>{t('chartYear')} {item.year}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};