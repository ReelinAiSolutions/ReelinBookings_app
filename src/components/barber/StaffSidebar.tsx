import { Calendar, BarChart3, User, ExternalLink, Settings, Users, Contact } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types';

interface StaffSidebarProps {
    activeTab: 'schedule' | 'performance' | 'settings' | 'team' | 'clients';
    setActiveTab: (tab: 'schedule' | 'performance' | 'settings' | 'team' | 'clients') => void;
    currentOrg: Organization | null;
}

export default function StaffSidebar({ activeTab, setActiveTab, currentOrg }: StaffSidebarProps) {
    const navItems = [
        { id: 'schedule', label: 'Calendar', icon: Calendar },
        { id: 'performance', label: 'My Stats', icon: BarChart3 },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'clients', label: 'My Clients', icon: Contact },
        { id: 'settings', label: 'Profile Settings', icon: User },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100/20">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('schedule')}>
                    {currentOrg?.logo_url ? (
                        <img suppressHydrationWarning src={currentOrg.logo_url} alt="Logo" className="w-10 h-10 rounded-2xl object-contain bg-white shadow-sm p-1" />
                    ) : (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#d946ef] text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
                            <Calendar className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Reelin Bookings</span>
                        <h1 className="text-sm font-[950] text-[#111827] tracking-tight truncate leading-tight">
                            {currentOrg?.name || 'Dashboard'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-5 space-y-1 overflow-y-auto mt-4 px-3">
                <p className="px-4 text-[11px] font-[950] text-gray-400 uppercase tracking-[0.2em] mb-4">Workspace</p>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-[800] transition-all group ${isActive
                                ? 'bg-gradient-to-r from-[#A855F7] to-[#d946ef] shadow-[0_8px_20px_rgba(168,85,247,0.3)] text-white'
                                : 'text-gray-400 hover:bg-[#F3E8FF] hover:text-[#A855F7]'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#A855F7]'}`} strokeWidth={isActive ? 2.5 : 2} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Removed */}
        </aside>
    );
}
