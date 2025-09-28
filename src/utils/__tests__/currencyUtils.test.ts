import { describe, it, expect } from 'vitest';
import { convertAssetValue, getTotalAssetsInCurrency, convertContributionToCurrency } from '../currencyUtils';
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
      expect(result).toBe(3050); // 5000 * 0.61
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
      // NZD assets: 5000 * 0.61 = 3050
      // Total: 6050
      expect(result).toBe(6050);
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
      expect(result).toBe(61); // 100 * 0.61
    });

    it('should return original amount for unsupported conversions', () => {
      const result = convertContributionToCurrency(100, 'EUR', 'GBP');
      expect(result).toBe(100);
    });
  });
});