'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import {
    User as UserIcon,
    Camera,
    Lock,
    LogOut,
    Mail,
    ShieldCheck,
    Bell,
    ChevronRight,
    Search,
    UserCircle,
    Phone,
    Save
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface StaffProfileProps {
    currentUser: any;
}

export default function StaffProfile({ currentUser }: StaffProfileProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser?.id) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (data) {
                setProfileData(data);
                setFormData(prev => ({ ...prev, fullName: data.full_name || '' }));
                setPreviewUrl(data.avatar_url);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let avatarUrl = profileData?.avatar_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUser.id}/avatar.${fileExt}`;

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
                .eq('id', currentUser.id);

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

            toast('Profile updated successfully!', 'success');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setShowChangePassword(false);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Hero Section */}
            <div className="relative group">
                {/* Fallback bg-slate-900 in case gradient fails or is light */}
                <div className="absolute inset-0 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 opacity-90"></div>
                </div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-[2.5rem]"></div>

                <div className="relative p-10 md:p-16 flex flex-col items-center text-center">
                    <div className="relative mb-8 group/avatar">
                        <div className="absolute -inset-1 bg-white/20 rounded-full blur group-hover/avatar:bg-white/40 transition-colors"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Staff Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle className="w-20 h-20 text-white/40" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white mb-1" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                        {formData.fullName || currentUser?.email?.split('@')[0] || 'My Profile'}
                    </h1>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse box-shadow-glow"></div>
                        <span className="text-white font-black text-[10px] tracking-widest uppercase drop-shadow-sm">Team Member Portal</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8 px-4 lg:px-0">

                {/* Personal Information Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Personal Details</h3>
                            <p className="text-sm text-gray-500 font-medium">Update your profile info.</p>
                        </div>
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-blue-600">
                            <UserIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative opacity-60">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-100 border-2 border-transparent rounded-[1.25rem] cursor-not-allowed font-bold text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-50 to-indigo-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Security & Privacy</h3>
                            <p className="text-sm text-gray-500 font-medium">Keep your account protected.</p>
                        </div>
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-primary-600">
                            <ShieldCheck className="w-6 h-6" />
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
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 group-hover:text-primary-600 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 uppercase tracking-widest text-xs">Update Password</div>
                                        <div className="text-xs text-gray-500 font-medium">Last changed 3 months ago</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all font-bold"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary-500 transition-all font-bold"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowChangePassword(false)}
                                        className="flex-1 rounded-2xl border-2 py-4 h-auto font-black uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <div className="flex-1"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="relative pt-4 overflow-hidden rounded-[2.25rem] shadow-2xl shadow-primary-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 group-hover:scale-110 transition-transform duration-500"></div>
                    <Button
                        type="submit"
                        className="w-full h-16 bg-transparent text-white border-0 shadow-none relative z-10 font-black text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                        isLoading={isLoading}
                    >
                        <Save className="w-6 h-6" />
                        Save Updated Profile
                    </Button>
                </div>

                {/* Account Actions / Delete / Sign Out */}
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
            </form>
        </div>
    );
}
