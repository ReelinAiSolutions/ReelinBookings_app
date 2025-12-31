import React, { useState, useMemo } from 'react';
import { DollarSign, CalendarDays, Users2, TrendingUp, Star, Clock, Briefcase, ChevronRight, Ban, Activity, Trophy, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, Zap, Target, Heart, UserMinus, UserPlus } from 'lucide-react';
import { Appointment, Staff, Service, AppointmentStatus } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { format, startOfWeek, addDays, isSameDay, subDays, startOfYear, eachMonthOfInterval, isWithinInterval, startOfMonth, subMonths, endOfDay, startOfDay, subWeeks, getYear, differenceInDays, getHours, getDay } from 'date-fns';

interface PerformanceViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

type TabType = 'business' | 'staff' | 'clients';
type TimeRange = 'week' | 'month' | 'year' | 'custom';

export default function PerformanceView({ appointments, services, staff }: PerformanceViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('business');
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

    const filterAppointments = (range: { start: Date, end: Date }) => {
        return appointments.filter(apt => {
            const d = new Date(apt.date);
            return isWithinInterval(d, { start: range.start, end: range.end });
        });
    };

    const currentAppointments = useMemo(() => filterAppointments(currentRange), [appointments, timeRange, customDateRange]);
    const previousAppointments = useMemo(() => filterAppointments(previousRange), [appointments, timeRange, customDateRange]);

    const getStats = (apts: Appointment[]) => {
        const valid = apts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
        const cancelled = apts.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

        const revenue = valid.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.price || 0), 0);
        // Calculate lost revenue from cancellations
        const lostRevenue = cancelled.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.price || 0), 0);

        // Calculate booked minutes
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

    // --- ADVANCED METRICS ---

    // Occupancy Rate (Estimate based on 8 hour days * staff count * days in range)
    const occupancyRate = useMemo(() => {
        const days = differenceInDays(currentRange.end, currentRange.start) + 1;
        const totalCapacityMinutes = days * 8 * 60 * (staff.length || 1);
        return Math.min(100, Math.round((currentStats.bookedMinutes / totalCapacityMinutes) * 100));
    }, [currentStats.bookedMinutes, currentRange, staff.length]);

    // Peak Demand (Busiest Hour)
    const demandHeatmap = useMemo(() => {
        const hours = new Array(24).fill(0);
        currentStats.valid.forEach(apt => {
            const h = getHours(new Date(apt.date));
            hours[h]++;
        });
        // Find max for scaling
        const max = Math.max(...hours, 1);
        return hours.map((count, hour) => ({ hour, count, intensity: count / max }));
    }, [currentStats.valid]);

    // Category Breakdown
    const categoryStats = useMemo(() => {
        const categories = new Map<string, number>();
        currentStats.valid.forEach(apt => {
            const s = services.find(srv => srv.id === apt.serviceId);
            if (s && s.category) {
                categories.set(s.category, (categories.get(s.category) || 0) + s.price);
            }
        });
        return Array.from(categories.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [currentStats.valid, services]);

    // Future Forecast (Next 30 days)
    const forecast = useMemo(() => {
        const next30 = addDays(new Date(), 30);
        const futureApts = appointments.filter(a =>
            (a.status === AppointmentStatus.CONFIRMED) &&
            new Date(a.date) > new Date() &&
            new Date(a.date) <= next30
        );
        const revenue = futureApts.reduce((sum, apt) => sum + (services.find(s => s.id === apt.serviceId)?.price || 0), 0);
        return { revenue, count: futureApts.length };
    }, [appointments, services]);

    // 1. BUSINESS: Top Services
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

    // 2. STAFF: Stats & Leaderboard
    const staffLeaderboard = useMemo(() => {
        return staff.map(member => {
            const memberApts = currentStats.valid.filter(a => a.staffId === member.id);
            const revenue = memberApts.reduce((sum, a) => sum + (services.find(s => s.id === a.serviceId)?.price || 0), 0);

            // Calculate utilization per staff
            const bookedMins = memberApts.reduce((sum, a) => sum + (services.find(s => s.id === a.serviceId)?.durationMinutes || 0), 0);
            const days = differenceInDays(currentRange.end, currentRange.start) + 1;
            const capacity = days * 8 * 60; // 8 hours per day
            const utilization = Math.min(100, Math.round((bookedMins / capacity) * 100));

            return { ...member, revenue, bookings: memberApts.length, utilization };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [staff, currentStats.valid, services, currentRange]);

    // 3. CLIENTS: New vs Returning
    const clientMetrics = useMemo(() => {
        const uniqueClientsPeriod = Array.from(new Set(currentStats.valid.map(a => a.clientEmail)));
        let newUnique = 0;
        let retUnique = 0;
        const historicSet = new Set(appointments.filter(a => new Date(a.date) < currentRange.start).map(a => a.clientEmail));

        uniqueClientsPeriod.forEach(email => {
            if (historicSet.has(email)) retUnique++;
            else newUnique++;
        });

        // Retention Risk (Haven't visited in 90 days)
        const ninetyDaysAgo = subDays(new Date(), 90);
        const allClients = Array.from(new Set(appointments.map(a => a.clientEmail)));
        let atRisk = 0;
        allClients.forEach(email => {
            const clientApts = appointments.filter(a => a.clientEmail === email).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
            atRisk,
            totalActive: uniqueClientsPeriod.length
        };
    }, [currentStats.valid, appointments, currentRange]);

    // Revenue Graph Data
    const revenueGraphData = useMemo(() => {
        let buckets: { name: string, value: number, previous?: number }[] = [];
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
    }, [timeRange, currentRange, currentStats.valid, services]);


    // --- RENDERERS ---

    const renderBusinessTab = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: HERO & KEY METRICS (Expanded Height) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Revenue Card - Spans 2 cols on large screens */}
                <div className="xl:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 min-h-[320px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h1 className="text-6xl font-black tracking-tight mb-2">${currentStats.revenue.toLocaleString()}</h1>
                                <p className="text-indigo-200 font-medium text-lg">Total Revenue generated this {timeRange === 'custom' ? 'period' : timeRange}</p>
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
                                    <linearGradient id="colorWhite" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={4} fill="url(#colorWhite)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Metrics Column - Spans 1 col, stacked */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Conversion/Bookings Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px]">
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
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Confirmed Bookings</p>
                        </div>
                    </div>

                    {/* Forecast Card (New) */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px]">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100/50 text-purple-700">Next 30 Days</span>
                        </div>
                        <div>
                            <h3 className="text-5xl font-black text-gray-900 mb-2">${forecast.revenue.toLocaleString()}</h3>
                            <p className="text-purple-400 font-bold text-xs uppercase tracking-widest">Projected Revenue</p>
                            <p className="text-gray-400 text-[10px] font-medium mt-1">from {forecast.count} upcoming appointments</p>
                        </div>
                    </div>

                    {/* Lost Revenue Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[240px]">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                <Ban className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-5xl font-black text-gray-900 mb-2">${currentStats.lostRevenue.toLocaleString()}</h3>
                            <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Missed Opportunity</p>
                            <p className="text-gray-400 text-[10px] font-medium mt-1">from cancellations & no-shows</p>
                        </div>
                    </div>

                    {/* Occupancy Radial Bar */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[240px]">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-8 left-8">Occupancy</h3>
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
                </div>
            </div>

            {/* ROW 2: DEEP DIVE & CATEGORIES */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Demand Heatmap (Busiest Times) - Spans 2 cols */}
                <div className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                <Zap className="w-6 h-6 fill-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">Peak Demand Hours</h3>
                        </div>
                        <div className="hidden md:flex gap-4 text-xs font-bold text-gray-400">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> High Traffic</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-200"></span> Moderate</div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full flex items-end gap-2">
                        {demandHeatmap.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                {h.count > 0 && (
                                    <div className="absolute -top-12 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold shadow-xl">
                                        {h.hour}:00 — {h.count} Bookings
                                    </div>
                                )}
                                <div
                                    className={`w-full rounded-t-xl transition-all duration-700 ease-out ${h.intensity > 0.8 ? 'bg-indigo-600' : h.intensity > 0.4 ? 'bg-indigo-400' : 'bg-indigo-100'}`}
                                    style={{ height: `${Math.max(8, h.intensity * 100)}%` }}
                                ></div>
                                {i % 3 === 0 && <span className="text-[10px] text-gray-400 font-bold">{h.hour}</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Category (Bar Chart) - New */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 mb-6">Revenue by Category</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={categoryStats.length > 0 ? categoryStats : [{ name: 'No Data', value: 0 }]} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }} formatter={(value: any) => `$${value}`} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#4F46E5', '#818CF8', '#C7D2FE'][index % 3] || '#E5E7EB'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROW 3: LISTS */}
            <div className="grid grid-cols-1 gap-6">
                {/* Top Service Mini List (Expanded) */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-gray-900">Top Performing Services</h3>
                        <button className="text-indigo-600 font-bold text-sm hover:underline">View All</button>
                    </div>
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
                </div>
            </div>
        </div>
    );

    const renderStaffTab = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: HERO & METRICS */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Top Performer Card - Spans 2 cols */}
                {staffLeaderboard.length > 0 && (
                    <div className="xl:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20 min-h-[320px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-emerald-500/30 rounded-lg backdrop-blur-md">
                                        <Trophy className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                    </div>
                                    <span className="text-sm font-bold tracking-widest uppercase text-emerald-100">Evaluated Top Performer</span>
                                </div>
                                <h2 className="text-5xl font-black mb-2">{staffLeaderboard[0].name}</h2>
                                <p className="text-emerald-100 font-medium text-lg">Leading the team with <span className="text-white font-bold">${staffLeaderboard[0].revenue.toLocaleString()}</span> in sales this period.</p>
                            </div>
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-black border-4 border-emerald-500/30">
                                {staffLeaderboard[0].name.charAt(0)}
                            </div>
                        </div>

                        {/* Mini Stats for Hero */}
                        <div className="grid grid-cols-3 gap-4 mt-8 bg-black/10 rounded-2xl p-4 backdrop-blur-sm">
                            <div>
                                <div className="text-xs text-emerald-200 font-bold uppercase">Bookings</div>
                                <div className="text-xl font-black">{staffLeaderboard[0].bookings}</div>
                            </div>
                            <div>
                                <div className="text-xs text-emerald-200 font-bold uppercase">Efficiency</div>
                                <div className="text-xl font-black">{staffLeaderboard[0].utilization}%</div>
                            </div>
                            <div>
                                <div className="text-xs text-emerald-200 font-bold uppercase">Avg Ticket</div>
                                <div className="text-xl font-black">${Math.round(staffLeaderboard[0].bookings > 0 ? staffLeaderboard[0].revenue / staffLeaderboard[0].bookings : 0)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Efficiency Radial */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[320px]">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-8 left-8">Team Efficiency</h3>
                    <div className="relative w-40 h-40 mt-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-gray-100" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (staffLeaderboard.reduce((acc, curr) => acc + curr.utilization, 0) / (staffLeaderboard.length || 1))) / 100} className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                            <span className="text-4xl font-black text-gray-900">{Math.round(staffLeaderboard.reduce((acc, curr) => acc + curr.utilization, 0) / (staffLeaderboard.length || 1))}%</span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 font-medium mt-6 max-w-[180px]">Average Booking Utilization across all staff members.</p>
                </div>

                {/* Total Staff Count Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 flex flex-col justify-between h-full min-h-[320px]">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Users2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-6xl font-black text-gray-900 mb-2">{staff.length}</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Active Staff Members</p>
                    </div>
                    <div className="flex gap-2">
                        {staff.slice(0, 4).map((m, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {m.name.charAt(0)}
                            </div>
                        ))}
                        {staff.length > 4 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">+{staff.length - 4}</div>}
                    </div>
                </div>
            </div>

            {/* ROW 2: DETAILED STAFF GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffLeaderboard.map((member, i) => (
                    <div key={member.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                    <p className="text-sm text-gray-400 font-medium">{member.role}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                #{i + 1}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400 font-bold">Revenue</span>
                                    <span className="text-gray-900 font-black">${member.revenue.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(member.revenue / (currentStats.revenue || 1)) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className="bg-gray-50 rounded-2xl p-2 text-center">
                                    <div className="text-xl font-black text-gray-900">{member.bookings}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase">Bookings</div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-2 text-center">
                                    <div className="text-xl font-black text-gray-900">{member.utilization}%</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase">Efficiency</div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-2 text-center">
                                    <div className="text-xl font-black text-gray-900">${Math.round(member.bookings > 0 ? member.revenue / member.bookings : 0)}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase">Avg Ticket</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderClientTab = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: HERO & METRICS */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Total Active Clients Hero - Spans 2 cols */}
                <div className="xl:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 min-h-[320px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Users2 className="w-5 h-5 text-indigo-100" />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-indigo-100">Total Active Clients</span>
                        </div>

                        <div>
                            <h2 className="text-6xl font-black mb-2">{clientMetrics.totalActive}</h2>
                            <p className="text-indigo-100 font-medium text-lg">Clients serviced during this period.</p>
                        </div>

                        {/* Simple Acquisition Sparkline (Mock Data for visual) */}
                        <div className="h-24 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { v: 10 }, { v: 15 }, { v: 12 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 22 }, { v: 30 }
                                ]}>
                                    <defs>
                                        <linearGradient id="colorClient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="v" stroke="#ffffff" strokeWidth={3} fill="url(#colorClient)" />
                                </AreaChart>
                            </ResponsiveContainer>
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

            {/* ROW 2: LOYAL CLIENTS GRID */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900">Top Loyal Clients</h3>
                    <button className="text-indigo-600 font-bold text-sm hover:underline">View All Clients</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from(new Set(appointments.map(a => a.clientEmail))).slice(0, 8).map((email, i) => {
                        const clientApts = appointments.filter(a => a.clientEmail === email && (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED));
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
                    }).sort((a, b) => 0)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-gray-50/50 overflow-hidden">
            {/* Header */}
            <header className="pt-8 pb-4 px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shrink-0 border-b border-gray-100">
                <div className="max-w-[1800px] mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight mb-2">
                            Analytics
                        </h1>
                        <nav className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-2xl w-fit">
                            {(['business', 'staff', 'clients'] as TabType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-5 py-2.5 rounded-xl transition-all capitalize text-sm font-bold ${activeTab === t ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                >
                                    {t}
                                </button>
                            ))}
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
                    {activeTab === 'business' && renderBusinessTab()}
                    {activeTab === 'staff' && renderStaffTab()}
                    {activeTab === 'clients' && renderClientTab()}
                </div>
            </main>
        </div>
    );
}
