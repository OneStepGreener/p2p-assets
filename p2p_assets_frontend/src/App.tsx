import { useState, useEffect } from 'react';
import { ResponsiveLayout } from './layouts/ResponsiveLayout';
import { AssetDashboard } from './components/tabs/AssetDashboard';
import { Audit } from './components/tabs/Audit';
import { Allocation } from './components/tabs/Allocation';
import { FilterPanel } from './components/shared/FilterPanel';
import { LoginSignup } from './components/auth/LoginSignup';
import { FilterState } from './types';

const AUTH_STORAGE_KEY = 'p2p_asset_auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token') || localStorage.getItem(AUTH_STORAGE_KEY) === '1';
  });

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  const [activeTab, setActiveTab] = useState('Asset Dashboard');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    location: 'All',
    department: 'All',
    assetCategory: 'All',
    status: 'All',
    costCenter: 'All',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const renderFilterPanel = () => {
    switch (activeTab) {
      case 'Asset Dashboard':
        return (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            showLocation={true}
            showDepartment={true}
            showCategory={true}
            showStatus={true}
            showCostCenter={true}
            showDateRange={true}
          />
        );
      case 'Audit':
        return (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            showLocation={true}
            showDepartment={true}
            showDateRange={true}
            showAuditor={true}
            showDiscrepancySeverity={true}
            showDiscrepancyStatus={true}
          />
        );
      case 'Allocation':
        return (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            showLocation={true}
            showDepartment={true}
            showCategory={true}
            showStatus={true}
            showCostCenter={true}
          />
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Asset Dashboard':
        return (
          <AssetDashboard filters={filters} onFilterChange={handleFilterChange} />
        );
      case 'Audit':
        return <Audit filters={filters} onFilterChange={handleFilterChange} />;
      case 'Allocation':
        return (
          <Allocation filters={filters} onFilterChange={handleFilterChange} />
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <LoginSignup onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ResponsiveLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      filterPanel={activeTab !== 'Asset Dashboard' ? renderFilterPanel() : undefined}
      onLogout={handleLogout}
    >
      {renderTabContent()}
    </ResponsiveLayout>
  );
}

export default App;
