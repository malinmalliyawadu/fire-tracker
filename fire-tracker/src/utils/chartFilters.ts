import type { Asset, Liability, AssetType, LiabilityType } from "../types/fire";

export interface ChartFilters {
  assetTypes: AssetType[];
  liabilityTypes: LiabilityType[];
  selectedAssets: string[];
  selectedLiabilities: string[];
}

/**
 * Filters assets based on the provided filter criteria
 */
export function filterAssets(assets: Asset[], filters: ChartFilters): Asset[] {
  if (!filters) return assets;

  // If there are liability filters but no asset filters, exclude all assets
  const hasLiabilityFilters = filters.liabilityTypes.length > 0 || filters.selectedLiabilities.length > 0;
  const hasAssetFilters = filters.assetTypes.length > 0 || filters.selectedAssets.length > 0;

  if (hasLiabilityFilters && !hasAssetFilters) {
    return []; // Return no assets when only liabilities are filtered
  }

  let filteredAssets = assets;

  // Filter by asset types
  if (filters.assetTypes.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      filters.assetTypes.includes(asset.type)
    );
  }

  // Filter by specific assets
  if (filters.selectedAssets.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      filters.selectedAssets.includes(asset.id)
    );
  }

  return filteredAssets;
}

/**
 * Filters liabilities based on the provided filter criteria
 */
export function filterLiabilities(liabilities: Liability[], filters: ChartFilters): Liability[] {
  if (!filters) return liabilities;

  // If there are asset filters but no liability filters, exclude all liabilities
  const hasAssetFilters = filters.assetTypes.length > 0 || filters.selectedAssets.length > 0;
  const hasLiabilityFilters = filters.liabilityTypes.length > 0 || filters.selectedLiabilities.length > 0;

  if (hasAssetFilters && !hasLiabilityFilters) {
    return []; // Return no liabilities when only assets are filtered
  }

  let filteredLiabilities = liabilities;

  // Filter by liability types
  if (filters.liabilityTypes.length > 0) {
    filteredLiabilities = filteredLiabilities.filter(liability =>
      filters.liabilityTypes.includes(liability.type)
    );
  }

  // Filter by specific liabilities
  if (filters.selectedLiabilities.length > 0) {
    filteredLiabilities = filteredLiabilities.filter(liability =>
      filters.selectedLiabilities.includes(liability.id)
    );
  }

  return filteredLiabilities;
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: ChartFilters): boolean {
  return (
    filters.assetTypes.length > 0 ||
    filters.liabilityTypes.length > 0 ||
    filters.selectedAssets.length > 0 ||
    filters.selectedLiabilities.length > 0
  );
}

/**
 * Gets a summary of active filters for display
 */
export function getFilterSummary(filters: ChartFilters): string {
  const parts = [];

  if (filters.assetTypes.length > 0) {
    parts.push(`${filters.assetTypes.length} asset type${filters.assetTypes.length > 1 ? 's' : ''}`);
  }

  if (filters.liabilityTypes.length > 0) {
    parts.push(`${filters.liabilityTypes.length} liability type${filters.liabilityTypes.length > 1 ? 's' : ''}`);
  }

  if (filters.selectedAssets.length > 0) {
    parts.push(`${filters.selectedAssets.length} asset${filters.selectedAssets.length > 1 ? 's' : ''}`);
  }

  if (filters.selectedLiabilities.length > 0) {
    parts.push(`${filters.selectedLiabilities.length} liability${filters.selectedLiabilities.length > 1 ? 'ies' : 'y'}`);
  }

  return parts.join(', ');
}