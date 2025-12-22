'use client';

import React, { useState, useMemo } from 'react';
import { Appointment, Service } from '@/types';
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    HelpCircle,
    Activity,
    Target
} from 'lucide-react';
import {
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfYear, endOfYear,
    isWithinInterval, parseISO,
    subDays, subMonths, subWeeks, subYears,
    format, startOfToday, endOfToday
} from 'date-fns';
import AnalyticsDatePicker, { DateRange, DateRangePreset } from '../admin/AnalyticsDatePicker';

interface StaffStatsProps {
    appointments: Appointment[];
    services: Service[];
    currentStaffId: string;
}

type Timeframe = 'today' | 'week' | 'month' | 'year';

export default function StaffStats({ appointments, services, currentStaffId }: StaffStatsProps) {
    const [compareMode, setCompareMode] = useState(false);

    // Initial Ranges (Period A: This Week, Period B: Last Week)
    const [selectedRange, setSelectedRange] = useState<DateRange>({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });

    const [comparisonRange, setComparisonRange] = useState<DateRange>({
        start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
    });

    const handleRangeChange = (range: DateRange, preset: DateRangePreset) => {
        setSelectedRange(range);
    };

    const handleComparisonRangeChange = (range: DateRange, preset: DateRangePreset) => {
        setCompareMode(true);
        setComparisonRange(range);
    };

    // All NON-CANCELLED appointments for THIS staff member
    const myAppointments = useMemo(() =>
        appointments.filter(a => a.staffId === currentStaffId && a.status !== 'CANCELLED'),
        [appointments, currentStaffId]);

    // Data Filtering & Calculation
    const stats = useMemo(() => {
        const currentApts = myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
            start: selectedRange.start,
            end: selectedRange.end
        }));

        const prevApts = myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
            start: comparisonRange.start,
            end: comparisonRange.end
        }));

        const calculateRevenue = (apts: Appointment[]) => apts.reduce((sum, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return sum + (service?.price || 0);
        }, 0);

        const calculateClients = (apts: Appointment[]) => new Set(apts.map(a => a.clientEmail)).size;

        const currRev = calculateRevenue(currentApts);
        const prevRev = calculateRevenue(prevApts);
        const currAptCount = currentApts.length;
        const prevAptCount = prevApts.length;
        const currClients = calculateClients(currentApts);
        const prevClients = calculateClients(prevApts);

        const getGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        return {
            revenue: { value: currRev, growth: getGrowth(currRev, prevRev) },
            appointments: { value: currAptCount, growth: getGrowth(currAptCount, prevAptCount) },
            clients: { value: currClients, growth: getGrowth(currClients, prevClients) },
            avgTicket: {
                value: currAptCount > 0 ? Math.round(currRev / currAptCount) : 0,
                growth: getGrowth(currRev / (currAptCount || 1), prevRev / (prevAptCount || 1))
            }
        };
    }, [myAppointments, services, selectedRange, comparisonRange]);

    return (
        <div className="space-y-8 pb-24 px-4 lg:px-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary-600" />
                        My Performance
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Track your personal growth and impact.</p>
                </div>

                {/* Range Selectors */}
                <div className="flex flex-col gap-4 items-end">
                    {compareMode ? (
                        <div className="flex flex-col gap-3 w-full lg:w-auto">
                            {/* Period A */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl whitespace-nowrap uppercase tracking-widest">
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
                                <span className="text-xs font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl whitespace-nowrap uppercase tracking-widest">
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
                                className="w-full px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Exit Compare
                            </button>
                            {/* Appointment Count Detail Detail */}
                            <div className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm space-y-1 font-bold">
                                <div className="text-gray-900">
                                    Total Appointments: <span className="font-black text-gray-900">{myAppointments.length}</span>
                                </div>
                                <div className="text-blue-600">
                                    Period A: <span className="font-black">{
                                        myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
                                            start: selectedRange.start,
                                            end: selectedRange.end
                                        })).length
                                    }</span>
                                </div>
                                <div className="text-purple-600">
                                    Period B: <span className="font-black">{
                                        myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
                                            start: comparisonRange.start,
                                            end: comparisonRange.end
                                        })).length
                                    }</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-4">
                            <AnalyticsDatePicker
                                selectedRange={selectedRange}
                                onRangeChange={handleRangeChange}
                                compareMode={false}
                                onCompareModeToggle={setCompareMode}
                            />
                            {/* Quick Compare Button */}
                            <button
                                onClick={() => {
                                    setCompareMode(true);
                                }}
                                className="px-6 py-3 bg-white border-2 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4 opacity-50" />
                                Compare
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="My Revenue"
                    value={`$${stats.revenue.value}`}
                    growth={stats.revenue.growth}
                    showGrowth={compareMode}
                    icon={DollarSign}
                    gradient="from-blue-500 to-cyan-500"
                    description="Total generated income"
                />
                <StatCard
                    label="My Appointments"
                    value={stats.appointments.value}
                    growth={stats.appointments.growth}
                    showGrowth={compareMode}
                    icon={Calendar}
                    gradient="from-purple-500 to-pink-500"
                    description="Sessions completed"
                />
                <StatCard
                    label="My Clients"
                    value={stats.clients.value}
                    growth={stats.clients.growth}
                    showGrowth={compareMode}
                    icon={Users}
                    gradient="from-orange-500 to-amber-500"
                    description="Unique customers served"
                />
                <StatCard
                    label="Avg. Session Value"
                    value={`$${stats.avgTicket.value}`}
                    growth={stats.avgTicket.growth}
                    showGrowth={compareMode}
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-teal-500"
                    description="Average revenue per visit"
                />
            </div>

            {/* Comparison Insights & Personal Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Insights Panel */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 overflow-hidden relative">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-50 rounded-full opacity-50 blur-3xl"></div>

                    <div className="relative flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Period Insights</h3>
                            <p className="text-gray-500 text-sm font-medium">
                                {compareMode ? `How you're trending compared to Period B.` : `Your performance summary for the selected period.`}
                            </p>
                        </div>
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                            <Target className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <InsightRow
                            label="Revenue Velocity"
                            curr={stats.revenue.value}
                            growth={stats.revenue.growth}
                            showGrowth={compareMode}
                            isCurrency={true}
                        />
                        <InsightRow
                            label="Client Retention"
                            curr={stats.clients.value}
                            growth={stats.clients.growth}
                            showGrowth={compareMode}
                            isPercentage={false}
                        />
                        <InsightRow
                            label="Session Frequency"
                            curr={stats.appointments.value}
                            growth={stats.appointments.growth}
                            showGrowth={compareMode}
                        />
                    </div>
                </div>

                {/* Motivational Achievement Card */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                    </div>

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border-b-2 border-yellow-600">
                            Performance Badge
                        </div>
                        <h4 className="text-3xl font-black mb-4 leading-tight tracking-tight">You're Rising Above!</h4>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            {stats.revenue.growth >= 0
                                ? "Your numbers are looking strong. Keep up this momentum to hit your next personal records!"
                                : "Consistency is key to growth. Focus on re-bookings and the numbers will follow."
                            }
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">+5 Achievements</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, growth, showGrowth, icon: Icon, gradient, description }: any) {
    const isPositive = growth >= 0;

    return (
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-125 transition-transform duration-500`}></div>

            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-gray-200/20`}>
                    <Icon className="w-6 h-6" />
                </div>
                {showGrowth && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>

            <div className="space-y-1 relative">
                <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</h4>
                <div className="text-4xl font-black text-gray-900 tracking-tighter">{value}</div>
                <p className="text-gray-400 text-[10px] font-bold mt-2">{description}</p>
            </div>
        </div>
    );
}

function InsightRow({ label, curr, growth, showGrowth, isCurrency = false, isPercentage = false }: any) {
    const isPositive = growth >= 0;

    return (
        <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
            <div className="flex flex-col">
                <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{label}</span>
                <span className="text-xs text-gray-500 font-bold mt-0.5">Performance Trend</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-xl font-black text-gray-900">
                        {isCurrency ? `$${Math.round(curr)}` : curr}{isPercentage ? '%' : ''}
                    </div>
                </div>
                {showGrowth && (
                    <div className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>
        </div>
    );
}
