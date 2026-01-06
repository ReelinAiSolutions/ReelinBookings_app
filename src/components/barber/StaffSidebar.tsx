import { Calendar, Users, BarChart3, Settings, User, Contact } from 'lucide-react';
import { Organization } from '@/types';
import Image from 'next/image';
import DarkModeToggle from '@/components/DarkModeToggle';

interface StaffSidebarProps {
    currentTab: 'dashboard' | 'schedule' | 'performance' | 'settings' | 'team' | 'clients';
    onTabChange: (tab: 'dashboard' | 'schedule' | 'performance' | 'settings' | 'team' | 'clients') => void;
    organization: Organization | null;
    staff?: any;
}

export default function StaffSidebar({ currentTab, onTabChange, organization }: StaffSidebarProps) {
    const workspaceItems = [
        { id: 'schedule', label: 'Calendar', icon: Calendar },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
    ] as const;

    const managementItems = [
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'clients', label: 'Clients', icon: Contact },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-72 h-screen bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-r border-gray-100/50 dark:border-white/5 fixed left-0 top-0 z-50 transition-all duration-500 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8 border-b border-gray-100/30 dark:border-white/5 bg-white/30 dark:bg-transparent">
                <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => onTabChange('schedule')}>
                    {organization ? (
                        <>
                            {organization.logo_url ? (
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-primary-500/20 blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Image src={organization.logo_url} alt="Logo" width={44} height={44} className="rounded-2xl object-contain bg-white shadow-md p-1.5 relative z-10" unoptimized />
                                </div>
                            ) : (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center shadow-xl group-hover:rotate-6 transition-all duration-500">
                                    <span className="text-sm font-black tracking-tighter">{organization.name?.substring(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                            <div className="flex flex-col min-w-0 justify-center">
                                <h1 className="text-[15px] font-[950] text-gray-900 dark:text-white tracking-tight truncate leading-tight">
                                    {organization.name}
                                </h1>
                                <p className="text-[9px] font-black text-primary-600/60 dark:text-primary-400/50 uppercase tracking-[0.15em] mt-0.5">Staff Portal</p>
                            </div>
                        </>
                    ) : (
                        // Skeleton Loader
                        <>
                            <div className="w-11 h-11 rounded-2xl bg-gray-100/50 dark:bg-white/5 animate-pulse" />
                            <div className="flex flex-col gap-2 min-w-0 justify-center">
                                <div className="h-3 w-20 bg-gray-100/50 dark:bg-white/5 rounded-full animate-pulse" />
                                <div className="h-2 w-12 bg-gray-100/30 dark:bg-white/5 rounded-full animate-pulse" />
                            </div>
                        </>
                    )}
                </div>
                <div className="ml-auto flex items-center">
                    <DarkModeToggle />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-10 overflow-y-auto mt-2">
                {/* Workspace Group */}
                <div className="space-y-1.5">
                    <p className="px-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] mb-5">Workspace</p>
                    {workspaceItems.map((item) => {
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id as any)}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13.5px] font-[850] transition-all duration-300 group relative ${isActive
                                    ? 'bg-primary-600 shadow-[0_10px_25px_-5px_rgba(var(--brand-primary-rgb,79,70,229),0.4)] text-white scale-[1.02]'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-700 dark:hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {item.label}
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-1.5">
                    <p className="px-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] mb-5">Management</p>
                    {managementItems.map((item) => {
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id as any)}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13.5px] font-[850] transition-all duration-300 group relative ${isActive
                                    ? 'bg-white dark:bg-white/10 shadow-[0_12px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-none text-gray-900 dark:text-white border border-gray-100/50 dark:border-white/10 scale-[1.02]'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-white/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}
