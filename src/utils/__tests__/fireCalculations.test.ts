import { describe, it, expect } from 'vitest';
import {
  calculateFIRENumber,
  calculateLeanFIRE,
  calculateFatFIRE,
  calculateCoastFIRE,
  calculateYearsToFIRE,
  calculateMonthlyContributionNeeded,
  calculateProgressPercentage,
  calculateFIREMetrics,
  generateProjection,
  convertToMonthlyContribution,
  formatCurrency,
  formatPercentage,
} from '../fireCalculations';
import type { Settings } from '../../types/fire';

describe('fireCalculations', () => {
  const mockSettings: Settings = {
    fireTarget: 1000000,
    withdrawalRate: 0.04,
    expectedReturn: 0.07,
    inflationRate: 0.03,
    retirementAge: 65,
    currentAge: 30,
    currency: 'NZD',
  };

  describe('calculateFIRENumber', () => {
    it('should return the FIRE target', () => {
      const result = calculateFIRENumber(mockSettings);
      expect(result).toBe(1000000);
    });
  });

  describe('calculateLeanFIRE', () => {
    it('should return 60% of FIRE target', () => {
      const result = calculateLeanFIRE(mockSettings);
      expect(result).toBe(600000);
    });
  });

  describe('calculateFatFIRE', () => {
    it('should return 150% of FIRE target', () => {
      const result = calculateFatFIRE(mockSettings);
      expect(result).toBe(1500000);
    });
  });

  describe('calculateCoastFIRE', () => {
    it('should calculate coast FIRE amount', () => {
      const result = calculateCoastFIRE(mockSettings);
      // 35 years to retirement, 4% real return
      // 1000000 / (1.04)^35 ≈ 253,416
      expect(result).toBeCloseTo(253416, -2);
    });
  });

  describe('calculateYearsToFIRE', () => {
    it('should calculate years to FIRE with positive contributions', () => {
      const result = calculateYearsToFIRE(
        100000, // current net worth
        5000,   // monthly contribution
        1000000, // fire target
        0.07,   // expected return
        30,     // current age
        65      // retirement age
      );
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(35);
    });

    it('should return 0 if already at FIRE target', () => {
      const result = calculateYearsToFIRE(
        1500000, // current net worth (above target)
        5000,    // monthly contribution
        1000000, // fire target
        0.07,    // expected return
        30,      // current age
        65       // retirement age
      );
      expect(result).toBe(0);
    });

    it('should return Infinity if no contributions', () => {
      const result = calculateYearsToFIRE(
        100000,  // current net worth
        0,       // no contributions
        1000000, // fire target
        0.07,    // expected return
        30,      // current age
        65       // retirement age
      );
      expect(result).toBe(Infinity);
    });
  });

  describe('calculateMonthlyContributionNeeded', () => {
    it('should calculate required monthly contribution', () => {
      const result = calculateMonthlyContributionNeeded(
        100000,  // current net worth
        1000000, // fire target
        20,      // years to FIRE
        0.07     // expected return
      );
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 if already at target', () => {
      const result = calculateMonthlyContributionNeeded(
        1500000, // current net worth (above target)
        1000000, // fire target
        20,      // years to FIRE
        0.07     // expected return
      );
      expect(result).toBe(0);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate progress percentage without baseline', () => {
      const result = calculateProgressPercentage(250000, 1000000);
      expect(result).toBe(25);
    });

    it('should cap at 100%', () => {
      const result = calculateProgressPercentage(1500000, 1000000);
      expect(result).toBe(100);
    });

    it('should handle negative net worth', () => {
      const result = calculateProgressPercentage(-50000, 1000000);
      expect(result).toBe(0);
    });

    describe('with baseline (snapshot-based)', () => {
      it('should calculate progress relative to starting baseline', () => {
        // Started at $50k, now at $250k, target $1M
        // Progress: (250k - 50k) / (1M - 50k) = 200k / 950k ≈ 21.05%
        const result = calculateProgressPercentage(250000, 1000000, 50000);
        expect(result).toBeCloseTo(21.05, 1);
      });

      it('should handle case where current is below baseline', () => {
        // Started at $100k, now at $50k, target $1M
        // Progress should be 0% since we went backwards
        const result = calculateProgressPercentage(50000, 1000000, 100000);
        expect(result).toBe(0);
      });

      it('should handle negative baseline (debt)', () => {
        // Started with -$50k debt, now at $100k, target $1M
        // Progress: (100k - (-50k)) / (1M - (-50k)) = 150k / 1.05M ≈ 14.29%
        const result = calculateProgressPercentage(100000, 1000000, -50000);
        expect(result).toBeCloseTo(14.29, 1);
      });

      it('should return 100% when target is reached from baseline', () => {
        // Started at $100k, now at $1M (target), should be 100%
        const result = calculateProgressPercentage(1000000, 1000000, 100000);
        expect(result).toBe(100);
      });

      it('should cap above 100% when exceeding target', () => {
        // Started at $100k, now at $1.2M, target $1M, should cap at 100%
        const result = calculateProgressPercentage(1200000, 1000000, 100000);
        expect(result).toBe(100);
      });

      it('should handle edge case where baseline equals target', () => {
        // If somehow baseline equals target, should return 100%
        const result = calculateProgressPercentage(1000000, 1000000, 1000000);
        expect(result).toBe(100);
      });

      it('should handle baseline greater than target', () => {
        // If baseline is above target (unusual but possible), should return 100%
        const result = calculateProgressPercentage(500000, 1000000, 1200000);
        expect(result).toBe(100);
      });
    });
  });

  describe('generateProjection', () => {
    it('should generate projection for positive net worth', () => {
      const result = generateProjection(
        100000, // current net worth
        2000,   // monthly contribution
        0.07,   // expected return
        30,     // current age
        10      // years
      );

      expect(result).toHaveLength(11); // 0 to 10 years
      expect(result[0].age).toBe(30);
      expect(result[0].value).toBe(100000);
      expect(result[10].age).toBe(40);
      expect(result[10].value).toBeGreaterThan(100000);
    });

    it('should handle debt scenarios with isDebtOnly flag', () => {
      const result = generateProjection(
        -300000, // debt
        2000,    // monthly payment
        0.05,    // debt interest rate
        30,      // current age
        10,      // years
        undefined,
        undefined,
        true,    // isDebtOnly
        0.07     // investment return for after debt
      );

      expect(result[0].value).toBe(-300000);
      // Debt should decrease over time
      expect(result[5].value).toBeGreaterThan(-300000);
    });

    it('should handle retirement phase', () => {
      const result = generateProjection(
        500000, // current net worth
        0,      // no contributions in retirement
        0.07,   // expected return
        65,     // retirement age
        10,     // years
        65,     // retirement age
        0.04    // withdrawal rate
      );

      // Should have withdrawals in retirement
      expect(result[1].value).toBeLessThan(result[0].value * 1.07);
    });
  });

  describe('convertToMonthlyContribution', () => {
    it('should convert weekly to monthly', () => {
      const result = convertToMonthlyContribution(100, 'weekly');
      expect(result).toBeCloseTo(433.33, 2); // 100 * 52 / 12
    });

    it('should convert fortnightly to monthly', () => {
      const result = convertToMonthlyContribution(500, 'fortnightly');
      expect(result).toBeCloseTo(1083.33, 2); // 500 * 26 / 12
    });

    it('should keep monthly unchanged', () => {
      const result = convertToMonthlyContribution(1000, 'monthly');
      expect(result).toBe(1000);
    });

    it('should convert quarterly to monthly', () => {
      const result = convertToMonthlyContribution(3000, 'quarterly');
      expect(result).toBe(1000); // 3000 / 3
    });

    it('should convert annually to monthly', () => {
      const result = convertToMonthlyContribution(12000, 'annually');
      expect(result).toBe(1000); // 12000 / 12
    });
  });

  describe('formatCurrency', () => {
    it('should format NZD currency', () => {
      const result = formatCurrency(123456, 'NZD');
      expect(result).toBe('$123,456');
    });

    it('should format USD currency', () => {
      const result = formatCurrency(123456, 'USD');
      expect(result).toBe('US$123,456');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-1234, 'NZD');
      expect(result).toBe('-$1,234');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      const result = formatPercentage(0.1234);
      expect(result).toBe('12.3%');
    });

    it('should format percentage with custom decimals', () => {
      const result = formatPercentage(0.1234, 2);
      expect(result).toBe('12.34%');
    });

    it('should handle zero', () => {
      const result = formatPercentage(0);
      expect(result).toBe('0.0%');
    });
  });

  describe('calculateFIREMetrics', () => {
    const mockHistory = [
      { netWorth: 50000, date: '2023-01-01T00:00:00.000Z' },
      { netWorth: 75000, date: '2023-06-01T00:00:00.000Z' },
      { netWorth: 100000, date: '2024-01-01T00:00:00.000Z' },
    ];

    it('should calculate FIRE metrics without history', () => {
      const result = calculateFIREMetrics(
        250000, // current net worth
        2000,   // monthly contribution
        mockSettings
      );

      expect(result.fireNumber).toBe(1000000);
      expect(result.currentNetWorth).toBe(250000);
      expect(result.progressPercentage).toBe(25); // 250k / 1M = 25%
      expect(result.yearsToFIRE).toBeGreaterThan(0);
      expect(result.monthlyContributionNeeded).toBeGreaterThan(0);
    });

    it('should calculate FIRE metrics with history (baseline)', () => {
      const result = calculateFIREMetrics(
        250000, // current net worth
        2000,   // monthly contribution
        mockSettings,
        mockHistory
      );

      expect(result.fireNumber).toBe(1000000);
      expect(result.currentNetWorth).toBe(250000);
      // Progress: (250k - 50k) / (1M - 50k) = 200k / 950k ≈ 21.05%
      expect(result.progressPercentage).toBeCloseTo(21.05, 1);
      expect(result.yearsToFIRE).toBeGreaterThan(0);
    });

    it('should handle empty history array', () => {
      const result = calculateFIREMetrics(
        250000, // current net worth
        2000,   // monthly contribution
        mockSettings,
        []
      );

      expect(result.progressPercentage).toBe(25); // Should default to no baseline
    });

    it('should sort history by date to find first snapshot', () => {
      const unsortedHistory = [
        { netWorth: 100000, date: '2024-01-01T00:00:00.000Z' },
        { netWorth: 50000, date: '2023-01-01T00:00:00.000Z' }, // This is earliest
        { netWorth: 75000, date: '2023-06-01T00:00:00.000Z' },
      ];

      const result = calculateFIREMetrics(
        250000, // current net worth
        2000,   // monthly contribution
        mockSettings,
        unsortedHistory
      );

      // Should use 50000 as baseline (earliest date)
      expect(result.progressPercentage).toBeCloseTo(21.05, 1);
    });

    it('should handle negative starting net worth (debt)', () => {
      const debtHistory = [
        { netWorth: -100000, date: '2023-01-01T00:00:00.000Z' },
        { netWorth: -50000, date: '2023-06-01T00:00:00.000Z' },
      ];

      const result = calculateFIREMetrics(
        100000, // current net worth
        2000,   // monthly contribution
        mockSettings,
        debtHistory
      );

      // Progress: (100k - (-100k)) / (1M - (-100k)) = 200k / 1.1M ≈ 18.18%
      expect(result.progressPercentage).toBeCloseTo(18.18, 1);
    });

    it('should handle case where current net worth is below starting baseline', () => {
      const highStartHistory = [
        { netWorth: 300000, date: '2023-01-01T00:00:00.000Z' },
      ];

      const result = calculateFIREMetrics(
        250000, // current net worth (below baseline)
        2000,   // monthly contribution
        mockSettings,
        highStartHistory
      );

      // Progress should be 0% since we went backwards
      expect(result.progressPercentage).toBe(0);
    });
  });
});