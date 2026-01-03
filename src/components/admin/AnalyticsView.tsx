import React, { useMemo, useState } from 'react';
import { processAnalytics, DateRange } from '@/utils/analyticsUtils';
import { Activity, Calendar, Users, AlertCircle, TrendingUp, Clock, Scissors, DollarSign, Repeat, ChevronDown, ChevronUp, Trophy, ArrowUpRight, ArrowDownRight, Filter, UserMinus, UserCheck, Crown } from 'lucide-react';
import { Appointment, Service, Staff } from '@/types';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import StatCard from './StatCard';
import ComparisonStatCard from './ComparisonStatCard';
import ComparisonChart from './ComparisonChart';
import AnalyticsSectionHeader from './AnalyticsSectionHeader';
import AnalyticsDatePicker, { DateRangePreset } from './AnalyticsDatePicker';
import DrillDownModal from './DrillDownModal';

interface AnalyticsViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

type ViewMode = 'business' | 'team';
type DrillDownMetric = 'revenue' | 'utilization' | 'clients' | 'appointments' | null;

export default function AnalyticsView({ appointments, services, staff }: AnalyticsViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('business');
    const [compareMode, setCompareMode] = useState(false);
    const [drillDownMetric, setDrillDownMetric] = useState<DrillDownMetric>(null);

    // Initialize with This Week
    const [selectedRange, setSelectedRange] = useState<DateRange>({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });

    // Calculate previous period for comparison
    const ranges = useMemo(() => {
        const daysDiff = Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24));
        const previous: DateRange = {
            start: new Date(selectedRange.start.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000),
            end: new Date(selectedRange.end.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000)
        };

        return { current: selectedRange, previous };
    }, [selectedRange]);

    const handleRangeChange = (range: DateRange, preset: DateRangePreset) => {
        setSelectedRange(range);
    };

    // Period B (Comparison Range) - for compare mode
    const [comparisonRange, setComparisonRange] = useState<DateRange>({
        start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
    });

    const handleComparisonRangeChange = (range: DateRange, preset: DateRangePreset) => {
        setComparisonRange(range);
    };


    const metrics = useMemo(() => {
        console.log('📊 Processing Analytics - Period A:', {
            appointmentsCount: appointments.length,
            currentRange: ranges.current,
            previousRange: ranges.previous
        });
        return processAnalytics(appointments, services, staff, ranges.current, ranges.previous);
    }, [appointments, services, staff, ranges]);

    // Metrics for Period B (when in compare mode)
    const comparisonMetrics = useMemo(() => {
        if (!compareMode) return null;
        const daysDiff = Math.ceil((comparisonRange.end.getTime() - comparisonRange.start.getTime()) / (1000 * 60 * 60 * 24));
        const prevComparison: DateRange = {
            start: new Date(comparisonRange.start.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000),
            end: new Date(comparisonRange.end.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000)
        };
        return processAnalytics(appointments, services, staff, comparisonRange, prevComparison);
    }, [compareMode, appointments, services, staff, comparisonRange]);

    const [openSections, setOpenSections] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('analytics_sections_state');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse saved analytics state', e);
                }
            }
        }
        // Default: All closed
        return {
            overview: false,
            trends: false,
            team: false,
            services: false,
            clients: false
        };
    });

    // Persist state changes
    React.useEffect(() => {
        localStorage.setItem('analytics_sections_state', JSON.stringify(openSections));
    }, [openSections]);

    const toggle = (key: keyof typeof openSections) => {
        setOpenSections((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };



    const GrowthBadge = ({ value, trend }: { value: number, trend: 'up' | 'down' | 'neutral' }) => {
        const isPositive = trend === 'up';
        const color = isPositive ? 'text-green-600 bg-green-50' : (trend === 'neutral' ? 'text-gray-600 bg-gray-50' : 'text-red-600 bg-red-50');
        const Icon = isPositive ? ArrowUpRight : (trend === 'neutral' ? TrendingUp : ArrowDownRight);

        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${color}`}>
                <Icon className="w-3 h-3" />
                {Math.abs(value).toFixed(0)}%
            </div>
        );
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedStaff = useMemo(() => {
        let sortableItems = [...metrics.topStaff];
        sortableItems.sort((a, b) => {
            // @ts-ignore
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            // @ts-ignore
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [metrics.topStaff, sortConfig]);

    const SortableHeader = ({ label, sortKey, align = 'right', className = '', mobileLabel }: { label: string, sortKey: string, align?: 'left' | 'right', className?: string, mobileLabel?: string }) => (
        <th
            className={`px-1 md:px-6 py-3 text-${align} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors select-none group ${className}`}
            onClick={() => handleSort(sortKey)}
        >
            <div className={`flex items-center gap-0.5 md:gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                <span className={mobileLabel ? "hidden md:inline" : ""}>{label}</span>
                {mobileLabel && <span className="md:hidden">{mobileLabel}</span>}
                <div className="flex flex-col opacity-0 group-hover:opacity-50 data-[active=true]:opacity-100" data-active={sortConfig.key === sortKey}>
                    <ChevronUp className={`w-2 h-2 md:w-3 md:h-3 ${sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-[#2D165D]' : 'text-gray-400'}`} />
                    <ChevronDown className={`w-2 h-2 md:w-3 md:h-3 -mt-0.5 md:-mt-1 ${sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-[#2D165D]' : 'text-gray-400'}`} />
                </div>
            </div>
        </th>
    );

    // Prepare Data for Charts
    const teamRevenueData = metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], revenue: s.revenue }));
    const teamUtilizationData = metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], utilization: s.utilization }));

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-24 w-full overflow-x-hidden">

            {/* Header & Controls */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 md:gap-3">
                            <div className="p-2 bg-primary-50 rounded-xl">
                                <Activity className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                            </div>
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-500 text-xs md:text-sm font-medium mt-1">Track your business growth and performance.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-full flex w-full lg:w-auto">
                        <button
                            onClick={() => setViewMode('business')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'business' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Business
                        </button>
                        <button
                            onClick={() => setViewMode('team')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'team' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Team
                        </button>
                    </div>

                    {/* Date Range Picker(s) */}
                    <div className="flex flex-col gap-3 w-full lg:w-auto">
                        {compareMode ? (
                            <div className="flex flex-col lg:flex-row gap-3">
                                {/* Period A */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-widest border border-primary-100">
                                        Period A
                                    </span>
                                    <AnalyticsDatePicker
                                        selectedRange={selectedRange}
                                        onRangeChange={handleRangeChange}
                                        compareMode={false}
                                    />
                                </div>
                                {/* Period B */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-widest border border-purple-100">
                                        Period B
                                    </span>
                                    <AnalyticsDatePicker
                                        selectedRange={comparisonRange}
                                        onRangeChange={handleComparisonRangeChange}
                                        compareMode={false}
                                    />
                                </div>
                                {/* Exit Compare Button */}
                                <button
                                    onClick={() => setCompareMode(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                                >
                                    Exit
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <AnalyticsDatePicker
                                    selectedRange={selectedRange}
                                    onRangeChange={handleRangeChange}
                                    compareMode={compareMode}
                                    onCompareModeToggle={setCompareMode}
                                />
                                <button
                                    onClick={() => setCompareMode(true)}
                                    className="sm:w-auto px-6 py-3 bg-white border-2 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <TrendingUp className="w-3.5 h-3.5 opacity-50" />
                                    Compare
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === BUSINESS VIEW === */}
            {viewMode === 'business' && (
                <div className="space-y-8 animate-in fade-in duration-300 w-full mb-24">

                    {/* 1. BUSINESS OVERVIEW (Always Visible) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="p-1.5 bg-primary-50 rounded-lg">
                                <Activity className="w-4 h-4 text-primary-600" />
                            </div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">Business Overview</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                            {compareMode && comparisonMetrics ? (
                                <>
                                    <ComparisonStatCard
                                        title="Total Revenue"
                                        periodAValue={`$${Number(metrics.revenue.total.value).toLocaleString()}`}
                                        periodBValue={`$${Number(comparisonMetrics.revenue.total.value).toLocaleString()}`}
                                        icon={DollarSign}
                                        color="green"
                                        delay={100}
                                    />
                                    <ComparisonStatCard
                                        title="Total Bookings"
                                        periodAValue={metrics.totalBookings.value}
                                        periodBValue={comparisonMetrics.totalBookings.value}
                                        icon={Calendar}
                                        color="indigo"
                                        delay={200}
                                    />
                                    <ComparisonStatCard
                                        title="Avg. Ticket"
                                        periodAValue={`$${metrics.revenue.average.toFixed(0)}`}
                                        periodBValue={`$${comparisonMetrics.revenue.average.toFixed(0)}`}
                                        icon={TrendingUp}
                                        color="purple"
                                        delay={300}
                                    />
                                    <ComparisonStatCard
                                        title="Utilization"
                                        periodAValue={metrics.utilization.value}
                                        periodBValue={comparisonMetrics.utilization.value}
                                        icon={Activity}
                                        color="orange"
                                        delay={400}
                                    />
                                </>
                            ) : (
                                <>
                                    <StatCard
                                        title="Total Revenue"
                                        value={`$${Number(metrics.revenue.total.value).toLocaleString()}`}
                                        growth={metrics.revenue.total.growth}
                                        trend={metrics.revenue.total.trend}
                                        icon={DollarSign}
                                        color="green"
                                        delay={100}
                                        onClick={() => setDrillDownMetric('revenue')}
                                    />
                                    <StatCard
                                        title="Total Bookings"
                                        value={metrics.totalBookings.value}
                                        growth={metrics.totalBookings.growth}
                                        trend={metrics.totalBookings.trend}
                                        icon={Calendar}
                                        color="indigo"
                                        delay={200}
                                        onClick={() => setDrillDownMetric('appointments')}
                                    />
                                    <StatCard
                                        title="Avg. Ticket"
                                        value={`$${metrics.revenue.average.toFixed(0)}`}
                                        growth={metrics.revenue.total.growth}
                                        trend={metrics.revenue.total.trend}
                                        icon={TrendingUp}
                                        color="purple"
                                        delay={300}
                                        onClick={() => setDrillDownMetric('revenue')}
                                    />
                                    <StatCard
                                        title="Utilization"
                                        value={metrics.utilization.value}
                                        growth={metrics.utilization.growth}
                                        trend={metrics.utilization.trend}
                                        icon={Activity}
                                        color="orange"
                                        delay={400}
                                        onClick={() => setDrillDownMetric('utilization')}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* 2. TIME & DEMAND ANALYSIS */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-2 mt-8">
                            <div className="p-1.5 bg-orange-50 rounded-lg">
                                <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">Time & Demand</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {compareMode && comparisonMetrics ? (
                                <>
                                    {/* Period A Peak Times */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                                        <div className="flex items-center gap-4 mb-4 relative z-10">
                                            <div className="text-xs font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 uppercase tracking-widest">
                                                Period A
                                            </div>
                                            <div className="relative group/icon flex-shrink-0">
                                                <div className="absolute inset-[-4px] bg-gradient-to-br from-orange-500 to-red-600 rounded-xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                                                <div className="relative p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md shadow-orange-500/20">
                                                    <Clock className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Day</span>
                                                <span className="text-lg font-black text-gray-900">{metrics.busiest.day}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Hour</span>
                                                <span className="text-lg font-black text-gray-900">{metrics.busiest.hour}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Period B Peak Times */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                                        <div className="flex items-center gap-4 mb-4 relative z-10">
                                            <div className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 uppercase tracking-widest">
                                                Period B
                                            </div>
                                            <div className="relative group/icon flex-shrink-0">
                                                <div className="absolute inset-[-4px] bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl blur-lg opacity-20 group-hover:opacity-50 transition-opacity" />
                                                <div className="relative p-2.5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-md shadow-gray-500/10">
                                                    <Clock className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Day</span>
                                                <span className="text-lg font-black text-gray-900">{comparisonMetrics.busiest.day}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Hour</span>
                                                <span className="text-lg font-black text-gray-900">{comparisonMetrics.busiest.hour}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Single Period Peak Times */}
                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 shadow-sm hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                                                <Clock className="w-5 h-5 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Peak Times</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Day</span>
                                                <span className="text-lg font-black text-gray-900">{metrics.busiest.day}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                                <span className="text-sm font-semibold text-gray-600">Busiest Hour</span>
                                                <span className="text-lg font-black text-gray-900">{metrics.busiest.hour}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demand Heatmap */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                                                <TrendingUp className="w-5 h-5 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Demand Heatmap</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {metrics.heatmap.slice(0, 5).map((item, index) => (
                                                <div key={item.hour} className="flex items-center gap-4">
                                                    <div className="w-16 text-xs font-bold text-gray-600">{item.hour}</div>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${(item.count / (metrics.heatmap[0]?.count || 1)) * 100}%`,
                                                                animationDelay: `${index * 100}ms`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-xs font-bold text-gray-900 text-right">{item.count}</div>
                                                </div>
                                            ))}
                                            {metrics.heatmap.length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4">No data available</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. TOP SERVICES */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-2 mt-8">
                            <div className="p-1.5 bg-green-50 rounded-lg">
                                <Scissors className="w-4 h-4 text-green-600" />
                            </div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">Top Services</h3>
                        </div>
                        {compareMode && comparisonMetrics ? (
                            <ComparisonChart
                                title="Service Revenue Comparison"
                                periodAData={metrics.topServices}
                                periodBData={comparisonMetrics.topServices}
                                dataKey="revenue"
                                periodALabel="Period A"
                                periodBLabel="Period B"
                                formatValue={(val) => `$${val.toLocaleString()}`}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all mb-6">
                                <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-3 border-b border-green-100">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                                            <Scissors className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-gray-900">Service Rankings</span>
                                    </div>
                                </div>
                                {metrics.topServices.map((service, index) => (
                                    <div key={service.name} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="relative group/rank flex-shrink-0">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${index === 0 ? 'from-yellow-400 to-orange-500' :
                                                    index === 1 ? 'from-gray-300 to-gray-400' :
                                                        index === 2 ? 'from-orange-400 to-red-500' :
                                                            'from-gray-100 to-gray-200'
                                                    } rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
                                                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-900">{service.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-gray-900">${service.revenue.toLocaleString()}</span>
                                            <span className="text-xs font-semibold text-green-600">{service.share.toFixed(0)}% share</span>
                                        </div>
                                    </div>
                                ))}
                                {metrics.topServices.length === 0 && (
                                    <div className="p-12 text-center">
                                        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">No service data yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. VIP CLIENTS */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-2 mt-8">
                            <div className="p-1.5 bg-yellow-50 rounded-lg">
                                <Crown className="w-4 h-4 text-yellow-600" />
                            </div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">VIP Clients</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all mb-6">
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-3 border-b border-yellow-100">
                                <div className="grid grid-cols-12 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-11 md:col-span-5">Client</div>
                                    <div className="col-span-3 text-right hidden md:block">Spent</div>
                                    <div className="col-span-3 text-right hidden md:block">Visits</div>
                                </div>
                            </div>
                            {metrics.topClients.map((client, index) => (
                                <div key={client.email} className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gradient-to-r hover:from-yellow-50/30 hover:to-orange-50/30 transition-all">
                                    <div className="col-span-1 relative group/rank">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${index === 0 ? 'from-yellow-400 to-orange-500' :
                                            index === 1 ? 'from-gray-300 to-gray-400' :
                                                index === 2 ? 'from-orange-400 to-red-500' :
                                                    'from-gray-100 to-gray-200'
                                            } rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
                                        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="col-span-11 md:col-span-5">
                                        <p className="font-bold text-gray-900 truncate">{client.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                    </div>
                                    <div className="col-span-3 text-right font-black text-gray-900 hidden md:block">
                                        ${client.spent.toLocaleString()}
                                    </div>
                                    <div className="col-span-3 text-right hidden md:block">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold">
                                            {client.visits} visits
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {metrics.topClients.length === 0 && (
                                <div className="p-12 text-center">
                                    <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">No client data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }


            {/* === TEAM VIEW (NEW) === */}
            {
                viewMode === 'team' && (
                    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-[90vw] mx-auto md:max-w-full">

                        {/* Performance Leaderboard - TOP SUMMARY */}
                        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                                <h4 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    Performance Leaderboard
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">Team performance summary and rankings</p>
                            </div>

                            <div className="overflow-x-auto w-full">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-1 md:px-6 py-3 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider w-8 md:w-auto">
                                                <span className="md:hidden">#</span>
                                                <span className="hidden md:inline">Rank</span>
                                            </th>
                                            <SortableHeader label="Staff" sortKey="name" align="left" className="w-24 md:w-auto" />
                                            <SortableHeader label="Rev" sortKey="revenue" align="right" mobileLabel="Rev" />
                                            <SortableHeader label="Hours" sortKey="hours" align="right" mobileLabel="Hrs" />
                                            <SortableHeader label="Util" sortKey="utilization" align="right" mobileLabel="Util" />
                                            <SortableHeader label="Rebook" sortKey="rebookingRate" align="right" mobileLabel="Rtnt" />
                                            <SortableHeader label="No-Show" sortKey="noShowRate" align="right" mobileLabel="NS" />
                                            <SortableHeader label="Clients" sortKey="clients" align="right" mobileLabel="Clts" />
                                            <SortableHeader label="Avg Tkt" sortKey="avgTicket" align="right" mobileLabel="Avg" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedStaff.length > 0 ? (
                                            sortedStaff.map((staff, index) => (
                                                <tr key={staff.name} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap">
                                                        <div className={`w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-full font-bold text-[10px] md:text-xs
                                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                                                    index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}
                                                    `}>
                                                            #{index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap max-w-[80px] md:max-w-none">
                                                        <div className="flex items-center">
                                                            <div className="h-5 w-5 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-[#A855F7] to-[#d946ef] flex items-center justify-center text-white font-bold mr-1.5 md:mr-3 text-[10px] md:text-sm shrink-0 shadow-sm shadow-[#d946ef]/20">
                                                                {staff.name.charAt(0)}
                                                            </div>
                                                            <div className="text-[10px] md:text-sm font-bold text-gray-900 truncate">{staff.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm font-bold text-gray-900">
                                                        ${staff.revenue.toLocaleString()}
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm text-gray-600">
                                                        {staff.hours.toFixed(1)}
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm">
                                                        <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${staff.utilization > 80 ? 'bg-green-100 text-green-800' :
                                                            staff.utilization > 50 ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {staff.utilization.toFixed(0)}%

                                                        </span>
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm text-gray-600 font-medium">
                                                        {staff.rebookingRate.toFixed(0)}%
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm text-gray-600 font-medium">
                                                        {staff.noShowRate.toFixed(0)}%
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm text-gray-600">
                                                        {staff.clients}
                                                    </td>
                                                    <td className="px-1 md:px-6 py-4 whitespace-nowrap text-right text-[10px] md:text-sm text-gray-600">
                                                        ${staff.avgTicket.toFixed(0)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <Trophy className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Team Data Available</h3>
                                                            <p className="text-sm text-gray-500">
                                                                No appointments found for this time period.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Detailed Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {compareMode && comparisonMetrics ? (
                                <>
                                    <ComparisonChart
                                        title="Revenue by Staff"
                                        periodAData={teamRevenueData}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], revenue: s.revenue }))}
                                        dataKey="revenue"
                                        formatValue={(val) => `$${val.toLocaleString()}`}
                                    />
                                    <ComparisonChart
                                        title="Utilization Rate"
                                        periodAData={teamUtilizationData}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], utilization: s.utilization }))}
                                        dataKey="utilization"
                                        formatValue={(val) => `${val}%`}
                                    />
                                    <ComparisonChart
                                        title="Hours Worked"
                                        periodAData={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], hours: s.hours }))}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], hours: s.hours }))}
                                        dataKey="hours"
                                        formatValue={(val) => `${val}h`}
                                    />
                                    <ComparisonChart
                                        title="Rebooking Rate"
                                        periodAData={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], rebooking: s.rebookingRate }))}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], rebooking: s.rebookingRate }))}
                                        dataKey="rebooking"
                                        formatValue={(val) => `${val}%`}
                                    />
                                    <ComparisonChart
                                        title="No-Show Rate"
                                        periodAData={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], noShow: s.noShowRate }))}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], noShow: s.noShowRate }))}
                                        dataKey="noShow"
                                        formatValue={(val) => `${val}%`}
                                    />
                                    <ComparisonChart
                                        title="Client Count"
                                        periodAData={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], clients: s.clients }))}
                                        periodBData={comparisonMetrics.topStaff.map(s => ({ name: s.name.split(' ')[0], clients: s.clients }))}
                                        dataKey="clients"
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Revenue Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                                <DollarSign className="w-5 h-5 text-white" />
                                            </div>
                                            Revenue by Staff
                                        </h4>
                                        <div className="h-64 overflow-x-auto no-scrollbar">
                                            <div className="h-full min-w-[300px]">
                                                {teamRevenueData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={teamRevenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                            <XAxis
                                                                dataKey="name"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fontSize: 9, fill: '#6B7280' }}
                                                                interval={0}
                                                                dy={5}
                                                                tickFormatter={(val) => val.slice(0, 3)}
                                                            />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                                                            <Tooltip
                                                                cursor={{ fill: '#F3F4F6' }}
                                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                            />
                                                            <Bar dataKey="revenue" fill="#2D165D" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                                {teamRevenueData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#2D165D', '#7C3AED', '#6D28D9', '#8B5CF6'][index % 4]} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                        <DollarSign className="w-8 h-8 opacity-20 mb-2" />
                                                        <span className="text-xs font-medium">No revenue data</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Utilization Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg">
                                                <Activity className="w-5 h-5 text-white" />
                                            </div>
                                            Utilization Rate
                                        </h4>
                                        <div className="h-64 overflow-x-auto no-scrollbar">
                                            <div className="h-full min-w-[300px]">
                                                {teamUtilizationData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={teamUtilizationData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                            <XAxis
                                                                dataKey="name"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fontSize: 9, fill: '#6B7280' }}
                                                                interval={0}
                                                                dy={5}
                                                                tickFormatter={(val) => val.slice(0, 3)}
                                                            />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(val) => `${val}%`} />
                                                            <Tooltip
                                                                cursor={{ fill: '#F3F4F6' }}
                                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                            />
                                                            <Bar dataKey="utilization" fill="#7C3AED" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                                {teamUtilizationData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA'][index % 4]} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                        <Activity className="w-8 h-8 opacity-20 mb-2" />
                                                        <span className="text-xs font-medium">No utilization data</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hours Worked Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                                <Clock className="w-5 h-5 text-white" />
                                            </div>
                                            Hours Worked
                                        </h4>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], hours: s.hours }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 9, fill: '#6B7280' }}
                                                        interval={0}
                                                        dy={5}
                                                        tickFormatter={(val) => val.slice(0, 3)}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F3F4F6' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="hours" fill="#6D28D9" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                        {metrics.topStaff.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#6D28D9', '#8B5CF6', '#A78BFA', '#2D165D'][index % 4]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Rebooking Rate Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-primary-700 to-primary-600 rounded-lg">
                                                <Repeat className="w-5 h-5 text-white" />
                                            </div>
                                            Rebooking Rate
                                        </h4>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], rebooking: s.rebookingRate }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 9, fill: '#6B7280' }}
                                                        interval={0}
                                                        dy={5}
                                                        tickFormatter={(val) => val.slice(0, 3)}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(val) => `${val}%`} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F3F4F6' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="rebooking" fill="#2D165D" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                        {metrics.topStaff.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#2D165D', '#7C3AED', '#6D28D9', '#8B5CF6'][index % 4]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* No-Show Rate Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                                                <UserMinus className="w-5 h-5 text-white" />
                                            </div>
                                            No-Show Rate
                                        </h4>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], noShow: s.noShowRate }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 9, fill: '#6B7280' }}
                                                        interval={0}
                                                        dy={5}
                                                        tickFormatter={(val) => val.slice(0, 3)}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(val) => `${val}%`} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F3F4F6' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="noShow" fill="#F59E0B" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                        {metrics.topStaff.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#F59E0B', '#EF4444', '#F97316', '#FB923C'][index % 4]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Client Count Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-400 rounded-lg">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            Client Count
                                        </h4>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.topStaff.map(s => ({ name: s.name.split(' ')[0], clients: s.clients }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 9, fill: '#6B7280' }}
                                                        interval={0}
                                                        dy={5}
                                                        tickFormatter={(val) => val.slice(0, 3)}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F3F4F6' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="clients" fill="#7C3AED" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                                        {metrics.topStaff.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA'][index % 4]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }



            {/* Drill-Down Modal */}
            {
                drillDownMetric && (
                    <DrillDownModal
                        isOpen={true}
                        onClose={() => setDrillDownMetric(null)}
                        title={
                            drillDownMetric === 'revenue' ? 'Revenue Breakdown' :
                                drillDownMetric === 'utilization' ? 'Utilization Analysis' :
                                    drillDownMetric === 'clients' ? 'Client Insights' :
                                        'Appointment Details'
                        }
                        metric={drillDownMetric as 'revenue' | 'utilization' | 'clients' | 'appointments'}
                        data={metrics}
                        compareMode={compareMode}
                        comparisonData={comparisonMetrics}
                    />
                )
            }
        </div >
    );
}

