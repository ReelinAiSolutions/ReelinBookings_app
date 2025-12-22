import { Calendar, Users, BarChart3, Settings, User, ExternalLink, Key, Briefcase, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types';

interface AdminNavProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team') => void;
    currentOrg: Organization | null;
}

export default function AdminNav({ activeTab, setActiveTab, currentOrg }: AdminNavProps) {
    const navItems = [
        { id: 'operations', label: 'Operations', icon: Calendar, mobileLabel: 'Calendar' },
        { id: 'services', label: 'Services', icon: Briefcase, mobileLabel: 'Services' },
        { id: 'team', label: 'Team', icon: Users, mobileLabel: 'Team' },
        { id: 'analytics', label: 'Analytics', icon: DollarSign, mobileLabel: 'Revenue' },
        { id: 'profile', label: 'Profile', icon: User, mobileLabel: 'Profile' },
    ] as const;

    return (
        <>
            {/* DESKTOP NAV MOVED TO SIDEBAR */}
            <div className="hidden"></div>

            {/* MOBILE NAV (Bottom Bar) - Hidden on Desktop */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center gap-1 w-full p-2 rounded-lg transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            <span className="text-[10px] font-medium tracking-tight">{item.mobileLabel}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
