import React from 'react';
import { Calendar, Users, BarChart3, Settings, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Organization } from '@/types';

interface AdminNavProps {
    activeTab: 'operations' | 'services' | 'analytics' | 'settings' | 'profile';
    setActiveTab: (tab: 'operations' | 'services' | 'analytics' | 'settings' | 'profile') => void;
    currentOrg: Organization | null;
}

export default function AdminNav({ activeTab, setActiveTab, currentOrg }: AdminNavProps) {
    const navItems = [
        { id: 'operations', label: 'Operations', icon: Calendar, mobileLabel: 'Calendar' },
        { id: 'services', label: 'Services & Team', icon: Users, mobileLabel: 'Team' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, mobileLabel: 'Stats' },
        { id: 'settings', label: 'Settings', icon: Settings, mobileLabel: 'Settings' },
        { id: 'profile', label: 'Profile', icon: User, mobileLabel: 'Profile' },
    ] as const;

    return (
        <>
            {/* DESKTOP NAV (Top Tabs) - Hidden on Mobile */}
            <div className="hidden lg:flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === item.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}

                {currentOrg && (
                    <Link
                        href={`/${currentOrg.slug}`}
                        target="_blank"
                        className="px-4 py-2 rounded-md text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 border-l border-gray-200 ml-2 pl-4"
                    >
                        Live Site <ExternalLink className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* MOBILE NAV (Bottom Bar) - Hidden on Desktop */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 pb-safe">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
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
