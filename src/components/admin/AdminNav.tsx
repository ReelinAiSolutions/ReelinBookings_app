import { Calendar, BarChart3, Settings, Users, Contact, Briefcase } from 'lucide-react';
import { Organization } from '@/types';
import DarkModeToggle from '../DarkModeToggle';

interface AdminNavProps {
    activeTab: 'operations' | 'analytics' | 'settings' | 'services' | 'team' | 'clients';
    setActiveTab: (tab: 'operations' | 'analytics' | 'settings' | 'services' | 'team' | 'clients') => void;
    currentOrg: Organization | null;
}

export default function AdminNav({ activeTab, setActiveTab, currentOrg }: AdminNavProps) {
    const navItems = [
        { id: 'operations', label: 'Schedule', icon: Calendar },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'clients', label: 'Clients', icon: Contact },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/90 backdrop-blur-2xl border-t border-gray-100 dark:border-white/10 px-6 h-20 flex justify-around items-center z-[9999] pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.04)] dark:shadow-none">
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        <item.icon
                            className={`w-6 h-6 transition-all ${isActive ? 'fill-primary-600/10' : ''}`}
                            strokeWidth={isActive ? 2.5 : 1.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
