import React from 'react';
import { Header } from '../components/shared/Header';

type TabId = 'dashboard' | 'audit' | 'allocation';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  filterPanel?: React.ReactNode;
  onLogout?: () => void;
}

const mapTabToId = (tab: string): TabId => {
  if (tab === 'Asset Dashboard') return 'dashboard';
  if (tab === 'Audit') return 'audit';
  if (tab === 'Allocation') return 'allocation';
  return 'dashboard';
};

const mapIdToTab = (id: TabId): string => {
  if (id === 'dashboard') return 'Asset Dashboard';
  if (id === 'audit') return 'Audit';
  if (id === 'allocation') return 'Allocation';
  return 'Asset Dashboard';
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, filterPanel, onLogout }) => {
  const currentTabId = mapTabToId(activeTab);
  
  const handleTabChange = (tabId: TabId) => {
    onTabChange(mapIdToTab(tabId));
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={currentTabId} onTabChange={handleTabChange} onLogout={onLogout} />
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
        {filterPanel && (
          <div className="w-full md:w-80 flex-shrink-0">{filterPanel}</div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};
