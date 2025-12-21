import React from 'react';
import { Calendar, Users, BarChart3, Settings, User, ExternalLink, Key, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types';

interface AdminSidebarProps {
    activeTab: 'operations' | 'services' | 'team' | 'analytics' | 'settings' | 'profile' | 'invites';
    setActiveTab: (tab: 'operations' | 'services' | 'team' | 'analytics' | 'settings' | 'profile' | 'invites') => void;
    currentOrg: Organization | null;
}

export default function AdminSidebar({ activeTab, setActiveTab, currentOrg }: AdminSidebarProps) {
    const navItems = [
        { id: 'operations', label: 'Operations', icon: Calendar },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'profile', label: 'Profile', icon: User },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <img suppressHydrationWarning src={currentOrg?.logo_url || '/logo.png'} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Reelin Bookings</span>
                        <h1 className="text-sm font-black text-gray-900 tracking-tight truncate leading-tight">
                            {currentOrg?.name || 'Dashboard'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / Live Link */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                {currentOrg && (
                    <Link
                        href={`/${currentOrg.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Live Site
                    </Link>
                )}
            </div>
        </aside>
    );
}
