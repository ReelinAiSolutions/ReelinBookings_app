
import React, { useState, useMemo } from 'react';
import {
    CalendarDays,
    TrendingUp,
    Users2,
    Clock,
    DollarSign,
    MoreHorizontal,
    ChevronDown,
    Zap,
    Ban,
    ArrowUpRight,
    ArrowDownRight,
    Heart,
    Star,
    Activity,
    Trophy,
    CheckCircle2,
    Sparkles,
    Briefcase,
    ChevronRight,
    Calendar as CalendarIcon,
    Target,
    UserMinus,
    Repeat,
    User,
    UserPlus,
    Search,
    Mail,
    X
} from 'lucide-react';
import { Appointment, Staff, Service, AppointmentStatus } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { format, startOfWeek, addDays, isSameDay, subDays, startOfYear, eachMonthOfInterval, isWithinInterval, startOfMonth, subMonths, endOfDay, startOfDay, subWeeks, getYear, differenceInDays, getHours, getDay } from 'date-fns';
import { getClientGradient } from '@/utils/colorUtils';

interface PerformanceViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
    primaryColor?: string;
}

type TabType = 'business' | 'staff' | 'clients';
type TimeRange = 'week' | 'month' | 'year' | 'custom';

export default function PerformanceView({ appointments, services, staff, primaryColor = '#a855f7' }: PerformanceViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('business');
    const [staffSort, setStaffSort] = useState<'bookings' | 'utilization' | 'revenue'>('revenue');
    const [clientSearch, setClientSearch] = useState('');
    const [clientSort, setClientSort] = useState<'ltv' | 'visits' | 'recent'>('ltv');
    const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [clientStaffFilter, setClientStaffFilter] = useState<string>('all');
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

    // --- OPTIMIZED DATA STRUCTURES (O(N)) ---

    // Service Map for O(1) Lookups
    const servicesMap = useMemo(() => {
        const map = new Map<string, Service>();
        services.forEach(s => map.set(s.id, s));
        return map;
    }, [services]);

    // Centralized Client Processor (Single Pass)
    const allClients = useMemo(() => {
        const groups = new Map<string, Appointment[]>();

        appointments.forEach(apt => {
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
                latestApt: latest,
                servedBy: Array.from(new Set(history.map(a => a.staffId)))
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null);
    }, [appointments, servicesMap]);

    const getStats = (apts: Appointment[]) => {
        // Filter out internal system appointments (Blocks/Internal Walk-ins)
        const customerApts = apts.filter(a =>
            !a.clientEmail.toLowerCase().includes('internal') &&
            !a.clientName.toLowerCase().includes('blocked time')
        );

        const valid = customerApts.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
        const cancelled = customerApts.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

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

    // --- SHARED METRICS (Required for multiple tabs) ---

    // Occupancy Rate
    const occupancyRate = useMemo(() => {
        const days = differenceInDays(currentRange.end, currentRange.start) + 1;
        const totalCapacityMinutes = days * 8 * 60 * (staff.length || 1);
        return Math.min(100, Math.round((currentStats.bookedMinutes / totalCapacityMinutes) * 100));
    }, [currentStats.bookedMinutes, currentRange, staff.length]);

    // Peak Demand (Heatmap)
    const demandHeatmap = useMemo(() => {
        const hours = new Array(24).fill(0);
        currentStats.valid.forEach(apt => {
            const h = getHours(new Date(apt.date));
            hours[h]++;
        });
        const max = Math.max(...hours, 1);
        return hours.map((count, hour) => ({ hour, count, intensity: count / max }));
    }, [currentStats.valid]);

    // Category Breakdown (moved from Business Tab specific to shared if needed, but used in Business)
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

    // Forecast
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

    // --- PERFORMANCE OPTIMIZED HOOKS ---

    // Pre-calculated Historic Client Set (for Return Rate)
    const historicClientSet = useMemo(() => {
        const set = new Set<string>();
        const cutOff = currentRange.start;
        appointments.forEach(a => {
            if (new Date(a.date) < cutOff && a.status !== AppointmentStatus.BLOCKED) {
                set.add(a.clientEmail.toLowerCase());
            }
        });
        return set;
    }, [appointments, currentRange.start]);

    // Staff Performance Metrics (O(N))
    const staffStats = useMemo(() => {
        const validByStaff = new Map<string, Appointment[]>();
        const allByStaff = new Map<string, Appointment[]>();

        currentStats.valid.forEach(a => {
            if (!validByStaff.has(a.staffId)) validByStaff.set(a.staffId, []);
            validByStaff.get(a.staffId)!.push(a);
        });
        currentAppointments.forEach(a => {
            if (!allByStaff.has(a.staffId)) allByStaff.set(a.staffId, []);
            allByStaff.get(a.staffId)!.push(a);
        });

        const days = differenceInDays(currentRange.end, currentRange.start) + 1;
        const capacity = days * 8 * 60; // 8h/day baseline

        return staff.map(member => {
            const mValid = validByStaff.get(member.id) || [];
            const mAll = allByStaff.get(member.id) || [];

            const revenue = mValid.reduce((sum, a) => sum + (servicesMap.get(a.serviceId)?.price || 0), 0);
            const bookedMins = mValid.reduce((sum, a) => sum + (servicesMap.get(a.serviceId)?.durationMinutes || 0), 0);

            const utilization = Math.min(100, Math.round((bookedMins / capacity) * 100));
            const missed = mAll.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW).length;
            const noShowCount = mAll.filter(a => a.status === AppointmentStatus.NO_SHOW).length;

            let returningCount = 0;
            mValid.forEach(a => {
                if (historicClientSet.has(a.clientEmail.toLowerCase())) returningCount++;
            });
            const repeatRate = mValid.length > 0 ? (returningCount / mValid.length) * 100 : 0;

            return {
                ...member,
                revenue,
                bookings: mValid.length,
                utilization,
                missed,
                noShowCount,
                repeatRate
            };
        });
    }, [staff, currentStats.valid, currentAppointments, servicesMap, currentRange, historicClientSet]);

    const sortedStaff = useMemo(() => {
        return [...staffStats].sort((a, b) => {
            if (staffSort === 'revenue') return b.revenue - a.revenue;
            if (staffSort === 'utilization') return b.utilization - a.utilization;
            return b.bookings - a.bookings;
        });
    }, [staffStats, staffSort]);

    // Client Metrics (O(N) using our pre-processed allClients)
    const clientMetrics = useMemo(() => {
        const uniqueInPeriod = new Set(currentStats.valid.map(a => a.clientEmail.toLowerCase()));
        let newUnique = 0;
        let retUnique = 0;

        uniqueInPeriod.forEach(email => {
            if (historicClientSet.has(email)) retUnique++;
            else newUnique++;
        });

        // Retention Risk Calculation (O(C))
        const atRiskCount = allClients.filter(c => c.status === 'At Risk').length;
        const totalActive = allClients.length;

        return {
            totalActive,
            newUnique,
            retUnique,
            atRisk: atRiskCount,
            mix: [
                { name: 'Returning', value: retUnique, color: primaryColor },
                { name: 'New', value: newUnique, color: '#3b82f6' } // Blue as a secondary accent
            ]
        };
    }, [currentStats.valid, historicClientSet, allClients]);

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
    }, [timeRange, currentRange, currentStats.valid, services]);


    // --- BUSINESS TAB SPECIFIC LOGIC ---

    const [serviceSort, setServiceSort] = useState<'revenue' | 'bookings'>('revenue');
    const [activeSections, setActiveSections] = useState({
        bookingHealth: true,
        timeDemand: true,
        services: true,
        clientHealth: true,
        timeDemandStaff: true // Reverting to old state name or ensuring it matches if I change it back
    });

    const toggleSection = (section: keyof typeof activeSections) => {
        setActiveSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Booking Health Metrics
    const bookingHealthMetrics = useMemo(() => {
        const upcoming = currentAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED && new Date(a.date) > new Date()).length;
        const completed = currentAppointments.filter(a => a.status === AppointmentStatus.COMPLETED || (a.status === AppointmentStatus.CONFIRMED && new Date(a.date) <= new Date())).length;
        const cancelled = currentAppointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW).length;
        const noShowCount = currentAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
        const total = currentAppointments.length;
        const noShowRate = total > 0 ? (noShowCount / total) * 100 : 0;

        return { upcoming, completed, cancelled, noShowRate };
    }, [currentAppointments]);

    // Bookings Trend Chart Data
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

    // Least Booked Hours
    const leastBookedHours = useMemo(() => {
        const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
        const hourCounts = new Map<number, number>();
        businessHours.forEach(h => hourCounts.set(h, 0));

        currentStats.valid.forEach(apt => {
            const h = getHours(new Date(apt.date));
            if (hourCounts.has(h)) {
                hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
            }
        });

        return Array.from(hourCounts.entries())
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([hour, count]) => ({ hour, count }));
    }, [currentStats.valid]);

    // Top Services (Sorted)
    const topServicesList = useMemo(() => {
        const serviceMap = new Map<string, { name: string, count: number, revenue: number }>();
        currentStats.valid.forEach(apt => {
            const s = services.find(srv => srv.id === apt.serviceId);
            if (!s) return;
            const curr = serviceMap.get(s.id) || { name: s.name, count: 0, revenue: 0 };
            curr.count++;
            curr.revenue += s.price;
            serviceMap.set(s.id, curr);
        });

        const list = Array.from(serviceMap.values());
        if (serviceSort === 'revenue') {
            return list.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        } else {
            return list.sort((a, b) => b.count - a.count).slice(0, 5);
        }
    }, [currentStats.valid, services, serviceSort]);

    // Avg Visits Per Client
    const avgVisitsPerClient = useMemo(() => {
        if (clientMetrics.totalActive === 0) return 0;
        return (currentStats.valid.length / clientMetrics.totalActive).toFixed(1);
    }, [currentStats.valid.length, clientMetrics.totalActive]);



    // Insight Generator
    const insightText = useMemo(() => {
        if (currentStats.bookings === 0) return "No data available for this period yet.";
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        currentStats.valid.forEach(a => dayCounts[getDay(new Date(a.date))]++);
        const busyDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const quietDayIndex = dayCounts.indexOf(Math.min(...dayCounts));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[busyDayIndex]}s are your busiest days, while ${days[quietDayIndex]}s tend to be quieter.`;
    }, [currentStats.bookings, currentStats.valid]);

    const staffInsightText = useMemo(() => {
        if (staffStats.length === 0) return "No staff data available.";
        // Find top performer by bookings
        const topBooker = [...staffStats].sort((a, b) => b.bookings - a.bookings)[0];
        if (topBooker && topBooker.bookings > 0) {
            return `${topBooker.name} is leading the team with ${topBooker.bookings} bookings this period.`;
        }
        // Fallback if no bookings
        return "Team availability is open for new bookings.";
    }, [staffStats]);

    const clientInsightText = useMemo(() => {
        const total = clientMetrics.mix[0].value + clientMetrics.mix[1].value;
        if (total === 0) return "No client activity recorded for this period.";

        const returnRate = (clientMetrics.mix[0].value / total) * 100;
        if (returnRate > 50) return `Strong Loyalty: ${returnRate.toFixed(0)}% of your clients are returning.`;
        if (clientMetrics.mix[1].value > clientMetrics.mix[0].value) return `Growth Mode: You're acquiring more new clients than returning ones.`;

        return "Balanced mix of new and returning clients.";
    }, [clientMetrics]);


    // --- RENDERERS ---

    const CollapsibleSection = ({
        title,
        isOpen,
        onToggle,
        children,
        icon: Icon
    }: {
        title: string,
        isOpen: boolean,
        onToggle: () => void,
        children: React.ReactNode,
        icon: any
    }) => (
        <div className="bg-white dark:bg-card rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0">
                    {children}
                </div>
            </div>
        </div>
    );

    const renderBusinessTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

            {/* 1. TOP SUMMARY (HEADLINE STATS) - Always Visible */}
            <div className="space-y-6">
                {/* Insight Banner */}
                {/* Insight Banner - Galaxy Theme */}
                <div className="bg-[#0A051C] relative overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-primary-900/20 flex items-center gap-3 border border-white/5">
                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% -20%, ${primaryColor}, transparent)` }} />
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 100%, ${primaryColor}, transparent)` }} />
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm relative z-10">
                        <Zap className="w-4 h-4 text-accent-400 fill-accent-400" />
                    </div>
                    <p className="text-sm font-medium relative z-10">{insightText}</p>
                </div>

                {/* Hero Stats Grid - FLATTENED */}
                {/* Hero Stats Grid - FLATTENED */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue (Large) */}
                    <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[24px] p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[180px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Total Revenue</h3>
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
                            <p className="text-xs text-gray-500 mt-2 font-medium">Generated this period</p>
                        </div>
                    </div>

                    {/* Confirmed Bookings */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between col-span-1">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl"><CalendarDays className="w-5 h-5" /></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{currentStats.bookings}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmed Bookings</p>
                        </div>
                    </div>

                    {/* Projected Revenue */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between col-span-1">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                            <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">Next 30d</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">${forecast.revenue.toLocaleString()}</h3>
                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Projected</p>
                        </div>
                    </div>

                    {/* Missed Opportunity */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between col-span-1">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl"><Ban className="w-5 h-5" /></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">${currentStats.lostRevenue.toLocaleString()}</h3>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Missed Opp.</p>
                        </div>
                    </div>

                    {/* Schedule Filled % */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden col-span-1">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl"><Clock className="w-5 h-5" /></div>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{occupancyRate}%</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[80px] leading-tight">Schedule Filled</p>
                            </div>
                            <div className="relative w-12 h-12 -mt-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[{ value: occupancyRate }, { value: 100 - occupancyRate }]}
                                            innerRadius={10}
                                            outerRadius={16}
                                            startAngle={90}
                                            endAngle={-270}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            <Cell fill={primaryColor} />
                                            <Cell fill="#2c2c2e" className="dark:fill-white/10" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BOOKING HEALTH (Collapsible) */}
            <CollapsibleSection
                title="Booking Health"
                icon={Heart}
                isOpen={activeSections.bookingHealth}
                onToggle={() => toggleSection('bookingHealth')}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bookings Trend Chart */}
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Bookings Over Time</h4>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={bookingsGraphData}>
                                    <defs>
                                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip
                                        cursor={{ stroke: primaryColor, strokeWidth: 1 }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={3} fill="url(#colorBookings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdown & No-Show */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Status Breakdown</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-primary-500"></span> Upcoming</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{bookingHealthMetrics.upcoming}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-green-500"></span> Completed</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{bookingHealthMetrics.completed}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400"></span> Cancelled</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{bookingHealthMetrics.cancelled}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-red-900 dark:text-red-300">No-Show Rate</h4>
                                <p className="text-[10px] text-red-600/70 dark:text-red-400/70 font-medium">Missed appointments</p>
                            </div>
                            <span className="text-2xl font-black text-red-600 dark:text-red-400">{bookingHealthMetrics.noShowRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </CollapsibleSection >


            {/* 3. TIME & DEMAND (Collapsible) */}
            < CollapsibleSection
                title="Time & Demand"
                icon={Clock}
                isOpen={activeSections.timeDemand}
                onToggle={() => toggleSection('timeDemand')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Peak Demand Heatmap */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Peak Demand Hours</h4>
                            <div className="flex gap-2 text-[10px] font-bold text-gray-400">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span> Busy</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-200"></span> Quiet</span>
                            </div>
                        </div>
                        <div className="h-32 w-full flex items-end gap-1">
                            {demandHeatmap.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className={`w-full rounded-t transition-all ${h.intensity > 0.6 ? 'bg-primary-600' : h.intensity > 0.2 ? 'bg-primary-300' : 'bg-primary-100'}`}
                                        style={{ height: `${Math.max(10, h.intensity * 100)}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 px-1">
                            <span>12 AM</span>
                            <span>12 PM</span>
                            <span>11 PM</span>
                        </div>
                    </div>

                    {/* Least Booked Hours */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Least Booked Hours</h4>
                        <div className="space-y-2">
                            {leastBookedHours.map((h, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg">
                                            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">{h.count} bookings</span>
                                </div>
                            ))}
                            {leastBookedHours.length === 0 && <p className="text-xs text-gray-400 italic">No data available.</p>}
                        </div>

                    </div>

                    <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100/50 dark:border-primary-500/10">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-primary-900 dark:text-primary-300">Avg. Daily Schedule Filled</span>
                            <span className="text-sm font-black text-primary-600 dark:text-primary-400">{occupancyRate}%</span>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* 4. SERVICES PERFORMANCE (Collapsible) */}
            <CollapsibleSection
                title="Services Performance"
                icon={Star}
                isOpen={activeSections.services}
                onToggle={() => toggleSection('services')}
            >
                <div className="flex justify-end mb-4">
                    <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-lg">
                        <button
                            onClick={() => setServiceSort('revenue')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${serviceSort === 'revenue' ? 'bg-white dark:bg-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                            type="button"
                        >
                            By Revenue
                        </button>
                        <button
                            onClick={() => setServiceSort('bookings')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${serviceSort === 'bookings' ? 'bg-white dark:bg-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                            type="button"
                        >
                            By Bookings
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {topServicesList.map((srv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                            <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black ${i < 3 ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                                    #{i + 1}
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight break-words">{srv.name}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-900 dark:text-white">{srv.count}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase">Bookings</div>
                                </div>
                                <div className="text-right w-14 sm:w-16">
                                    <div className="text-sm font-black text-gray-900 dark:text-white">${srv.revenue.toLocaleString()}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase">Revenue</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {topServicesList.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No service data.</p>}
                </div>
            </CollapsibleSection >


            {/* 5. CLIENT HEALTH (Collapsible - High Level Only) */}
            < CollapsibleSection
                title="Client Health"
                icon={Users2}
                isOpen={activeSections.clientHealth}
                onToggle={() => toggleSection('clientHealth')}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full mb-2">
                            <Repeat className="w-5 h-5" />
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                            {((clientMetrics.mix[0].value / (clientMetrics.totalActive || 1)) * 100).toFixed(0)}%
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Repeat Client Rate</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full mb-2">
                            <Users2 className="w-5 h-5" />
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                            {avgVisitsPerClient}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Visits / Client</p>
                    </div>
                </div>
            </CollapsibleSection >

        </div >
    );
    const renderStaffTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

                {/* Team Insight Banner */}
                {/* Team Insight Banner - Galaxy Theme */}
                <div className="bg-[#0A051C] relative overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-primary-900/20 flex items-center gap-3 border border-white/5">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_-20%,var(--primary-600),transparent)]" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_0%_100%,var(--primary-600),transparent)]" />
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm relative z-10">
                        <Zap className="w-4 h-4 text-accent-400 fill-accent-400" />
                    </div>
                    <p className="text-sm font-medium relative z-10">{staffInsightText}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Team Performance</h3>
                    <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-white/10 p-1 rounded-full overflow-x-auto max-w-full no-scrollbar">
                        {(['bookings', 'utilization', 'revenue'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStaffSort(s)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize whitespace-nowrap ${staffSort === s ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Staff Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedStaff.map((member, index) => {
                        const isTopPerformer = index === 0;
                        return (
                            <div
                                key={member.id}
                                className={`rounded-[24px] p-5 border transition-all group relative overflow-hidden ${isTopPerformer
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20 scale-[1.02] z-10'
                                    : 'bg-white dark:bg-card border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/20'
                                    }`}
                            >
                                {/* Rank Badge */}
                                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[20px] font-black text-xs uppercase tracking-widest ${isTopPerformer ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                                    }`}>
                                    #{index + 1}
                                </div>

                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:scale-105 ${isTopPerformer
                                        ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none'
                                        : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/20 dark:shadow-none'
                                        }`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isTopPerformer ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>{member.name}</div>
                                        <div className={`text-xs font-medium ${isTopPerformer ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Retention: {member.repeatRate.toFixed(0)}%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <div className={`p-3 rounded-2xl ${isTopPerformer ? 'bg-white/60 dark:bg-black/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Bookings</div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white">{member.bookings}</div>
                                    </div>
                                    <div className={`p-3 rounded-2xl ${isTopPerformer ? 'bg-white/60 dark:bg-black/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Utilization</div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white">{member.utilization}%</div>
                                    </div>
                                    <div className={`col-span-2 p-3 rounded-2xl flex justify-between items-center ${isTopPerformer ? 'bg-emerald-500 text-white shadow-sm' : 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300'
                                        }`}>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isTopPerformer ? 'text-emerald-100' : 'text-primary-400'}`}>Revenue</div>
                                        <div className="text-xl font-black">${member.revenue.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Abstract Sparkle for Top Performer */}
                                {isTopPerformer && (
                                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl pointer-events-none opacity-50"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    const renderClientTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

                {/* Insight Banner */}
                {/* Insight Banner - Galaxy Theme */}
                <div className="bg-[#0A051C] relative overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-primary-900/20 flex items-center gap-3 border border-white/5">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_-20%,var(--primary-600),transparent)]" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_0%_100%,var(--primary-600),transparent)]" />
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm relative z-10">
                        <Sparkles className="w-4 h-4 text-accent-400 fill-accent-400" />
                    </div>
                    <p className="text-sm font-medium relative z-10">{clientInsightText}</p>
                </div>

                {/* ROW 1: METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Total Active Clients */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-6 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white">{clientMetrics.totalActive}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Active Clients</p>
                            </div>
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl"><Users2 className="w-5 h-5" /></div>
                        </div>
                        {/* Tiny Sparkline Decoration */}
                        <div className="absolute bottom-0 left-0 w-full h-12 opacity-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{ v: 10 }, { v: 20 }, { v: 15 }, { v: 25 }, { v: 30 }]}>
                                    <Area type="monotone" dataKey="v" stroke={primaryColor} fill={primaryColor} strokeWidth={5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Retention Rate */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-6 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                    {((clientMetrics.mix[0].value / (clientMetrics.mix[0].value + clientMetrics.mix[1].value || 1)) * 100).toFixed(0)}%
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Retention Rate</p>
                            </div>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Repeat className="w-5 h-5" /></div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${((clientMetrics.mix[0].value / (clientMetrics.mix[0].value + clientMetrics.mix[1].value || 1)) * 100)}%` }}></div>
                        </div>
                    </div>

                    {/* At Risk */}
                    <div className="bg-white dark:bg-card rounded-[24px] p-6 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white">{clientMetrics.atRisk}</h3>
                                <p className="text-xs font-bold text-red-300 uppercase tracking-widest mt-1">At Risk Clients</p>
                            </div>
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl"><UserMinus className="w-5 h-5" /></div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-4">Haven't visited in 90+ days</p>
                    </div>
                </div>

                {/* ROW 2: MINI CRM SECTION */}
                <div className="bg-white dark:bg-card rounded-[32px] p-8 shadow-sm border border-gray-100/50 dark:border-white/10 min-h-[600px]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Client Portal</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Manage relationships and track loyalty ({Array.from(new Set(appointments.filter(a => a.status !== AppointmentStatus.BLOCKED && !a.clientEmail.toLowerCase().includes('internal') && !a.clientName.toLowerCase().includes('blocked time')).map(a => a.clientEmail))).length} total)</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                                    <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        value={clientStaffFilter}
                                        onChange={(e) => setClientStaffFilter(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer min-w-[140px] text-gray-900 dark:text-white"
                                    >
                                        <option value="all">Every Staff</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="flex flex-wrap justify-center sm:flex-nowrap items-center gap-1 p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm w-full sm:w-auto">
                                    {(['ltv', 'visits', 'recent'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setClientSort(s)}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${clientSort === s ? 'bg-white dark:bg-primary-900/40 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allClients
                            .filter(c => (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase())))
                            .filter(c => (clientStaffFilter === 'all' || c.servedBy.includes(clientStaffFilter)))
                            .sort((a, b) => {
                                if (clientSort === 'ltv') return b.totalLtv - a.totalLtv;
                                if (clientSort === 'visits') return b.visits - a.visits;
                                return b.lastVisitDate.getTime() - a.lastVisitDate.getTime();
                            })
                            .map((client, index) => {
                                const isTopClient = index === 0 && (clientSearch === '' && clientStaffFilter === 'all');

                                const statusStyles = {
                                    'VIP': 'bg-amber-50 text-amber-700 border-amber-100',
                                    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                    'New': 'bg-primary-50 text-primary-700 border-primary-100',
                                    'At Risk': 'bg-red-50 text-red-700 border-red-100'
                                };

                                return (
                                    <div
                                        key={client.email}
                                        className={`group p-6 rounded-[24px] border transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden ${isTopClient
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20 scale-[1.02] z-10'
                                            : 'bg-white dark:bg-card border-gray-100 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-100/30 dark:hover:shadow-none'
                                            }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[20px] font-black text-xs uppercase tracking-widest ${isTopClient ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                                            }`}>
                                            #{index + 1}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all group-hover:scale-110 ${isTopClient
                                                    ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none'
                                                    : `${getClientGradient(client.name)} text-white shadow-md dark:shadow-none`
                                                    }`}>
                                                    {client.name.charAt(0)}
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyles[client.status]}`}>
                                                    {client.status}
                                                </span>
                                            </div>

                                            <div className="mb-6">
                                                <h4 className={`font-bold truncate transition-colors ${isTopClient ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>{client.name}</h4>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isTopClient ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{client.email}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className={`p-3 rounded-2xl ${isTopClient ? 'bg-white/60 dark:bg-black/20' : 'border border-gray-100 dark:border-white/5 shadow-sm'}`} style={!isTopClient ? { backgroundColor: '#ffffff' } : undefined}>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total LTV</div>
                                                    <div className="text-lg font-black text-gray-900 dark:text-white">${client.totalLtv.toLocaleString()}</div>
                                                </div>
                                                <div className={`p-3 rounded-2xl ${isTopClient ? 'bg-white/60 dark:bg-black/20' : 'bg-transparent dark:bg-white/5'}`}>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Visits</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-lg font-black text-gray-900 dark:text-white">{client.visits}</div>
                                                        <span className="text-[10px] text-gray-400 font-medium">total</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`p-3 rounded-xl border mb-6 ${isTopClient ? 'bg-white/80 dark:bg-black/20 border-emerald-100 dark:border-emerald-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-100/50 dark:border-white/5'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Visit</span>
                                                </div>
                                                <div className="text-xs font-bold text-gray-700 dark:text-gray-200">{format(client.lastVisitDate, 'MMM d, yyyy')}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{servicesMap.get(client.latestApt.serviceId)?.name || 'Service Unspecified'}</div>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-2 pt-4 border-t relative z-10 ${isTopClient ? 'border-emerald-200/50 dark:border-emerald-500/20' : 'border-gray-50 dark:border-white/5'}`}>
                                            <button
                                                onClick={() => setSelectedClientEmail(client.email)}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isTopClient
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500'
                                                    }`}
                                            >
                                                View History
                                            </button>
                                            <a
                                                href={`mailto:${client.email}?subject=Just checking in!`}
                                                className={`p-2 rounded-xl border border-transparent transition-all shadow-sm ${isTopClient
                                                    ? 'bg-white dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:border-emerald-200'
                                                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-white/10 hover:border-primary-100 dark:hover:border-primary-500/30'
                                                    }`}
                                                title="Email Client"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                            <button className={`p-2 rounded-xl border border-transparent transition-all shadow-sm ${isTopClient
                                                ? 'bg-white dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:border-emerald-200'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-white/10 hover:border-primary-100 dark:hover:border-primary-500/30'
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
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-0 overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        Analytics
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Performance Intelligence
                    </p>
                </div>
            </div>

            {/* Filters Bar (Tabs & Time Range) */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-100/80 dark:bg-white/5 p-3 rounded-[24px] border border-transparent">
                <div className="flex items-center gap-1 p-1 bg-white/50 dark:bg-white/5 rounded-xl w-fit">
                    {['business', 'staff', 'clients'].map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as TabType)}
                            className={`px-4 py-2 rounded-lg transition-all capitalize text-[10px] font-black uppercase tracking-widest ${activeTab === t ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    {timeRange === 'custom' && (
                        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-right-4">
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="text-[10px] font-black text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-24"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="text-[10px] font-black text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-24"
                            />
                        </div>
                    )}

                    <div className="bg-white/50 dark:bg-white/5 p-1 rounded-xl flex text-[10px] font-black uppercase tracking-widest w-full md:w-auto border border-gray-100 dark:border-white/5">
                        {(['week', 'month', 'year', 'custom'] as TimeRange[]).map(r => (
                            <button
                                key={r}
                                onClick={() => {
                                    setTimeRange(r);
                                    if (r === 'custom') setIsCustomDateModalOpen(true);
                                }}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all capitalize ${timeRange === r ? 'bg-white dark:bg-card text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}
                            >
                                {r === 'custom' ? 'Custom' : `${r}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pb-32 overflow-y-auto w-full scroll-smooth">
                <div className="max-w-[1800px] mx-auto w-full">
                    {activeTab === 'business' && renderBusinessTab()}
                    {activeTab === 'staff' && renderStaffTab()}
                    {activeTab === 'clients' && renderClientTab()}
                </div>
            </main>

            {/* --- CLIENT HISTORY MODAL --- */}
            {selectedClientEmail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSelectedClientEmail(null)}
                    />
                    <div className="bg-white dark:bg-card rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col border border-gray-100 dark:border-white/10">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-card sticky top-0 z-20">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Client History</h3>
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{selectedClientEmail}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClientEmail(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* History Timeline */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30 dark:bg-black/20">
                            {appointments
                                .filter(a => a.clientEmail === selectedClientEmail)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((apt, idx) => {
                                    const service = services.find(s => s.id === apt.serviceId);
                                    const staffMember = staff.find(s => s.id === apt.staffId);

                                    return (
                                        <div key={apt.id} className="relative pl-8 group">
                                            {/* Vertical Line */}
                                            {idx !== appointments.filter(a => a.clientEmail === selectedClientEmail).length - 1 && (
                                                <div className="absolute left-3.5 top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-white/10 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors" />
                                            )}

                                            {/* Dot */}
                                            <div className="absolute left-0 top-1.5 w-7 h-7 bg-white dark:bg-card border-2 border-gray-200 dark:border-white/20 rounded-full flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors">
                                                <div className="w-2 h-2 bg-gray-200 dark:bg-white/20 rounded-full group-hover:bg-primary-500 transition-colors" />
                                            </div>

                                            <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            {format(new Date(apt.date), 'EEEE, MMMM d, yyyy')}
                                                        </div>
                                                        <div className="text-lg font-bold text-gray-900 dark:text-white">{service?.name || 'Unknown Service'}</div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${apt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                                        apt.status === AppointmentStatus.CONFIRMED ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20' :
                                                            'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10'
                                                        }`}>
                                                        {apt.status}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg">
                                                            <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-300">{staffMember?.name || 'Unassigned'}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg">
                                                            <DollarSign className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-300">${service?.price || 0}</div>
                                                    </div>
                                                </div>

                                                {apt.notes && (
                                                    <div className="mt-4 p-3 bg-primary-50/30 dark:bg-primary-900/10 rounded-xl text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-primary-200 dark:border-primary-500/30">
                                                        "{apt.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Summary Footer */}
                        <div className="p-6 bg-white dark:bg-card border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedClientEmail(null)}
                                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
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
                    <div className="bg-white dark:bg-card rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col border border-gray-100 dark:border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/10">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Custom Range</h3>
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
                                            className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
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
                                            className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCustomDateModalOpen(false)}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-gray-200 transition-all shadow-xl shadow-gray-200 dark:shadow-none active:scale-95"
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
