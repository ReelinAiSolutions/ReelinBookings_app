'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ChartData {
    name: string;
    bookings: number;
    revenue: number;
}

interface DashboardChartsProps {
    data: ChartData[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-[400px] animate-pulse"></div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-[400px] animate-pulse"></div>
        </div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-[420px] transition-all hover:shadow-xl hover:shadow-gray-200/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Revenue</h3>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">Gross business performance</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="75%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                            cursor={{ stroke: '#4F46E5', strokeWidth: 1 }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueMain)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Bookings Chart */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-[420px] transition-all hover:shadow-xl hover:shadow-gray-200/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Appointments</h3>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">Booking volume & density</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="75%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                        <Tooltip
                            cursor={{ stroke: '#8b5cf6', strokeWidth: 1 }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
