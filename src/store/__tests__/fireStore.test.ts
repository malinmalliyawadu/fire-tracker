import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFireStore } from '../fireStore';
import * as currencyUtils from '../../utils/currencyUtils';

describe('fireStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFireStore.setState({
      assets: [],
      liabilities: [],
      settings: {
        fireTarget: 1000000,
        withdrawalRate: 0.04,
        expectedReturn: 0.07,
        inflationRate: 0.03,
        retirementAge: 65,
        currentAge: 30,
        currency: 'NZD',
      },
      history: [],
      milestones: [],
    });
  });

  describe('refreshExchangeRate', () => {
    it('should update settings with fetched exchange rate', async () => {
      const mockFetchExchangeRate = vi.spyOn(currencyUtils, 'fetchExchangeRate');
      mockFetchExchangeRate.mockResolvedValue({
        rate: 1.72,
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      const { refreshExchangeRate, settings } = useFireStore.getState();

      await refreshExchangeRate();

      const updatedSettings = useFireStore.getState().settings;

      expect(updatedSettings.usdToNzdRate).toBe(1.72);
      expect(updatedSettings.exchangeRateLastUpdated).toBe('2024-01-15T10:30:00.000Z');

      mockFetchExchangeRate.mockRestore();
    });

    it('should update exchange rate even when fetch fails (uses default)', async () => {
      const mockFetchExchangeRate = vi.spyOn(currencyUtils, 'fetchExchangeRate');
      mockFetchExchangeRate.mockResolvedValue({
        rate: 1.65, // Default rate
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      const { refreshExchangeRate } = useFireStore.getState();

      await refreshExchangeRate();

      const updatedSettings = useFireStore.getState().settings;

      expect(updatedSettings.usdToNzdRate).toBe(1.65);
      expect(updatedSettings.exchangeRateLastUpdated).toBeDefined();

      mockFetchExchangeRate.mockRestore();
    });

    it('should preserve other settings when updating exchange rate', async () => {
      const mockFetchExchangeRate = vi.spyOn(currencyUtils, 'fetchExchangeRate');
      mockFetchExchangeRate.mockResolvedValue({
        rate: 1.70,
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      const { refreshExchangeRate, settings } = useFireStore.getState();
      const originalFireTarget = settings.fireTarget;
      const originalCurrency = settings.currency;

      await refreshExchangeRate();

      const updatedSettings = useFireStore.getState().settings;

      expect(updatedSettings.fireTarget).toBe(originalFireTarget);
      expect(updatedSettings.currency).toBe(originalCurrency);
      expect(updatedSettings.usdToNzdRate).toBe(1.70);

      mockFetchExchangeRate.mockRestore();
    });
  });

  describe('getTotalAssets with exchange rate', () => {
    it('should use stored exchange rate when calculating total assets', () => {
      const { addAsset, updateSettings } = useFireStore.getState();

      // Set a custom exchange rate
      updateSettings({ usdToNzdRate: 1.80 });

      // Add USD asset
      addAsset({
        name: 'USD Stock',
        type: 'individual-stock',
        accountType: 'investment',
        value: 1000,
        stockCurrency: 'USD',
        contributions: 100,
        contributionFrequency: 'monthly',
      });

      // Add NZD asset
      addAsset({
        name: 'NZD Savings',
        type: 'savings-account',
        accountType: 'savings',
        value: 2000,
        contributions: 50,
        contributionFrequency: 'monthly',
      });

      const { getTotalAssets } = useFireStore.getState();
      const total = getTotalAssets();

      // USD: 1000 * 1.80 = 1800
      // NZD: 2000
      // Total: 3800
      expect(total).toBe(3800);
    });

    it('should use default rate when no custom rate is set', () => {
      const { addAsset } = useFireStore.getState();

      // Add USD asset
      addAsset({
        name: 'USD Stock',
        type: 'individual-stock',
        accountType: 'investment',
        value: 1000,
        stockCurrency: 'USD',
        contributions: 100,
        contributionFrequency: 'monthly',
      });

      const { getTotalAssets } = useFireStore.getState();
      const total = getTotalAssets();

      // USD: 1000 * 1.65 (default) = 1650
      expect(total).toBe(1650);
    });
  });

  describe('updateSettings', () => {
    it('should allow updating exchange rate settings', () => {
      const { updateSettings } = useFireStore.getState();

      updateSettings({
        usdToNzdRate: 1.75,
        exchangeRateLastUpdated: '2024-01-15T12:00:00.000Z',
      });

      const { settings } = useFireStore.getState();

      expect(settings.usdToNzdRate).toBe(1.75);
      expect(settings.exchangeRateLastUpdated).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should not affect other settings when updating exchange rate', () => {
      const { updateSettings, settings: initialSettings } = useFireStore.getState();

      updateSettings({
        usdToNzdRate: 1.75,
      });

      const { settings } = useFireStore.getState();

      expect(settings.fireTarget).toBe(initialSettings.fireTarget);
      expect(settings.currency).toBe(initialSettings.currency);
      expect(settings.usdToNzdRate).toBe(1.75);
    });
  });
});
