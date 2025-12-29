import React from 'react';
import { DollarSign, CalendarDays, Users2, TrendingUp, Star } from 'lucide-react';
import { Appointment, Staff, Service, AppointmentStatus } from '@/types';

interface PerformanceViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

export default function PerformanceView({ appointments, services, staff }: PerformanceViewProps) {
    // Calculate stats from real data
    const totalRevenue = appointments
        .filter(apt => apt.status === AppointmentStatus.CONFIRMED || apt.status === AppointmentStatus.COMPLETED)
        .reduce((sum, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return sum + (service?.price || 0);
        }, 0);

    const totalBookings = appointments.filter(apt => apt.status !== AppointmentStatus.CANCELLED).length;

    const uniqueClients = new Set(appointments.map(apt => apt.clientEmail)).size;

    const avgValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Mock change percentages (in production, calculate from historical data)
    const stats = [
        { label: 'Revenue', val: `$${totalRevenue.toLocaleString()}`, change: '+12%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bookings', val: totalBookings.toString(), change: '+5%', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'New Clients', val: uniqueClients.toString(), change: '+8%', icon: Users2, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg Value', val: `$${Math.round(avgValue)}`, change: '-2%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="absolute inset-0 flex flex-col bg-white scrollbar-hide" style={{ overflow: 'auto' }}>
            {/* Sticky Header - Matching Calendar Style */}
            <header className="pt-6 pb-2 px-5 bg-[#F2F2F7]/90 backdrop-blur-md sticky top-0 z-50 flex flex-col shrink-0 transition-all">
                <div className="h-6 flex items-start">
                    {/* Empty space for consistency with calendar */}
                </div>
                <div className="flex items-end justify-between mt-1">
                    <h1 className="text-[30px] font-black tracking-tight text-gray-900 leading-tight">
                        Performance
                    </h1>
                    <div className="flex items-center gap-2.5 mb-2">
                        {/* Future: Add filter/date range selector */}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 bg-[#F5F5F7] px-8 pt-8 pb-32 space-y-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col justify-between h-40">
                                <div className="flex justify-between items-start">
                                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2.5} />
                                    </div>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">{stat.val}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Chart Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Revenue Trends</h3>
                                <p className="text-gray-400 font-medium text-sm mt-1">Income visualization over time</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-xl">
                                <button className="px-4 py-2 text-sm font-bold text-gray-900 bg-white shadow-sm rounded-lg transition-all">
                                    Week
                                </button>
                                <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-colors">
                                    Month
                                </button>
                            </div>
                        </div>
                        <div className="h-[400px] w-full bg-gradient-to-b from-gray-50 to-white rounded-2xl flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs border border-gray-100 dashed border-2">
                            Chart Visualization Area
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-7 h-7 text-indigo-600" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">Peak Hours</h4>
                                    <p className="text-base text-gray-500 font-medium">Most bookings occur between <span className="text-indigo-600 font-bold">2 PM - 5 PM</span></p>
                                </div>
                            </div>
                            <div className="pl-[4.5rem]">
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    Consider adding an extra staff member during these hours to maximize revenue potential.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Star className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">Top Performer</h4>
                                    <p className="text-base text-gray-500 font-medium">
                                        <span className="text-emerald-600 font-bold">{services.length > 0 ? services[0].name : 'N/A'}</span> is trending up.
                                    </p>
                                </div>
                            </div>
                            <div className="pl-[4.5rem]">
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    This service accounts for 45% of your total revenue this month.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}
