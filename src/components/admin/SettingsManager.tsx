'use client';

import { Building2, Save, Upload, MapPin, Phone, Globe, Mail, Palette, Clock } from 'lucide-react';
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
        primary_color: org.primary_color || '#4F46E5', // Default Indigo
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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Initial Load sync
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
        setPreviewUrl(org.logo_url || null);
    }, [org]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let logoUrl = org.logo_url;

            // 1. Upload Logo if changed
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${org.id}/logo.${fileExt}`; // Fixed path per org

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('org-assets')
                    .upload(fileName, logoFile, {
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: publicData } = supabase.storage
                    .from('org-assets')
                    .getPublicUrl(fileName);

                logoUrl = publicData.publicUrl;
            }

            // 2. Update Organization Record
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
                    business_hours: bookingSettings.business_hours
                })
                .eq('id', org.id)
                .select()
                .single();

            if (error) throw error;

            // 3. Notify Parent
            onUpdate(data as Organization);
            toast('Settings saved successfully!', 'success');

        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast('Failed to save settings: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to safely get day settings with type assertion
    const getDaySettings = (day: string) => {
        return (bookingSettings.business_hours as any)[day] || { open: '09:00', close: '17:00', isOpen: false };
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
            {/* Header Actions */}
            <div className="flex justify-end items-center mb-4">
                <Button
                    type="submit"
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-primary-500/20"
                    isLoading={isLoading}
                >
                    <Save className="w-4 h-4" />
                    Save Settings
                </Button>
            </div>

            {/* Branding Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Palette className="w-5 h-5 text-gray-400" />
                    Brand Appearance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Building2 className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={formData.primary_color}
                                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                className="h-12 w-24 p-1 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm uppercase"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Used for buttons, links, and highlights on your booking page.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Info Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    Business Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email (Public)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                                placeholder="hello@company.com"
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                                placeholder="123 Main St, New York, NY"
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Website URL</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Globe className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Booking Preferences
                </h3>

                <div className="space-y-6">
                    {/* Interval Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booking Interval</label>
                        <p className="text-xs text-gray-500 mb-3">Determines how often a new appointment slot can start (e.g. 9:00, 9:15 vs 9:00, 10:00).</p>
                        <select
                            value={bookingSettings.slot_interval}
                            onChange={(e) => setBookingSettings({ ...bookingSettings, slot_interval: parseInt(e.target.value) })}
                            className="block w-full max-w-xs pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-lg border"
                        >
                            <option value={15}>Every 15 Minutes</option>
                            <option value={30}>Every 30 Minutes</option>
                            <option value={60}>Every Hour</option>
                        </select>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <label className="block text-sm font-bold text-gray-900 mb-4">Business Operating Hours</label>
                        <div className="space-y-3">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                const daySettings = getDaySettings(day);
                                return (
                                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2 transition-colors">
                                        <div className="w-32 flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={daySettings.isOpen}
                                                onChange={(e) => {
                                                    const newHours = { ...bookingSettings.business_hours } as any;
                                                    newHours[day] = { ...daySettings, isOpen: e.target.checked };
                                                    setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                }}
                                                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-900 capitalize">{day}</span>
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
                                                    className="block w-32 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                                                />
                                                <span className="text-gray-400 font-medium text-sm">to</span>
                                                <input
                                                    type="time"
                                                    value={daySettings.close}
                                                    onChange={(e) => {
                                                        const newHours = { ...bookingSettings.business_hours } as any;
                                                        newHours[day] = { ...daySettings, close: e.target.value };
                                                        setBookingSettings({ ...bookingSettings, business_hours: newHours });
                                                    }}
                                                    className="block w-32 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic px-3 py-1.5 bg-gray-50 rounded border border-gray-100">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

        </form>
    );
}
