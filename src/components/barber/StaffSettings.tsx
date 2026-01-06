'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
    User, Mail, Camera, Lock, Bell, ChevronRight, Search, Phone, Save, Settings,
    Shield, Smartphone, LogOut, Trash2, Plus, X, Briefcase, Clock, Building2, UserCircle,
    Palette, Moon, Sun
} from 'lucide-react';
import Image from 'next/image';
import { Organization, Staff } from '@/types';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile } from '@/services/dataService';
import NotificationManager from '../admin/NotificationManager';

const supabase = createClient();

interface StaffSettingsProps {
    currentUser: any;
    onRefresh?: () => Promise<void>;
    initialSettings?: any;
}

// Simple helper to adjust color brightness (copied from BrandingInjector for instant preview)
const adjustColor = (hex: string, percent: number) => {
    // Percent > 0: Lighten (Mix with White)
    // Percent < 0: Darken (Mix with Black)
    // Percent range: -1.0 to 1.0

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    if (percent > 0) {
        // Lighten: Target is 255
        r = Math.round(r + (255 - r) * percent);
        g = Math.round(g + (255 - g) * percent);
        b = Math.round(b + (255 - b) * percent);
    } else {
        // Darken: Target is 0
        const p = -percent; // make positive for calc
        r = Math.round(r * (1 - p));
        g = Math.round(g * (1 - p));
        b = Math.round(b * (1 - p));
    }

    const toHex = (n: number) => {
        const h = Math.max(0, Math.min(255, n)).toString(16);
        return h.length === 1 ? '0' + h : h;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function StaffSettings({ currentUser, onRefresh, initialSettings }: StaffSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string>('profile');
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list'); // 'list' shows menu, 'detail' shows content
    const { toast } = useToast();
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isDark, setIsDark] = useState(false);
    const [themeColor, setThemeColor] = useState<string>('#a855f7');

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

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser?.id) return;
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (data) {
                setProfileData(data);
                setFormData(prev => ({
                    ...prev,
                    fullName: data.full_name || '',
                    email: data.email || '',
                    role: data.role || ''
                }));
                setPreviewUrl(data.avatar_url);
                if (data.settings?.admin_color) {
                    setThemeColor(data.settings.admin_color);
                }
            }
        };

        const fetchOrganization = async () => {
            if (!currentUser?.organization_id) return;
            const { data } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', currentUser.organization_id)
                .single();
            if (data) setCurrentOrg(data);
        };

        fetchProfile();
        fetchOrganization();
    }, [currentUser]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            let avatarUrl = previewUrl;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUser.id}/avatar-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('profile-assets')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-assets')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            }

            await updateUserProfile(currentUser.id, currentUser.organization_id, {
                fullName: formData.fullName,
                avatarUrl: avatarUrl || undefined,
                settings: {
                    ...profileData?.settings,
                    admin_color: themeColor
                }
            });

            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.newPassword
                });
                if (passwordError) throw passwordError;
            }

            toast('Profile updated successfully', 'success');
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            toast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const menuItems = [
        { id: 'profile', label: 'Personal Information', icon: User },
        { id: 'security', label: 'Security & Password', icon: Lock },
        { id: 'notifications', label: 'Notification Settings', icon: Bell },
        { id: 'appearance', label: 'Interface Appearance', icon: Palette }
    ];

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 w-full">
            {/* Header Section - Pro Admin Style Match */}
            <div className="flex flex-col space-y-6">
                <div>
                    <h2 className="text-[32px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        Personal Account
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 animate-spin-slow" />
                        PROFILE MANAGEMENT
                    </p>
                </div>

                {/* Pill Toggle - Visual Match for Continuity */}
                <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-white/5 rounded-full w-fit">
                    <div className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Profile
                    </div>
                </div>
            </div>

            {/* Main Content Layout - 12 Column Grid for Pro Parity */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Desktop Sidebar / Mobile Menu List */}
                <div className={`lg:col-span-3 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'}`}>
                    <div className="space-y-1.5">
                        <p className="px-4 text-[11px] font-[950] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                            Account
                        </p>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setOpenSection(item.id);
                                    setMobileView('detail');
                                    // Scroll to top on mobile nav
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group border border-transparent ${openSection === item.id
                                    ? 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 shadow-sm text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-all ${openSection === item.id
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-gray-200 dark:shadow-none'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/10 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                        }`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-left">{item.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 ${openSection === item.id
                                    ? 'opacity-100 text-gray-900 dark:text-white'
                                    : 'text-gray-300'
                                    }`} />
                            </button>
                        ))}

                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/login';
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-red-100 group-hover:text-red-500 dark:group-hover:bg-red-500/20 transition-colors">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-left">Sign Out</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`lg:col-span-9 space-y-6 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>

                    {/* Mobile Back Button */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setMobileView('list')}
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm"
                        >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                            Back to Settings
                        </button>
                    </div>

                    {/* Personal Information */}
                    {openSection === 'profile' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">Personal Profile</h3>

                            <div className="flex flex-col items-center gap-6 mb-12">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-[2.2rem] opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                                    {previewUrl ? (
                                        <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                                            <Image src={previewUrl} alt="Preview" width={128} height={128} className="w-full h-full object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <div className="relative w-32 h-32 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                                            <User className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}
                                    <label className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-gray-800">
                                        <Camera className="w-5 h-5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">{formData.fullName || 'No Name Set'}</h4>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{formData.role || 'Staff Member'}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Full Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/10 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Section */}
                    {openSection === 'security' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">Security & Password</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white pl-12"
                                            placeholder="••••••••"
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 opacity-20" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white pl-12"
                                            placeholder="••••••••"
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 opacity-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance Section */}
                    {openSection === 'appearance' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">Interface Appearance</h3>
                            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-colors ${isDark ? 'bg-gray-800 text-primary-400' : 'bg-white text-amber-500'}`}>
                                        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Dark Mode</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">{isDark ? 'Stealth Mode Active' : 'Bright Mode Enabled'}</div>
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

                            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 mt-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 bg-white text-gray-900 transition-colors`}>
                                        <Palette className="w-5 h-5" style={{ color: themeColor }} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Theme Color</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Personalize your workspace</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-tighter">{themeColor}</div>
                                    <input
                                        type="color"
                                        value={themeColor}
                                        onChange={(e) => {
                                            const newColor = e.target.value;
                                            setThemeColor(newColor);

                                            // Proactively apply for instant feedback across ALL variables
                                            // ensuring we override the !important styles from BrandingInjector
                                            const setVar = (name: string, value: string) =>
                                                document.documentElement.style.setProperty(name, value, 'important');

                                            setVar('--brand-primary', newColor);
                                            setVar('--primary-color', newColor);

                                            // Shades
                                            setVar('--primary-50', adjustColor(newColor, 0.95));
                                            setVar('--primary-100', adjustColor(newColor, 0.85));
                                            setVar('--primary-200', adjustColor(newColor, 0.7));
                                            setVar('--primary-300', adjustColor(newColor, 0.5));
                                            setVar('--primary-400', adjustColor(newColor, 0.3));
                                            setVar('--primary-500', newColor);
                                            setVar('--primary-600', newColor);
                                            setVar('--primary-700', adjustColor(newColor, -0.15));
                                            setVar('--primary-800', adjustColor(newColor, -0.3));
                                            setVar('--primary-900', adjustColor(newColor, -0.45));

                                            setVar('--ring', newColor);
                                        }}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Section */}
                    {openSection === 'notifications' && (
                        <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">Notification Preferences</h3>
                            <NotificationManager orgId={currentUser?.organization_id} />
                        </div>
                    )}

                    {/* Global Save Button - Pro Primary Style */}
                    <div className="pt-4">
                        <button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className={`w-full text-white px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 transition-all duration-200`}
                            style={{
                                backgroundColor: themeColor,
                                boxShadow: `0 10px 15px -3px ${themeColor}40`
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save All Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
