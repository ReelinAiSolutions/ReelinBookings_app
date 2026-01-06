'use client';
import React, { useState } from 'react';
import {
    Building2, User, ChevronRight, Palette, Clock,
    CalendarDays, ShieldAlert, LayoutDashboard, Globe,
    ChevronLeft, LogOut, ShieldCheck, Bell, Camera,
    Settings as SettingsIcon, CreditCard, HelpCircle
} from 'lucide-react';
import { Organization } from '@/types';
import SettingsManager from './SettingsManager';
import ProfileManager from './ProfileManager';

interface UnifiedSettingsProps {
    org: Organization;
    user: any;
    profile: any;
    onUpdate: (updatedOrg?: Organization) => void;
}

export default function UnifiedSettings({ org, user, profile, onUpdate }: UnifiedSettingsProps) {
    const [view, setView] = useState<'business' | 'profile'>('business');
    const [mobileSubTab, setMobileSubTab] = useState<string | null>(null);

    // Business Menu Items
    const businessMenu = [
        { id: 'brand', label: 'Brand & Logo', icon: Palette },
        { id: 'details', label: 'Business Details', icon: Building2 },
        { id: 'hours', label: 'Hours & Availability', icon: Clock },
        { id: 'rules', label: 'Scheduling Rules', icon: CalendarDays },
        { id: 'legal', label: 'Policies & Legal', icon: ShieldAlert },
        { id: 'link', label: 'Booking Link', icon: Globe }
    ];

    // Profile Menu Items
    const profileMenu = [
        { id: 'profile', label: 'Personal Information', icon: User },
        { id: 'security', label: 'Security & Password', icon: ShieldCheck },
        { id: 'notifications', label: 'Notification Settings', icon: Bell },
        { id: 'appearance', label: 'Interface Appearance', icon: Palette },
        { id: 'calendar', label: 'Calendar View', icon: LayoutDashboard },
    ];

    const currentMenu = view === 'business' ? businessMenu : profileMenu;

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 pt-8 px-4 sm:px-6 lg:px-0 lg:pt-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        {view === 'business' ? 'Business Settings' : 'Personal Account'}
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4" />
                        {view === 'business' ? 'Organization Control' : 'Profile Management'}
                    </p>
                </div>

                {/* Toggle */}
                <div className="inline-flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm self-start md:self-auto">
                    <button
                        onClick={() => { setView('business'); setMobileSubTab(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'business'
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        Business
                    </button>
                    <button
                        onClick={() => { setView('profile'); setMobileSubTab(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'profile'
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Profile
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Desktop Sidebar / Mobile List */}
                <div className={`lg:col-span-3 ${mobileSubTab ? 'hidden lg:block' : 'block'}`}>
                    <div className="space-y-1.5">
                        <p className="px-4 text-[11px] font-[950] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                            {view === 'business' ? 'Organization' : 'Account'}
                        </p>
                        {currentMenu.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setMobileSubTab(item.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group border border-transparent ${mobileSubTab === item.id || (!mobileSubTab && item.id === (view === 'business' ? 'brand' : 'profile'))
                                    ? 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 shadow-sm text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-all ${mobileSubTab === item.id || (!mobileSubTab && item.id === (view === 'business' ? 'brand' : 'profile'))
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-gray-200 dark:shadow-none'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/10 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                        }`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">{item.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 ${mobileSubTab === item.id || (!mobileSubTab && item.id === (view === 'business' ? 'brand' : 'profile'))
                                    ? 'opacity-100 text-gray-900 dark:text-white'
                                    : 'text-gray-300'
                                    }`} />
                            </button>
                        ))}
                    </div>

                    {/* Mobile Only: Extra Menu Items (matches reference picture) */}
                    <div className="lg:hidden mt-10 space-y-1.5 pt-10 border-t border-gray-100 dark:border-white/5">
                        <p className="px-4 text-[11px] font-[950] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">More</p>
                        <button className="w-full flex items-center justify-between p-4 rounded-2xl text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">Help & Support</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Content Area (Overlay on Mobile if sub-tab selected) */}
                <div className={`lg:col-span-9 h-full ${mobileSubTab
                    ? 'fixed inset-0 z-[60] bg-white dark:bg-black p-6 lg:relative lg:p-0 lg:z-auto lg:bg-transparent overflow-y-auto'
                    : 'hidden lg:block'
                    }`}>
                    {/* Mobile Back Button */}
                    {mobileSubTab && (
                        <button
                            onClick={() => setMobileSubTab(null)}
                            className="lg:hidden flex items-center gap-2 mb-8 text-gray-500 font-black uppercase tracking-widest text-[10px]"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Settings
                        </button>
                    )}

                    {/* Sections */}
                    <div className="animate-in slide-in-from-right-4 duration-500 h-full">
                        {view === 'business' ? (
                            <SettingsManager
                                org={org}
                                onUpdate={onUpdate as any}
                                activeTabOverride={mobileSubTab || 'brand'}
                                hideHeader={true}
                                hideSidebar={true}
                            />
                        ) : (
                            <ProfileManager
                                user={user}
                                profile={profile}
                                onUpdate={() => onUpdate()}
                                activeTabOverride={mobileSubTab || 'profile'}
                                hideHeader={true}
                                hideSidebar={true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
