import React from 'react';
import { Users, DollarSign, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
    stats: {
        totalRevenue: number;
        totalBookings: number;
        activeStaff: number;
    }
}

const colorMap = {
    green: {
        gradient: 'from-green-500 to-emerald-600',
        glow: 'bg-green-500',
        fallback: 'bg-green-600'
    },
    blue: {
        gradient: 'from-blue-500 to-cyan-600',
        glow: 'bg-blue-500',
        fallback: 'bg-blue-600'
    },
    orange: {
        gradient: 'from-orange-500 to-red-600',
        glow: 'bg-orange-500',
        fallback: 'bg-orange-600'
    }
};

export default function DashboardStats({ stats }: DashboardStatsProps) {
    const renderStat = (title: string, value: string | number, Icon: any, color: 'green' | 'blue' | 'orange', subtitle?: string) => {
        const colors = colorMap[color];

        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-300/60 cursor-default">
                {/* Background Glow Layer */}
                <div className={`absolute inset-[-6px] ${colors.glow} rounded-[32px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className={`absolute inset-[-2px] ${colors.glow} rounded-[24px] blur-sm opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</h3>
                            <div className="h-0.5 w-6 bg-gray-100 mt-1 rounded-full group-hover:w-12 transition-all duration-500 group-hover:bg-blue-200" />
                        </div>
                        <div className="relative group/icon">
                            {/* Robust Background for Mobile Visibility */}
                            <div className={`absolute inset-0 ${colors.fallback} rounded-xl blur-md opacity-20 group-hover:opacity-50 transition-opacity duration-300`} />
                            <div className={`relative p-3 bg-gradient-to-br ${colors.gradient} rounded-xl shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-gray-900 tracking-tight">
                            {value}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                            {subtitle || 'Performance Overview'}
                        </p>
                        <div className="p-1 px-2 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            Live
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderStat('Weekly Revenue', `$${stats.totalRevenue.toLocaleString()}`, DollarSign, 'green', 'Updated just now')}
            {renderStat('Total Bookings', stats.totalBookings, CalendarCheck, 'blue', 'Active appointments')}
            {renderStat('Team Members', stats.activeStaff, Users, 'orange', 'On-duty staff')}
        </div>
    );
}
