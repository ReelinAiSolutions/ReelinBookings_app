import React from 'react';
import { Calendar, Users, BarChart3, Settings, User, ExternalLink, Key, Briefcase } from 'lucide-react';
import { Organization } from '@/types';

interface AdminSidebarProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team') => void;
    currentOrg: Organization | null;
}

export default function AdminSidebar({ activeTab, setActiveTab, currentOrg }: AdminSidebarProps) {
    const workspaceItems = [
        { id: 'operations', label: 'Calendar', icon: Calendar },
        { id: 'analytics', label: 'Performance', icon: BarChart3 },
    ] as const;

    const managementItems = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'settings', label: 'Business Ops', icon: Settings },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white/40 backdrop-blur-3xl border-r border-gray-100/50 fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100/20">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('operations')}>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
                        <Calendar className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-[950] text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Elite</span>
                        <h1 className="text-sm font-[950] text-[#111827] tracking-tight truncate leading-tight">
                            {currentOrg?.name || 'Dashboard'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-5 space-y-9 overflow-y-auto mt-4 px-3">
                {/* Workspace Group */}
                <div className="space-y-1">
                    <p className="px-4 text-[11px] font-[950] text-gray-400 uppercase tracking-[0.2em] mb-4">Workspace</p>
                    {workspaceItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-[800] transition-all group ${isActive
                                    ? 'bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-[#111827] border border-gray-100'
                                    : 'text-gray-400 hover:bg-white/60 hover:text-[#111827]'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#4F46E5]' : 'text-gray-400 group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-1">
                    <p className="px-4 text-[11px] font-[950] text-gray-400 uppercase tracking-[0.2em] mb-4 mt-6">Management</p>
                    {managementItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-[800] transition-all group ${isActive
                                    ? 'bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-[#111827] border border-gray-100'
                                    : 'text-gray-400 hover:bg-white/60 hover:text-[#111827]'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#4F46E5]' : 'text-gray-400 group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Footer / Profile Card */}
            <div className="p-4 bg-transparent">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white hover:bg-white transition-all cursor-pointer group shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative border-2 border-white shadow-inner">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-[950] text-[#111827] truncate leading-tight">Felix V.</span>
                        <span className="text-[10px] font-[800] text-gray-400 uppercase tracking-tight">Agency Owner</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
