interface ExchangeRateResponse {
  conversion_rates: {
    [currency: string]: number;
  };
}

class CurrencyService {
  private cache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly API_KEY = 'YOUR_API_KEY'; // Replace with actual API key

  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}-${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      // Using ExchangeRate-API (free tier available)
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${this.API_KEY}/latest/${from}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
      }

      const data: ExchangeRateResponse = await response.json();
      const rate = data.conversion_rates[to];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${from} to ${to}`);
      }

      // Cache the result
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);

      // Fallback to approximate rate if API fails
      if (from === 'USD' && to === 'NZD') {
        return 1.65; // Fallback approximate rate
      }
      if (from === 'NZD' && to === 'USD') {
        return 0.61; // Fallback approximate rate
      }

      return 1; // Default to 1:1 if no fallback available
    }
  }

  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  // For development/demo without API key
  async getExchangeRateDemo(from: string, to: string): Promise<number> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return demo exchange rates
    if (from === 'USD' && to === 'NZD') {
      return 1.65;
    }
    if (from === 'NZD' && to === 'USD') {
      return 0.61;
    }

    return 1;
  }

  async convertCurrencyDemo(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    const rate = await this.getExchangeRateDemo(from, to);
    return amount * rate;
  }
}

export const currencyService = new CurrencyService();

// Utility function to convert USD original values to NZD
export async function convertUSDToNZD(usdAmount: number): Promise<number> {
  return currencyService.convertCurrencyDemo(usdAmount, 'USD', 'NZD');
}

// Utility function to convert NZD values to USD
export async function convertNZDToUSD(nzdAmount: number): Promise<number> {
  return currencyService.convertCurrencyDemo(nzdAmount, 'NZD', 'USD');
}