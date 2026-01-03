'use client';
import { createClient } from '@/lib/supabase';

import React, { useState, useEffect } from 'react';

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
    Save,
    Settings,
    ChevronDown,
    MapPin,
    Globe
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import NotificationManager from '../admin/NotificationManager';

interface StaffSettingsProps {
    currentUser: any;
    onUpdate?: () => void;
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

export default function StaffSettings({ currentUser }: StaffSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createClient();

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:px-0">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none mb-2">Profile Settings</h1>
                <p className="text-gray-500 font-medium">Manage your profile and account.</p>
            </div>


            <form onSubmit={handleSave} className="space-y-4">

                {/* Profile Information Accordion */}
                <AccordionItem
                    title="Public Profile"
                    subtitle="Update your photo and personal details"
                    icon={UserIcon}
                    colorClass="bg-purple-50 text-purple-600"
                    isOpen={openSection === 'profile'}
                    onToggle={() => setOpenSection(openSection === 'profile' ? null : 'profile')}
                >
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-8">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-8">
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gray-100 rounded-3xl blur group-hover/avatar:bg-gray-200 transition-colors"></div>
                                <div className="relative w-32 h-32 bg-white rounded-3xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-16 h-16 text-gray-300" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                        <Camera className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Change</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 mb-1">Make it yours</h4>
                                <p className="text-sm text-gray-500 mb-4 max-w-md">Upload a clear photo to help clients identify you.</p>
                                <div className="flex gap-3">
                                    <label className="px-4 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 cursor-pointer transition-colors shadow-lg shadow-gray-900/20">
                                        Upload Photo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide ml-1">Full Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-gray-900 placeholder:text-gray-400 outline-none"
                                        placeholder="e.g. John Doe"
                                    />
                                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide ml-1">Email Address</label>
                                <div className="relative opacity-60">
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl font-bold text-gray-500 cursor-not-allowed"
                                    />
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Save Button for Profile */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/10 transition-all active:scale-95"
                                isLoading={isLoading}
                            >
                                Save Profile
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
                    onToggle={() => setOpenSection(openSection === 'security' ? null : 'security')}
                >
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                        {!showChangePassword ? (
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(true)}
                                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 transition-all group hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-purple-500 group-hover:bg-purple-50 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 text-sm">Change Password</div>
                                        <div className="text-xs text-gray-500 font-medium mt-0.5">Update your login credentials</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Confirm</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowChangePassword(false)}
                                        className="text-xs font-bold uppercase tracking-wider"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider"
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

            {/* Notifications Accordion */}
            <AccordionItem
                title="Notifications"
                subtitle="Manage your alert preferences"
                icon={Bell}
                colorClass="bg-purple-50 text-purple-600"
                isOpen={openSection === 'notifications'}
                onToggle={() => setOpenSection(openSection === 'notifications' ? null : 'notifications')}
            >
                <NotificationManager />
            </AccordionItem>

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
