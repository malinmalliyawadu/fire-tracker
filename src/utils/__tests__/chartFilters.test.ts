import { describe, it, expect } from 'vitest';
import { filterAssets, filterLiabilities, hasActiveFilters, getFilterSummary } from '../chartFilters';
import type { Asset, Liability } from '../../types/fire';
import type { ChartFilters } from '../chartFilters';

describe('chartFilters', () => {
  const mockAssets: Asset[] = [
    {
      id: '1',
      name: 'Stock A',
      type: 'individual-stock',
      accountType: 'investment',
      value: 10000,
      contributions: 100,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
    {
      id: '2',
      name: 'KiwiSaver',
      type: 'kiwisaver',
      accountType: 'kiwisaver',
      value: 20000,
      contributions: 200,
      contributionFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
    {
      id: '3',
      name: 'Bitcoin',
      type: 'bitcoin',
      accountType: 'investment',
      value: 5000,
      quantity: 0.1,
      contributions: 50,
      contributionFrequency: 'weekly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
  ];

  const mockLiabilities: Liability[] = [
    {
      id: '1',
      name: 'Home Mortgage',
      type: 'mortgage',
      balance: 300000,
      interestRate: 5.19,
      minimumPayment: 1500,
      paymentFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
    {
      id: '2',
      name: 'Car Loan',
      type: 'car-loan',
      balance: 20000,
      interestRate: 7,
      minimumPayment: 500,
      paymentFrequency: 'monthly',
      dateAdded: '2024-01-01',
      lastUpdated: '2024-01-01',
    },
  ];

  describe('filterAssets', () => {
    it('should return all assets when no filters are applied', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterAssets(mockAssets, filters);
      expect(result).toEqual(mockAssets);
    });

    it('should filter by asset types', () => {
      const filters: ChartFilters = {
        assetTypes: ['individual-stock', 'bitcoin'],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterAssets(mockAssets, filters);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('individual-stock');
      expect(result[1].type).toBe('bitcoin');
    });

    it('should filter by specific assets', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: ['2'],
        selectedLiabilities: [],
      };

      const result = filterAssets(mockAssets, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return empty array when liability filters are active but no asset filters', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: ['mortgage'],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterAssets(mockAssets, filters);
      expect(result).toEqual([]);
    });

    it('should combine asset type and specific asset filters', () => {
      const filters: ChartFilters = {
        assetTypes: ['individual-stock', 'kiwisaver'],
        liabilityTypes: [],
        selectedAssets: ['1'],
        selectedLiabilities: [],
      };

      const result = filterAssets(mockAssets, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('filterLiabilities', () => {
    it('should return all liabilities when no filters are applied', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterLiabilities(mockLiabilities, filters);
      expect(result).toEqual(mockLiabilities);
    });

    it('should filter by liability types', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: ['mortgage'],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterLiabilities(mockLiabilities, filters);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('mortgage');
    });

    it('should return empty array when asset filters are active but no liability filters', () => {
      const filters: ChartFilters = {
        assetTypes: ['individual-stock'],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      const result = filterLiabilities(mockLiabilities, filters);
      expect(result).toEqual([]);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters are active', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when any filter is active', () => {
      const filters: ChartFilters = {
        assetTypes: ['individual-stock'],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getFilterSummary', () => {
    it('should return empty string when no filters are active', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: [],
      };

      expect(getFilterSummary(filters)).toBe('');
    });

    it('should summarize active filters', () => {
      const filters: ChartFilters = {
        assetTypes: ['individual-stock', 'bitcoin'],
        liabilityTypes: ['mortgage'],
        selectedAssets: ['1'],
        selectedLiabilities: [],
      };

      const summary = getFilterSummary(filters);
      expect(summary).toContain('2 asset types');
      expect(summary).toContain('1 liability type');
      expect(summary).toContain('1 asset');
    });

    it('should handle plural forms correctly', () => {
      const filters: ChartFilters = {
        assetTypes: [],
        liabilityTypes: [],
        selectedAssets: [],
        selectedLiabilities: ['1', '2'],
      };

      const summary = getFilterSummary(filters);
      expect(summary).toContain('2 liabilities');
    });
  });
});