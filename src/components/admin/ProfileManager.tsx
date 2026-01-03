'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import NotificationManager from './NotificationManager';
import { Button } from '@/components/ui/Button';
import { User, Camera, Save, Lock, User as UserIcon, Building2, LogOut, Mail, ShieldCheck, Settings as SettingsIcon, Key, ChevronDown } from 'lucide-react';
import { Organization } from '@/types';

interface ProfileManagerProps {
    user: any;
    profile: any;
    onUpdate: () => void;
}

// Helper Interface for Accordion
interface AccordionItemProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    colorClass: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const AccordionItem = ({ title, subtitle, icon: Icon, colorClass, isOpen, onToggle, children }: AccordionItemProps) => (
    <div className={`bg-white rounded-[32px] shadow-sm border transition-all duration-300 overflow-hidden ${isOpen ? 'border-gray-200 ring-4 ring-gray-50' : 'border-gray-100'}`}>
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between p-8 text-left transition-colors hover:bg-gray-50/50"
        >
            <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${colorClass}`}>
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">{title}</h3>
                    <p className="text-sm text-gray-500 font-bold mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-gray-100 rotate-180' : 'bg-transparent'}`}>
                <ChevronDown className="w-6 h-6 text-gray-400" />
            </div>
        </button>
        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-8 pt-0 border-t border-gray-100/50">
                <div className="pt-8">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

export default function ProfileManager({ user, profile, onUpdate }: ProfileManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [openSection, setOpenSection] = useState<string>('profile');

    const toggleSection = (id: string) => {
        setOpenSection(openSection === id ? '' : id);
    };

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

            if (showChangePassword && formData.password) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.password
                });
                if (passwordError) throw passwordError;
            }

            alert('Profile updated successfully!');
            onUpdate();
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setShowChangePassword(false);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Standard Header */}
            <header className="mb-8">
                <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none mb-2">Profile Settings</h1>
                <p className="text-gray-500 font-medium">Manage your personal information and security details.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-4">

                {/* Public Profile Accordion */}
                <AccordionItem
                    title="Public Profile"
                    subtitle="Update your photo and personal details"
                    icon={UserIcon}
                    colorClass="bg-blue-50 text-blue-600"
                    isOpen={openSection === 'profile'}
                    onToggle={() => toggleSection('profile')}
                >
                    <div className="space-y-8">
                        {/* Avatar Uploader - Refined for Accordion */}
                        <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-gray-50 rounded-[24px] border border-gray-100">
                            <div className="relative group/avatar shrink-0">
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden relative z-10 bg-white">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-300">
                                            <UserIcon className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full cursor-pointer hover:bg-black transition-colors shadow-lg z-20">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="font-black text-gray-900 text-lg">Profile Photo</h4>
                                <p className="text-sm text-gray-500 font-medium">This will be displayed on your account.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                        placeholder="Admin Name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative opacity-60">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-100 border-2 border-transparent rounded-[1.25rem] cursor-not-allowed font-bold text-gray-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-medium ml-2 mt-1">Managed by organization settings</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-gray-900 hover:bg-black text-white rounded-[24px] px-8 py-6 font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:shadow-2xl transition-all active:scale-95"
                                isLoading={isLoading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </AccordionItem>

                {/* Security Accordion */}
                <AccordionItem
                    title="Security & Privacy"
                    subtitle="Manage your password and account access"
                    icon={ShieldCheck}
                    colorClass="bg-purple-50 text-purple-600"
                    isOpen={openSection === 'security'}
                    onToggle={() => toggleSection('security')}
                >
                    <div className="space-y-6">
                        {!showChangePassword ? (
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(true)}
                                className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-white rounded-2xl border border-gray-100 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 group-hover:text-purple-600 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 uppercase tracking-widest text-xs">Update Password</div>
                                        <div className="text-xs text-gray-500 font-medium">Manage your login credentials</div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <SettingsIcon className="w-4 h-4" />
                                </div>
                            </button>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                                        }}
                                        className="flex-1 rounded-[24px] border-2 py-4 h-auto font-black uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-[24px] py-4 h-auto font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/20"
                                        isLoading={isLoading}
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionItem>
            </form>

            <div className="max-w-3xl">
                <NotificationManager />
            </div>

            {/* Sign Out Section - At Bottom */}
            <div className="max-w-3xl pt-8 border-t border-gray-100">
                <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-rose-900">Sign Out</h4>
                        <p className="text-xs text-rose-500/80 font-medium mt-0.5">End your current session safely</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

        </div>
    );
}
