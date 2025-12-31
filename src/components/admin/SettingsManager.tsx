'use client';

import { Building2, Save, Upload, MapPin, Phone, Globe, Mail, Palette, Clock, CheckCircle2, Tag, ChevronDown, ChevronUp, ShieldAlert, CalendarDays, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Organization } from '@/types';

interface SettingsManagerProps {
    org: Organization;
    onUpdate: (updatedOrg: Organization) => void;
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

export default function SettingsManager({ org, onUpdate }: SettingsManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(org.logo_url || null);
    const { toast } = useToast();

    // Accordion State
    const [openSection, setOpenSection] = useState<string>('brand');

    const toggleSection = (id: string) => {
        setOpenSection(openSection === id ? '' : id);
    };

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
        }
    });

    const [calendarColor, setCalendarColor] = useState<'staff' | 'service'>(org.settings?.color_mode || 'staff');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        setFormData({
            name: org.name,
            slug: org.slug,
            primary_color: org.primary_color || '#4F46E5',
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
            }
        });
        setCalendarColor(org.settings?.color_mode || 'staff');
        setPreviewUrl(org.logo_url || null);
    }, [org]);

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
                        color_mode: calendarColor
                    }
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

    return (
        <div className="space-y-8">
            <header className="mb-8">
                <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none mb-2">Settings</h1>
                <p className="text-gray-500 font-medium">Manage your brand, business details, and preferences</p>
            </header>

            <form onSubmit={handleSave} className="space-y-4">

                {/* 0. Booking Link (NEW) */}
                <AccordionItem
                    title="Booking Link"
                    subtitle="Share this link with your customers"
                    icon={Globe}
                    colorClass="bg-indigo-50 text-indigo-600"
                    isOpen={openSection === 'link'}
                    onToggle={() => toggleSection('link')}
                >
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Public Booking URL</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Globe className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${org.slug}`}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/${org.slug}`);
                                    toast('Link copied to clipboard!', 'success');
                                }}
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                            >
                                Copy Link
                            </Button>
                            <a
                                href={`/${org.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                            >
                                Open Page
                            </a>
                        </div>
                        <p className="mt-3 text-xs text-gray-400 font-medium ml-1">
                            This is the unique URL where your clients can book appointments.
                        </p>
                    </div>
                </AccordionItem>

                {/* 1. Brand Appearance */}
                <AccordionItem
                    title="Brand Appearance"
                    subtitle="Customize your logo and primary colors"
                    icon={Palette}
                    colorClass="bg-indigo-50 text-indigo-600"
                    isOpen={openSection === 'brand'}
                    onToggle={() => toggleSection('brand')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Company Logo</label>
                            <div className="flex items-center gap-5">
                                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center px-5 py-3 border-2 border-indigo-100 shadow-sm text-sm font-bold rounded-xl text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload New Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="mt-2.5 text-xs text-gray-400 font-medium">Recommended: 500x500 PNG or SVG</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Primary Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-14 w-24 p-1.5 rounded-xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow bg-white"
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-base uppercase font-bold text-gray-900 transition-all duration-200"
                                    />
                                    <p className="mt-2.5 text-xs text-gray-400 font-medium">Used for buttons, highlights, and accents</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* 2. Business Details */}
                <AccordionItem
                    title="Business Details"
                    subtitle="Public contact information and location"
                    icon={Building2}
                    colorClass="bg-blue-50 text-blue-600"
                    isOpen={openSection === 'business'}
                    onToggle={() => toggleSection('business')}
                >
                    <div className="space-y-6">
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
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-lg"
                                    placeholder="Your Business Name"
                                />
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
                                        className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300"
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
                                        className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300"
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
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    placeholder="123 Main St, City, State 12345"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Business Website</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Globe className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    placeholder="https://yourbusiness.com"
                                />
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* 3. Hours & Availability */}
                <AccordionItem
                    title="Hours & Availability"
                    subtitle="Configure opening hours and booking intervals"
                    icon={Clock}
                    colorClass="bg-emerald-50 text-emerald-600"
                    isOpen={openSection === 'hours'}
                    onToggle={() => toggleSection('hours')}
                >
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Booking Interval</label>
                            <div className="relative group max-w-sm">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <select
                                    value={bookingSettings.slot_interval}
                                    onChange={(e) => setBookingSettings({ ...bookingSettings, slot_interval: parseInt(e.target.value) })}
                                    className="block w-full pl-14 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-gray-900 appearance-none text-base cursor-pointer hover:bg-gray-100"
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

                        <div className="border-t border-gray-100 pt-8">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Operating Hours</label>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                    const daySettings = getDaySettings(day);
                                    return (
                                        <div key={day} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${daySettings.isOpen ? 'bg-white border-emerald-100 hover:border-emerald-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-80'}`}>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={daySettings.isOpen}
                                                    onChange={(e) => {
                                                        const newHours = { ...bookingSettings.business_hours } as any;
                                                        newHours[day] = { ...daySettings, isOpen: e.target.checked };
                                                        setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                    }}
                                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-lg cursor-pointer transition-all"
                                                />
                                                <span className={`text-sm font-bold capitalize w-24 ${daySettings.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                                            </div>

                                            {daySettings.isOpen ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={daySettings.open}
                                                        onChange={(e) => {
                                                            const newHours = { ...bookingSettings.business_hours } as any;
                                                            newHours[day] = { ...daySettings, open: e.target.value };
                                                            setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                        }}
                                                        className="block w-28 px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all text-center"
                                                    />
                                                    <span className="text-gray-300 font-black text-xs">-</span>
                                                    <input
                                                        type="time"
                                                        value={daySettings.close}
                                                        onChange={(e) => {
                                                            const newHours = { ...bookingSettings.business_hours } as any;
                                                            newHours[day] = { ...daySettings, close: e.target.value };
                                                            setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                        }}
                                                        className="block w-28 px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all text-center"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 text-right pr-4">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Closed</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* 4. Scheduling Rules (NEW) */}
                <AccordionItem
                    title="Scheduling Rules"
                    subtitle="Set buffers, notice periods, and limits"
                    icon={CalendarDays}
                    colorClass="bg-purple-50 text-purple-600"
                    isOpen={openSection === 'rules'}
                    onToggle={() => toggleSection('rules')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Min Notice */}
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Min Scheduling Notice</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min={0}
                                    defaultValue={4}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 text-lg"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Hours</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 font-medium">Prevent last-minute bookings.</p>
                        </div>

                        {/* Max Advance */}
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Max Advance Booking</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min={1}
                                    defaultValue={60}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 text-lg"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Days</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 font-medium">How far into the future clients can book.</p>
                        </div>

                        {/* Buffer Time */}
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Buffer Time</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min={0}
                                    step={5}
                                    defaultValue={0}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-gray-900 text-lg"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Mins</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 font-medium">Gap after every appointment.</p>
                        </div>
                    </div>
                </AccordionItem>

                {/* 5. Policies & Legal (NEW) */}
                <AccordionItem
                    title="Policies & Legal"
                    subtitle="Cancellation text and terms of service"
                    icon={ShieldAlert}
                    colorClass="bg-red-50 text-red-600"
                    isOpen={openSection === 'policies'}
                    onToggle={() => toggleSection('policies')}
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Cancellation Policy</label>
                            <textarea
                                rows={4}
                                placeholder="e.g. Please provide at least 24 hours notice for cancellations to avoid being charged a fee."
                                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 min-h-[120px]"
                            />
                        </div>
                    </div>
                </AccordionItem>

                {/* 6. Calendar Appearance */}
                <AccordionItem
                    title="Calendar Appearance"
                    subtitle="Customize how appointments are displayed"
                    icon={Palette}
                    colorClass="bg-orange-50 text-orange-600"
                    isOpen={openSection === 'calendar'}
                    onToggle={() => toggleSection('calendar')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <button
                            type="button"
                            onClick={() => setCalendarColor('staff')}
                            className={`group p-6 rounded-[24px] border-2 text-left transition-all duration-300 relative overflow-hidden ${calendarColor === 'staff'
                                ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                                : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <div className={`font-black text-base mb-1 ${calendarColor === 'staff' ? 'text-orange-700' : 'text-gray-900'}`}>
                                        By Staff Member
                                    </div>
                                    <div className={`text-xs font-medium ${calendarColor === 'staff' ? 'text-orange-600' : 'text-gray-500'}`}>
                                        Each staff member has a unique consistent color.
                                    </div>
                                </div>
                                {calendarColor === 'staff' && (
                                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCalendarColor('service')}
                            className={`group p-6 rounded-[24px] border-2 text-left transition-all duration-300 relative overflow-hidden ${calendarColor === 'service'
                                ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                                : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <div className={`font-black text-base mb-1 ${calendarColor === 'service' ? 'text-orange-700' : 'text-gray-900'}`}>
                                        By Service Type
                                    </div>
                                    <div className={`text-xs font-medium ${calendarColor === 'service' ? 'text-orange-600' : 'text-gray-500'}`}>
                                        Each service type has a unique color.
                                    </div>
                                </div>
                                {calendarColor === 'service' && (
                                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>
                </AccordionItem>

                {/* Save Button */}
                <div className="flex justify-end pt-6 pb-20 sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 mt-8 p-6 -mx-8">
                    <Button
                        type="submit"
                        className="flex items-center gap-3 bg-[#4F46E5] hover:bg-[#4338ca] text-white px-10 py-4 rounded-xl shadow-xl shadow-indigo-500/20 font-bold text-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                        isLoading={isLoading}
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </Button>
                </div>

            </form>
        </div>
    );
}
