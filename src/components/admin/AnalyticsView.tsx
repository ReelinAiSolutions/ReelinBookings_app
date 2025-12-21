import React, { useMemo, useState } from 'react';
import { processAnalytics, DateRange } from '@/utils/analyticsUtils';
import { Activity, Calendar, Users, AlertCircle, TrendingUp, Clock, Scissors, DollarSign, Repeat, ChevronDown, ChevronUp, Trophy, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Appointment, Service, Staff } from '@/types';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';

interface AnalyticsViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

type TimeFilter = 'this_month' | 'last_month' | 'this_year' | 'all_time';

export default function AnalyticsView({ appointments, services, staff }: AnalyticsViewProps) {
    const [filter, setFilter] = useState<TimeFilter>('this_month');

    // Calculate Date Ranges based on Filter
    const ranges = useMemo(() => {
        const now = new Date();
        let current: DateRange;
        let previous: DateRange;

        switch (filter) {
            case 'this_month':
                current = { start: startOfMonth(now), end: now }; // Up to now
                previous = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
                break;
            case 'last_month':
                current = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
                previous = { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(subMonths(now, 2)) };
                break;
            case 'this_year':
                current = { start: startOfYear(now), end: now };
                previous = { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
                break;
            case 'all_time':
                // Hacky "All Time" - last 10 years
                current = { start: subYears(now, 10), end: now };
                previous = { start: subYears(now, 20), end: subYears(now, 10) }; // Compare to "nothing" essentially
                break;
        }
        return { current, previous };
    }, [filter]);

    const metrics = useMemo(() => processAnalytics(appointments, services, staff, ranges.current, ranges.previous), [appointments, services, staff, ranges]);

    const [openSections, setOpenSections] = useState({
        overview: true,
        trends: false,
        team: false,
        services: false,
        clients: false
    });

    const toggle = (key: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const SectionHeader = ({ title, icon: Icon, id, subtitle }: { title: string, icon: any, id: keyof typeof openSections, subtitle?: string }) => (
        <button
            onClick={() => toggle(id)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all mb-2 shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <span className="font-bold text-gray-900 block">{title}</span>
                    {subtitle && <span className="text-xs text-gray-500 font-medium">{subtitle}</span>}
                </div>
            </div>
            {openSections[id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
    );

    const GrowthBadge = ({ value, trend }: { value: number, trend: 'up' | 'down' | 'neutral' }) => {
        if (filter === 'all_time') return null; // No growth for all time
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

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Analytics Dashboard</h2>
                    <p className="text-sm text-gray-500">Track your business growth and performance.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {(['this_month', 'last_month', 'this_year', 'all_time'] as TimeFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* 1. BUSINESS OVERVIEW */}
            <div>
                <SectionHeader title="Business Overview" subtitle="Revenue, Growth & Health" icon={Activity} id="overview" />
                {openSections.overview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-2">

                        {/* Revenue */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">${Number(metrics.revenue.total.value).toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <GrowthBadge value={metrics.revenue.total.growth} trend={metrics.revenue.total.trend} />
                                <span className="text-xs text-gray-400 font-medium">Avg ${metrics.revenue.average.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Utilization */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Utilization</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{metrics.utilization.value}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <GrowthBadge value={metrics.utilization.growth} trend={metrics.utilization.trend} />
                                <span className="text-xs text-gray-400 font-medium">Occupancy</span>
                            </div>
                        </div>

                        {/* New Clients */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Clients</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{metrics.clients.newCount.value}</h3>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <GrowthBadge value={metrics.clients.newCount.growth} trend={metrics.clients.newCount.trend} />
                                <span className="text-xs text-gray-400 font-medium">{metrics.clients.returnRate} Return Rate</span>
                            </div>
                        </div>

                        {/* Lost Revenue */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Missed</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">${metrics.revenue.lost.toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="px-2 py-1 bg-gray-50 rounded-md text-xs font-bold text-gray-500">
                                    {metrics.cancellationRate} Cancel Rate
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* 2. TIME & TRENDS (Collapsible) */}
            <div>
                <SectionHeader title="Time & Demand Analysis" subtitle="Peak Hours, Days & Months" icon={Calendar} id="trends" />
                {openSections.trends && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in slide-in-from-top-2">
                        {/* Peak Times Text */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center gap-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <span className="text-gray-500 font-medium">Busiest Day</span>
                                <span className="font-black text-xl text-gray-900">{metrics.busiest.day}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Busiest Hour</span>
                                <span className="font-black text-xl text-gray-900">{metrics.busiest.hour}</span>
                            </div>
                        </div>

                        {/* Peak Hours Chart */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" /> Demand Heatmap
                            </h4>
                            <div className="space-y-3">
                                {metrics.heatmap.slice(0, 5).map((item) => (
                                    <div key={item.hour} className="flex items-center gap-4">
                                        <div className="w-12 text-xs font-bold text-gray-500">{item.hour}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary-600 h-full rounded-full"
                                                style={{ width: `${(item.count / (metrics.heatmap[0]?.count || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {metrics.heatmap.length === 0 && <p className="text-sm text-gray-400 italic">No data available.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. TEAM PERFORMANCE (Collapsible) */}
            <div>
                <SectionHeader title="Staff Leaderboard" subtitle="Rankings by Revenue" icon={Trophy} id="team" />
                {openSections.team && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 animate-in slide-in-from-top-2">
                        {metrics.topStaff.map((staff, index) => (
                            <div key={staff.name} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' :
                                            index === 1 ? 'bg-gray-100 text-gray-600 ring-4 ring-gray-50' :
                                                index === 2 ? 'bg-orange-100 text-orange-700 ring-4 ring-orange-50' : 'bg-white text-gray-400 border border-gray-200'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{staff.name}</p>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {staff.bookings} bookings
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-gray-900 text-lg">${staff.revenue.toLocaleString()}</span>
                                    <span className="text-xs text-gray-400 block tracking-wider text-green-600 font-medium">${staff.avgTicket.toFixed(0)} avg/tkt</span>
                                </div>
                            </div>
                        ))}
                        {metrics.topStaff.length === 0 && <div className="p-8 text-center text-gray-400">No staff data yet.</div>}
                    </div>
                )}
            </div>

            {/* 4. SERVICE INSIGHTS (Collapsible) */}
            <div>
                <SectionHeader title="Top Services" subtitle="Highest Grossing" icon={Scissors} id="services" />
                {openSections.services && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 animate-in slide-in-from-top-2">
                        {metrics.topServices.map((service, index) => (
                            <div key={service.name} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <span className="font-medium text-gray-900">{service.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-gray-900">${service.revenue.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500">{service.share.toFixed(0)}% share</span>
                                </div>
                            </div>
                        ))}
                        {metrics.topServices.length === 0 && <div className="p-8 text-center text-gray-400">No service data yet.</div>}
                    </div>
                )}
            </div>

            {/* 5. CLIENT INSIGHTS (Collapsible) */}
            <div>
                <SectionHeader title="VIP Clients" subtitle="Top Spenders & Loyalists" icon={Users} id="clients" />
                {openSections.clients && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1">#</div>
                            <div className="col-span-5">Client</div>
                            <div className="col-span-3 text-right">Spent</div>
                            <div className="col-span-3 text-right">Visits</div>
                        </div>
                        {metrics.topClients.map((client, index) => (
                            <div key={client.email} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="col-span-1 font-bold text-gray-400 text-xs">{index + 1}</div>
                                <div className="col-span-5">
                                    <p className="font-bold text-gray-900 text-sm truncate">{client.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                </div>
                                <div className="col-span-3 text-right font-bold text-gray-900 text-sm">${client.spent.toLocaleString()}</div>
                                <div className="col-span-3 text-right text-xs text-gray-600 font-medium">{client.visits}</div>
                            </div>
                        ))}
                        {metrics.topClients.length === 0 && <div className="p-8 text-center text-gray-400">No client data available.</div>}
                    </div>
                )}
            </div>

        </div>
    );
}
