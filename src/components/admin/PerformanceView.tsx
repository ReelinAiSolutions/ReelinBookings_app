import React from 'react';
import { DollarSign, CalendarDays, Users2, TrendingUp, Star } from 'lucide-react';
import { Appointment, Staff, Service } from '@/types';

interface PerformanceViewProps {
    appointments: Appointment[];
    services: Service[];
    staff: Staff[];
}

export default function PerformanceView({ appointments, services, staff }: PerformanceViewProps) {
    // Calculate stats from real data
    const totalRevenue = appointments
        .filter(apt => apt.status === 'booked' || apt.status === 'completed')
        .reduce((sum, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return sum + (service?.price || 0);
        }, 0);

    const totalBookings = appointments.filter(apt => apt.status !== 'canceled').length;

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
            <main className="flex-1 bg-[#F2F2F7] px-5 pt-6 pb-24 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={2} />
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight mb-1">{stat.val}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-gray-900">Revenue</h3>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg">
                                Week
                            </button>
                            <button className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                                Month
                            </button>
                        </div>
                    </div>
                    <div className="h-[200px] lg:h-[300px] w-full bg-gray-50/50 rounded-xl flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-[10px] border border-gray-100">
                        Chart Visualization
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900">Peak Hours</h4>
                                <p className="text-xs text-gray-400">2 PM - 5 PM</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Most bookings occur during afternoon hours. Consider adjusting staff schedules.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Star className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900">Top Service</h4>
                                <p className="text-xs text-gray-400">
                                    {services.length > 0 ? services[0].name : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Accounts for 45% of total revenue this week. High demand continues.
                        </p>
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
