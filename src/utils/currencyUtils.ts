import type { Asset } from "../types/fire";

// Default fallback conversion rate
const DEFAULT_USD_TO_NZD = 1.65;

/**
 * Fetches the current USD to NZD exchange rate from an API
 */
export async function fetchExchangeRate(): Promise<{ rate: number; timestamp: string }> {
  try {
    // Using exchangerate-api.com free tier (1500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();

    if (data.rates && data.rates.NZD) {
      return {
        rate: data.rates.NZD,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    // Return default rate if fetch fails
    return {
      rate: DEFAULT_USD_TO_NZD,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gets the current exchange rate, using stored rate or default
 */
export function getExchangeRate(storedRate?: number): number {
  return storedRate || DEFAULT_USD_TO_NZD;
}

/**
 * Converts an asset's value to the target currency
 */
export function convertAssetValue(asset: Asset, targetCurrency: string, exchangeRate?: number): number {
  const assetCurrency = asset.stockCurrency || "NZD";
  const rate = getExchangeRate(exchangeRate);

  if (assetCurrency === targetCurrency) {
    return asset.value;
  }

  if (assetCurrency === "USD" && targetCurrency === "NZD") {
    return asset.value * rate;
  }

  if (assetCurrency === "NZD" && targetCurrency === "USD") {
    return asset.value / rate;
  }

  // Default to original value if conversion not supported
  return asset.value;
}

/**
 * Gets the total assets value in the target currency
 */
export function getTotalAssetsInCurrency(assets: Asset[], targetCurrency: string, exchangeRate?: number): number {
  return assets.reduce((sum, asset) => {
    return sum + convertAssetValue(asset, targetCurrency, exchangeRate);
  }, 0);
}

/**
 * Converts contribution amounts to target currency for calculations
 */
export function convertContributionToCurrency(
  amount: number,
  fromCurrency: string,
  targetCurrency: string,
  exchangeRate?: number
): number {
  const rate = getExchangeRate(exchangeRate);

  if (fromCurrency === targetCurrency) {
    return amount;
  }

  if (fromCurrency === "USD" && targetCurrency === "NZD") {
    return amount * rate;
  }

  if (fromCurrency === "NZD" && targetCurrency === "USD") {
    return amount / rate;
  }

  return amount;
}