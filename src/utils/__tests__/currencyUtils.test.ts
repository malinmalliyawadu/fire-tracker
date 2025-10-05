import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertAssetValue, getTotalAssetsInCurrency, convertContributionToCurrency, fetchExchangeRate, getExchangeRate } from '../currencyUtils';
import type { Asset } from '../../types/fire';

describe('currencyUtils', () => {
  const mockAssets: Asset[] = [
    {
      id: '1',
      name: 'USD Stock',
      type: 'individual-stock',
      accountType: 'investment',
      value: 1000,
      stockCurrency: 'USD',
      contributions: 100,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
    {
      id: '2',
      name: 'NZD Savings',
      type: 'savings-account',
      accountType: 'savings',
      value: 5000,
      contributions: 200,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
    {
      id: '3',
      name: 'Another USD Asset',
      type: 'individual-stock',
      accountType: 'investment',
      value: 2000,
      stockCurrency: 'USD',
      contributions: 150,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
  ];

  describe('convertAssetValue', () => {
    it('should return same value when currencies match', () => {
      const result = convertAssetValue(mockAssets[0], 'USD');
      expect(result).toBe(1000);
    });

    it('should convert USD to NZD', () => {
      const result = convertAssetValue(mockAssets[0], 'NZD');
      expect(result).toBe(1650); // 1000 * 1.65
    });

    it('should convert NZD to USD', () => {
      const result = convertAssetValue(mockAssets[1], 'USD');
      expect(result).toBeCloseTo(3030.30, 2); // 5000 / 1.65
    });

    it('should handle assets without stockCurrency (default to NZD)', () => {
      const result = convertAssetValue(mockAssets[1], 'NZD');
      expect(result).toBe(5000);
    });

    it('should return original value for unsupported conversions', () => {
      const mockAsset = { ...mockAssets[0], stockCurrency: 'EUR' };
      const result = convertAssetValue(mockAsset as Asset, 'NZD');
      expect(result).toBe(1000);
    });
  });

  describe('getTotalAssetsInCurrency', () => {
    it('should sum all assets in NZD', () => {
      const result = getTotalAssetsInCurrency(mockAssets, 'NZD');
      // USD assets: (1000 + 2000) * 1.65 = 4950
      // NZD assets: 5000
      // Total: 9950
      expect(result).toBe(9950);
    });

    it('should sum all assets in USD', () => {
      const result = getTotalAssetsInCurrency(mockAssets, 'USD');
      // USD assets: 1000 + 2000 = 3000
      // NZD assets: 5000 / 1.65 = 3030.30
      // Total: 6030.30
      expect(result).toBeCloseTo(6030.30, 2);
    });

    it('should handle empty asset array', () => {
      const result = getTotalAssetsInCurrency([], 'NZD');
      expect(result).toBe(0);
    });
  });

  describe('convertContributionToCurrency', () => {
    it('should return same amount when currencies match', () => {
      const result = convertContributionToCurrency(100, 'NZD', 'NZD');
      expect(result).toBe(100);
    });

    it('should convert USD to NZD', () => {
      const result = convertContributionToCurrency(100, 'USD', 'NZD');
      expect(result).toBe(165); // 100 * 1.65
    });

    it('should convert NZD to USD', () => {
      const result = convertContributionToCurrency(100, 'NZD', 'USD');
      expect(result).toBeCloseTo(60.61, 2); // 100 / 1.65
    });

    it('should return original amount for unsupported conversions', () => {
      const result = convertContributionToCurrency(100, 'EUR', 'GBP');
      expect(result).toBe(100);
    });
  });

  describe('fetchExchangeRate', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and return exchange rate successfully', async () => {
      const mockResponse = {
        rates: {
          NZD: 1.68
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await fetchExchangeRate();

      expect(result.rate).toBe(1.68);
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return default rate when API response is invalid', async () => {
      const mockResponse = {
        rates: {} // Missing NZD
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await fetchExchangeRate();

      expect(result.rate).toBe(1.65); // Default rate
      expect(result.timestamp).toBeDefined();
    });

    it('should return default rate when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchExchangeRate();

      expect(result.rate).toBe(1.65); // Default rate
      expect(result.timestamp).toBeDefined();
    });

    it('should call the correct API endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ rates: { NZD: 1.65 } })
      });
      global.fetch = mockFetch;

      await fetchExchangeRate();

      expect(mockFetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD');
    });
  });

  describe('getExchangeRate', () => {
    it('should return stored rate when provided', () => {
      const result = getExchangeRate(1.75);
      expect(result).toBe(1.75);
    });

    it('should return default rate when no rate is provided', () => {
      const result = getExchangeRate();
      expect(result).toBe(1.65);
    });

    it('should return default rate when undefined is provided', () => {
      const result = getExchangeRate(undefined);
      expect(result).toBe(1.65);
    });
  });

  describe('convertAssetValue with custom exchange rate', () => {
    const mockAsset: Asset = {
      id: '1',
      name: 'USD Stock',
      type: 'individual-stock',
      accountType: 'investment',
      value: 1000,
      stockCurrency: 'USD',
      contributions: 100,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    };

    it('should use custom exchange rate when provided', () => {
      const result = convertAssetValue(mockAsset, 'NZD', 1.75);
      expect(result).toBe(1750); // 1000 * 1.75
    });

    it('should use default rate when no custom rate provided', () => {
      const result = convertAssetValue(mockAsset, 'NZD');
      expect(result).toBe(1650); // 1000 * 1.65 (default)
    });

    it('should use custom rate for NZD to USD conversion', () => {
      const nzdAsset = { ...mockAsset, stockCurrency: undefined, value: 1750 };
      const result = convertAssetValue(nzdAsset as Asset, 'USD', 1.75);
      expect(result).toBe(1000); // 1750 / 1.75
    });
  });

  describe('getTotalAssetsInCurrency with custom exchange rate', () => {
    it('should use custom exchange rate for total calculation', () => {
      const result = getTotalAssetsInCurrency(mockAssets, 'NZD', 1.75);
      // USD assets: (1000 + 2000) * 1.75 = 5250
      // NZD assets: 5000
      // Total: 10250
      expect(result).toBe(10250);
    });

    it('should use default rate when no custom rate provided', () => {
      const result = getTotalAssetsInCurrency(mockAssets, 'NZD');
      // USD assets: (1000 + 2000) * 1.65 = 4950
      // NZD assets: 5000
      // Total: 9950
      expect(result).toBe(9950);
    });
  });

  describe('convertContributionToCurrency with custom exchange rate', () => {
    it('should use custom exchange rate for USD to NZD', () => {
      const result = convertContributionToCurrency(100, 'USD', 'NZD', 1.80);
      expect(result).toBe(180); // 100 * 1.80
    });

    it('should use custom exchange rate for NZD to USD', () => {
      const result = convertContributionToCurrency(180, 'NZD', 'USD', 1.80);
      expect(result).toBe(100); // 180 / 1.80
    });

    it('should use default rate when no custom rate provided', () => {
      const result = convertContributionToCurrency(100, 'USD', 'NZD');
      expect(result).toBe(165); // 100 * 1.65
    });
  });
});