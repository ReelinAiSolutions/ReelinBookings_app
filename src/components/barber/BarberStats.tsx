'use client';

import React, { useState, useMemo } from 'react';
import { Appointment, Service, AppointmentStatus } from '@/types';
import {
    DollarSign,
    Briefcase,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Ban,
    Users2,
    Calendar as CalendarIcon,
    Sparkles,
    UserMinus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    format, startOfWeek, addDays, isSameDay, subDays,
    startOfYear, eachMonthOfInterval, isWithinInterval,
    startOfMonth, subMonths, endOfDay, startOfDay,
    subWeeks, getYear, differenceInDays, getHours
} from 'date-fns';

interface StaffStatsProps {
    appointments: Appointment[];
    services: Service[];
    currentStaffId: string;
}

type TimeRange = 'week' | 'month' | 'year' | 'custom';
type TabType = 'my_stats' | 'clients';

export default function StaffStats({ appointments, services, currentStaffId }: StaffStatsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('my_stats');
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // --- DATE FILTERING HELPER ---
    const getDateRange = (range: TimeRange, offset = 0) => {
        const now = new Date();

        if (range === 'custom') {
            const start = startOfDay(new Date(customDateRange.start));
            const end = endOfDay(new Date(customDateRange.end));
            if (offset > 0) {
                const duration = differenceInDays(end, start) + 1;
                const prevEnd = subDays(start, 1);
                return { start: subDays(prevEnd, duration - 1), end: endOfDay(prevEnd) };
            }
            return { start, end };
        }

        if (range === 'week') {
            const start = subWeeks(startOfDay(now), offset);
            return { start: subDays(start, 6), end: endOfDay(start) };
        }
        if (range === 'month') {
            const start = subMonths(startOfMonth(now), offset);
            return { start, end: offset === 0 ? endOfDay(now) : endOfDay(new Date(now.getFullYear(), now.getMonth() - offset + 1, 0)) };
        }
        const start = subDays(startOfYear(now), offset * 365);
        return { start: startOfYear(start), end: endOfDay(now) };
    };

    // --- DATA CALCULATIONS ---
    const currentRange = getDateRange(timeRange);
    const previousRange = getDateRange(timeRange, 1);

    // *CRITICAL*: Filter appointments for THIS staff member appropriately
    const myAppointments = useMemo(() =>
        appointments.filter(a => a.staffId === currentStaffId),
        [appointments, currentStaffId]
    );

    const filterAppointments = (range: { start: Date, end: Date }) => {
        return myAppointments.filter(apt => {
            if (apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.NO_SHOW) return false;
            const d = new Date(apt.date);
            return isWithinInterval(d, { start: range.start, end: range.end });
        });
    };

    const filterAllAppointments = (range: { start: Date, end: Date }) => {
        // Including cancelled for metrics
        return myAppointments.filter(apt => {
            const d = new Date(apt.date);
            return isWithinInterval(d, { start: range.start, end: range.end });
        });
    }

    const currentAppointments = useMemo(() => filterAllAppointments(currentRange), [myAppointments, timeRange, currentRange]);
    const previousAppointments = useMemo(() => filterAllAppointments(previousRange), [myAppointments, timeRange, previousRange]);

    const getStats = (apts: Appointment[]) => {
        const valid = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
        const cancelled = apts.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

        const revenue = valid.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.price || 0), 0);
        const lostRevenue = cancelled.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.price || 0), 0);
        const bookedMinutes = valid.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.durationMinutes || 0), 0);

        return { revenue, bookings: valid.length, cancelled: cancelled.length, valid, lostRevenue, bookedMinutes };
    };

    const currentStats = useMemo(() => getStats(currentAppointments), [currentAppointments, services]);
    const previousStats = useMemo(() => getStats(previousAppointments), [previousAppointments, services]);

    const calcChange = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return ((current - prev) / prev) * 100;
    };

    const revenueChange = calcChange(currentStats.revenue, previousStats.revenue);
    const bookingsChange = calcChange(currentStats.bookings, previousStats.bookings);

    // Occupancy Rate
    const occupancyRate = useMemo(() => {
        const days = differenceInDays(currentRange.end, currentRange.start) + 1;
        // Assuming 8 hours/day for single staff
        const totalCapacityMinutes = days * 8 * 60;
        return Math.min(100, Math.round((currentStats.bookedMinutes / totalCapacityMinutes) * 100));
    }, [currentStats.bookedMinutes, currentRange]);

    // Revenue Graph Data
    const revenueGraphData = useMemo(() => {
        let buckets: { name: string, value: number }[] = [];
        const daysDiff = differenceInDays(currentRange.end, currentRange.start);

        if (daysDiff <= 31) {
            let curr = currentRange.start;
            while (curr <= currentRange.end) {
                const d = curr;
                const val = currentStats.valid.filter(a => isSameDay(new Date(a.date), d)).reduce((sum, a) => sum + (services.find(s => s.id === a.serviceId)?.price || 0), 0);
                buckets.push({ name: format(d, 'd'), value: val });
                curr = addDays(curr, 1);
            }
        } else {
            const months = eachMonthOfInterval({ start: currentRange.start, end: currentRange.end });
            buckets = months.map(d => {
                const val = currentStats.valid.filter(a => new Date(a.date).getMonth() === d.getMonth() && getYear(new Date(a.date)) === getYear(d)).reduce((sum, a) => sum + (services.find(s => s.id === a.serviceId)?.price || 0), 0);
                return { name: format(d, 'MMM'), value: val };
            });
        }
        return buckets;
    }, [currentRange, currentStats.valid, services]);

    // Top Services (My Services)
    const topServices = useMemo(() => {
        const serviceMap = new Map<string, { name: string, count: number, revenue: number }>();
        currentStats.valid.forEach(apt => {
            const s = services.find(srv => srv.id === apt.serviceId);
            if (!s) return;
            const curr = serviceMap.get(s.id) || { name: s.name, count: 0, revenue: 0 };
            curr.count++;
            curr.revenue += s.price;
            serviceMap.set(s.id, curr);
        });
        return Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [currentStats.valid, services]);

    // Client Metrics
    const clientMetrics = useMemo(() => {
        const uniqueClientsPeriod = Array.from(new Set(currentStats.valid.map(a => a.clientEmail)));
        let newUnique = 0;
        let retUnique = 0;
        // Clients I've seen before this period
        const historicSet = new Set(myAppointments.filter(a => new Date(a.date) < currentRange.start).map(a => a.clientEmail));

        uniqueClientsPeriod.forEach(email => {
            if (historicSet.has(email)) retUnique++;
            else newUnique++;
        });

        // Retention Risk
        const ninetyDaysAgo = subDays(new Date(), 90);
        const myClients = Array.from(new Set(myAppointments.map(a => a.clientEmail)));
        let atRisk = 0;
        myClients.forEach(email => {
            const clientApts = myAppointments.filter(a => a.clientEmail === email).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (clientApts.length > 0) {
                const lastVisit = new Date(clientApts[0].date);
                if (lastVisit < ninetyDaysAgo) atRisk++;
            }
        });

        return {
            mix: [
                { name: 'Returning', value: retUnique, color: '#4F46E5' },
                { name: 'New', value: newUnique, color: '#10B981' }
            ],
            totalActive: uniqueClientsPeriod.length,
            atRisk
        };
    }, [currentStats.valid, myAppointments, currentRange]);

    // --- RENDERERS ---

    const renderMyStats = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: HERO & KEY METRICS */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Revenue Card */}
                <div className="xl:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 min-h-[320px] flex flex-col justify-between group">
                    {/* Decorative Blurs */}
                    <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-white/10 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h1 className="text-6xl font-black tracking-tight mb-2">${currentStats.revenue.toLocaleString()}</h1>
                                <p className="text-indigo-200 font-medium text-lg">My Revenue generated this {timeRange}</p>
                            </div>
                            <div className={`flex items-center gap-1 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 ${revenueChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {revenueChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                <span className="font-bold text-lg">{Math.abs(revenueChange).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-40 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueGraphData}>
                                <defs>
                                    <linearGradient id="colorWhiteStaff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={4} fill="url(#colorWhiteStaff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Metrics Grid */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bookings Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px] hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${bookingsChange >= 0 ? 'bg-blue-100/50 text-blue-700' : 'bg-red-100/50 text-red-700'}`}>
                                {bookingsChange >= 0 ? '+' : ''}{bookingsChange.toFixed(0)}%
                            </span>
                        </div>
                        <div>
                            <h3 className="text-5xl font-black text-gray-900 mb-2">{currentStats.bookings}</h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">My Bookings</p>
                        </div>
                    </div>

                    {/* Occupancy Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[240px] hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-8 left-8">Utilization</h3>
                        <div className="relative w-32 h-32 mt-4">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * occupancyRate) / 100} className="text-indigo-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                                <span className="text-3xl font-black text-gray-900">{occupancyRate}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Lost Revenue */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px] hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                <Ban className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-5xl font-black text-gray-900 mb-2">${currentStats.lostRevenue.toLocaleString()}</h3>
                            <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Missed Opportunities</p>
                            <p className="text-gray-400 text-[10px] font-medium mt-1">Cancellations & No-shows</p>
                        </div>
                    </div>

                    {/* Client Mix - Small Card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px] hover:shadow-lg transition-shadow duration-300 relative">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-6 left-6">Client Mix</h3>
                        <div className="h-32 w-full mt-6 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={clientMetrics.mix} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {clientMetrics.mix.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-gray-900">{clientMetrics.totalActive}</span>
                            </div>
                        </div>
                        <div className="flex w-full gap-2 mt-2">
                            <div className="flex-1 bg-indigo-50 rounded-lg p-1.5 text-center">
                                <div className="text-indigo-700 font-black text-lg">{clientMetrics.mix[0].value}</div>
                                <div className="text-[9px] text-indigo-400 font-bold uppercase">Return</div>
                            </div>
                            <div className="flex-1 bg-emerald-50 rounded-lg p-1.5 text-center">
                                <div className="text-emerald-700 font-black text-lg">{clientMetrics.mix[1].value}</div>
                                <div className="text-[9px] text-emerald-400 font-bold uppercase">New</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: LISTS */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Top Performing Services</h3>
                            <p className="text-xs text-gray-500 font-bold mt-1">Your most booked services this period</p>
                        </div>
                    </div>
                    {topServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topServices.slice(0, 6).map((srv, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-500 border border-gray-200'}`}>#{i + 1}</div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{srv.name}</div>
                                            <div className="text-xs text-gray-400 font-medium">{srv.count} bookings</div>
                                        </div>
                                    </div>
                                    <div className="font-black text-gray-900">${srv.revenue.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 text-sm font-bold uppercase tracking-widest bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                            No service data for this period
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderClients = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: HERO & METRICS */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Total Active Clients Hero */}
                <div className="xl:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 min-h-[320px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Users2 className="w-5 h-5 text-indigo-100" />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-indigo-100">My Active Clients</span>
                        </div>

                        <div>
                            <h2 className="text-6xl font-black mb-2">{clientMetrics.totalActive}</h2>
                            <p className="text-indigo-100 font-medium text-lg">Clients serviced during this period.</p>
                        </div>
                    </div>
                </div>

                {/* New vs Returning Pie Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col items-center justify-between min-h-[320px]">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest self-start">Client Mix</h3>
                    <div className="h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={clientMetrics.mix} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {clientMetrics.mix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-3xl font-black text-gray-900">{clientMetrics.mix[0].value + clientMetrics.mix[1].value}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">Total</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full gap-2">
                        <div className="flex-1 bg-indigo-50 rounded-xl p-2 text-center">
                            <div className="text-indigo-700 font-black">{clientMetrics.mix[0].value}</div>
                            <div className="text-[10px] text-indigo-400 font-bold uppercase">Return</div>
                        </div>
                        <div className="flex-1 bg-emerald-50 rounded-xl p-2 text-center">
                            <div className="text-emerald-700 font-black">{clientMetrics.mix[1].value}</div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase">New</div>
                        </div>
                    </div>
                </div>

                {/* Churn Risk Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between min-h-[320px]">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                            <UserMinus className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-6xl font-black text-gray-900 mb-2">{clientMetrics.atRisk}</h3>
                        <p className="text-red-400 font-bold text-xs uppercase tracking-widest">At Risk Clients</p>
                        <p className="text-gray-400 text-xs font-medium mt-2">Haven't visited in 90+ days</p>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
                        View List
                    </button>
                </div>
            </div>

            {/* ROW 2: TOP CLIENTS GRID */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900">Your Loyal Clients</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from(new Set(myAppointments.map(a => a.clientEmail))).slice(0, 8).map((email, i) => {
                        const clientApts = myAppointments.filter(a => a.clientEmail === email && (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED));
                        if (clientApts.length === 0) return null;
                        const val = clientApts.reduce((sum, a) => sum + (services.find(s => s.id === a.serviceId)?.price || 0), 0);
                        const name = clientApts[0].clientName;

                        return (
                            <div key={email} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200">
                                        {name.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-gray-900 truncate">{name}</div>
                                        <div className="text-xs text-gray-500 font-medium">Joined {format(new Date(), 'MMM yyyy')}</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-bold">LTV</span>
                                        <span className="font-black text-gray-900">${val.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-bold">Visits</span>
                                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">{clientApts.length}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )

    return (
        <div className="absolute inset-0 flex flex-col bg-[#F8F9FD] overflow-hidden">
            {/* Header - EXACT REPLICA OF ADMIN */}
            <header className="pt-8 pb-4 px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shrink-0 border-b border-gray-100">
                <div className="max-w-[1800px] mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight mb-2">
                            Analytics
                        </h1>
                        <nav className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('my_stats')}
                                className={`px-5 py-2.5 rounded-xl transition-all capitalize text-sm font-bold ${activeTab === 'my_stats' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                            >
                                My Stats
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`px-5 py-2.5 rounded-xl transition-all capitalize text-sm font-bold ${activeTab === 'clients' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                            >
                                Clients
                            </button>
                        </nav>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2">
                        {timeRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-right-4">
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="text-xs font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-1"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="text-xs font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-1"
                                />
                            </div>
                        )}

                        <div className="bg-gray-100/80 p-1 rounded-2xl flex text-xs font-bold">
                            {(['week', 'month', 'year', 'custom'] as TimeRange[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setTimeRange(r)}
                                    className={`px-4 py-2.5 rounded-xl transition-all capitalize ${timeRange === r ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                >
                                    {r === 'custom' ? 'Custom' : `This ${r}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-10 pt-8 pb-32 overflow-y-auto w-full scroll-smooth">
                <div className="max-w-[1800px] mx-auto w-full">
                    {activeTab === 'my_stats' && renderMyStats()}
                    {activeTab === 'clients' && renderClients()}
                </div>
            </main>
        </div>
    );
}
