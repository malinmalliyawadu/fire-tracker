import type { Asset } from "../types/fire";

// Simple demo conversion rates - in production these would come from live API
const CONVERSION_RATES = {
  USD_TO_NZD: 1.65,
  NZD_TO_USD: 0.61,
};

/**
 * Converts an asset's value to the target currency
 */
export function convertAssetValue(asset: Asset, targetCurrency: string): number {
  const assetCurrency = asset.stockCurrency || "NZD";

  if (assetCurrency === targetCurrency) {
    return asset.value;
  }

  if (assetCurrency === "USD" && targetCurrency === "NZD") {
    return asset.value * CONVERSION_RATES.USD_TO_NZD;
  }

  if (assetCurrency === "NZD" && targetCurrency === "USD") {
    return asset.value * CONVERSION_RATES.NZD_TO_USD;
  }

  // Default to original value if conversion not supported
  return asset.value;
}

/**
 * Gets the total assets value in the target currency
 */
export function getTotalAssetsInCurrency(assets: Asset[], targetCurrency: string): number {
  return assets.reduce((sum, asset) => {
    return sum + convertAssetValue(asset, targetCurrency);
  }, 0);
}

/**
 * Converts contribution amounts to target currency for calculations
 */
export function convertContributionToCurrency(
  amount: number,
  fromCurrency: string,
  targetCurrency: string
): number {
  if (fromCurrency === targetCurrency) {
    return amount;
  }

  if (fromCurrency === "USD" && targetCurrency === "NZD") {
    return amount * CONVERSION_RATES.USD_TO_NZD;
  }

  if (fromCurrency === "NZD" && targetCurrency === "USD") {
    return amount * CONVERSION_RATES.NZD_TO_USD;
  }

  return amount;
}