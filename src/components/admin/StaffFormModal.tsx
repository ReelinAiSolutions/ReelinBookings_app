'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, User, Mail, Shield, Briefcase, Phone,
    Save, Camera, Trash2, Clock, Calendar, Star, Check, Scissors
} from 'lucide-react';
import Image from 'next/image';
import { Staff, Service } from '@/types';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

const supabase = createClient();

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Staff>, avatarFile?: File | null) => Promise<void>;
    editingStaff?: Staff | null;
    services?: Service[];
    onSaveSchedule?: (schedule: any[]) => Promise<void>;
    onSaveServices?: (serviceIds: string[]) => Promise<void>;
    initialSchedule?: any[];
}

type Tab = 'profile' | 'services' | 'schedule';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffFormModal({
    isOpen,
    onClose,
    onSave,
    editingStaff,
    services = [],
    onSaveSchedule,
    onSaveServices,
    initialSchedule
}: StaffFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const { toast } = useToast();

    // Profile State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'staff',
        specialties: [] as string[],
    });

    // Schedule State
    const [schedule, setSchedule] = useState<any[]>([]);

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

        // Reset tab
        setActiveTab('profile');
    }, [editingStaff, isOpen]);

    useEffect(() => {
        if (initialSchedule) {
            setSchedule(initialSchedule);
        }
    }, [initialSchedule]);

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

    const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
        setSchedule(prev => prev.map(day => {
            if (day.dayOfWeek === dayIndex) {
                return { ...day, [field]: value };
            }
            return day;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Save Profile
            if (activeTab === 'profile') {
                let avatar_url = previewUrl;

                if (avatarFile) {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('org-assets') // Make sure bucket matches what's in use
                        .upload(fileName, avatarFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('org-assets')
                            .getPublicUrl(fileName);
                        avatar_url = publicUrl;
                    }
                }

                await onSave({
                    ...formData,
                    avatar: avatar_url || undefined
                }, avatarFile);
            }
            // 2. Save Services
            else if (activeTab === 'services') {
                if (onSaveServices) {
                    await onSaveServices(formData.specialties);
                }
            }
            // 3. Save Schedule
            else if (activeTab === 'schedule') {
                if (onSaveSchedule) {
                    await onSaveSchedule(schedule);
                }
            }

        } catch (error: any) {
            console.error(error);
            toast('Failed to save', 'error');
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
                    className="relative w-full max-w-2xl bg-white dark:bg-card rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10 shrink-0">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                            {editingStaff ? 'Edit Member' : 'Add Member'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    {editingStaff && (
                        <div className="flex items-center px-8 border-b border-gray-100 dark:border-white/10 shrink-0 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'profile', icon: User, label: 'Profile' },
                                { id: 'services', icon: Scissors, label: 'Services' },
                                { id: 'schedule', icon: Clock, label: 'Schedule' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" strokeWidth={2.5} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {/* TAB: PROFILE */}
                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-white/5 border-4 border-white dark:border-white/10 shadow-xl relative">
                                                {previewUrl ? (
                                                    <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-black dark:focus:border-white rounded-2xl outline-none font-bold transition-all dark:text-white"
                                                placeholder="Enter name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-black dark:focus:border-white rounded-2xl outline-none font-bold transition-all dark:text-white"
                                                placeholder="email@example.com"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Role</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-black dark:focus:border-white rounded-2xl outline-none font-bold transition-all dark:text-white appearance-none cursor-pointer"
                                            >
                                                <option value="staff" className="text-gray-900">Staff Member</option>
                                                <option value="manager" className="text-gray-900">Manager</option>
                                                <option value="owner" className="text-gray-900">Owner</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: SERVICES */}
                            {activeTab === 'services' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <p className="text-sm text-gray-500 font-medium">Select the services that <span className="text-gray-900 dark:text-white font-bold">{formData.name}</span> can perform.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {services.map(service => {
                                            const isSelected = formData.specialties.includes(service.id);
                                            return (
                                                <div
                                                    key={service.id}
                                                    onClick={() => {
                                                        const newSpecs = isSelected
                                                            ? formData.specialties.filter(id => id !== service.id)
                                                            : [...formData.specialties, service.id];
                                                        setFormData({ ...formData, specialties: newSpecs });
                                                    }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected
                                                            ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-500'
                                                            : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                                        </div>
                                                        <span className={`font-bold text-sm ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {service.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {services.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 text-sm">No services available to assign.</div>
                                    )}
                                </div>
                            )}

                            {/* TAB: SCHEDULE */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {schedule.map((day) => (
                                        <div key={day.dayOfWeek} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                            <div className="w-24 shrink-0">
                                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {DAYS[day.dayOfWeek === 0 ? 0 : day.dayOfWeek]}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-1">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={day.isWorking}
                                                        onChange={(e) => handleScheduleChange(day.dayOfWeek, 'isWorking', e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                </label>

                                                {day.isWorking ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={day.startTime}
                                                            onChange={(e) => handleScheduleChange(day.dayOfWeek, 'startTime', e.target.value)}
                                                            className="bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                        <span className="text-gray-400 font-bold">-</span>
                                                        <input
                                                            type="time"
                                                            value={day.endTime}
                                                            onChange={(e) => handleScheduleChange(day.dayOfWeek, 'endTime', e.target.value)}
                                                            className="bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Off Duty</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 flex gap-4 sticky bottom-0 bg-white dark:bg-[#1a1b1e] p-4 -mx-4 border-t border-gray-50 dark:border-white/5">
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
                                    className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 dark:shadow-white/10 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save {activeTab}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
