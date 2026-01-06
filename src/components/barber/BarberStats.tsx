'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
    UserMinus,
    Search,
    Mail,
    Clock,
    X,
    Repeat,
    ChevronDown,
    RotateCcw,
    Zap,
    Maximize
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import {
    format, startOfWeek, addDays, isSameDay, subDays,
    startOfYear, eachMonthOfInterval, isWithinInterval,
    startOfMonth, subMonths, endOfDay, startOfDay,
    subWeeks, getYear, differenceInDays, getHours
} from 'date-fns';
import { getClientGradient } from '@/utils/colorUtils';

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
    const [clientSearch, setClientSearch] = useState('');
    const [clientSort, setClientSort] = useState<'ltv' | 'visits' | 'recent'>('recent');
    const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Theme Detection
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

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

    // --- OPTIMIZED DATA STRUCTURES (O(N)) ---

    // Service Map for O(1) Lookups
    const servicesMap = useMemo(() => {
        const map = new Map<string, Service>();
        services.forEach(s => map.set(s.id, s));
        return map;
    }, [services]);

    // Centralized Personal Client Processor (Single Pass)
    const allClients = useMemo(() => {
        const groups = new Map<string, Appointment[]>();

        myAppointments.forEach(apt => {
            // Standard Exclusion Logic
            if (apt.status === AppointmentStatus.BLOCKED) return;
            const email = apt.clientEmail?.toLowerCase() || '';
            const name = apt.clientName?.toLowerCase() || '';
            if (email.includes('internal') || name.includes('blocked time')) return;

            if (!groups.has(apt.clientEmail)) groups.set(apt.clientEmail, []);
            groups.get(apt.clientEmail)!.push(apt);
        });

        const now = new Date();

        return Array.from(groups.entries()).map(([email, apts]) => {
            const history = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
            if (history.length === 0) return null;

            const totalLtv = history.reduce((sum, a) => sum + (servicesMap.get(a.serviceId)?.price || 0), 0);
            const latest = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const lastVisit = new Date(latest.date);
            const daysSince = differenceInDays(now, lastVisit);

            let status: 'VIP' | 'Active' | 'New' | 'At Risk' = 'Active';
            if (history.length === 1) status = 'New';
            else if (totalLtv > 500 || history.length > 10) status = 'VIP';
            else if (daysSince > 90) status = 'At Risk';

            return {
                email,
                name: history[0].clientName,
                totalLtv,
                visits: history.length,
                lastVisitDate: lastVisit,
                status,
                latestApt: latest
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null);
    }, [myAppointments, servicesMap]);

    const getStats = (apts: Appointment[]) => {
        // Filter out internal system appointments (Blocks/Internal Walk-ins)
        const customerApts = apts.filter(a =>
            a.status !== AppointmentStatus.BLOCKED &&
            !a.clientEmail.toLowerCase().includes('internal') &&
            !a.clientName.toLowerCase().includes('blocked time')
        );

        const valid = customerApts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
        const cancelled = customerApts.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

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

    const bookingsGraphData = useMemo(() => {
        let buckets: { name: string, value: number }[] = [];
        const daysDiff = differenceInDays(currentRange.end, currentRange.start);

        if (daysDiff <= 31) {
            let curr = currentRange.start;
            while (curr <= currentRange.end) {
                const d = curr;
                const val = currentAppointments.filter(a => isSameDay(new Date(a.date), d) && (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED)).length;
                buckets.push({ name: format(d, 'd'), value: val });
                curr = addDays(curr, 1);
            }
        } else {
            const months = eachMonthOfInterval({ start: currentRange.start, end: currentRange.end });
            buckets = months.map(d => {
                const val = currentAppointments.filter(a => new Date(a.date).getMonth() === d.getMonth() && getYear(new Date(a.date)) === getYear(d) && (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED)).length;
                return { name: format(d, 'MMM'), value: val };
            });
        }
        return buckets;
    }, [currentRange, currentAppointments]);

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
        const filteredApts = myAppointments.filter(a =>
            a.status !== AppointmentStatus.BLOCKED &&
            !a.clientEmail.toLowerCase().includes('internal') &&
            !a.clientName.toLowerCase().includes('blocked time')
        );

        const activeAptsInPeriod = filteredApts.filter(a => {
            const d = new Date(a.date);
            return (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED) &&
                isWithinInterval(d, currentRange);
        });

        const uniqueClientsPeriod = Array.from(new Set(activeAptsInPeriod.map(a => a.clientEmail)));

        let newUnique = 0;
        let retUnique = 0;
        const historicSet = new Set(filteredApts.filter(a =>
            (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED) &&
            new Date(a.date) < currentRange.start
        ).map(a => a.clientEmail));

        uniqueClientsPeriod.forEach(email => {
            if (historicSet.has(email)) retUnique++;
            else newUnique++;
        });

        const ninetyDaysAgo = subDays(new Date(), 90);
        const myClients = Array.from(new Set(filteredApts.map(a => a.clientEmail)));
        let atRisk = 0;
        myClients.forEach(email => {
            const clientApts = filteredApts.filter(a => a.clientEmail === email && (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (clientApts.length > 0) {
                const lastVisit = new Date(clientApts[0].date);
                if (lastVisit < ninetyDaysAgo) atRisk++;
            }
        });

        return {
            mix: [
                { name: 'Returning', value: retUnique, color: '#10B981' },
                { name: 'New', value: newUnique, color: 'var(--primary-600)' }
            ],
            totalActive: uniqueClientsPeriod.length,
            returning: retUnique,
            new: newUnique,
            atRisk
        };
    }, [myAppointments, currentRange]);

    // --- RENDERERS ---

    const renderMyStats = () => {
        // Calculate Rebooking Rate (Simplified for this view)
        const myUniqueClients = Array.from(new Set(currentStats.valid.map(a => a.clientEmail)));
        // Clients seen before current period
        const myHistoricSet = new Set(myAppointments.filter(a => new Date(a.date) < currentRange.start).map(a => a.clientEmail));
        let myReturnCount = 0;
        myUniqueClients.forEach(email => { if (myHistoricSet.has(email)) myReturnCount++; });
        const rebookingRate = myUniqueClients.length > 0 ? (myReturnCount / myUniqueClients.length) * 100 : 0;

        // Avg Appointments / Day
        const daysInPeriod = differenceInDays(currentRange.end, currentRange.start) + 1;
        const avgAptsPerDay = daysInPeriod > 0 ? (currentStats.bookings / daysInPeriod) : 0;

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">

                {/* ROW 1: ELITE PERFORMANCE SUMMARY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. Revenue Hero Card */}
                    <div className="lg:col-span-2 group relative">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-[32px] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative bg-gray-950 dark:bg-card border border-white/5 rounded-[32px] p-8 text-white min-h-[240px] flex flex-col justify-between shadow-2xl overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary-500/20 transition-all duration-1000"></div>

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(var(--brand-primary-rgb,79,70,229),0.6)] animate-pulse" />
                                        <h3 className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em]">Personal Revenue</h3>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-primary-500/50 mr-1">$</span>
                                        <h1 className="text-5xl lg:text-7xl font-[950] tracking-tighter leading-none">
                                            {currentStats.revenue.toLocaleString()}
                                        </h1>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black backdrop-blur-xl border border-white/10 ${revenueChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {Math.abs(revenueChange).toFixed(1)}%
                                </div>
                            </div>

                            <div className="relative z-10 mt-8">
                                <div className="flex justify-between items-end mb-3">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">Growth Target Met</p>
                                    <span className="text-sm font-black text-primary-400">{occupancyRate}%</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full shadow-[0_0_15px_rgba(var(--brand-primary-rgb,79,70,229),0.3)] transition-all duration-1000 ease-out"
                                        style={{ width: `${occupancyRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Secondary Stats Grid */}
                    <div className="space-y-6">
                        {/* Bookings Card */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3.5 bg-primary-600 shadow-lg shadow-primary-500/30 text-white rounded-[20px] transition-transform group-hover:scale-110 duration-500">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center gap-1 text-[11px] font-black ${bookingsChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {bookingsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {bookingsChange.toFixed(0)}%
                                </div>
                            </div>
                            <div>
                                <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{currentStats.bookings}</h3>
                                <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Active Sessions</p>
                            </div>
                        </div>

                        {/* Efficiency Card */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3.5 bg-gray-900 dark:bg-white/10 text-white rounded-[20px] transition-transform group-hover:scale-110 duration-500">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Premium</div>
                            </div>
                            <div>
                                <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{rebookingRate.toFixed(0)}%</h3>
                                <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Rebooking Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: BOOKING TREND (Elite Chart) */}
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100/50 dark:border-white/5 shadow-sm relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-600 shadow-lg shadow-primary-500/20 text-white rounded-2xl">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] text-[11px]">Appointment Velocity</h3>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Real-time engagement trend</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">Live Pulse</span>
                        </div>
                    </div>

                    <div className="h-72 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bookingsGraphData}>
                                <defs>
                                    <linearGradient id="colorBookingsElite" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary-600)" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="var(--primary-600)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ stroke: 'var(--primary-600)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-gray-950/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-lg font-black text-white">{payload[0].value} <span className="text-xs text-gray-400 font-bold ml-1 uppercase">Bookings</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--primary-600)"
                                    strokeWidth={4}
                                    fill="url(#colorBookingsElite)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROW 3: QUALITY SIGNALS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Client Rebooking Rate */}
                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100/50 dark:border-white/5 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                        <div>
                            <div className="px-2.5 py-1 bg-primary-600/10 text-primary-600 dark:text-primary-400 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] mb-4 w-fit">Primary Quality Signal</div>
                            <h4 className="text-2xl font-[950] text-gray-900 dark:text-white mb-2 tracking-tight">Retention Rate</h4>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 max-w-[200px] leading-relaxed uppercase tracking-widest">Growth through loyalty</p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-[950] text-primary-600 dark:text-primary-400 tracking-tighter group-hover:scale-110 transition-transform duration-500">{rebookingRate.toFixed(0)}%</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Active Recall</div>
                        </div>
                    </div>

                    {/* Daily Workload */}
                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100/50 dark:border-white/5 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                        <div>
                            <div className="px-2.5 py-1 bg-gray-900/10 dark:bg-white/10 text-gray-900 dark:text-white rounded-lg text-[9px] font-black uppercase tracking-[0.15em] mb-4 w-fit">Operations Signal</div>
                            <h4 className="text-2xl font-[950] text-gray-900 dark:text-white mb-2 tracking-tight">Workload Density</h4>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 max-w-[200px] leading-relaxed uppercase tracking-widest">Daily peak performance</p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-[950] text-gray-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">{avgAptsPerDay.toFixed(1)}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Appts / Session</div>
                        </div>
                    </div>
                </div>

            </div>
        );
    };

    const renderClients = () => {
        const clientInsightText = clientMetrics.totalActive > 5
            ? `Your client book expanded by ${((clientMetrics.new / (clientMetrics.totalActive || 1)) * 100).toFixed(0)}% new clients this period!`
            : "Great work! Every client you serve helps grow your personal brand.";

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">

                {/* Insight Banner - High Contrast Professional */}
                <div className="group relative overflow-hidden rounded-[32px] p-6 bg-gray-950 shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary-500/30 transition-all duration-1000" />

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-[13px] uppercase tracking-[0.2em] mb-1">Growth Opportunity identified</h4>
                            <p className="text-gray-400 font-medium leading-relaxed">{clientInsightText}</p>
                        </div>
                    </div>
                </div>

                {/* ROW 1: CLIENT PERFORMANCE METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Active Clients */}
                    <div className="md:col-span-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm group hover:translate-y-[-4px] transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-purple-600 shadow-lg shadow-purple-500/30 text-white rounded-2xl">
                                <Users2 className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Growth</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{clientMetrics.totalActive}</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Active CRM</p>
                        </div>
                    </div>

                    {/* Returning Base */}
                    <div className="md:col-span-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm group hover:translate-y-[-4px] transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-600 shadow-lg shadow-emerald-500/30 text-white rounded-2xl">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Loyalty</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{clientMetrics.returning}</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Regulars</p>
                        </div>
                    </div>

                    {/* New Acquisition */}
                    <div className="md:col-span-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm group hover:translate-y-[-4px] transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-600 shadow-lg shadow-blue-500/30 text-white rounded-2xl">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">New</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{clientMetrics.new}</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">New Bookings</p>
                        </div>
                    </div>

                    {/* At Risk */}
                    <div className="md:col-span-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm group hover:translate-y-[-4px] transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-600 shadow-lg shadow-rose-500/30 text-white rounded-2xl">
                                <UserMinus className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:animate-pulse">Alert</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-[950] text-gray-900 dark:text-white tracking-tight">{clientMetrics.atRisk}</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Retention Risk</p>
                        </div>
                    </div>
                </div>

                {/* ROW 2: CRM EXPLORER */}
                <div className="min-h-[600px] mt-12">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 pb-8 border-b border-gray-100/50 dark:border-white/5">
                        <div>
                            <h3 className="text-2xl font-[950] text-gray-900 dark:text-white tracking-tight">Personal Client Book</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2 underline decoration-primary-500/30 decoration-2 underline-offset-4">
                                Managing {Array.from(new Set(myAppointments.filter(a => a.status !== AppointmentStatus.BLOCKED && !a.clientEmail.toLowerCase().includes('internal') && !a.clientName.toLowerCase().includes('blocked time')).map(a => a.clientEmail))).length} Elite Relationships
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-all duration-300" />
                                <input
                                    type="text"
                                    placeholder="Search directory..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-white/10 rounded-[20px] text-sm font-black focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all dark:text-white dark:placeholder-gray-600 shadow-sm"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/50 dark:bg-white/5 backdrop-blur-md rounded-[20px] w-full sm:w-auto border border-gray-100 dark:border-white/5">
                                {(['ltv', 'visits', 'recent'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setClientSort(s)}
                                        className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-[10px] font-[950] uppercase tracking-[0.15em] transition-all whitespace-nowrap ${clientSort === s ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allClients
                            .filter(c => (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase())))
                            .sort((a, b) => {
                                if (clientSort === 'ltv') return b.totalLtv - a.totalLtv;
                                if (clientSort === 'visits') return b.visits - a.visits;
                                return b.lastVisitDate.getTime() - a.lastVisitDate.getTime();
                            })
                            .map((client, index) => {
                                const isTopClient = index === 0 && clientSearch === '';

                                const statusStyles = {
                                    'VIP': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50',
                                    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50',
                                    'New': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50',
                                    'At Risk': 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                                };

                                return (
                                    <div
                                        key={client.email}
                                        className={`group p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between h-full relative overflow-hidden ${isTopClient
                                            ? 'bg-gradient-to-br from-gray-950 to-gray-900 dark:from-white/10 dark:to-transparent border-white/10 shadow-2xl scale-[1.02] z-10'
                                            : 'bg-white/40 dark:bg-white/5 backdrop-blur-xl border-gray-100 dark:border-white/10 hover:border-primary-500/30 hover:shadow-2xl hover:translate-y-[-4px]'
                                            }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`absolute top-0 right-0 px-5 py-2 rounded-bl-[24px] font-[950] text-[10px] uppercase tracking-[0.2em] ${isTopClient ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                            }`}>
                                            Elite #{index + 1}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-[950] text-xl transition-all group-hover:rotate-6 duration-500 ${isTopClient
                                                    ? 'bg-white text-gray-950 shadow-xl'
                                                    : `shadow-lg ${getClientGradient(client.name)} text-white`
                                                    }`}>
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-[950] uppercase tracking-[0.2em] border ${isTopClient ? 'bg-white/10 text-white border-white/20' : statusStyles[client.status]}`}>
                                                    {client.status}
                                                </div>
                                            </div>

                                            <div className="mb-8">
                                                <h4 className={`text-xl font-[950] truncate tracking-tight transition-colors ${isTopClient ? 'text-white' : 'text-gray-900 dark:text-white group-hover:text-primary-600'}`}>{client.name}</h4>
                                                <p className={`text-[10px] font-black uppercase tracking-[0.15em] truncate mt-1 ${isTopClient ? 'text-gray-400' : 'text-gray-400'}`}>{client.email}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-8">
                                                <div className={`p-4 rounded-[20px] ${isTopClient ? 'bg-white/5 border border-white/5' : 'bg-gray-50/50 dark:bg-white/5 border border-transparent'}`}>
                                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Portfolio</div>
                                                    <div className={`text-xl font-[950] tracking-tight ${isTopClient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>${client.totalLtv.toLocaleString()}</div>
                                                </div>
                                                <div className={`p-4 rounded-[20px] ${isTopClient ? 'bg-white/5 border border-white/5' : 'bg-gray-50/50 dark:bg-white/5 border border-transparent'}`}>
                                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Visits</div>
                                                    <div className={`text-xl font-[950] tracking-tight ${isTopClient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{client.visits}</div>
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-[20px] border mb-8 ${isTopClient ? 'bg-white/5 border-white/10' : 'bg-white/50 dark:bg-white/5 border-gray-100/50 dark:border-white/10'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Latest Session</span>
                                                </div>
                                                <div className={`text-[13px] font-[950] tracking-tight ${isTopClient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{format(client.lastVisitDate, 'MMM d, yyyy')}</div>
                                                <div className="text-[10px] font-bold text-primary-500/80 mt-1 uppercase tracking-widest truncate">{servicesMap.get(client.latestApt.serviceId)?.name || 'Premium Service'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 relative z-10 pt-4">
                                            <button
                                                onClick={() => setSelectedClientEmail(client.email)}
                                                className={`flex-1 py-3.5 rounded-[20px] text-[10px] font-[950] uppercase tracking-[0.2em] transition-all shadow-lg ${isTopClient
                                                    ? 'bg-white text-gray-950 hover:bg-gray-100'
                                                    : 'bg-gray-950 dark:bg-white border border-transparent dark:border-white text-white dark:text-gray-950 hover:scale-[1.02] active:scale-[0.98]'
                                                    }`}
                                            >
                                                History
                                            </button>
                                            <a
                                                href={`mailto:${client.email}`}
                                                className={`p-3.5 rounded-[20px] border transition-all ${isTopClient
                                                    ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 hover:text-primary-600 hover:border-primary-500/30'
                                                    }`}
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full">
            {/* Header - Refined for Pro Parity */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-[32px] font-black tracking-tight text-gray-900 dark:text-white leading-none mb-2">
                            Performance & Insights
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Track your professional growth and client engagement metrics.</p>

                        <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('my_stats')}
                                className={`px-5 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${activeTab === 'my_stats'
                                    ? 'bg-white dark:bg-card text-primary-500 shadow-xl shadow-black/5 ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`px-5 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${activeTab === 'clients'
                                    ? 'bg-white dark:bg-card text-primary-500 shadow-xl shadow-black/5 ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                            >
                                Client CRM
                            </button>
                        </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2">
                        {timeRange === 'custom' && (
                            <div className="hidden md:flex items-center gap-2 bg-white dark:bg-card px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm animate-in fade-in slide-in-from-right-4">
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

                        <div className="bg-gray-100/80 dark:bg-white/5 p-1 rounded-2xl flex text-xs font-bold w-full md:w-auto">
                            {(['week', 'month', 'year', 'custom'] as TimeRange[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setTimeRange(r);
                                        if (r === 'custom') setIsCustomDateModalOpen(true);
                                    }}
                                    className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl transition-all capitalize ${timeRange === r ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10'}`}
                                >
                                    {r === 'custom' ? 'Custom' : `This ${r}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="px-4 lg:px-0 w-full">
                {activeTab === 'my_stats' && renderMyStats()}
                {activeTab === 'clients' && renderClients()}
            </div>

            {/* History Modal */}
            {selectedClientEmail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedClientEmail(null)}></div>
                    <div className="bg-white dark:bg-[#1a1b1e] rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col border dark:border-white/5">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Appointment History</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedClientEmail}</p>
                            </div>
                            <button onClick={() => setSelectedClientEmail(null)} className="p-2 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                                <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#1a1b1e]">
                            <div className="space-y-8 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5"></div>

                                {myAppointments
                                    .filter(a => a.clientEmail === selectedClientEmail && a.status !== AppointmentStatus.BLOCKED)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((apt, idx) => {
                                        const service = services.find(s => s.id === apt.serviceId);
                                        return (
                                            <div key={apt.id + idx} className="relative pl-12">
                                                {/* Dot */}
                                                <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-white/5 flex items-center justify-center z-10 shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-500' : 'bg-primary-500'}`}></div>
                                                </div>

                                                <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100/50 dark:border-white/5 hover:border-primary-100 dark:hover:border-primary-900/50 transition-all">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{format(new Date(apt.date), 'MMMM d, yyyy')}</div>
                                                        <div className={`w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                            apt.status === AppointmentStatus.CANCELLED ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                                                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                            }`}>
                                                            {apt.status}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white">{service?.name || 'Unknown Service'}</div>
                                                        </div>
                                                        <div className="text-lg font-black text-gray-900 dark:text-white">${service?.price || 0}</div>
                                                    </div>
                                                    {apt.notes && (
                                                        <div className="mt-3 p-3 bg-white dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                                            "{apt.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-end">
                            <button
                                onClick={() => setSelectedClientEmail(null)}
                                className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM DATE PICKER MODAL --- */}
            {isCustomDateModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsCustomDateModalOpen(false)}
                    />
                    <div className="bg-white dark:bg-[#1a1b1e] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col border dark:border-white/5">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Custom Range</h3>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Select your analysis window</p>
                        </div>

                        <div className="p-8 space-y-6 dark:bg-[#1a1b1e]">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={customDateRange.start}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">End Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={customDateRange.end}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCustomDateModalOpen(false)}
                                className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-gray-200 transition-all shadow-xl shadow-gray-200 dark:shadow-none active:scale-95"
                            >
                                Apply Range
                            </button>
                            <button
                                onClick={() => setIsCustomDateModalOpen(false)}
                                className="w-full py-4 bg-transparent text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
