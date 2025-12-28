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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-6 h-20 flex justify-between items-center z-[9999] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id || (item.id === 'operations' && activeTab === 'invites');
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center transition-all duration-300 w-full ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
                        >
                            <item.icon
                                className={`w-7 h-7 transition-all ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]' : ''}`}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                        </button>
                    );
                })}
            </div>
        </>
    );
}
