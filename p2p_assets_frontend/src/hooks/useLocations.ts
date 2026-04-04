/**
 * Custom Hook: useLocations
 * Fetches distinct HO_COUNTRY_NAME from cm_division_tlog for location filter (Asset Dashboard)
 */

import { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';

export interface UseLocationsReturn {
  locations: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLocations = (): UseLocationsReturn => {
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getLocations();
      setLocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch locations');
      setLocations([]);
      console.error('Error in useLocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
  };
};
