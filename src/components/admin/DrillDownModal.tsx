import React from 'react';
import { X, ChevronLeft, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    metric: 'revenue' | 'utilization' | 'clients' | 'appointments';
    data: any;
    compareMode?: boolean;
    comparisonData?: any;
}

export default function DrillDownModal({ isOpen, onClose, title, metric, data, compareMode, comparisonData }: DrillDownModalProps) {
    if (!isOpen) return null;

    const renderRevenueCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Staff */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Revenue by Staff</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topStaff.map((s: any) => ({ name: s.name.split(' ')[0], revenue: s.revenue }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {data.topStaff.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#10B981', 'var(--primary-600)', '#7C3AED', '#F59E0B'][index % 4]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Revenue by Service */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Revenue by Service</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topServices} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} angle={-45} textAnchor="end" height={80} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Average Ticket Size */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <h4 className="font-bold text-gray-900 mb-2">Average Ticket</h4>
                <p className="text-4xl font-black text-gray-900">${data.revenue.average.toFixed(0)}</p>
                <p className="text-sm text-gray-600 mt-2">Per appointment</p>
            </div>

            {/* Lost Revenue */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
                <h4 className="font-bold text-gray-900 mb-2">Missed Revenue</h4>
                <p className="text-4xl font-black text-gray-900">${data.revenue.lost.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">From cancellations & no-shows</p>
            </div>
        </div>
    );

    const renderUtilizationCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization by Staff */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Utilization by Staff</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topStaff.map((s: any) => ({ name: s.name.split(' ')[0], utilization: s.utilization }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `${val}%`} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="utilization" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {data.topStaff.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['var(--primary-600)', '#10B981', '#F59E0B', '#8B5CF6'][index % 4]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hours Worked */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Hours Worked by Staff</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topStaff.map((s: any) => ({ name: s.name.split(' ')[0], hours: s.hours }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="hours" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Demand Heatmap */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-2">
                <h4 className="font-bold text-gray-900 mb-4">Demand by Hour</h4>
                <div className="space-y-3">
                    {data.heatmap.slice(0, 8).map((item: any, index: number) => (
                        <div key={item.hour} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-bold text-gray-600">{item.hour}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-primary-500 to-purple-400 h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(item.count / (data.heatmap[0]?.count || 1)) * 100}%`,
                                        animationDelay: `${index * 50}ms`
                                    }}
                                />
                            </div>
                            <div className="w-16 text-sm font-bold text-gray-900 text-right">{item.count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderClientsCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Clients */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-2">
                <h4 className="font-bold text-gray-900 mb-4">Top Clients by Spending</h4>
                <div className="space-y-2">
                    {data.topClients.slice(0, 5).map((client: any, index: number) => (
                        <div key={client.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                                            'bg-gray-200 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.visits} visits</p>
                                </div>
                            </div>
                            <p className="font-black text-gray-900">${client.spent.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Client Metrics */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-2">Return Rate</h4>
                <p className="text-4xl font-black text-gray-900">{data.clients.returnRate}</p>
                <p className="text-sm text-gray-600 mt-2">Clients coming back</p>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-2xl border border-primary-200">
                <h4 className="font-bold text-gray-900 mb-2">Total Active</h4>
                <p className="text-4xl font-black text-gray-900">{data.clients.totalActive}</p>
                <p className="text-sm text-gray-600 mt-2">Unique clients</p>
            </div>
        </div>
    );

    const renderAppointmentsCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments by Staff */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Appointments by Staff</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topStaff.map((s: any) => ({ name: s.name.split(' ')[0], bookings: s.bookings }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="bookings" fill="#F59E0B" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {data.topStaff.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#F59E0B', 'var(--primary-600)', '#10B981', '#8B5CF6'][index % 4]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Appointments by Service */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Appointments by Service</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topServices} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} angle={-45} textAnchor="end" height={80} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Metrics */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
                <h4 className="font-bold text-gray-900 mb-2">Cancellation Rate</h4>
                <p className="text-4xl font-black text-gray-900">{data.cancellationRate}</p>
                <p className="text-sm text-gray-600 mt-2">Appointments cancelled</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border border-orange-200">
                <h4 className="font-bold text-gray-900 mb-2">No-Show Rate</h4>
                <p className="text-4xl font-black text-gray-900">{data.noShowRate}</p>
                <p className="text-sm text-gray-600 mt-2">Clients didn't show up</p>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white md:rounded-3xl shadow-2xl max-w-6xl w-full h-full md:h-auto md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5 md:p-6 flex items-center justify-between sticky top-0 z-10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 -ml-2 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1 text-white font-bold"
                        >
                            <ChevronLeft className="w-6 h-6" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white">{title}</h2>
                            <p className="text-primary-100 text-xs md:text-sm mt-0.5">Detailed breakdown and insights</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors hidden md:block"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 overflow-y-auto h-[calc(100vh-80px)] md:max-h-[calc(90vh-100px)]">
                    <button
                        onClick={onClose}
                        className="mb-6 flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    {metric === 'revenue' && renderRevenueCharts()}
                    {metric === 'utilization' && renderUtilizationCharts()}
                    {metric === 'clients' && renderClientsCharts()}
                    {metric === 'appointments' && renderAppointmentsCharts()}
                </div>
            </div>
        </div>
    );
}
