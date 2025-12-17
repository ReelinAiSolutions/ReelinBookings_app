import React, { useMemo } from 'react';
import { processAnalytics } from '@/utils/analyticsUtils';
import { Activity, Calendar, Users, AlertCircle, TrendingUp, Clock, Scissors } from 'lucide-react';
import { Appointment } from '@/types';

interface AnalyticsViewProps {
    appointments: Appointment[];
}

export default function AnalyticsView({ appointments }: AnalyticsViewProps) {
    const metrics = useMemo(() => processAnalytics(appointments), [appointments]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Operational Analytics</h2>
                <p className="text-gray-500 text-sm">Insights derived from booking activity. No estimated revenue displayed.</p>
            </div>

            {/* Top Cards: Business Health */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</div>
                    <div className="text-xs text-gray-500 mt-1">All-time bookings</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Busiest Day</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.busiestDay}</div>
                    <div className="text-xs text-gray-500 mt-1">Highest frequency day</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{metrics.completionRate}</div>
                    <div className="text-xs text-gray-500 mt-1">Bookings completed</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Cancellations</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{metrics.cancellationRate}</div>
                    <div className="text-xs text-gray-500 mt-1">Cancellation rate</div>
                </div>
            </div>

            {/* Middle Section: Demand & Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Peak Hours Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-gray-900">Peak Demand Hours</h3>
                    </div>
                    <div className="space-y-4">
                        {metrics.peakHours.map((item, i) => (
                            <div key={item.hour} className="flex items-center gap-4">
                                <div className="w-16 text-sm font-medium text-gray-600">{item.hour}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary-500 h-full rounded-full"
                                        style={{ width: `${(item.count / (metrics.peakHours[0]?.count || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="w-12 text-right text-sm font-bold text-gray-900">{item.count}</div>
                            </div>
                        ))}
                        {metrics.peakHours.length === 0 && <div className="text-gray-400 text-sm">No data yet.</div>}
                    </div>
                </div>

                {/* Popular Services */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Scissors className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-gray-900">Top Services</h3>
                    </div>
                    <div className="space-y-4">
                        {metrics.topServices.map((item, i) => (
                            <div key={item.name} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">{item.count} bookings</span>
                            </div>
                        ))}
                        {metrics.topServices.length === 0 && <div className="text-gray-400 text-sm">No data yet.</div>}
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Staff Load</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {metrics.topStaff.map(staff => (
                        <div key={staff.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="font-medium text-gray-900">{staff.name}</div>
                            <div className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-bold shadow-sm">
                                {staff.count} appts
                            </div>
                        </div>
                    ))}
                    {metrics.topStaff.length === 0 && <div className="text-gray-400 text-sm">No data yet.</div>}
                </div>
            </div>
        </div>
    );
}
