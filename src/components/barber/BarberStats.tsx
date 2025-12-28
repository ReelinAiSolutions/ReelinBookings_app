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
    Target,
    Trophy,
    Star,
    Award,
    Zap
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
import StatCard from '../admin/StatCard';

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

        const lifetimeRevenue = myAppointments.reduce((sum, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return sum + (service?.price || 0);
        }, 0);
        const lifetimeBookings = myAppointments.length;

        const getRankInfo = (totalRev: number, totalApts: number) => {
            const tiers = [
                { name: 'LEGEND', rev: 1000000, apts: 10000, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { name: 'MASTER', rev: 500000, apts: 5000, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { name: 'ELITE', rev: 100000, apts: 1000, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { name: 'PRO', rev: 10000, apts: 100, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { name: 'RISING STAR', rev: 0, apts: 0, color: 'text-gray-400', bg: 'bg-gray-500/10' }
            ];

            let currentTierIndex = tiers.length - 1;
            for (let i = 0; i < tiers.length - 1; i++) {
                if (totalRev >= tiers[i].rev && totalApts >= tiers[i].apts) {
                    currentTierIndex = i;
                    break;
                }
            }

            const currentTier = tiers[currentTierIndex];
            const nextTier = currentTierIndex > 0 ? tiers[currentTierIndex - 1] : null;

            return {
                name: currentTier.name,
                color: currentTier.color,
                bg: currentTier.bg,
                next: nextTier,
                revProgress: nextTier ? Math.min(100, Math.round((totalRev / nextTier.rev) * 100)) : 100,
                aptProgress: nextTier ? Math.min(100, Math.round((totalApts / nextTier.apts) * 100)) : 100
            };
        };

        const rank = getRankInfo(lifetimeRevenue, lifetimeBookings);

        return {
            revenue: { value: currRev, growth: getGrowth(currRev, prevRev) },
            appointments: { value: currAptCount, growth: getGrowth(currAptCount, prevAptCount) },
            clients: { value: currClients, growth: getGrowth(currClients, prevClients) },
            avgTicket: {
                value: currAptCount > 0 ? Math.round(currRev / currAptCount) : 0,
                growth: getGrowth(currRev / (currAptCount || 1), prevRev / (prevAptCount || 1))
            },
            rank,
            lifetimeRevenue,
            lifetimeBookings
        };
    }, [myAppointments, services, selectedRange, comparisonRange]);

    return (
        <div className="space-y-8 pb-24 px-4 lg:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 md:gap-3">
                            <div className="p-2 bg-primary-50 rounded-xl">
                                <Activity className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                            </div>
                            Performance Analytics
                        </h1>
                        <p className="text-gray-500 text-xs md:text-sm font-medium mt-1">Track your growth and impact.</p>
                    </div>
                </div>

                {/* Range Selectors - Mobile Optimized */}
                <div className="w-full">
                    {compareMode ? (
                        <div className="flex flex-col gap-3">
                            {/* Period A */}
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-widest border border-blue-100">
                                    P. A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <AnalyticsDatePicker
                                        selectedRange={selectedRange}
                                        onRangeChange={handleRangeChange}
                                        compareMode={false}
                                    />
                                </div>
                            </div>
                            {/* Period B */}
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-widest border border-purple-100">
                                    P. B
                                </div>
                                <div className="flex-1 min-w-0">
                                    <AnalyticsDatePicker
                                        selectedRange={comparisonRange}
                                        onRangeChange={handleComparisonRangeChange}
                                        compareMode={false}
                                    />
                                </div>
                            </div>
                            {/* Exit Compare Button */}
                            <button
                                onClick={() => setCompareMode(false)}
                                className="w-full mt-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Exit Comparison
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 min-w-0">
                                <AnalyticsDatePicker
                                    selectedRange={selectedRange}
                                    onRangeChange={handleRangeChange}
                                    compareMode={false}
                                />
                            </div>
                            {/* Quick Compare Button */}
                            <button
                                onClick={() => setCompareMode(true)}
                                className="sm:w-auto px-6 py-3 bg-white border-2 border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-200 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Compare
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Metric Cards - Using Shared StatCard for Color Pop */}
            {/* FIX: Switch grid-cols-2 to grid-cols-1 for better mobile readability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="My Revenue"
                    value={`$${stats.revenue.value}`}
                    growth={stats.revenue.growth}
                    trend={stats.revenue.growth >= 0 ? 'up' : 'down'}
                    icon={DollarSign}
                    color="green"
                    delay={100}
                />
                <StatCard
                    title="Appointments"
                    value={stats.appointments.value}
                    growth={stats.appointments.growth}
                    trend={stats.appointments.growth >= 0 ? 'up' : 'down'}
                    icon={Calendar}
                    color="indigo"
                    delay={200}
                />
                <StatCard
                    title="My Clients"
                    value={stats.clients.value}
                    growth={stats.clients.growth}
                    trend={stats.clients.growth >= 0 ? 'up' : 'down'}
                    icon={Users}
                    color="blue"
                    delay={300}
                />
                <StatCard
                    title="Avg. Session"
                    value={`$${stats.avgTicket.value}`}
                    growth={stats.avgTicket.growth}
                    trend={stats.avgTicket.growth >= 0 ? 'up' : 'down'}
                    icon={TrendingUp}
                    color="emerald"
                    delay={400}
                />
            </div>

            {/* Comparison Insights & Personal Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Insights Panel */}
                <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 md:p-10 overflow-hidden relative group">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-50 rounded-full opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="relative flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-primary-600" />
                                Period Insights
                            </h3>
                            <p className="text-gray-500 text-xs md:text-sm font-medium">
                                {compareMode ? `How you're trending compared to Period B.` : `Your performance summary for the selected period.`}
                            </p>
                        </div>
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl shadow-inner">
                            <Target className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <InsightRow
                            label="Revenue Velocity"
                            curr={stats.revenue.value}
                            growth={stats.revenue.growth}
                            showGrowth={compareMode}
                            isCurrency={true}
                            color="green"
                        />
                        <InsightRow
                            label="Client Retention"
                            curr={stats.clients.value}
                            growth={stats.clients.growth}
                            showGrowth={compareMode}
                            isPercentage={false}
                            color="blue"
                        />
                        <InsightRow
                            label="Session Frequency"
                            curr={stats.appointments.value}
                            growth={stats.appointments.growth}
                            showGrowth={compareMode}
                            color="emerald"
                        />
                    </div>
                </div>

                {/* Elite Performance Hub */}
                <div className={`bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group`}>
                    {/* Background Dynamic Glow - Color Pop */}
                    <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-30 transition-all duration-1000 ${stats.rank.name === 'LEGEND' ? 'bg-purple-600'
                        : stats.rank.name === 'MASTER' ? 'bg-blue-600'
                            : stats.rank.name === 'ELITE' ? 'bg-emerald-600'
                                : 'bg-yellow-600'
                        }`} />

                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Trophy className="w-32 h-32" />
                    </div>

                    <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest border-b-2 border-amber-600 shadow-lg shadow-yellow-500/20">
                                <Zap className="w-3 h-3" />
                                Elite Performance
                            </div>
                            <div className={`px-4 py-1.5 rounded-xl ${stats.rank.bg} ${stats.rank.color} border border-white/10 text-[10px] font-black tracking-[0.2em] shadow-lg`}>
                                {stats.rank.name}
                            </div>
                        </div>

                        <h4 className="text-3xl font-black mb-4 leading-tight tracking-tight">
                            {stats.rank.name === 'LEGEND' ? 'Peak of the Industry' : 'The Path to Greatness'}
                        </h4>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
                            {stats.rank.next
                                ? `Unlock ${stats.rank.next.name} status by hitting both career milestones below.`
                                : "You've reached LEGEND status. Your name is etched into the history of this organization."
                            }
                        </p>

                        {/* Achievement Badges - More Vibrant */}
                        <div className="flex gap-4 mb-8">
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${stats.rank.name !== 'RISING STAR'
                                    ? 'text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] border-yellow-400/50 scale-110 bg-yellow-400/10'
                                    : 'text-gray-600 opacity-20'
                                    }`}>
                                    <Trophy className="w-7 h-7" />
                                </div>
                                <span className={`text-[10px] font-bold ${stats.rank.name !== 'RISING STAR' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-widest`}>PRO</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${['ELITE', 'MASTER', 'LEGEND'].includes(stats.rank.name)
                                    ? 'text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)] border-blue-400/50 scale-110 bg-blue-400/10'
                                    : 'text-gray-600 opacity-20'
                                    }`}>
                                    <Star className="w-7 h-7" />
                                </div>
                                <span className={`text-[10px] font-bold ${['ELITE', 'MASTER', 'LEGEND'].includes(stats.rank.name) ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-widest`}>ELITE</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${stats.rank.name === 'LEGEND'
                                    ? 'text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-400/50 scale-110 bg-purple-400/10'
                                    : 'text-gray-600 opacity-20'
                                    }`}>
                                    <Award className="w-7 h-7" />
                                </div>
                                <span className={`text-[10px] font-bold ${stats.rank.name === 'LEGEND' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-widest`}>LEGEND</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress to Next Rank - Vibrant Bars */}
                    <div className="mt-4 pt-6 border-t border-white/10 space-y-6">
                        {stats.rank.next && (
                            <>
                                {/* Revenue Progress */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                                Revenue Target: ${stats.rank.next.rev.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-amber-500 shadow-amber-500/20">
                                                ${stats.lifetimeRevenue.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-500">/ ${stats.rank.next.rev.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000"
                                            style={{ width: `${stats.rank.revProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Booking Progress */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                                Booking Target: {stats.rank.next.apts.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-blue-500 shadow-blue-500/20">
                                                {stats.lifetimeBookings.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-500">/ {stats.rank.next.apts.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                            style={{ width: `${stats.rank.aptProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        {!stats.rank.next && (
                            <div className="py-6 text-center bg-purple-500/5 rounded-[2rem] border border-purple-500/20">
                                <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] animate-pulse">
                                    LEGENDARY STATUS ACTIVE
                                </div>
                                <p className="text-xs text-gray-500 font-medium mt-2 italic">You have conquered the industry.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


function InsightRow({ label, curr, growth, showGrowth, isCurrency = false, isPercentage = false, color = 'blue' }: any) {
    const isPositive = growth >= 0;

    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100'
    };

    const activeColor = colors[color] || colors.blue;

    return (
        <div className="flex items-center justify-between p-4 md:p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 relative group/row">
            <div className={`absolute inset-y-2 left-0 w-1 bg-current rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity ${activeColor.split(' ')[0]}`} />
            <div className="flex flex-col">
                <span className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] text-gray-400 font-bold mt-0.5">Performance Trend</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                    <div className="text-lg md:text-xl font-black text-gray-900">
                        {isCurrency ? `$${Math.round(curr).toLocaleString()}` : curr}{isPercentage ? '%' : ''}
                    </div>
                </div>
                {showGrowth && (
                    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>
        </div>
    );
}
