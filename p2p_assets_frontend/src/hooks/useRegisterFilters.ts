/**
 * Hooks for cascading filter dropdowns (Country -> State -> City -> Division -> Branch -> Category).
 * Fetches options when parent selection changes; resets children when parent changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { filterService } from '../services/filterService';
import type {
  CountryOption,
  StateOption,
  CityOption,
  DivisionOption,
  BranchOption,
  CategoryOption,
} from '../services/filterService';
import type { RegisterFilterState } from '../types';

const EMPTY: RegisterFilterState = {
  country: '',
  state: '',
  city: '',
  divisionCode: '',
  branchCode: '',
  assetClass: '',
  categoryId: '',
};

export interface UseRegisterFiltersOptions {
  companyCode?: string;
  initialFilters?: Partial<RegisterFilterState>;
}

export interface UseRegisterFiltersReturn {
  filters: RegisterFilterState;
  setFilters: (f: Partial<RegisterFilterState>) => void;
  countries: CountryOption[];
  states: StateOption[];
  cities: CityOption[];
  divisions: DivisionOption[];
  branches: BranchOption[];
  categories: CategoryOption[];
  loading: { countries: boolean; states: boolean; cities: boolean; divisions: boolean; branches: boolean; categories: boolean };
  resetFilters: () => void;
}

export function useRegisterFilters(options: UseRegisterFiltersOptions = {}): UseRegisterFiltersReturn {
  const { companyCode = '', initialFilters } = options;
  const [filters, setFiltersState] = useState<RegisterFilterState>({ ...EMPTY, ...initialFilters });
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [divisions, setDivisions] = useState<DivisionOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    divisions: false,
    branches: false,
    categories: false,
  });

  const setFilters = useCallback((f: Partial<RegisterFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(EMPTY);
  }, []);

  // Countries: load once
  useEffect(() => {
    let cancelled = false;
    setLoading((l) => ({ ...l, countries: true }));
    filterService
      .getCountries()
      .then((data) => {
        if (!cancelled) setCountries(data);
      })
      .finally(() => setLoading((l) => ({ ...l, countries: false })));
    return () => {
      cancelled = true;
    };
  }, []);

  // States: when country changes
  useEffect(() => {
    if (!filters.country) {
      setStates([]);
      return;
    }
    let cancelled = false;
    setLoading((l) => ({ ...l, states: true }));
    filterService
      .getStates(filters.country)
      .then((data) => {
        if (!cancelled) setStates(data);
      })
      .finally(() => setLoading((l) => ({ ...l, states: false })));
    return () => {
      cancelled = true;
    };
  }, [filters.country]);

  // Cities: when country or state changes
  useEffect(() => {
    if (!filters.country) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoading((l) => ({ ...l, cities: true }));
    filterService
      .getCities(filters.country, filters.state)
      .then((data) => {
        if (!cancelled) setCities(data);
      })
      .finally(() => setLoading((l) => ({ ...l, cities: false })));
    return () => {
      cancelled = true;
    };
  }, [filters.country, filters.state]);

  // Divisions: when companyCode or load once
  useEffect(() => {
    let cancelled = false;
    setLoading((l) => ({ ...l, divisions: true }));
    filterService
      .getDivisions(companyCode || undefined)
      .then((data) => {
        if (!cancelled) setDivisions(data);
      })
      .finally(() => setLoading((l) => ({ ...l, divisions: false })));
    return () => {
      cancelled = true;
    };
  }, [companyCode]);

  // Branches: when divisionCode changes
  useEffect(() => {
    if (!filters.divisionCode) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    setLoading((l) => ({ ...l, branches: true }));
    filterService
      .getBranches(filters.divisionCode)
      .then((data) => {
        if (!cancelled) setBranches(data);
      })
      .finally(() => setLoading((l) => ({ ...l, branches: false })));
    return () => {
      cancelled = true;
    };
  }, [filters.divisionCode]);

  // Categories: when assetClass changes
  useEffect(() => {
    if (!filters.assetClass) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    setLoading((l) => ({ ...l, categories: true }));
    filterService
      .getCategories(filters.assetClass)
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .finally(() => setLoading((l) => ({ ...l, categories: false })));
    return () => {
      cancelled = true;
    };
  }, [filters.assetClass]);

  return {
    filters,
    setFilters,
    countries,
    states,
    cities,
    divisions,
    branches,
    categories,
    loading,
    resetFilters,
  };
}
