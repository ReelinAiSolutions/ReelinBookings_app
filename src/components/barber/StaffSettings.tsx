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
}

export default function StaffSettings({ currentUser }: StaffSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);
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

    useEffect(() => {
        // Check local storage or system preference
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
            const { data, error } = await supabase
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
            }
        };

        const fetchOrganization = async () => {
            if (!currentUser?.organization_id) return;
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', currentUser.organization_id)
                .single();
            if (error) {
                console.error('Error fetching organization:', error);
            } else {
                setCurrentOrg(data);
            }
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

            // Update profile and linked staff record
            await updateUserProfile(currentUser.id, currentUser.organization_id, {
                fullName: formData.fullName,
                avatarUrl: avatarUrl || undefined
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
        } catch (error: any) {
            toast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-0 pt-8 lg:pt-0">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-2">Staff Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your profile, security, and notifications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Navigation */}
                <div className="space-y-2">
                    {[
                        { id: 'profile', label: 'My Profile', icon: User, color: 'bg-blue-500' },
                        { id: 'security', label: 'Security', icon: Shield, color: 'bg-primary-500' },
                        { id: 'appearance', label: 'Appearance', icon: Palette, color: 'bg-pink-500' },
                        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-emerald-500' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setOpenSection(item.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${openSection === item.id
                                ? 'bg-white dark:bg-white/5 shadow-xl dark:shadow-none border-gray-100 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10'
                                : 'hover:bg-white/50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl text-white ${item.color} shadow-lg shadow-${item.color.split('-')[1]}-500/20`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs">{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${openSection === item.id ? 'rotate-90' : ''}`} />
                        </button>
                    ))}
                </div>

                {/* Right: Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {(!openSection || openSection === 'profile') && (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Personal Profile</h3>

                            <div className="flex flex-col items-center gap-6 mb-12">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[2.2rem] opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                                    {previewUrl ? (
                                        <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-white/10 shadow-xl">
                                            <Image src={previewUrl} alt="Preview" width={128} height={128} className="w-full h-full object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <div className="relative w-32 h-32 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex items-center justify-center border-4 border-white dark:border-white/10 shadow-lg">
                                            <UserCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}
                                    <label className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-[#1a1b1e]">
                                        <Camera className="w-5 h-5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{formData.fullName || 'No Name Set'}</h4>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{formData.role || 'Staff Member'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black/40 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email (Read-only)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/5 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {openSection === 'security' && (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Security & Password</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black/40 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black/40 rounded-2xl outline-none transition-all font-bold text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {openSection === 'appearance' && (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Appearance</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-colors ${isDark ? 'bg-gray-800 text-primary-400' : 'bg-white text-amber-500'}`}>
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
                            </div>
                        </div>
                    )}

                    {openSection === 'notifications' && (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Notification Settings</h3>
                            <NotificationManager orgId={currentUser?.organization_id} />
                        </div>
                    )}



                    {/* Global Save Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handleSaveProfile}
                            isLoading={isLoading}
                            className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20"
                        >
                            Save All Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
