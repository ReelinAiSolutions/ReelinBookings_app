'use client';

import { Building2, Save, Upload, MapPin, Phone, Globe, Mail, Palette, Clock, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Organization } from '@/types';

interface SettingsManagerProps {
    org: Organization;
    onUpdate: (updatedOrg: Organization) => void;
}

export default function SettingsManager({ org, onUpdate }: SettingsManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(org.logo_url || null);
    const { toast } = useToast();

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
                    .from('organization-assets')
                    .upload(fileName, logoFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('organization-assets')
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
        <form onSubmit={handleSave} className="space-y-6">

            {/* Brand Appearance Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Brand Appearance</h3>
                            <p className="text-sm text-gray-600">Customize your logo and colors</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center px-4 py-2.5 border-2 border-purple-200 shadow-sm text-sm font-bold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Change Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="mt-2 text-xs text-gray-500">PNG, JPG, or SVG up to 2MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Primary Brand Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-12 w-24 p-1 rounded-xl border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm uppercase font-bold text-gray-900 transition-all duration-200"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">Used for buttons and highlights</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Details Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Business Details</h3>
                            <p className="text-sm text-gray-600">Contact information and location</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                            placeholder="Your Business Name"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                                    placeholder="contact@business.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Globe className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                                placeholder="https://yourbusiness.com"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Preferences Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Booking Preferences</h3>
                            <p className="text-sm text-gray-600">Configure hours and intervals</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Interval Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Booking Interval</label>
                        <p className="text-xs text-gray-500 mb-3">How often new appointment slots can start</p>
                        <select
                            value={bookingSettings.slot_interval}
                            onChange={(e) => setBookingSettings({ ...bookingSettings, slot_interval: parseInt(e.target.value) })}
                            className="block w-full max-w-xs px-4 py-3 border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-xl font-bold text-gray-900 transition-all duration-200"
                        >
                            <option value={15}>Every 15 Minutes</option>
                            <option value={30}>Every 30 Minutes</option>
                            <option value={60}>Every Hour</option>
                        </select>
                    </div>

                    {/* Business Hours */}
                    <div className="border-t-2 border-gray-100 pt-6">
                        <label className="block text-sm font-black text-gray-900 mb-4">Business Operating Hours</label>
                        <div className="space-y-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                const daySettings = getDaySettings(day);
                                return (
                                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200">
                                        <div className="w-32 flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={daySettings.isOpen}
                                                onChange={(e) => {
                                                    const newHours = { ...bookingSettings.business_hours } as any;
                                                    newHours[day] = { ...daySettings, isOpen: e.target.checked };
                                                    setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                }}
                                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-gray-900 capitalize">{day}</span>
                                        </div>

                                        {daySettings.isOpen ? (
                                            <div className="flex items-center gap-3 animate-in fade-in duration-200">
                                                <input
                                                    type="time"
                                                    value={daySettings.open}
                                                    onChange={(e) => {
                                                        const newHours = { ...bookingSettings.business_hours } as any;
                                                        newHours[day] = { ...daySettings, open: e.target.value };
                                                        setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                    }}
                                                    className="block w-32 px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                />
                                                <span className="text-gray-400 font-bold text-sm">to</span>
                                                <input
                                                    type="time"
                                                    value={daySettings.close}
                                                    onChange={(e) => {
                                                        const newHours = { ...bookingSettings.business_hours } as any;
                                                        newHours[day] = { ...daySettings, close: e.target.value };
                                                        setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                    }}
                                                    className="block w-32 px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 font-medium">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Options Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Calendar Options</h3>
                            <p className="text-sm text-gray-600">Customize calendar appearance</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Calendar Appointments Color Source</label>
                    <p className="text-xs text-gray-500 mb-4">Choose how appointments are colored in the Admin Calendar views</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setCalendarColor('staff')}
                            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${calendarColor === 'staff'
                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-500/20'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className={`font-black text-sm mb-1 ${calendarColor === 'staff' ? 'text-orange-700' : 'text-gray-700'}`}>
                                By Staff Member
                            </div>
                            <div className={`text-xs ${calendarColor === 'staff' ? 'text-orange-600' : 'text-gray-500'}`}>
                                Consistent color per person
                            </div>
                            {calendarColor === 'staff' && (
                                <div className="mt-2">
                                    <CheckCircle2 className="w-5 h-5 text-orange-600 mx-auto" />
                                </div>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalendarColor('service')}
                            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${calendarColor === 'service'
                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-500/20'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className={`font-black text-sm mb-1 ${calendarColor === 'service' ? 'text-orange-700' : 'text-gray-700'}`}>
                                By Service Type
                            </div>
                            <div className={`text-xs ${calendarColor === 'service' ? 'text-orange-600' : 'text-gray-500'}`}>
                                Consistent color per service
                            </div>
                            {calendarColor === 'service' && (
                                <div className="mt-2">
                                    <CheckCircle2 className="w-5 h-5 text-orange-600 mx-auto" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-green-500/30 font-bold transition-all duration-200 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5"
                    isLoading={isLoading}
                >
                    <Save className="w-5 h-5" />
                    Save All Settings
                </Button>
            </div>

        </form>
    );
}
