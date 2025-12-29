import React, { useState, useMemo } from 'react';
import { DollarSign, CalendarDays, Users2, TrendingUp, Star, Clock, Briefcase, ChevronRight } from 'lucide-react';
import { Appointment, Staff, Service, AppointmentStatus } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format, startOfWeek, addDays, isSameDay, subDays, startOfYear, eachMonthOfInterval } from 'date-fns';

interface PerformanceViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

type TabType = 'business' | 'staff' | 'clients';

export default function PerformanceView({ appointments, services, staff }: PerformanceViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('business');

    // --- DATA CALCULATIONS ---

    // Filter valid appointments
    const validAppointments = useMemo(() =>
        appointments.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED),
        [appointments]);

    // 1. BUSINESS STATS
    const totalRevenue = useMemo(() => validAppointments.reduce((sum, apt) => {
        const s = services.find(srv => srv.id === apt.serviceId);
        return sum + (s?.price || 0);
    }, 0), [validAppointments, services]);

    const totalBookings = validAppointments.length;
    const avgValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Revenue Chart Data (Last 7 Days)
    const revenueData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

        return last7Days.map(date => {
            const dayRevenue = validAppointments
                .filter(apt => isSameDay(new Date(apt.date), date))
                .reduce((sum, apt) => {
                    const s = services.find(srv => srv.id === apt.serviceId);
                    return sum + (s?.price || 0);
                }, 0);
            return {
                name: format(date, 'EEE'),
                fullDate: format(date, 'MMM d'),
                value: dayRevenue
            };
        });
    }, [validAppointments, services]);

    // 2. STAFF STATS
    const staffStats = useMemo(() => {
        return staff.map(member => {
            const memberApts = validAppointments.filter(a => a.staffId === member.id);
            const revenue = memberApts.reduce((sum, apt) => {
                const s = services.find(srv => srv.id === apt.serviceId);
                return sum + (s?.price || 0);
            }, 0);
            const hours = memberApts.reduce((sum, apt) => {
                const s = services.find(srv => srv.id === apt.serviceId);
                return sum + ((s?.durationMinutes || 0) / 60);
            }, 0);

            return {
                id: member.id,
                name: member.name,
                bookings: memberApts.length,
                revenue,
                hours
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [staff, validAppointments, services]);

    // 3. CLIENT STATS
    const clientStats = useMemo(() => {
        const clientMap = new Map<string, { name: string, email: string, count: number, value: number, lastVisit: string }>();

        validAppointments.forEach(apt => {
            const current = clientMap.get(apt.clientEmail) || {
                name: apt.clientName,
                email: apt.clientEmail,
                count: 0,
                value: 0,
                lastVisit: apt.date
            };

            const s = services.find(srv => srv.id === apt.serviceId);
            current.count += 1;
            current.value += (s?.price || 0);
            if (new Date(apt.date) > new Date(current.lastVisit)) {
                current.lastVisit = apt.date;
            }
            clientMap.set(apt.clientEmail, current);
        });

        const allClients = Array.from(clientMap.values());
        const totalClients = allClients.length;
        const returningClients = allClients.filter(c => c.count > 1).length;
        const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

        return {
            total: totalClients,
            returning: returningClients,
            retentionRate,
            topClients: allClients.sort((a, b) => b.value - a.value).slice(0, 5)
        };
    }, [validAppointments, services]);


    // --- RENDERERS ---

    const renderBusinessTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <DollarSign className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+12.5%</span>
                    </div>
                    <div className="mb-1">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">${totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <CalendarDays className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">+5%</span>
                    </div>
                    <div className="mb-1">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Bookings</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalBookings}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">-1.2%</span>
                    </div>
                    <div className="mb-1">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Avg. Order Value</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">${Math.round(avgValue)}</h3>
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent h-[450px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">Revenue Trends</h3>
                        <p className="text-gray-400 font-medium">Performance over the last 7 days</p>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ stroke: '#4F46E5', strokeWidth: 2 }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderStaffTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Utilization Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staffStats.slice(0, 4).map((member, i) => (
                    <div key={member.id} className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold bg-indigo-50 text-indigo-600 shrink-0`}>
                            {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {member.bookings} Bookings</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(member.hours)} Hrs</span>
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                    <span className="text-gray-400">Revenue Contribution</span>
                                    <span className="text-indigo-600">${member.revenue.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-indigo-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(member.revenue / totalRevenue) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Staff Performance Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent h-[400px]">
                <h3 className="text-2xl font-black text-gray-900 mb-8">Revenue by Staff Member</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={staffStats} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }} width={100} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={30}>
                            {staffStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#4F46E5', '#818CF8', '#C7D2FE'][index % 3]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderClientTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Clients</p>
                    <h3 className="text-4xl font-black text-gray-900">{clientStats.total}</h3>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Returning Clients</p>
                    <h3 className="text-4xl font-black text-indigo-600">{clientStats.returning}</h3>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Retention Rate</p>
                    <h3 className="text-4xl font-black text-emerald-600">{Math.round(clientStats.retentionRate)}%</h3>
                </div>
            </div>

            {/* Top Clients Table */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] min-h-[400px]">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Top Clients</h3>
                <div className="space-y-4">
                    {clientStats.topClients.map((client, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{client.name}</div>
                                    <div className="text-xs text-gray-400 font-medium">{client.count} visits • Last seen {format(new Date(client.lastVisit), 'MMM d')}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">${client.value.toLocaleString()}</div>
                                <div className="text-xs text-emerald-600 font-bold">Lifetime Value</div>
                            </div>
                        </div>
                    ))}
                    {clientStats.topClients.length === 0 && (
                        <div className="text-center py-12 text-gray-400 font-medium">No client data available yet.</div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <header className="pt-6 pb-4 px-8 bg-[#F5F5F7]/90 backdrop-blur-md sticky top-0 z-50 shrink-0 border-b border-gray-200/50">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight mb-2">
                            Analytics
                        </h1>
                        <nav className="flex items-center gap-2 text-sm font-bold bg-gray-200/50 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('business')}
                                className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Business
                            </button>
                            <button
                                onClick={() => setActiveTab('staff')}
                                className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'staff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Staff
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'clients' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Clients
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 bg-[#F5F5F7] px-8 pt-8 pb-32 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    {activeTab === 'business' && renderBusinessTab()}
                    {activeTab === 'staff' && renderStaffTab()}
                    {activeTab === 'clients' && renderClientTab()}
                </div>
            </main>
        </div>
    );
}
