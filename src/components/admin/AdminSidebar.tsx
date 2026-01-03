import { Calendar, Users, BarChart3, Settings, User, ExternalLink, Key, Briefcase, Contact } from 'lucide-react';
import { Organization } from '@/types';

interface AdminSidebarProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team' | 'clients';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team' | 'clients') => void;
    currentOrg: Organization | null;
}

export default function AdminSidebar({ activeTab, setActiveTab, currentOrg }: AdminSidebarProps) {
    const workspaceItems = [
        { id: 'operations', label: 'Calendar', icon: Calendar },
        { id: 'analytics', label: 'Performance', icon: BarChart3 },
    ] as const;

    const managementItems = [
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'clients', label: 'Clients', icon: Contact },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'settings', label: 'Business Ops', icon: Settings },
        { id: 'profile', label: 'Profile Settings', icon: User },
    ] as const;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100/20">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('operations')}>
                    {currentOrg?.logo_url ? (
                        <img suppressHydrationWarning src={currentOrg.logo_url} alt="Logo" className="w-10 h-10 rounded-2xl object-contain bg-white shadow-sm p-1" />
                    ) : (
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
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
                                    ? 'bg-primary-600 shadow-[0_8px_20px_rgba(45,22,93,0.15)] text-white'
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
                                    ? 'bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-[#111827] border border-gray-100'
                                    : 'text-gray-400 hover:bg-white/60 hover:text-[#111827]'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#2D165D]' : 'text-gray-400 group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
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
