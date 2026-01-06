import { Calendar, Users, BarChart3, Settings, ExternalLink, Key, Briefcase, Contact } from 'lucide-react';
import { Organization } from '@/types';
import Image from 'next/image';
import DarkModeToggle from '../DarkModeToggle';

interface AdminSidebarProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'services' | 'team' | 'clients';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'services' | 'team' | 'clients') => void;
    currentOrg: Organization | null;
}

export default function AdminSidebar({ activeTab, setActiveTab, currentOrg }: AdminSidebarProps) {
    const workspaceItems = [
        { id: 'operations', label: 'Calendar', icon: Calendar },
        { id: 'analytics', label: 'Performance', icon: BarChart3 },
    ] as const;

    const managementItems = [
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'clients', label: 'Clients', icon: Contact },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white dark:bg-sidebar border-r border-gray-100 dark:border-sidebar-border fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100/20 dark:border-gray-800">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('operations')}>
                    {currentOrg ? (
                        <>
                            {currentOrg.logo_url ? (
                                <Image src={currentOrg.logo_url} alt="Logo" width={40} height={40} className="rounded-2xl object-contain bg-white shadow-sm p-1" unoptimized />
                            ) : (
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
                                    <span className="text-sm font-bold">{currentOrg.name?.substring(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                            <div className="flex flex-col min-w-0 justify-center">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-0.5 opacity-0 animate-in fade-in duration-500">Workspace</span>
                                <h1 className="text-sm font-[950] text-[#111827] dark:text-white tracking-tight truncate leading-tight">
                                    {currentOrg.name}
                                </h1>
                            </div>
                        </>
                    ) : (
                        // Skeleton Loader
                        <>
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 animate-pulse" />
                            <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                                <div className="h-2 w-16 bg-gray-100 rounded-full animate-pulse" />
                                <div className="h-4 w-24 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                        </>
                    )}
                </div>
                <div className="ml-auto">
                    <DarkModeToggle />
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
                                    ? 'bg-primary-600 shadow-lg shadow-primary-600/20 text-white'
                                    : 'text-gray-400 hover:bg-primary-50 hover:text-primary-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600'}`} strokeWidth={isActive ? 2.5 : 2} />
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
                                    ? 'bg-white dark:bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-[#111827] dark:text-white border border-gray-100 dark:border-white/10'
                                    : 'text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-[#111827] dark:hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600 dark:text-white' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Footer Removed */}
        </aside>
    );
}
