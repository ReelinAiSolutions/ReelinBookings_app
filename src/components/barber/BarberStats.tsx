import React, { useState } from 'react';
import { Appointment, Service } from '@/types';
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

interface BarberStatsProps {
    appointments: Appointment[];
    services: Service[];
    currentStaffId: string;
}

type Timeframe = 'today' | 'week' | 'month' | 'year';

export default function BarberStats({ appointments, services, currentStaffId }: BarberStatsProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>('today');

    // Filter for THIS staff member
    const myAppointments = appointments.filter(a => a.staffId === currentStaffId && a.status !== 'CANCELLED');

    // Filter by Timeframe
    const getFilteredAppointments = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        switch (timeframe) {
            case 'today':
                return myAppointments.filter(a => a.date === todayStr);
            case 'week':
                return myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
                    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
                    end: endOfWeek(now, { weekStartsOn: 1 })
                }));
            case 'month':
                return myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
                    start: startOfMonth(now),
                    end: endOfMonth(now)
                }));
            case 'year':
                return myAppointments.filter(a => isWithinInterval(parseISO(a.date), {
                    start: startOfYear(now),
                    end: endOfYear(now)
                }));
            default:
                return [];
        }
    };

    const filteredAppointments = getFilteredAppointments();

    const calculateRevenue = (apts: Appointment[]) => {
        return apts.reduce((total, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return total + (service?.price || 0);
        }, 0);
    };

    const revenue = calculateRevenue(filteredAppointments);

    // Calculate Advanced Stats based on FILTERED appointments
    const clientCounts = filteredAppointments.reduce((acc, curr) => {
        acc[curr.clientName] = (acc[curr.clientName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topClientEntry = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
    const topClientName = topClientEntry ? topClientEntry[0] : 'None';
    const topClientVisits = topClientEntry ? topClientEntry[1] : 0;

    const uniqueClients = Object.keys(clientCounts).length;
    const returningClients = Object.values(clientCounts).filter(count => count > 1).length;
    // For Today/Week, return rate might be low/irrelevant using just that small window of data. 
    // Usually Return Rate is "All Time" or "Last 30 Days". 
    // Let's keep it tied to the window for "Repeat customers IN THIS PERIOD" vs "Unique customers IN THIS PERIOD"
    const returnRate = uniqueClients > 0 ? Math.round((returningClients / uniqueClients) * 100) : 0;

    const timeframeLabel = {
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        year: 'This Year'
    }[timeframe];

    // Calculate Future Appointments for Pipeline
    const now = new Date();
    const futureAppointments = myAppointments.filter(a => new Date(a.date + 'T' + a.timeSlot) > now);

    return (
        <div className="p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-black text-gray-900">My Performance</h1>

                {/* Timeframe Selector */}
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    {(['today', 'week', 'month', 'year'] as Timeframe[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === t
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Count */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-black text-gray-900">{filteredAppointments.length}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Clients ({timeframeLabel})</span>
                </div>

                {/* Revenue */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-black text-gray-900">${revenue}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Revenue ({timeframeLabel})</span>
                </div>

                {/* Return Rate */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-black text-gray-900">{returnRate}%</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Return Rate</span>
                </div>

                {/* Top Customer */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-gray-900 line-clamp-1 break-all px-1">{topClientName}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Top Client ({topClientVisits})</span>
                </div>
            </div>

            {/* Weekly Overview */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900">Upcoming Pipeline</h3>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Next 7 Days</span>
                    <span className="text-xl font-black text-gray-900">{futureAppointments.length} <span className="text-xs font-normal text-gray-500">bookings</span></span>
                </div>
            </div>

            {/* Tip / Motivation */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg text-white">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1">Keep it up!</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            You're doing great. Deliver excellent service to keep those re-bookings coming!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
