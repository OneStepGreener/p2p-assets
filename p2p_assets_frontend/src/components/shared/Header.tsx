import { useState, useEffect } from 'react';
import { Bell, Settings, User } from '../icons';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { TabNavigation } from './TabNavigation';
import tciLogo from '../../assets/TCI_Logo.jpg';
import type { User as UserType } from '../../types';

const USER_STORAGE_KEY = 'user';

function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type TabId = 'register' | 'dashboard' | 'audit' | 'allocation';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, onLogout }: HeaderProps) {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserType;
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const displayName = user?.emp_name?.trim() || 'User';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center">
              <img 
                src={tciLogo} 
                alt="TCI Leaders in Logistics" 
                className="h-8 w-auto md:h-10 object-contain" 
              />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-foreground">Asset Management System</h1>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full md:w-auto overflow-x-auto md:overflow-visible">
            <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-status-disposed rounded-full" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2 h-8 md:h-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs md:text-sm font-medium">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="pointer-events-none">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">{displayName}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-status-disposed" onClick={onLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
