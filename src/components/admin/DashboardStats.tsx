import React from 'react';
import { Users, DollarSign, CalendarCheck } from 'lucide-react';

interface DashboardStatsProps {
    stats: {
        totalRevenue: number;
        totalBookings: number;
        activeStaff: number;
    }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Revenue (Weekly)</h3>
                    <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                    <span className="bg-green-100 px-1.5 py-0.5 rounded mr-1">+0%</span> from last week
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                    <CalendarCheck className="w-5 h-5 text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-primary-600 flex items-center mt-1">
                    <span className="bg-primary-100 px-1.5 py-0.5 rounded mr-1">+0%</span> from last week
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Active Staff</h3>
                    <Users className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeStaff}</p>
                <p className="text-xs text-gray-400 mt-1">Ready for bookings</p>
            </div>
        </div>
    );
}
