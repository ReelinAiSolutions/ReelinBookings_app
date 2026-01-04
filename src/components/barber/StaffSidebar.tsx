'use client';
import React from 'react';
import {
    LayoutDashboard, Calendar, Scissors, Settings, LogOut,
    Bell, ChevronRight, UserCircle, Sparkles, Building2,
    Users, Briefcase, Clock, Shield
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Organization } from '@/types';

interface StaffSidebarProps {
    staff: any;
    organization: Organization | null;
    currentTab: string;
    onTabChange: (tab: string) => void;
}

export default function StaffSidebar({ staff, organization, currentTab, onTabChange }: StaffSidebarProps) {
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const menuItems = [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'schedule', label: 'My Schedule', icon: Calendar },
        { id: 'performance', label: 'Performance', icon: Sparkles },
        { id: 'settings', label: 'My Settings', icon: Settings }
    ];

    return (
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-50">
            {/* Header / Org Info */}
            <div className="p-8">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 group transition-all hover:shadow-lg">
                    {organization?.logo_url ? (
                        <div className="relative w-12 h-12 bg-white rounded-2xl p-1 shadow-sm overflow-hidden">
                            <Image
                                src={organization.logo_url}
                                alt={organization.name}
                                fill
                                className="object-contain p-1"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                            <Building2 className="w-6 h-6" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm uppercase tracking-tight truncate text-gray-900">{organization?.name || 'My Business'}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Portal Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
                <div className="px-6 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Main Menu</span>
                </div>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center justify-between group px-6 py-4 rounded-2xl transition-all duration-300 ${currentTab === item.id
                                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`transition-transform duration-300 ${currentTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                <item.icon className="w-5 h-5 font-black uppercase tracking-widest text-[10px]" />
                            </div>
                            <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                        </div>
                        {currentTab === item.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                        )}
                        {currentTab !== item.id && (
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-black uppercase tracking-widest text-[10px]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* User Profile / Status */}
            <div className="p-6">
                <div className="bg-gray-50 rounded-[2.5rem] p-6 border border-gray-100 overflow-hidden relative group transition-all hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                            {staff?.avatar_url ? (
                                <Image
                                    src={staff.avatar_url}
                                    alt={staff.full_name}
                                    width={48}
                                    height={48}
                                    className="relative w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                                    unoptimized
                                />
                            ) : (
                                <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                                    <UserCircle className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-sm uppercase tracking-tight truncate text-gray-900">{staff?.full_name}</p>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {staff?.role || 'Staff'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-white p-3 rounded-2xl text-center shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today</p>
                            <p className="text-sm font-black text-gray-900 tracking-tight tracking-widest text-xs uppercase">82%</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl text-center shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Goal</p>
                            <p className="text-sm font-black text-gray-900 tracking-tight tracking-widest text-xs uppercase">95%</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all duration-300 group/logout border border-gray-100 hover:border-red-100"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover/logout:-translate-x-1" />
                        <span className="font-black uppercase tracking-widest text-[10px]">Secure Exit</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
