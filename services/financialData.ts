
export interface FinancialIndicators {
  cdi: number;
  ipca: number;
  lastUpdate: string;
}

const CACHE_KEY = 'financial_indicators_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const DEFAULT_INDICATORS: FinancialIndicators = {
    cdi: 10.65,
    ipca: 4.50,
    lastUpdate: new Date().toISOString(),
};

export const fetchIndicators = async (): Promise<FinancialIndicators> => {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            return parsed.data;
        }
    } catch (e) {
        console.error("Error parsing cache", e);
        localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    // Fetch CDI from BrasilAPI
    const cdiPromise = fetch('https://brasilapi.com.br/api/taxas/v1')
        .then(async res => {
            if (!res.ok) throw new Error('BrasilAPI Error');
            const data = await res.json();
            if (!Array.isArray(data)) return undefined;
            const item = data.find((d: any) => d.nome === 'CDI' || d.nome === 'Selic');
            return item ? parseFloat(item.valor) : undefined;
        })
        .catch(err => {
            console.warn('Failed to fetch CDI', err);
            return undefined;
        });

    // Fetch IPCA (12m accumulated) from BCB
    // Series 13522: IPCA - Acumulado 12 meses
    const ipcaPromise = fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json')
        .then(async res => {
            if (!res.ok) throw new Error('BCB API Error');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return parseFloat(data[0].valor);
            }
            return undefined;
        })
        .catch(err => {
            console.warn('Failed to fetch IPCA', err);
            return undefined;
        });

    const [cdi, ipca] = await Promise.all([cdiPromise, ipcaPromise]);

    const result: FinancialIndicators = {
      cdi: cdi ?? DEFAULT_INDICATORS.cdi,
      ipca: ipca ?? DEFAULT_INDICATORS.ipca,
      lastUpdate: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: result
    }));

    return result;
  } catch (error) {
    console.warn('Error fetching financial indicators, using fallbacks:', error);
    return DEFAULT_INDICATORS;
  }
};
