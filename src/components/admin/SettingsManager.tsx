'use client';
import { createClient } from '@/lib/supabase';
import {
    Building2, Save, Upload, MapPin, Phone, Globe, Mail, Palette, Clock,
    CheckCircle2, Tag, ChevronRight, ChevronUp, ShieldAlert, CalendarDays,
    Moon, Sun, LayoutDashboard, CalendarX, Plus, Trash2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Organization } from '@/types';
import Image from 'next/image';

interface SettingsManagerProps {
    org: Organization;
    onUpdate: (updatedOrg: Organization) => void;
    activeTabOverride?: string;
    hideHeader?: boolean;
    hideSidebar?: boolean;
}

export default function SettingsManager({
    org,
    onUpdate,
    activeTabOverride,
    hideHeader = false,
    hideSidebar = false
}: SettingsManagerProps) {
    if (!org) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(org.logo_url || null);
    const { toast } = useToast();

    // Navigation State
    const [activeTab, setActiveTab] = useState<string>('brand');


    const [formData, setFormData] = useState({
        name: org.name,
        slug: org.slug,
        primary_color: org.primary_color || '#4F46E5',
        phone: org.phone || '',
        email: org.email || '',
        address: org.address || '',
        website: org.website || ''
    });

    const [bookingSettings, setBookingSettings] = useState({
        slot_interval: org.slot_interval || 60,
        business_hours: org.business_hours || {
            monday: { open: '09:00', close: '17:00', isOpen: true },
            tuesday: { open: '09:00', close: '17:00', isOpen: true },
            wednesday: { open: '09:00', close: '17:00', isOpen: true },
            thursday: { open: '09:00', close: '17:00', isOpen: true },
            friday: { open: '09:00', close: '17:00', isOpen: true },
            saturday: { open: '10:00', close: '16:00', isOpen: true },
            sunday: { open: '10:00', close: '16:00', isOpen: false }
        },
        notify_all_bookings: org.settings?.notifications?.all_bookings || false
    });

    const [legalSettings, setLegalSettings] = useState({
        cancellation_policy: org.settings?.policies?.cancellation_policy || '',
        terms_url: org.terms_url || '',
        policy_url: org.policy_url || ''
    });

    const [calendarColor, setCalendarColor] = useState<'staff' | 'service'>(org.settings?.color_mode || 'staff');
    const [holidays, setHolidays] = useState<string[]>(org.settings?.scheduling?.holidays || []);
    const [newHolidayDate, setNewHolidayDate] = useState('');

    const [schedulingRules, setSchedulingRules] = useState({
        minNoticeValue: org.settings?.scheduling?.min_notice_value ?? 4,
        minNoticeUnit: org.settings?.scheduling?.min_notice_unit || 'hours',
        maxAdvanceValue: org.settings?.scheduling?.max_advance_value ?? 60,
        maxAdvanceUnit: org.settings?.scheduling?.max_advance_unit || 'days',
        bufferMinutes: org.settings?.scheduling?.buffer_minutes ?? 0
    });

    const supabase = createClient();

    useEffect(() => {
        setFormData({
            name: org.name,
            slug: org.slug,
            primary_color: org.primary_color || '#a855f7',
            phone: org.phone || '',
            email: org.email || '',
            address: org.address || '',
            website: org.website || ''
        });
        setBookingSettings({
            slot_interval: org.slot_interval || 60,
            business_hours: org.business_hours || {
                monday: { open: '09:00', close: '17:00', isOpen: true },
                tuesday: { open: '09:00', close: '17:00', isOpen: true },
                wednesday: { open: '09:00', close: '17:00', isOpen: true },
                thursday: { open: '09:00', close: '17:00', isOpen: true },
                friday: { open: '09:00', close: '17:00', isOpen: true },
                saturday: { open: '10:00', close: '16:00', isOpen: true },
                sunday: { open: '10:00', close: '16:00', isOpen: false }
            },
            notify_all_bookings: org.settings?.notifications?.all_bookings || false
        });
        setLegalSettings({
            cancellation_policy: org.settings?.policies?.cancellation_policy || '',
            terms_url: org.terms_url || '',
            policy_url: org.policy_url || ''
        });
        setCalendarColor(org.settings?.color_mode || 'staff');
        setHolidays(org.settings?.scheduling?.holidays || []);
        setSchedulingRules({
            minNoticeValue: org.settings?.scheduling?.min_notice_value ?? 4,
            minNoticeUnit: org.settings?.scheduling?.min_notice_unit || 'hours',
            maxAdvanceValue: org.settings?.scheduling?.max_advance_value ?? 60,
            maxAdvanceUnit: org.settings?.scheduling?.max_advance_unit || 'days',
            bufferMinutes: org.settings?.scheduling?.buffer_minutes ?? 0
        });

        if (activeTabOverride) {
            setActiveTab(activeTabOverride);
        }
        setPreviewUrl(org.logo_url || null);
    }, [org, activeTabOverride]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let logoUrl = org.logo_url;

            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${org.id}/logo.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('org-assets')
                    .upload(fileName, logoFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('org-assets')
                    .getPublicUrl(fileName);

                logoUrl = publicData.publicUrl;
            }

            const { data, error } = await supabase
                .from('organizations')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    primary_color: formData.primary_color,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    website: formData.website,
                    logo_url: logoUrl,
                    slot_interval: bookingSettings.slot_interval,
                    business_hours: bookingSettings.business_hours,
                    settings: {
                        ...org.settings,
                        color_mode: calendarColor,
                        policies: {
                            cancellation_policy: legalSettings.cancellation_policy
                        },
                        notifications: {
                            ...org.settings?.notifications,
                            all_bookings: bookingSettings.notify_all_bookings
                        },
                        scheduling: {
                            ...org.settings?.scheduling,
                            holidays: holidays,
                            min_notice_value: schedulingRules.minNoticeValue,
                            min_notice_unit: schedulingRules.minNoticeUnit,
                            max_advance_value: schedulingRules.maxAdvanceValue,
                            max_advance_unit: schedulingRules.maxAdvanceUnit,
                            buffer_minutes: schedulingRules.bufferMinutes
                        }
                    },
                    terms_url: legalSettings.terms_url,
                    policy_url: legalSettings.policy_url
                })
                .eq('id', org.id)
                .select()
                .single();

            if (error) throw error;

            toast('Your business settings have been updated successfully.', 'success');
            onUpdate(data);

        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast(error.message || 'Failed to save settings', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getDaySettings = (day: string) => {
        return (bookingSettings.business_hours as any)[day] || { open: '09:00', close: '17:00', isOpen: false };
    };

    const menuItems = [
        { id: 'brand', label: 'Brand & Logo', icon: Palette, color: 'bg-indigo-500' },
        { id: 'details', label: 'Business Details', icon: Building2, color: 'bg-blue-500' },
        { id: 'hours', label: 'Hours & Availability', icon: Clock, color: 'bg-amber-500' },
        { id: 'rules', label: 'Scheduling Rules', icon: CalendarDays, color: 'bg-orange-500' },
        { id: 'legal', label: 'Policies & Legal', icon: ShieldAlert, color: 'bg-red-500' },
        { id: 'link', label: 'Booking Link', icon: Globe, color: 'bg-emerald-500' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8 p-2 sm:p-8">
            {/* Header */}
            {!hideHeader && (
                <div>
                    <h1 className="text-[32px] font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Business Operations</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your brand, details, and booking configurations.</p>
                </div>
            )}

            <div className={`${hideSidebar ? 'block' : 'grid grid-cols-1 lg:grid-cols-4 gap-8'}`}>
                {/* Left: Navigation */}
                {!hideSidebar && (
                    <div className="space-y-2 lg:col-span-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${activeTab === item.id
                                    ? 'bg-white dark:bg-card shadow-lg sm:shadow-xl border-gray-100 dark:border-white/10 ring-1 ring-black/5'
                                    : 'hover:bg-white/50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white ${item.color} shadow-md sm:shadow-lg`}>
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs text-left">{item.label}</span>
                                </div>
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === item.id ? 'text-primary-500' : 'text-gray-300'}`} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Right: Content Area */}
                <div className={`${hideSidebar ? 'w-full' : 'lg:col-span-3'} space-y-6`}>
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Booking Link */}
                        {activeTab === 'link' && (
                            <div className="bg-white dark:bg-card rounded-[1.25rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Booking Link</h3>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Public Booking URL</label>
                                    <div className="flex flex-col md:flex-row items-center gap-3">
                                        <div className="flex-1 w-full relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Globe className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${org.slug}`}
                                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/${org.slug}`);
                                                    toast('Link copied to clipboard!', 'success');
                                                }}
                                                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white border-transparent px-8 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:-translate-y-0.5"
                                            >
                                                Copy
                                            </Button>
                                            <a
                                                href={`/${org.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 md:flex-none flex items-center justify-center bg-gray-900 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5"
                                            >
                                                Open Page
                                            </a>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-400 font-medium ml-1">
                                        This is the unique URL where your clients can book appointments.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Brand Appearance */}
                        {activeTab === 'brand' && (
                            <div className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">Brand Appearance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Logo Section - Elite Stlye */}
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Company Logo</label>
                                        <div className="flex items-center gap-6">
                                            <div className="relative group">
                                                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                                                <div className="relative w-32 h-32 rounded-[1.8rem] border-4 border-white dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-white/5 overflow-hidden shadow-lg">
                                                    {previewUrl ? (
                                                        <Image
                                                            src={previewUrl}
                                                            alt="Business Logo"
                                                            width={100}
                                                            height={100}
                                                            className="w-full h-full object-contain p-4"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <label className="cursor-pointer inline-flex items-center px-6 py-4 border-2 border-primary-500/20 shadow-sm text-xs font-black uppercase tracking-wider rounded-2xl text-primary-600 bg-primary-50/50 hover:bg-primary-50 hover:-translate-y-0.5 transition-all duration-200">
                                                    <Upload className="w-4 h-4 mr-2.5" />
                                                    Upload New Logo
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Recommended: 500x500 PNG/SVG</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Section - Elite Style */}
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Wayfinding Color</label>
                                        <div className="flex items-center justify-between p-1.5 pr-2 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 relative group hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-16 h-16 rounded-[1.2rem] shadow-sm flex items-center justify-center transition-colors" style={{ backgroundColor: formData.primary_color }}>
                                                    <Palette className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Interface Tint</div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1.5 opacity-70">
                                                        {formData.primary_color}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={formData.primary_color}
                                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="px-5 py-3 bg-white dark:bg-black rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform">
                                                    Change
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wide ml-1">
                                            Applied to your public booking page journey.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Business Details */}
                        {activeTab === 'details' && (
                            <div className="bg-white dark:bg-card rounded-[1.25rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Business Details</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Business Name</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Tag className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                    placeholder="Your Business Name"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Public URL Slug</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Globe className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-0-]/g, '') })}
                                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                    placeholder="your-business-slug"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                    placeholder="contact@business.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Office Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <MapPin className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                placeholder="123 Main St, City, State 12345"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-white/10 pt-8 mt-4">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Notification Preferences</label>
                                        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">Admin Booking Notifications</p>
                                                    <p className="text-xs font-medium text-gray-400">Receive an email for every new booking Made.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBookingSettings({ ...bookingSettings, notify_all_bookings: !bookingSettings.notify_all_bookings })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${bookingSettings.notify_all_bookings ? 'bg-primary-600' : 'bg-gray-200 dark:bg-white/10'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings.notify_all_bookings ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hours & Availability */}
                        {activeTab === 'hours' && (
                            <div className="bg-white dark:bg-card rounded-[1.25rem] sm:rounded-[2.5rem] p-3 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Hours & Availability</h3>
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Booking Interval</label>
                                        <div className="relative group max-w-sm">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <Clock className="h-5 w-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                                            </div>
                                            <select
                                                value={bookingSettings.slot_interval}
                                                onChange={(e) => setBookingSettings({ ...bookingSettings, slot_interval: parseInt(e.target.value) })}
                                                className="block w-full pl-14 pr-10 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-gray-900 dark:text-white appearance-none text-base cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                                            >
                                                <option value={15}>Every 15 Minutes</option>
                                                <option value={30}>Every 30 Minutes</option>
                                                <option value={60}>Every Hour</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 max-h-full flex items-center pr-4 pointer-events-none">
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium ml-2 mt-2">Determines start times (e.g. 9:00, 9:15)</p>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-white/10 pt-8">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Operating Hours</label>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                                const daySettings = getDaySettings(day);
                                                return (
                                                    <div key={day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-200 border ${daySettings.isOpen ? 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm' : 'bg-gray-50/50 dark:bg-white/5 border-transparent opacity-60'}`}>
                                                        <div className="flex items-center gap-3 mb-3.5 sm:mb-0">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={daySettings.isOpen}
                                                                    onChange={(e) => {
                                                                        const newHours = { ...bookingSettings.business_hours } as any;
                                                                        newHours[day] = { ...daySettings, isOpen: e.target.checked };
                                                                        setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                                    }}
                                                                    className="peer w-5 h-5 text-amber-500 focus:ring-amber-500 border-gray-300 rounded-lg cursor-pointer transition-all z-10 opacity-0 absolute inset-0"
                                                                />
                                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${daySettings.isOpen ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white dark:bg-white/10'}`}>
                                                                    {daySettings.isOpen && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${daySettings.isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{day}</span>
                                                        </div>

                                                        {daySettings.isOpen ? (
                                                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                                                <div className="relative flex-1 sm:w-36 lg:w-44 group min-w-0">
                                                                    <input
                                                                        type="time"
                                                                        value={daySettings.open}
                                                                        onChange={(e) => {
                                                                            const newHours = { ...bookingSettings.business_hours } as any;
                                                                            newHours[day] = { ...daySettings, open: e.target.value };
                                                                            setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                                        }}
                                                                        className="block w-full px-2 sm:px-3 py-2.5 sm:py-3.5 bg-gray-50 dark:bg-black border-2 border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-xl text-[12px] sm:text-sm font-bold text-gray-900 dark:text-white focus:ring-0 focus:border-amber-500 transition-all text-center"
                                                                    />
                                                                </div>
                                                                <span className="text-gray-300 font-black text-[10px] opacity-40 shrink-0 text-center">-</span>
                                                                <div className="relative flex-1 sm:w-36 lg:w-44 group min-w-0">
                                                                    <input
                                                                        type="time"
                                                                        value={daySettings.close}
                                                                        onChange={(e) => {
                                                                            const newHours = { ...bookingSettings.business_hours } as any;
                                                                            newHours[day] = { ...daySettings, close: e.target.value };
                                                                            setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                                        }}
                                                                        className="block w-full px-2 sm:px-3 py-2.5 sm:py-3.5 bg-gray-50 dark:bg-black border-2 border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-xl text-[12px] sm:text-sm font-bold text-gray-900 dark:text-white focus:ring-0 focus:border-amber-500 transition-all text-center"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 sm:text-right sm:pr-4">
                                                                <span className="text-[10px] sm:text-xs font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2.5 py-1.5 rounded-lg">Closed</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Holidays & Closures Section */}
                                    <div className="border-t border-gray-100 dark:border-white/10 pt-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CalendarX className="w-5 h-5 text-red-500" />
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Holidays & Closures</label>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mb-6 ml-1">Add specific dates where your business will be closed (e.g. Christmas, New Year's Eve).</p>

                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        type="date"
                                                        value={newHolidayDate}
                                                        onChange={(e) => setNewHolidayDate(e.target.value)}
                                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-black border-2 border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-0 focus:border-red-500 transition-all"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!newHolidayDate) return;
                                                        if (holidays.includes(newHolidayDate)) {
                                                            toast('This date is already added.', 'error');
                                                            return;
                                                        }
                                                        setHolidays([...holidays, newHolidayDate].sort());
                                                        setNewHolidayDate('');
                                                        toast('Holiday added. Don\'t forget to save!', 'success');
                                                    }}
                                                    className="bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90 px-6 rounded-2xl font-bold flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Date
                                                </Button>
                                            </div>

                                            {holidays.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                    {holidays.map((date) => (
                                                        <div key={date} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 group animate-in fade-in zoom-in duration-300">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                                    {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setHolidays(holidays.filter(h => h !== date));
                                                                    toast('Holiday removed.', 'success');
                                                                }}
                                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                                                    <CalendarX className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-gray-400">No holidays added yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scheduling Rules */}
                        {activeTab === 'rules' && (
                            <div className="bg-white dark:bg-card rounded-[1.25rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Scheduling Rules</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Min Scheduling Notice</label>
                                        <div className="flex bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[22px] focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all overflow-hidden group">
                                            <select
                                                value={schedulingRules.minNoticeUnit}
                                                onChange={(e) => setSchedulingRules({ ...schedulingRules, minNoticeUnit: e.target.value as any })}
                                                className="w-[100px] pl-4 pr-2 py-4 bg-transparent border-none font-black text-xs text-orange-500 uppercase tracking-widest cursor-pointer appearance-none focus:ring-0"
                                            >
                                                <option value="minutes">Mins</option>
                                                <option value="hours">Hours</option>
                                            </select>
                                            <div className="w-[2px] h-6 bg-gray-200 dark:bg-white/10 self-center opacity-50" />
                                            <input
                                                type="number"
                                                min={0}
                                                value={schedulingRules.minNoticeValue}
                                                onChange={(e) => setSchedulingRules({ ...schedulingRules, minNoticeValue: parseInt(e.target.value) || 0 })}
                                                className="flex-1 px-4 py-4 bg-transparent border-none focus:ring-0 font-bold text-gray-900 dark:text-white text-lg placeholder:text-gray-300"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Prevent last-minute bookings.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Max Advance Booking</label>
                                        <div className="flex bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[22px] focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all overflow-hidden group">
                                            <select
                                                value={schedulingRules.maxAdvanceUnit}
                                                onChange={(e) => setSchedulingRules({ ...schedulingRules, maxAdvanceUnit: e.target.value as any })}
                                                className="w-[100px] pl-4 pr-2 py-4 bg-transparent border-none font-black text-xs text-orange-500 uppercase tracking-widest cursor-pointer appearance-none focus:ring-0"
                                            >
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                            </select>
                                            <div className="w-[2px] h-6 bg-gray-200 dark:bg-white/10 self-center opacity-50" />
                                            <input
                                                type="number"
                                                min={1}
                                                value={schedulingRules.maxAdvanceValue}
                                                onChange={(e) => setSchedulingRules({ ...schedulingRules, maxAdvanceValue: parseInt(e.target.value) || 1 })}
                                                className="flex-1 px-4 py-4 bg-transparent border-none focus:ring-0 font-bold text-gray-900 dark:text-white text-lg placeholder:text-gray-300"
                                                placeholder="1"
                                            />
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">How far into future clients book.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Buffer Time</label>
                                        <div className="flex bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[22px] focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all overflow-hidden group">
                                            <div className="w-[100px] pl-4 pr-2 py-4 bg-transparent border-none font-black text-xs text-orange-500 uppercase tracking-widest flex items-center">
                                                Mins
                                            </div>
                                            <div className="w-[2px] h-6 bg-gray-200 dark:bg-white/10 self-center opacity-50" />
                                            <input
                                                type="number"
                                                min={0}
                                                step={5}
                                                value={schedulingRules.bufferMinutes}
                                                onChange={(e) => setSchedulingRules({ ...schedulingRules, bufferMinutes: parseInt(e.target.value) || 0 })}
                                                className="flex-1 px-4 py-4 bg-transparent border-none focus:ring-0 font-bold text-gray-900 dark:text-white text-lg placeholder:text-gray-300"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Gap after every appointment.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Legal & Policies */}
                        {activeTab === 'legal' && (
                            <div className="bg-white dark:bg-card rounded-[1.25rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Policies & Legal</h3>
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Cancellation Policy</label>
                                        <div className="relative group">
                                            <textarea
                                                rows={6}
                                                value={legalSettings.cancellation_policy}
                                                onChange={(e) => setLegalSettings({ ...legalSettings, cancellation_policy: e.target.value })}
                                                className="w-full p-5 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300 min-h-[160px] resize-y"
                                                placeholder="e.g. Please provide at least 24 hours notice for cancellations to avoid being charged a fee. Late cancellations will result in a 50% charge of the scheduled service."
                                            />
                                            <div className="absolute bottom-4 right-4 pointer-events-none">
                                                <ShieldAlert className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400 font-medium ml-2">Displayed to clients before they confirm their booking.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Terms of Service URL</label>
                                            <input
                                                type="url"
                                                value={legalSettings.terms_url}
                                                onChange={(e) => setLegalSettings({ ...legalSettings, terms_url: e.target.value })}
                                                className="w-full pl-5 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Privacy Policy URL</label>
                                            <input
                                                type="url"
                                                value={legalSettings.policy_url}
                                                onChange={(e) => setLegalSettings({ ...legalSettings, policy_url: e.target.value })}
                                                className="w-full pl-5 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-[20px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Save Button (Global for all tabs) */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200 px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save All Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div >
            </div >
        </div >
    );
}
