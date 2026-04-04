import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ asChild, children }) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');
  
  const { setOpen, open } = context;
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(!open),
    } as any);
  }
  
  return (
    <button onClick={() => setOpen(!open)} className="outline-none">
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps {
  align?: 'start' | 'end' | 'center';
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = 'start', 
  children, 
  className 
}) => {
  const context = React.useContext(DropdownMenuContext);
  const menuRef = useRef<HTMLDivElement>(null);
  
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');
  
  const { open, setOpen } = context;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);
  
  if (!open) return null;
  
  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };
  
  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className,
  onClick 
}) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu');
  
  const { setOpen } = context;
  
  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };
  
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => {
  return <div className={cn('my-1 h-px bg-border', className)} />;
};
