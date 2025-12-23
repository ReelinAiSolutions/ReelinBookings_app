'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { User, Camera, Save, Lock, User as UserIcon, Building2, LogOut, Mail, Shield, Settings as SettingsIcon, Key } from 'lucide-react';
import SettingsManager from './SettingsManager';
import { Organization } from '@/types';

interface ProfileManagerProps {
    user: any;
    profile: any;
    onUpdate: () => void;
    org: Organization | null;
    onUpdateOrg: (org: Organization) => void;
}

export default function ProfileManager({ user, profile, onUpdate, org, onUpdateOrg }: ProfileManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
    const [showChangePassword, setShowChangePassword] = useState(false);

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
        <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">

            {/* Premium Hero Section */}
            <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 rounded-[2.5rem] shadow-2xl shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-500"></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-[2.5rem]"></div>

                <div className="relative p-10 md:p-16 flex flex-col items-center text-center">
                    <div className="relative mb-8 group/avatar">
                        <div className="absolute -inset-1 bg-white/20 rounded-full blur group-hover/avatar:bg-white/40 transition-colors"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Admin Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        setPreviewUrl(null); // Fallback to icon
                                    }}
                                />
                            ) : (
                                <UserIcon className="w-16 h-16 md:w-20 md:h-20 text-white/50" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white mb-1" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                        {formData.fullName || 'Welcome Admin'}
                    </h1>
                    <p className="text-white/80 font-medium text-lg mb-4">{formData.email}</p>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-white/90 font-black text-[10px] tracking-widest uppercase">Admin Portal Active</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #f9fafb, #f3f4f6)' }}>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Personal Details</h3>
                            <p className="text-sm text-gray-500 font-medium">Update your administrative profile.</p>
                        </div>
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-primary-600">
                            <UserIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
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

                        {/* Quick Save Button inside section for better UX */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-8 py-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-600/20"
                                isLoading={isLoading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #faf5ff, #fdf2f8)' }}>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Security</h3>
                            <p className="text-sm text-gray-500 font-medium">Protect your admin account.</p>
                        </div>
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-purple-600">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-8">
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
                                                <Key className="h-5 w-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
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
                                        className="flex-1 rounded-2xl border-2 py-4 h-auto font-black uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-4 h-auto font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/20"
                                        isLoading={isLoading}
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Business Settings Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #f0fdfa, #ecfdf5)' }}>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Business Configuration</h3>
                        <p className="text-sm text-gray-500 font-medium">Manage your organization details.</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-teal-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-8">
                    {org ? (
                        <SettingsManager org={org} onUpdate={onUpdateOrg} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Building2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-bold mb-2">Business settings unavailable</p>
                            <p className="text-sm text-gray-500">Organization profile could not be loaded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sign Out Section */}
            <div className="pt-12 border-t border-gray-200">
                <div className="bg-rose-50 rounded-[2rem] border border-rose-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-xl font-black text-rose-900 tracking-tight">Account Session</h4>
                        <p className="text-sm text-rose-600 font-medium">End your current session on this device.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out Now
                    </button>
                </div>
            </div>

        </div>
    );
}
