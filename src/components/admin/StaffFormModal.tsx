import React, { useState, useEffect } from 'react';
import { Staff, Service } from '@/types';
import { X, Upload, User, Mail, Briefcase, Scissors, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Staff>, avatarFile: File | null) => Promise<void>;
    editingStaff: Staff | null;
    services: Service[];
    onSaveSchedule?: (schedule: any[]) => Promise<void>;
    onSaveServices?: (serviceIds: string[]) => Promise<void>;
    initialSchedule?: any[];
}

const DEFAULT_SCHEDULE = [
    { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '15:00', isWorking: true },
    { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '15:00', isWorking: false },
];

export default function StaffFormModal({
    isOpen,
    onClose,
    onSave,
    editingStaff,
    services,
    onSaveSchedule,
    onSaveServices,
    initialSchedule = []
}: StaffFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'schedule' | 'services'>('details');
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        avatar: '',
    });

    const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    useEffect(() => {
        if (editingStaff) {
            setFormData({
                name: editingStaff.name,
                email: editingStaff.email || '',
                role: editingStaff.role || '',
                avatar: editingStaff.avatar || '',
            });
            setAvatarPreview(editingStaff.avatar || '');
            setSelectedServices(editingStaff.specialties || []);

            if (initialSchedule.length > 0) {
                setSchedule(initialSchedule);
            }
        } else {
            setFormData({ name: '', email: '', role: '', avatar: '' });
            setAvatarPreview('');
            setAvatarFile(null);
            setSelectedServices([]);
            setSchedule(DEFAULT_SCHEDULE);
        }
    }, [editingStaff, initialSchedule, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitDetails = async () => {
        setIsLoading(true);
        try {
            await onSave(formData, avatarFile);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitSchedule = async () => {
        if (onSaveSchedule) {
            setIsLoading(true);
            try {
                await onSaveSchedule(schedule);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmitServices = async () => {
        if (onSaveServices) {
            setIsLoading(true);
            try {
                await onSaveServices(selectedServices);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const updateScheduleItem = (index: number, field: string, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        {editingStaff ? 'Edit Team Member' : 'New Team Member'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'details'
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Details
                    </button>
                    {editingStaff && (
                        <>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'schedule'
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Schedule
                            </button>
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'services'
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Scissors className="w-4 h-4" />
                                Services
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    {avatarPreview ? (
                                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                                            <User className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 p-3 bg-gray-900 text-white rounded-2xl cursor-pointer hover:bg-black transition-all shadow-xl active:scale-95">
                                        <Upload className="w-5 h-5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-500 mt-3">Click to upload photo</p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Sarah Johnson"
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="sarah@example.com"
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 px-1">Used for login and notifications</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                            Role / Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            placeholder="e.g., Senior Stylist"
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && editingStaff && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                                <p className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Weekly Working Schedule
                                </p>
                            </div>

                            <div className="space-y-3">
                                {schedule.map((day, idx) => (
                                    <div key={day.dayOfWeek} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition-all hover:bg-white hover:shadow-sm">
                                        <label className="flex items-center gap-3 w-full sm:w-32 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={day.isWorking}
                                                onChange={(e) => updateScheduleItem(idx, 'isWorking', e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500/20 border-gray-300 transition-all"
                                            />
                                            <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{day.dayName}</span>
                                        </label>

                                        {day.isWorking ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) => updateScheduleItem(idx, 'startTime', e.target.value)}
                                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                />
                                                <span className="text-gray-400 font-bold text-[10px]">to</span>
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) => updateScheduleItem(idx, 'endTime', e.target.value)}
                                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Day Off</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmitSchedule}
                                className="w-full mt-6 bg-gray-900 hover:bg-black text-white h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                <Save className="w-4 h-4" />
                                {isLoading ? 'Saving...' : 'Update Schedule'}
                            </button>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && editingStaff && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                                <p className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                                    <Scissors className="w-4 h-4" />
                                    Assigned Services
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {services.map(service => (
                                    <label
                                        key={service.id}
                                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${selectedServices.includes(service.id)
                                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                                            : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedServices.includes(service.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedServices(prev => [...prev, service.id]);
                                                } else {
                                                    setSelectedServices(prev => prev.filter(id => id !== service.id));
                                                }
                                            }}
                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500/20 border-gray-300 transition-all"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-black text-gray-900 block">{service.name}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{service.durationMinutes} min • ${service.price}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmitServices}
                                className="w-full mt-6 bg-gray-900 hover:bg-black text-white h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                <Save className="w-4 h-4" />
                                {isLoading ? 'Saving...' : 'Update Services'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - Only show for Details tab */}
                {activeTab === 'details' && (
                    <div className="flex items-center gap-3 p-8 border-t border-gray-100 bg-gray-50/50">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 bg-white border border-gray-200 text-gray-900 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitDetails}
                            className="flex-1 h-12 bg-gray-900 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50 disabled:shadow-none"
                            disabled={isLoading || !formData.name || !formData.email}
                        >
                            {isLoading ? 'Processing...' : editingStaff ? 'Update Roster' : 'Join Team'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
