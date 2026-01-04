import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Scissors, Calendar, BarChart3, Settings,
    Plus, Clock, MapPin, Star, Sparkles, Building2, UserCircle,
    TrendingUp, DollarSign, Users2, Briefcase, ChevronLeft,
    Phone, Mail, Shield, Globe, Pencil, Trash2, CheckCircle2,
    CalendarDays, CreditCard, ExternalLink, Filter, ShoppingBag, ArrowUpRight, User, ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PreviewCalendar from './PreviewCalendar';

const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
];

export default function PreviewDashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    const services = [
        { id: '1', name: 'Premium Haircut', price: '$45', duration: '45 min', category: 'Hair', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300' },
        { id: '2', name: 'Beard Grooming', price: '$25', duration: '30 min', category: 'Face', image: 'https://images.unsplash.com/photo-1599351474290-288d8481d77a?auto=format&fit=crop&q=80&w=300' },
        { id: '3', name: 'Complete Styling', price: '$85', duration: '90 min', category: 'Combo', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=300' }
    ];

    const staff = [
        { id: '1', name: 'Alex Rivera', role: 'Master Barber', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=fill&q=80&w=150' },
        { id: '2', name: 'Sarah Chen', role: 'Stylist Specialist', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=fill&q=80&w=150' },
        { id: '3', name: 'Marcus Bell', role: 'Senior Barber', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=fill&q=80&w=150' }
    ];

    return (
        <div className="flex bg-gray-50/50 min-h-screen">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                            <Scissors className="w-6 h-6" />
                        </div>
                        <span className="font-black text-xl tracking-tighter uppercase">BarberHub</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'appointments', icon: Calendar, label: 'Schedule' },
                        { id: 'services', icon: Scissors, label: 'Services' },
                        { id: 'team', icon: Users, label: 'The Team' },
                        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                        { id: 'settings', icon: Settings, label: 'Settings' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === item.id
                                    ? 'bg-black text-white shadow-xl shadow-black/10'
                                    : 'text-gray-400 hover:text-black hover:bg-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5 font-black uppercase tracking-widest text-[10px]" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6">
                    <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-gray-900">Premium Plan</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enterprise Mode</p>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-black transition-colors">
                            Manage Billing
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 p-10 space-y-10">
                {/* Top Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">
                            Welcome back, Admin Dashboard
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-3xl w-80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            />
                        </div>
                        <button className="p-4 bg-black text-white rounded-3xl shadow-xl shadow-black/20 hover:scale-105 transition-all">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Revenue', value: '$12,490', trend: '+14%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Bookings', value: '342', trend: '+8%', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Retention', value: '89%', trend: '+2%', icon: Users2, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Efficiency', value: '94%', trend: '+5%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <span className={`text-xs font-black p-1 px-2 rounded-lg bg-emerald-50 text-emerald-600`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Chart and Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Financial Performance</h3>
                                    <select className="bg-gray-50 border-none rounded-xl text-xs font-black uppercase tracking-widest px-4 py-2 outline-none">
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                    </select>
                                </div>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                                labelStyle={{ display: 'none' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <h3 className="text-xl font-black uppercase tracking-tight">Popular Services</h3>
                                <div className="space-y-4">
                                    {services.map((service) => (
                                        <div key={service.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden relative">
                                                <Image src={service.image} alt={service.name} fill className="object-cover" unoptimized />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm uppercase tracking-tight truncate">{service.name}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{service.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm">{service.price}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-black">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span>12%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[2rem] text-xs font-black text-gray-400 uppercase tracking-widest hover:border-black hover:text-black transition-all">
                                    View Service Insights
                                </button>
                            </div>
                        </div>

                        {/* Team Grid */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tight">Active Team Members</h3>
                                <button className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Manage Team</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {staff.map((member) => (
                                    <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all">
                                        <div className="relative">
                                            <Image src={member.avatar} alt={member.name} width={64} height={64} className="w-16 h-16 rounded-3xl object-cover ring-4 ring-gray-50 group-hover:ring-black/10 transition-all" unoptimized />
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white" />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase tracking-tight text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <PreviewCalendar />
                    </div>
                )}
            </div>
        </div>
    );
}
