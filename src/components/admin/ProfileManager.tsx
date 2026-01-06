'use client';
import { createClient } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import NotificationManager from './NotificationManager';
import { Button } from '@/components/ui/Button';
import {
    User, Camera, Save, Lock, User as UserIcon, LogOut,
    ShieldCheck, Key, ChevronRight, Palette, Moon, Sun,
    Bell, LayoutDashboard, Briefcase, Users, CheckCircle2
} from 'lucide-react';
import { Organization } from '@/types';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

interface ProfileManagerProps {
    user: any;
    profile: any;
    onUpdate: () => void;
    activeTabOverride?: string;
    hideHeader?: boolean;
    hideSidebar?: boolean;
}

export default function ProfileManager({
    user,
    profile,
    onUpdate,
    activeTabOverride,
    hideHeader = false,
    hideSidebar = false
}: ProfileManagerProps) {
    if (!user || !profile) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [openSection, setOpenSection] = useState<string>(activeTabOverride || 'profile');
    const [isDark, setIsDark] = useState(false);
    const [calendarColor, setCalendarColor] = useState<'staff' | 'service'>('staff');
    const [adminColor, setAdminColor] = useState('#a855f7');
    const [isSavingPref, setIsSavingPref] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (activeTabOverride) {
            setOpenSection(activeTabOverride);
        }
        // Load personal preferences from and org settings if available
        if (profile?.settings?.calendar_color) {
            setCalendarColor(profile.settings.calendar_color);
        }
        if (profile?.settings?.admin_color) {
            setAdminColor(profile.settings.admin_color);
        }
    }, [activeTabOverride, profile]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createClient();

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({ ...prev, fullName: profile.full_name || '' }));
            setPreviewUrl(profile.avatar_url || null);
        }
    }, [profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await supabase.auth.signOut();
            window.location.href = '/login';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let avatarUrl = profile?.avatar_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-assets')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('profile-assets')
                    .getPublicUrl(fileName);

                avatarUrl = publicData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    avatar_url: avatarUrl
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            if (formData.password) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.password
                });
                if (passwordError) throw passwordError;
            }

            // Save preferences to profile settings
            const { error: settingsError } = await supabase
                .from('profiles')
                .update({
                    settings: {
                        ...(profile.settings || {}),
                        calendar_color: calendarColor,
                        admin_color: adminColor
                    }
                })
                .eq('id', user.id);

            if (settingsError) throw settingsError;

            toast('Profile updated successfully!', 'success');
            onUpdate();
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setShowChangePassword(false);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
            setIsSavingPref(false);
        }
    };

    const handleQuickSavePref = async (updates: any) => {
        setIsSavingPref(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    settings: {
                        ...(profile.settings || {}),
                        ...updates
                    }
                })
                .eq('id', user.id);

            if (error) throw error;
            onUpdate();
            toast('Preference saved', 'success');
        } catch (error: any) {
            toast(error.message || 'Failed to save preference', 'error');
        } finally {
            setIsSavingPref(false);
        }
    };

    return (
        <div className={`${hideSidebar ? 'max-w-none px-0 py-2' : 'max-w-4xl mx-auto p-8'} space-y-8`}>
            {/* Header */}
            {!hideHeader && (
                <div>
                    <h1 className="text-[32px] font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Profile Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your personal information and security details.</p>
                </div>
            )}

            <div className={`${hideSidebar ? 'block' : 'grid grid-cols-1 md:grid-cols-3 gap-8'}`}>
                {/* Left: Navigation */}
                {!hideSidebar && (
                    <div className="space-y-2">
                        {[
                            { id: 'profile', label: 'My Profile', icon: UserIcon, color: 'bg-blue-500' },
                            { id: 'security', label: 'Security', icon: ShieldCheck, color: 'bg-primary-500' },
                            { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-purple-500' },
                            { id: 'appearance', label: 'Appearance', icon: Palette, color: 'bg-pink-500' },
                            { id: 'calendar', label: 'Calendar View', icon: LayoutDashboard, color: 'bg-orange-500' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setOpenSection(item.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${openSection === item.id
                                    ? 'bg-white dark:bg-card shadow-xl border-gray-100 dark:border-white/10 ring-1 ring-black/5'
                                    : 'hover:bg-white/50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl text-white ${item.color} shadow-lg`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-xs">{item.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${openSection === item.id ? 'rotate-90' : ''}`} />
                            </button>
                        ))}

                        <div className="pt-8 mt-8 border-t border-gray-100 dark:border-white/10">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all font-black uppercase tracking-widest text-xs"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Right: Content Area */}
                <div className={`${hideSidebar ? 'w-full' : 'md:col-span-2'} space-y-6`}>
                    {/* Personal Profile */}
                    {openSection === 'profile' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Personal Profile</h3>

                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="flex flex-col items-center gap-6 mb-12">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-primary-600 rounded-[2.2rem] opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                                        {previewUrl ? (
                                            <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                                                <Image src={previewUrl} alt="Preview" width={128} height={128} className="w-full h-full object-cover" unoptimized />
                                            </div>
                                        ) : (
                                            <div className="relative w-32 h-32 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                                                <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                        <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-gray-800">
                                            <Camera className="w-5 h-5" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">{formData.fullName || 'No Name Set'}</h4>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Administrator</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="w-full px-6 py-4 bg-gray-100 dark:bg-white/10 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-100"
                                    >
                                        Save All Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security */}
                    {openSection === 'security' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Security & Password</h3>
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, password: e.target.value });
                                                    setShowChangePassword(true);
                                                }}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white pl-12"
                                                placeholder="••••••••"
                                            />
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white pl-12"
                                                placeholder="••••••••"
                                            />
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        disabled={!formData.password}
                                        className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 text-white"
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Appearance */}
                    {openSection === 'appearance' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Appearance</h3>
                            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-colors ${isDark ? 'bg-gray-800 text-purple-400' : 'bg-white text-amber-500'}`}>
                                        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Dark Mode</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{isDark ? 'Easy on the eyes' : 'Bright and clear'}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${isDark ? 'bg-primary-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark ? 'translate-x-[26px]' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Personal Interface Color</label>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <input
                                                type="color"
                                                value={adminColor}
                                                onChange={(e) => setAdminColor(e.target.value)}
                                                className="h-14 w-20 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-card"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={adminColor}
                                                    onChange={(e) => setAdminColor(e.target.value)}
                                                    className="block w-full px-5 py-3.5 bg-white dark:bg-black/20 border-2 border-transparent focus:border-primary-500 rounded-xl text-sm font-bold text-gray-900 dark:text-white uppercase transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">This color will be applied to your sidebar, buttons, and highlights across the admin dashboard.</p>
                                            <Button
                                                onClick={() => handleQuickSavePref({ admin_color: adminColor })}
                                                isLoading={isSavingPref}
                                                size="sm"
                                                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6"
                                            >
                                                Apply Theme
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {openSection === 'notifications' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Notification Preferences</h3>
                            <NotificationManager />
                        </div>
                    )}

                    {/* Calendar View */}
                    {openSection === 'calendar' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Calendar Appearance</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-12 max-w-md mx-auto">Choose how color-coding is applied to your personal calendar view.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <button
                                    type="button"
                                    onClick={() => setCalendarColor('staff')}
                                    className={`group p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative overflow-hidden ${calendarColor === 'staff'
                                        ? 'border-primary-500 bg-purple-50 dark:bg-primary-500/10 shadow-lg shadow-primary-500/10 scale-[1.02]'
                                        : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-2xl ${calendarColor === 'staff' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-white/10 text-gray-400'} shadow-lg transition-colors`}>
                                                <Users className="w-6 h-6" />
                                            </div>
                                            {calendarColor === 'staff' && (
                                                <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-black text-lg mb-1 ${calendarColor === 'staff' ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                                                By Staff Member
                                            </div>
                                            <div className={`text-sm font-medium leading-relaxed ${calendarColor === 'staff' ? 'text-primary-500/80' : 'text-gray-500'}`}>
                                                Each team member has a consistent color across all their bookings.
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCalendarColor('service')}
                                    className={`group p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative overflow-hidden ${calendarColor === 'service'
                                        ? 'border-primary-500 bg-purple-50 dark:bg-primary-500/10 shadow-lg shadow-primary-500/10 scale-[1.02]'
                                        : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-2xl ${calendarColor === 'service' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-white/10 text-gray-400'} shadow-lg transition-colors`}>
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            {calendarColor === 'service' && (
                                                <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-black text-lg mb-1 ${calendarColor === 'service' ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                                                By Service Type
                                            </div>
                                            <div className={`text-sm font-medium leading-relaxed ${calendarColor === 'service' ? 'text-primary-500/80' : 'text-gray-500'}`}>
                                                Color-code based on the service being performed.
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10">
                                <Button
                                    onClick={handleSave}
                                    isLoading={isLoading}
                                    className="px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-100"
                                >
                                    Update Calendar Preferences
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
