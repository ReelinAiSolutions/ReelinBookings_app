'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { User, Camera, Save, Lock, User as UserIcon, Building2, LogOut, Mail, Shield, Settings as SettingsIcon } from 'lucide-react';
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

            {/* Hero Section with Avatar */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 overflow-hidden relative shadow-2xl backdrop-blur-sm">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 md:w-20 md:h-20 text-white/50" />
                            )}
                            <label className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                                <Camera className="w-8 h-8 text-white mb-2" />
                                <span className="text-white text-sm font-bold">Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                            {formData.fullName || 'Welcome'}
                        </h1>
                        <p className="text-blue-100 text-lg flex items-center gap-2 justify-center md:justify-start">
                            <Mail className="w-5 h-5" />
                            {formData.email}
                        </p>
                        <div className="mt-4 flex items-center gap-2 justify-center md:justify-start">
                            <div className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                                Admin
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                                <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Personal Information</h2>
                                <p className="text-sm text-gray-600">Update your personal details</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Email cannot be changed for security reasons</p>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-gray-200">
                            <Button
                                type="submit"
                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                                isLoading={isLoading}
                            >
                                <Save className="w-5 h-5" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                <Lock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Security</h2>
                                <p className="text-sm text-gray-600">Manage your password and security settings</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!showChangePassword ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowChangePassword(true)}
                                className="flex items-center gap-2 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-bold px-6 py-3 rounded-xl transition-all duration-200"
                            >
                                <Lock className="w-5 h-5" />
                                Change Password
                            </Button>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                                        }}
                                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-bold px-6 py-2 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Business Settings Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in slide-in-from-bottom-4" style={{ animationDelay: '300ms' }}>
                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Business Settings</h2>
                            <p className="text-sm text-gray-600">Configure your business details and preferences</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
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
            <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 animate-in slide-in-from-bottom-4" style={{ animationDelay: '400ms' }}>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">Sign Out</h3>
                            <p className="text-sm text-gray-600">End your current session</p>
                        </div>
                        <Button
                            type="button"
                            onClick={handleSignOut}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl shadow-lg shadow-red-500/30 font-bold transition-all duration-200 hover:shadow-xl hover:shadow-red-500/40"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
