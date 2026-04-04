import React from 'react';
import { Layout } from './Layout';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  filterPanel?: React.ReactNode;
  onLogout?: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  filterPanel,
  onLogout,
}) => {
  return (
    <Layout activeTab={activeTab} onTabChange={onTabChange} filterPanel={filterPanel} onLogout={onLogout}>
      {children}
    </Layout>
  );
};
