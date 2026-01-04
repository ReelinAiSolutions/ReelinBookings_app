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
    UserMinus,
    Search,
    Mail,
    Clock,
    X,
    Repeat,
    ChevronDown
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
                { name: 'Returning', value: retUnique, color: '#4F46E5' },
                { name: 'New', value: newUnique, color: '#10B981' }
            ],
            totalActive: uniqueClientsPeriod.length,
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

                {/* ROW 1: PERSONAL PERFORMANCE SUMMARY (Matched to Admin Style) */}
                <div className="grid grid-cols-2 gap-4">

                    {/* 1. Revenue (Hero - Standard Gray Theme) */}
                    <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[24px] p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[180px]">
                        {/* Abstract BG Shape */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">My Revenue</h3>
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">${currentStats.revenue.toLocaleString()}</h1>
                            </div>
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 ${revenueChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(revenueChange).toFixed(0)}%
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-600 w-full animate-pulse"></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wider">Generated from completed appointments</p>
                        </div>
                    </div>

                    {/* 2. My Bookings */}
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-[#F3E8FF] text-[#A855F7] rounded-xl"><Briefcase className="w-5 h-5" /></div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bookingsChange >= 0 ? 'bg-[#F3E8FF] text-[#A855F7]' : 'bg-red-50 text-red-600'}`}>
                                {bookingsChange >= 0 ? '+' : ''}{bookingsChange.toFixed(0)}%
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{currentStats.bookings}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Confirmed Bookings</p>
                        </div>
                    </div>

                    {/* 3. Missed Appointments */}
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-red-50 text-red-500 rounded-xl"><Ban className="w-5 h-5" /></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{currentStats.cancelled}</h3>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Missed Appts</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                                    {occupancyRate}% Utilization
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: BOOKING TREND (Standardized Chart) - Fills whitespace functionally */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#F3E8FF] text-[#A855F7] rounded-xl">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">My Booking Trend</h3>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bookingsGraphData}>
                                <defs>
                                    <linearGradient id="colorBookingsStaff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip
                                    cursor={{ stroke: '#A855F7', strokeWidth: 1 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#A855F7" strokeWidth={3} fill="url(#colorBookingsStaff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROW 3: QUALITY SIGNALS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Client Rebooking Rate */}
                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">Rebooking Rate</h4>
                            <p className="text-xs text-gray-500 max-w-[200px]">Percentage of your clients who returned for another visit.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="px-2 py-1 bg-[#F3E8FF] text-[#A855F7] rounded-md text-[10px] font-bold uppercase">Primary Quality Signal</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-black text-[#A855F7]">{rebookingRate.toFixed(0)}%</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Retention Strength</div>
                        </div>
                    </div>

                    {/* Daily Workload */}
                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">Daily Workload</h4>
                            <p className="text-xs text-gray-500">Average confirmed appointments per working day.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">Consistency Metric</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-black text-gray-900">{avgAptsPerDay.toFixed(1)}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Appts / Day</div>
                        </div>
                    </div>
                </div>

            </div>
        );
    };

    const renderClients = () => {
        const clientInsightText = clientMetrics.totalActive > 5
            ? `Your client book expanded by ${((clientMetrics.mix[1].value / (clientMetrics.totalActive || 1)) * 100).toFixed(0)}% new clients this period!`
            : "Great work! Every client you serve helps grow your personal brand.";

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
                {/* Insight Banner */}
                {/* Insight Banner - Galaxy Theme */}
                <div className="bg-[#0A051C] relative overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-primary-900/20 flex items-center gap-3 border border-white/5">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_-20%,var(--primary-600),transparent)]" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_0%_100%,#7C3AED,transparent)]" />
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm relative z-10">
                        <Sparkles className="w-4 h-4 text-accent-400 fill-accent-400" />
                    </div>
                    <p className="text-sm font-medium relative z-10">{clientInsightText}</p>
                </div>

                {/* ROW 1: METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900">{clientMetrics.totalActive}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Active This Period</p>
                            </div>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Users2 className="w-5 h-5" /></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900">
                                    {((clientMetrics.mix[0].value / (clientMetrics.mix[0].value + clientMetrics.mix[1].value || 1)) * 100).toFixed(0)}%
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Retention Rate</p>
                            </div>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Repeat className="w-5 h-5" /></div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${((clientMetrics.mix[0].value / (clientMetrics.mix[0].value + clientMetrics.mix[1].value || 1)) * 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900">{clientMetrics.atRisk}</h3>
                                <p className="text-xs font-bold text-red-300 uppercase tracking-widest mt-1">At Risk Clients</p>
                            </div>
                            <div className="p-2 bg-red-50 text-red-500 rounded-xl"><UserMinus className="w-5 h-5" /></div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-4">Haven't visited in 90+ days</p>
                    </div>
                </div>

                {/* ROW 2: MINI CRM SECTION */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 min-h-[600px]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">My Client Portal</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manage your relationships ({Array.from(new Set(myAppointments.filter(a => a.status !== AppointmentStatus.BLOCKED && !a.clientEmail.toLowerCase().includes('internal') && !a.clientName.toLowerCase().includes('blocked time')).map(a => a.clientEmail))).length} total)</p>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap justify-center sm:flex-nowrap items-center gap-1 p-1 bg-gray-100/80 rounded-full w-full lg:w-auto">
                                {(['ltv', 'visits', 'recent'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setClientSort(s)}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${clientSort === s ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
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
                                const avatarGradient = 'bg-gradient-to-br from-[#A855F7] to-[#d946ef] shadow-[#d946ef]/20';

                                const statusStyles = {
                                    'VIP': 'bg-amber-50 text-amber-700 border-amber-100',
                                    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                    'New': 'bg-blue-50 text-blue-700 border-blue-100',
                                    'At Risk': 'bg-red-50 text-red-700 border-red-100'
                                };

                                return (
                                    <div
                                        key={client.email}
                                        className={`group p-6 rounded-[24px] border transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden ${isTopClient
                                            ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100/50 scale-[1.02] z-10'
                                            : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/30'
                                            }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[20px] font-black text-xs uppercase tracking-widest ${isTopClient ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            #{index + 1}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all group-hover:scale-110 ${isTopClient
                                                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                                                    : `${avatarGradient} text-white shadow-md shadow-black/5`
                                                    }`}>
                                                    {client.name.charAt(0)}
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyles[client.status]}`}>
                                                    {client.status}
                                                </span>
                                            </div>

                                            <div className="mb-6">
                                                <h4 className={`font-bold truncate transition-colors ${isTopClient ? 'text-emerald-900' : 'text-gray-900 group-hover:text-primary-600'}`}>{client.name}</h4>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isTopClient ? 'text-emerald-600' : 'text-gray-400'}`}>{client.email}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className={`p-3 rounded-2xl ${isTopClient ? 'bg-white/60' : 'bg-transparent'}`}>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total LTV</div>
                                                    <div className="text-lg font-black text-gray-900">${client.totalLtv.toLocaleString()}</div>
                                                </div>
                                                <div className={`p-3 rounded-2xl ${isTopClient ? 'bg-white/60' : 'bg-transparent'}`}>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Visits</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-lg font-black text-gray-900">{client.visits}</div>
                                                        <span className="text-[10px] text-gray-400 font-medium">total</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`p-3 rounded-xl border mb-6 ${isTopClient ? 'bg-white/80 border-emerald-100' : 'bg-gray-50 border-gray-100/50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Visit</span>
                                                </div>
                                                <div className="text-xs font-bold text-gray-700">{format(client.lastVisitDate, 'MMM d, yyyy')}</div>
                                                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{servicesMap.get(client.latestApt.serviceId)?.name || 'Service Unspecified'}</div>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-2 pt-4 border-t relative z-10 ${isTopClient ? 'border-emerald-200/50' : 'border-gray-50'}`}>
                                            <button
                                                onClick={() => setSelectedClientEmail(client.email)}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isTopClient
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white'
                                                    }`}
                                            >
                                                View History
                                            </button>
                                            <a
                                                href={`mailto:${client.email}?subject=Just checking in!`}
                                                className={`p-2 rounded-xl border border-transparent transition-all shadow-sm ${isTopClient
                                                    ? 'bg-white text-emerald-600 hover:border-emerald-200'
                                                    : 'bg-gray-50 text-gray-400 hover:text-purple-600 hover:bg-white hover:border-purple-100'
                                                    }`}
                                                title="Email Client"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                            <button className={`p-2 rounded-xl border border-transparent transition-all shadow-sm ${isTopClient
                                                ? 'bg-white text-emerald-600 hover:border-emerald-200'
                                                : 'bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-white hover:border-primary-100'
                                                }`}>
                                                <Briefcase className="w-4 h-4" />
                                            </button>
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
            {/* Header - Standardized Sticky with Multi-Layer Blur */}
            <header className="pt-2 pb-6 px-4 lg:px-10 lg:-mx-10 bg-white/70 backdrop-blur-2xl sticky top-0 z-[40] shrink-0 border-b border-gray-100/50 mb-8 -mt-6">
                <div className="max-w-[1800px] mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-tight mb-4">
                            Analytics
                        </h2>
                        <nav className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-full w-fit">
                            <button
                                onClick={() => setActiveTab('my_stats')}
                                className={`px-5 py-2.5 rounded-full transition-all capitalize text-sm font-bold ${activeTab === 'my_stats' ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                            >
                                My Stats
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`px-5 py-2.5 rounded-full transition-all capitalize text-sm font-bold ${activeTab === 'clients' ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                            >
                                Clients
                            </button>
                        </nav>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2">
                        {timeRange === 'custom' && (
                            <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-right-4">
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

                        <div className="bg-gray-100/80 p-1 rounded-2xl flex text-xs font-bold w-full md:w-auto">
                            {(['week', 'month', 'year', 'custom'] as TimeRange[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setTimeRange(r);
                                        if (r === 'custom') setIsCustomDateModalOpen(true);
                                    }}
                                    className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl transition-all capitalize ${timeRange === r ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
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
                    <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Appointment History</h3>
                                <p className="text-sm text-gray-500 font-medium">{selectedClientEmail}</p>
                            </div>
                            <button onClick={() => setSelectedClientEmail(null)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            <div className="space-y-8 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                {myAppointments
                                    .filter(a => a.clientEmail === selectedClientEmail && a.status !== AppointmentStatus.BLOCKED)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((apt, idx) => {
                                        const service = services.find(s => s.id === apt.serviceId);
                                        return (
                                            <div key={apt.id + idx} className="relative pl-12">
                                                {/* Dot */}
                                                <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center z-10 shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-500' : 'bg-primary-500'}`}></div>
                                                </div>

                                                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50 hover:border-primary-100 transition-all">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{format(new Date(apt.date), 'MMMM d, yyyy')}</div>
                                                        <div className={`w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700' :
                                                            apt.status === AppointmentStatus.CANCELLED ? 'bg-red-50 text-red-700' :
                                                                'bg-blue-50 text-blue-700'
                                                            }`}>
                                                            {apt.status}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold text-gray-900">{service?.name || 'Unknown Service'}</div>
                                                        </div>
                                                        <div className="text-lg font-black text-gray-900">${service?.price || 0}</div>
                                                    </div>
                                                    {apt.notes && (
                                                        <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed italic">
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
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedClientEmail(null)}
                                className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
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
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col">
                        <div className="p-8 border-b border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900">Custom Range</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Select your analysis window</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={customDateRange.start}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
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
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCustomDateModalOpen(false)}
                                className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                            >
                                Apply Range
                            </button>
                            <button
                                onClick={() => setIsCustomDateModalOpen(false)}
                                className="w-full py-4 bg-transparent text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors"
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
