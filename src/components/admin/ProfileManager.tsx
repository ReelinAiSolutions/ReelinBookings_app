'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { User, Camera, Save, Lock, User as UserIcon } from 'lucide-react';

interface ProfileManagerProps {
    user: any; // Auth user object
    profile: any; // Profile table data
    onUpdate: () => void;
}

export default function ProfileManager({ user, profile, onUpdate }: ProfileManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Update Profile (Name & Avatar)
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

            // 2. Update Password (if provided)
            if (formData.password) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.password
                });
                if (passwordError) throw passwordError;
            }

            alert('Profile updated successfully!');
            onUpdate(); // Refresh parent state
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); // Clear password fields

        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    Personal Details
                </h3>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Upload */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-gray-50 flex items-center justify-center bg-gray-100 overflow-hidden relative group shadow-sm">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-gray-300" />
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium">
                                <Camera className="w-5 h-5 mb-1" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">Click to change</p>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 sm:text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed directly.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Lock className="w-5 h-5 text-gray-400" />
                    Security
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Leave blank to keep current"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-primary-500/20"
                    isLoading={isLoading}
                >
                    <Save className="w-4 h-4" />
                    Save Profile
                </Button>
            </div>
        </form>
    );
}
