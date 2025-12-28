import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Users, BarChart3, Settings, ChevronRight, Bell, Search,
    Plus, Clock, MapPin, Star, Sparkles, Building2, UserCircle,
    TrendingUp, DollarSign, Users2, Briefcase, ChevronLeft,
    Phone, Mail, Shield, Globe, Pencil, Trash2, CheckCircle2,
    CalendarDays, CreditCard, ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PreviewCalendar from './PreviewCalendar';

const AmbientBackground = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes mashDrift {
            0% { background-position: 0% 50%; opacity: 0.7; }
            50% { background-position: 100% 50%; opacity: 1; }
            100% { background-position: 0% 50%; opacity: 0.7; }
        }
        .ambient-mesh {
            background: radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.03) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, rgba(0, 122, 255, 0.02) 0%, transparent 100%);
            background-size: 200% 200%;
            animation: mashDrift 15s infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `}} />
);

interface PreviewDashboardProps {
    theme: 'current' | 'premium' | 'glass';
    externalTab?: 'calendar' | 'stats' | 'settings';
    isMobile?: boolean;
}

const MOCK_CHART_DATA = [
    { name: 'Mon', revenue: 400, bookings: 4 },
    { name: 'Tue', revenue: 700, bookings: 8 },
    { name: 'Wed', revenue: 500, bookings: 6 },
    { name: 'Thu', revenue: 900, bookings: 12 },
    { name: 'Fri', revenue: 1200, bookings: 15 },
    { name: 'Sat', revenue: 1500, bookings: 18 },
    { name: 'Sun', revenue: 800, bookings: 10 },
];

const MOCK_TEAM = [
    { id: 1, name: 'Sarah Johnson', role: 'Senior Stylist', status: 'Online', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 2, name: 'Michael Chen', role: 'Barber', status: 'Offline', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
    { id: 3, name: 'Elena Rodriguez', role: 'Esthetician', status: 'In Session', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
];

const MOCK_SERVICES = [
    { id: 1, name: 'Premium Haircut', price: '$85', duration: '45m', category: 'Hair' },
    { id: 2, name: 'Signature Facial', price: '$120', duration: '60m', category: 'Spa' },
    { id: 3, name: 'Express Beard Trim', price: '$40', duration: '20m', category: 'Barber' },
];

export default function PreviewDashboard({ theme, externalTab, isMobile = false }: PreviewDashboardProps) {
    const isPremium = theme === 'premium';
    const isGlass = theme === 'glass';
    const [activeTab, setActiveTab] = useState<'calendar' | 'stats' | 'settings'>(externalTab || 'calendar');
    const [settingsView, setSettingsView] = useState<'hub' | 'profile' | 'team' | 'services' | 'business'>('hub');

    // Sync with external tab if it changes
    React.useEffect(() => {
        if (externalTab) {
            setActiveTab(externalTab);
        }
    }, [externalTab]);

    // -- THEME VARIABLES --
    const styles = {
        bg: isPremium ? 'bg-[#F2F2F7]' : isGlass ? 'bg-slate-900' : 'bg-gray-50',
        card: isPremium ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[1.5rem]' : isGlass ? 'bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl' : 'bg-white shadow-sm border border-gray-200 rounded-xl',
        textMain: isGlass ? 'text-white' : 'text-gray-900',
        textSub: isGlass ? 'text-gray-400' : 'text-gray-500',
        primary: isPremium ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/20' : isGlass ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white',
        headerFont: isPremium ? 'font-black tracking-tight' : 'font-bold tracking-tight',
        nav: isPremium ? 'bg-white/80 backdrop-blur-xl border-t border-gray-200/50' : 'bg-white border-t border-gray-200',
    };

    const handleSettingsClick = (view: typeof settingsView) => {
        setActiveTab('settings');
        setSettingsView(view);
    };

    const renderHeader = (title: string, showBack = false, onBack?: () => void) => (
        <header className={`${isPremium ? 'pt-8 pb-4 px-8 bg-[#F2F2F7]/95 backdrop-blur-xl' : 'p-4 bg-white border-b border-gray-200'} sticky top-0 z-50 flex items-center gap-4 transition-all duration-300`}>
            {showBack && (
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200/50 rounded-full transition-colors active:scale-90">
                    <ChevronLeft className={`w-6 h-6 ${styles.textMain}`} />
                </button>
            )}
            <div className="flex flex-col">
                <h1 className={`text-3xl ${styles.headerFont} ${styles.textMain} tracking-tight`}>{title}</h1>
            </div>
            {!showBack && (
                <div className="ml-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm lg:hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                    </div>
                </div>
            )}
        </header>
    );

    // -- MODULE RENDERS --

    const renderProfile = () => (
        <div className="space-y-6">
            <div className={`${styles.card} p-6 flex flex-col items-center text-center`}>
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Felix" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Pencil className="w-3 h-3" />
                    </button>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Felix V.</h3>
                <p className="text-sm text-gray-500">Agency Principal</p>
                <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Pro Plan</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Verified</span>
                </div>
            </div>

            <div className="space-y-3 px-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Account Information</p>
                {[
                    { icon: Mail, label: 'Email', value: 'felix@reelin.ca' },
                    { icon: Phone, label: 'Phone', value: '+1 (416) 555-0192' },
                    { icon: Shield, label: 'Security', value: 'Password & 2FA' },
                    { icon: CheckCircle2, label: 'Subscription', value: 'Billed monthly' },
                ].map((item, i) => (
                    <div key={i} className={`${styles.card} p-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-colors`}>
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-white transition-colors">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                <p className="text-sm font-bold text-gray-900">{item.value}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </div>
                ))}
            </div>
            <button className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 rounded-2xl active:scale-95 transition-transform">
                Sign Out
            </button>
        </div>
    );

    const renderTeam = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-gray-900">Your Professionals</h3>
                <button className="p-2 bg-black text-white rounded-xl active:scale-90 transition-transform">
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-3">
                {MOCK_TEAM.map(member => (
                    <div key={member.id} className={`${styles.card} p-4 flex items-center justify-between group`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden relative">
                                <img src={member.image} alt={member.name} />
                                <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white ${member.status === 'Online' ? 'bg-green-500' : member.status === 'In Session' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{member.name}</h4>
                                <p className="text-xs text-gray-500">{member.role} • {member.status}</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
            <div className={`${styles.card} p-6 border-dashed border-2 flex flex-col items-center justify-center text-center opacity-70`}>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Users2 className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-900">Expand Your Team</p>
                <p className="text-xs text-gray-400 mt-1">Invite staff to manage their own schedules.</p>
            </div>
        </div>
    );

    const renderServices = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-gray-900">Active Catalog</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform">
                    <Plus className="w-4 h-4" /> Add Service
                </button>
            </div>
            <div className="space-y-3">
                {MOCK_SERVICES.map(service => (
                    <div key={service.id} className={`${styles.card} p-5 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
                                    <span className="text-xs font-black text-indigo-600">{service.price}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                                <Pencil className="w-4 h-4" />
                            </div>
                            <div className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBusiness = () => (
        <div className="space-y-6">
            <div className={`${styles.card} p-5 space-y-4`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight">Reelin Bookings</h4>
                        <p className="text-xs text-gray-500">Global Settings</p>
                    </div>
                </div>
                <div className="pt-2 border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500">Booking Interval</span>
                        <select
                            defaultValue="30 Minutes"
                            className="bg-gray-50 px-3 py-1.5 rounded-lg font-bold border-none outline-none"
                        >
                            <option>15 Minutes</option>
                            <option>30 Minutes</option>
                            <option>60 Minutes</option>
                        </select>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500">Currency</span>
                        <span className="font-black text-gray-900">CAD ($)</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 px-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Operational Hours</p>
                {['Mon - Fri', 'Saturday', 'Sunday'].map((day, i) => (
                    <div key={i} className={`${styles.card} p-4 flex items-center justify-between`}>
                        <span className="text-sm font-bold text-gray-900">{day}</span>
                        <div className="flex items-center gap-3">
                            {day === 'Sunday' ? (
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase">Closed</span>
                            ) : (
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{day === 'Saturday' ? '10:00 - 18:00' : '09:00 - 19:00'}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                    </div>
                ))}
            </div>

            <div className={`${styles.card} p-4 flex items-center gap-4 bg-indigo-600 text-white cursor-pointer hover:scale-[1.02] transition-transform`}>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Upgrade Subscription</h4>
                    <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Unlock team slots & analytics</p>
                </div>
                <ExternalLink className="w-4 h-4" />
            </div>
        </div>
    );

    return (
        <div className={`w-full h-full overflow-hidden flex ${styles.bg} transition-colors duration-500 font-sans relative`}>
            {isPremium && <AmbientBackground />}
            {isPremium && <div className="absolute inset-0 ambient-mesh pointer-events-none" />}

            {/* DESKTOP SIDEBAR */}
            {!isMobile && (
                <aside className={`hidden lg:flex flex-col w-64 shrink-0 ${isPremium ? 'bg-gray-50/50 backdrop-blur-xl border-r border-gray-200/50' : 'bg-white border-r border-gray-200'} pt-8 pb-6 px-4 justify-between transition-all duration-300`}>
                    <div className="space-y-8">
                        <div className="px-4 flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('calendar')}>
                            <div className={`w-10 h-10 rounded-2xl ${isPremium ? 'bg-black text-white' : 'bg-indigo-600 text-white'} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:rotate-12`}>
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className={`text-xl ${styles.headerFont} ${styles.textMain}`}>Reelin</span>
                        </div>

                        <div className="space-y-6">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? (isPremium ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-black' : 'bg-indigo-50 text-indigo-700') : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                                >
                                    <CalendarDays className="w-5 h-5" />
                                    <span className="text-sm font-bold">Calendar</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? (isPremium ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-black' : 'bg-indigo-50 text-indigo-700') : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span className="text-sm font-bold">Performance</span>
                                </button>
                            </nav>

                            <div className="px-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Management</p>
                                <nav className="space-y-1 -mx-2">
                                    {[
                                        { id: 'profile', icon: UserCircle, label: 'Profile' },
                                        { id: 'team', icon: Users, label: 'Team Members' },
                                        { id: 'services', icon: Briefcase, label: 'Services' },
                                        { id: 'business', icon: Building2, label: 'Business Ops' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSettingsClick(item.id as any)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === 'settings' && settingsView === item.id ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-sm font-semibold">{item.label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-auto p-3 rounded-2xl flex items-center gap-3 group cursor-pointer transition-all ${isPremium ? 'bg-white shadow-sm border border-gray-100 hover:shadow-md' : 'bg-gray-50 hover:bg-white'}`} onClick={() => handleSettingsClick('profile')}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-slate-100">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">Felix V.</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Agency Owner</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </div>
                </aside>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative border-4 border-transparent">
                <div className="flex-1 relative overflow-hidden bg-white">
                    {activeTab === 'calendar' ? (
                        <div className="absolute inset-0 bg-white">
                            <PreviewCalendar hideNav={true} onTabChange={setActiveTab} />
                        </div>
                    ) : activeTab === 'stats' ? (
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
                                    {[
                                        { label: 'Revenue', val: '$4,250', change: '+12%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
                                        { label: 'Bookings', val: '48', change: '+5%', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
                                        { label: 'New Clients', val: '12', change: '+8%', icon: Users2, color: 'text-purple-600', bg: 'bg-purple-50', dot: 'bg-purple-500' },
                                        { label: 'Avg Value', val: '$85', change: '-2%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
                                    ].map((stat, i) => (
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
                                                <p className="text-xs text-gray-400">Premium Haircut</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Accounts for 45% of total revenue this week. High demand continues.
                                        </p>
                                    </div>
                                </div>
                            </main>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col overflow-y-auto bg-gray-50 pb-24">
                            {settingsView === 'hub' ? renderHeader('Settings') : renderHeader(settingsView.charAt(0).toUpperCase() + settingsView.slice(1), true, () => setSettingsView('hub'))}
                            <main className="p-6">
                                {settingsView === 'hub' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                                        {[
                                            { id: 'profile', label: 'Felix V.', icon: UserCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
                                            { id: 'team', label: 'Team', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                            { id: 'services', label: 'Services', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { id: 'business', label: 'Business', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
                                        ].map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSettingsView(item.id as any)}
                                                className={`${styles.card} p-6 flex items-center justify-between cursor-pointer`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-16 h-16 rounded-3xl ${item.bg} ${item.color} flex items-center justify-center`}>
                                                        <item.icon className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-black text-gray-900 text-lg leading-tight">{item.label}</h3>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {settingsView === 'profile' && renderProfile()}
                                {settingsView === 'team' && renderTeam()}
                                {settingsView === 'services' && renderServices()}
                                {settingsView === 'business' && renderBusiness()}
                            </main>
                        </div>
                    )}
                </div>

                {/* MOBILE BOTTOM NAV - REFINED MINIMALIST VERSION */}
                <nav className={`h-20 bg-white border-t border-gray-100 flex items-center justify-around px-8 ${isMobile ? 'flex' : 'lg:hidden'} relative z-[9999]`}>
                    {[
                        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
                        { id: 'stats', label: 'Stats', icon: BarChart3 },
                        { id: 'settings', label: 'Settings', icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'settings') {
                                    handleSettingsClick('hub');
                                } else {
                                    setActiveTab(item.id as any);
                                }
                            }}
                            className={`flex flex-col items-center transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
                        >
                            <item.icon className={`w-7 h-7 ${activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
