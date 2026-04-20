import React from 'react';
import { cn } from '../../utils/cn';

type TabId = 'dashboard' | 'audit' | 'allocation';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Asset Dashboard' },
  { id: 'audit', label: 'Audit' },
  { id: 'allocation', label: 'Allocation' },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-colors rounded-md whitespace-nowrap flex-shrink-0',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
