import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Rectangle,
} from 'recharts';
import { chartService } from '../services/chartService';
import type { ChartServiceItem, ChartCategoryItem, ChartSubcategoryItem } from '../types';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ErrorMessage } from './shared/ErrorMessage';

const MAX_LABEL_LEN = 28;
const BAR_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#ea580c', '#0891b2', '#be185d',
  '#4f46e5', '#0d9488',
];
const PIE_COLORS = [
  '#ea580c', '#16a34a', '#ca8a04', '#dc2626', '#2563eb', '#9333ea', '#ec4899', '#0891b2', '#4f46e5', '#0d9488',
];

function truncate(str: string, max: number = MAX_LABEL_LEN): string {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

/** Full-row clickable bar: transparent hit area over entire row + visible blue bar */
function ServiceBarRowShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { payload?: ChartServiceItem };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const item = payload?.payload;
  const isClickable = item?.serviceCode && item.serviceCode !== '__OTHERS__';
  return (
    <g>
      {isClickable && (
        <Rectangle
          x={0}
          y={y}
          width={3000}
          height={height}
          fill="transparent"
          className="cursor-pointer"
        />
      )}
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={BAR_COLORS[0]}
        radius={[0, 4, 4, 0]}
        className="cursor-pointer"
      />
    </g>
  );
}

type Level = 'service' | 'category' | 'subcategory';

export interface ChartSelection {
  serviceCode?: string;
  categoryId?: string;
  subcategoryId?: string;
}

interface AssetDrilldownChartProps {
  /** When user drills down or goes back, call with current selection; null = clear register filter */
  onSelectionChange?: (selection: ChartSelection | null) => void;
}

export function AssetDrilldownChart({ onSelectionChange }: AssetDrilldownChartProps) {
  const [level, setLevel] = useState<Level>('service');
  const [services, setServices] = useState<ChartServiceItem[]>([]);
  const [categories, setCategories] = useState<ChartCategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<ChartSubcategoryItem[]>([]);
  const [selectedService, setSelectedService] = useState<ChartServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ChartCategoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategorySearch, setSubcategorySearch] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chartService.getServices(0);
      setServices(data);
      setLevel('service');
      setSelectedService(null);
      setSelectedCategory(null);
      setCategories([]);
      setSubcategories([]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchCategories = useCallback(async (serviceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await chartService.getCategories(serviceCode, 10);
      setCategories(data);
      setLevel('category');
      setSelectedCategory(null);
      setSubcategories([]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async (serviceCode: string, categoryId: string) => {
    if (categoryId === '__OTHERS__') {
      setSubcategories([]);
      setLevel('subcategory');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await chartService.getSubcategories(serviceCode, categoryId, 15);
      setSubcategories(data);
      setLevel('subcategory');
    } catch (e: any) {
      setError(e?.message || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleServiceClick = (item: ChartServiceItem) => {
    if (item.serviceCode === '__OTHERS__') return;
    setSelectedService(item);
    fetchCategories(item.serviceCode);
    onSelectionChange?.({ serviceCode: item.serviceCode });
  };

  const handleCategoryClick = (item: ChartCategoryItem) => {
    if (item.categoryId === '__OTHERS__') return;
    setSelectedCategory(item);
    if (selectedService) fetchSubcategories(selectedService.serviceCode, item.categoryId);
    onSelectionChange?.({ serviceCode: selectedService?.serviceCode, categoryId: item.categoryId });
  };

  const handleSubcategoryClick = (item: ChartSubcategoryItem) => {
    if (item.subCategoryId === '__OTHERS__') return;
    onSelectionChange?.({
      serviceCode: selectedService?.serviceCode,
      categoryId: selectedCategory?.categoryId,
      subcategoryId: item.subCategoryId,
    });
  };

  const goBackToServices = () => {
    setLevel('service');
    setSelectedService(null);
    setSelectedCategory(null);
    setCategories([]);
    setSubcategories([]);
    setServices([]);
    fetchServices();
    onSelectionChange?.(null);
  };

  const goBackToCategories = () => {
    setLevel('category');
    setSelectedCategory(null);
    setSubcategories([]);
    onSelectionChange?.({ serviceCode: selectedService?.serviceCode });
  };

  const totalServices = useMemo(() => services.reduce((s, i) => s + i.assetCount, 0), [services]);
  const totalCategories = useMemo(() => categories.reduce((s, i) => s + i.assetCount, 0), [categories]);
  const totalSubcategories = useMemo(() => subcategories.reduce((s, i) => s + i.assetCount, 0), [subcategories]);

  const barDataServices = useMemo(
    () => services.map((i) => ({ name: truncate(i.serviceDesc), fullName: i.serviceDesc, count: i.assetCount, payload: i })),
    [services]
  );
  const pieDataCategories = useMemo(
    () =>
      categories.map((i, idx) => ({
        name: truncate(i.categoryName),
        fullName: i.categoryName,
        value: i.assetCount,
        payload: i,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      })),
    [categories]
  );
  const filteredSubcategories = useMemo(() => {
    if (!subcategorySearch.trim()) return subcategories;
    const q = subcategorySearch.trim().toLowerCase();
    return subcategories.filter(
      (i) => i.subCategoryName.toLowerCase().includes(q) || (i.subCategoryId && i.subCategoryId.toLowerCase().includes(q))
    );
  }, [subcategories, subcategorySearch]);
  const barDataSubcategories = useMemo(
    () =>
      filteredSubcategories.map((i) => ({
        name: truncate(i.subCategoryName),
        fullName: i.subCategoryName,
        count: i.assetCount,
        payload: i,
      })),
    [filteredSubcategories]
  );

  const TooltipBar = ({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const name = p.fullName ?? p.name ?? '';
    const count = p.count ?? 0;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg border border-gray-700 text-sm">
        <p className="font-medium mb-1">{name}</p>
        <p className="text-base font-semibold">
          {count} <span className="text-gray-300 font-normal">assets ({pct}%)</span>
        </p>
      </div>
    );
  };

  const TooltipPie = ({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    const name = data.payload?.fullName ?? data.name ?? '';
    const value = data.value ?? 0;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg border border-gray-700 text-sm">
        <p className="font-medium mb-1">{name}</p>
        <p className="text-base font-semibold">
          {value} <span className="text-gray-300 font-normal">assets ({pct}%)</span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 shrink-0">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">Asset distribution (drill-down)</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs md:text-sm text-gray-500">Service</span>
          <span className="text-gray-400">→</span>
          <span className="text-xs md:text-sm text-gray-500">Category</span>
          <span className="text-gray-400">→</span>
          <span className="text-xs md:text-sm text-gray-500">Subcategory</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
        <button
          type="button"
          onClick={goBackToServices}
          className="hover:text-blue-600 underline focus:outline-none"
        >
          Service
        </button>
        {selectedService && (
          <>
            <span>/</span>
            <button
              type="button"
              onClick={level === 'subcategory' ? goBackToCategories : undefined}
              className={
                level === 'subcategory'
                  ? 'hover:text-blue-600 underline focus:outline-none'
                  : 'text-gray-900 font-medium cursor-default'
              }
            >
              {truncate(selectedService.serviceDesc, 22)}
            </button>
          </>
        )}
        {selectedCategory && (
          <>
            <span>/</span>
            <span className="text-gray-900 font-medium">{truncate(selectedCategory.categoryName, 22)}</span>
          </>
        )}
      </nav>

      {error && (
        <ErrorMessage message={error} onRetry={level === 'service' ? fetchServices : () => setError(null)} />
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading chart...</span>
        </div>
      )}

      {!loading && !error && level === 'service' && (
        <div className="min-h-[320px]">
          {barDataServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-sm">
              <p>No service data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(320, Math.min(560, 120 + barDataServices.length * 26))}>
              <BarChart
                data={barDataServices}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <Tooltip
                  content={<TooltipBar total={totalServices} />}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar
                  dataKey="count"
                  fill={BAR_COLORS[0]}
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  animationDuration={300}
                  shape={<ServiceBarRowShape />}
                  onClick={(e: any) => {
                    const p = e?.payload?.payload ?? e?.payload;
                    if (p?.serviceCode && p.serviceCode !== '__OTHERS__') handleServiceClick(p);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {!loading && !error && level === 'category' && (
        <div className="min-h-[320px]">
          {pieDataCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-sm">
              <p>No category data for this service.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieDataCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  onClick={(_: any, index: number) => pieDataCategories[index]?.payload && handleCategoryClick(pieDataCategories[index].payload)}
                  cursor="pointer"
                  animationDuration={300}
                >
                  {pieDataCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPie total={totalCategories} />} />
                <Legend
                  verticalAlign="bottom"
                  height={56}
                  formatter={(value, entry: any) => {
                    const item = entry?.payload?.payload;
                    const v = item?.assetCount ?? 0;
                    const pct = totalCategories > 0 ? ((v / totalCategories) * 100).toFixed(1) : '0';
                    return (
                      <span className="text-gray-600 text-xs md:text-sm">
                        {value} <span className="text-gray-400">({pct}%)</span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {!loading && !error && level === 'subcategory' && (
        <div className="min-h-[320px]">
          {selectedCategory?.categoryId === '__OTHERS__' ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-sm">
              <p>Subcategory breakdown is not available for &quot;Others&quot;.</p>
            </div>
          ) : (
            <>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Filter subcategories..."
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  className="input-field h-8 text-sm w-full max-w-xs"
                />
              </div>
              {barDataSubcategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-sm">
                  <p>No subcategory data.</p>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(320, Math.min(480, barDataSubcategories.length * 26))}
                >
                  <BarChart
                    data={barDataSubcategories}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: '#374151' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<TooltipBar total={totalSubcategories} />}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Bar
                      dataKey="count"
                      fill={BAR_COLORS[1]}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      animationDuration={300}
                      onClick={(e: any) => {
                        const p = e?.payload?.payload ?? e?.payload;
                        if (p?.subCategoryId && p.subCategoryId !== '__OTHERS__') handleSubcategoryClick(p);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
