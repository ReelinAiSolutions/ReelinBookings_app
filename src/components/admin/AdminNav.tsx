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
        { id: 'analytics', label: 'Stats', icon: BarChart3, mobileLabel: 'Stats' },
        { id: 'profile', label: 'Profile', icon: User, mobileLabel: 'Profile' },
    ] as const;

    return (
        <>
            {/* DESKTOP NAV MOVED TO SIDEBAR */}
            <div className="hidden"></div>

            {/* MOBILE NAV (Bottom Bar) - Hidden on Desktop */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-gray-200/50 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center gap-1.5 w-full p-2 rounded-xl transition-all duration-300 ${isActive
                                ? 'text-primary-600 scale-110'
                                : 'text-gray-400 hover:text-gray-600 active:scale-95'
                                }`}
                        >
                            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            </div>
                            <span className={`text-[10px] font-black tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-60 text-[9px]'}`}>
                                {item.mobileLabel}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
