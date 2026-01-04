'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, User, Mail, Shield, Briefcase, Phone,
    Save, Camera, Trash2, Clock, Calendar, Star, Check
} from 'lucide-react';
import Image from 'next/image';
import { Staff, Organization } from '@/types';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

const supabase = createClient();

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Staff>, avatarFile?: File | null) => Promise<void>;
    editingStaff?: Staff | null;
    services?: any[];
    onSaveSchedule?: (schedule: any[]) => Promise<void>;
    onSaveServices?: (serviceIds: string[]) => Promise<void>;
    initialSchedule?: any[];
}

export default function StaffFormModal({
    isOpen,
    onClose,
    onSave,
    editingStaff,
    services,
    onSaveSchedule,
    onSaveServices,
    initialSchedule
}: StaffFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'staff',
        specialties: [] as string[],
    });

    useEffect(() => {
        if (editingStaff) {
            setFormData({
                name: editingStaff.name,
                email: editingStaff.email || '',
                role: editingStaff.role,
                specialties: editingStaff.specialties || [],
            });
            setPreviewUrl(editingStaff.avatar || null);
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'staff',
                specialties: [],
            });
            setPreviewUrl(null);
        }
    }, [editingStaff, isOpen]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let avatar_url = previewUrl;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                avatar_url = publicUrl;
            }

            onSave({
                ...formData,
                avatar: avatar_url || undefined
            }, avatarFile);
        } catch (error: any) {
            if (typeof toast === 'function') {
                toast('Error updating staff: ' + error.message, 'error');
            } else {
                console.error(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-card rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
                >
                    <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                            {editingStaff ? 'Edit Team Member' : 'Add New Member'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-white/5 border-4 border-white dark:border-white/10 shadow-xl relative">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-12 h-12 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 p-3 bg-black text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                                    <Camera className="w-5 h-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black rounded-2xl outline-none font-bold transition-all dark:text-white"
                                        placeholder="Enter member's name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black rounded-2xl outline-none font-bold transition-all dark:text-white"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>



                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">System Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black rounded-2xl outline-none font-bold appearance-none transition-all dark:text-white"
                                    >
                                        <option value="staff" className="dark:bg-black">Staff Member</option>
                                        <option value="admin" className="dark:bg-black">Administrator</option>
                                        <option value="owner" className="dark:bg-black">Organization Owner</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Specialties Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Specialties & Expertise</label>
                            <div className="flex flex-wrap gap-2">
                                {['Fade Master', 'Beard Trim', 'Hair Color', 'Styling', 'Shaving', 'Long Hair'].map((spec) => (
                                    <button
                                        key={spec}
                                        type="button"
                                        onClick={() => {
                                            const newSpecs = formData.specialties.includes(spec)
                                                ? formData.specialties.filter(s => s !== spec)
                                                : [...formData.specialties, spec];
                                            setFormData({ ...formData, specialties: newSpecs });
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.specialties.includes(spec)
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20 scale-105'
                                            : 'bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:border-black dark:hover:border-white/20 hover:text-black dark:hover:text-white'
                                            }`}
                                    >
                                        {spec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-400 dark:text-white/40 font-black uppercase tracking-widest text-xs rounded-2xl hover:border-gray-200 dark:hover:border-white/20 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[2] py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Member Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
