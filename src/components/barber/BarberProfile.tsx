import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { User, Camera, Save, Lock, LogOut } from 'lucide-react';

interface BarberProfileProps {
    user: any;
    // We might need to fetch the staff record if we want to sync avatar updates there too?
    // Usually Profile table syncs to Staff table via triggers or manual updates.
    // For now, let's assume updating 'profiles' table is sufficient and the StaffManager pulls from it or they are separate.
    // Actually, in this app, Staff are created separately.
    // Ideally user.email matches staff.email.
    currentUser: any;
}

export default function BarberProfile({ currentUser }: BarberProfileProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

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
            // 1. Update Profile (Name & Avatar)
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

            // 2. Update Password (if provided)
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
        <div className="p-6 pb-24 space-y-8">
            <h1 className="text-2xl font-black text-gray-900">My Profile</h1>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Personal Details */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-50 flex items-center justify-center bg-gray-100 overflow-hidden relative group shadow-inner mb-4">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-300" />
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium">
                                <Camera className="w-6 h-6" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide cursor-pointer">Tap to Change Photo</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all bg-gray-50 focus:bg-white"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={currentUser?.email || ''}
                                disabled
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Lock className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Security</h3>
                    </div>

                    {!showChangePassword ? (
                        <Button type="button" variant="outline" onClick={() => setShowChangePassword(true)} className="w-full justify-center">
                            Change Password
                        </Button>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-black"
                                placeholder="New Password"
                            />
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-black"
                                placeholder="Confirm Password"
                            />
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setShowChangePassword(false)} className="flex-1">Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold shadow-lg shadow-black/10 hover:bg-gray-900 active:scale-[0.98] transition-all"
                    isLoading={isLoading}
                >
                    Save Changes
                </Button>

                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-red-500 font-medium text-sm flex items-center justify-center gap-2 mx-auto hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </form>
        </div>
    );
}
