import React, { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number | ReactNode;
  secondaryValue?: string;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  color: string;
  bgColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  secondaryValue,
  change,
  changeLabel,
  icon,
  color,
  bgColor,
}) => {
  return (
    <div className={`kpi-card ${bgColor || 'bg-white'} transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-600 mb-1 md:mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{value}</p>
          {secondaryValue && (
            <p className="text-sm text-gray-600 font-medium">{secondaryValue}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
              <span
                className={`text-sm font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">{changeLabel || 'vs last month'}</span>
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${color} shadow-sm flex-shrink-0`}
        >
          <div className="w-5 h-5 md:w-6 md:h-6">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};
