import React from 'react';
import { Calendar, Users, BarChart3, Settings, User, ExternalLink, Key, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types';

interface AdminSidebarProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team') => void;
    currentOrg: Organization | null;
}

export default function AdminSidebar({ activeTab, setActiveTab, currentOrg }: AdminSidebarProps) {
    const navItems = [
        { id: 'operations', label: 'Calendar', icon: Calendar },
        { id: 'analytics', label: 'Performance', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'settings', label: 'Business Ops', icon: Settings },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-gray-50/50 backdrop-blur-xl border-r border-gray-200/50 fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-200/30">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('operations')}>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:rotate-12">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Reelin</span>
                        <h1 className="text-sm font-black text-gray-900 tracking-tight truncate leading-tight">
                            {currentOrg?.name || 'Dashboard'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto mt-4">
                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Workspace</p>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive
                                    ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-black border border-gray-100'
                                    : 'text-gray-400 hover:bg-gray-100/50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Footer / Profile Card */}
            <div className="p-4 border-t border-gray-200/30">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 border border-white hover:bg-white transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-gray-900 truncate">Felix V.</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Agency Owner</span>
                    </div>
                    <Settings className="w-4 h-4 text-gray-300 ml-auto group-hover:rotate-90 transition-transform" />
                </div>
            </div>
        </aside>
    );
}
