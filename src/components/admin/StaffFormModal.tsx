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
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'details'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Details
                    </button>
                    {editingStaff && (
                        <>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'schedule'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Clock className="w-4 h-4 inline mr-2" />
                                Schedule
                            </button>
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'services'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Scissors className="w-4 h-4 inline mr-2" />
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
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200">
                                            <User className="w-16 h-16 text-white" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
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
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-1" />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Sarah Johnson"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="sarah@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Used for login and notifications</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Briefcase className="w-4 h-4 inline mr-1" />
                                        Role / Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        placeholder="e.g., Senior Stylist"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && editingStaff && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Set {editingStaff.name}'s weekly working hours
                                </p>
                            </div>

                            {schedule.map((day, idx) => (
                                <div key={day.dayOfWeek} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                    <label className="flex items-center gap-3 w-32 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={day.isWorking}
                                            onChange={(e) => updateScheduleItem(idx, 'isWorking', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="font-medium text-gray-900">{day.dayName}</span>
                                    </label>

                                    {day.isWorking ? (
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="time"
                                                value={day.startTime}
                                                onChange={(e) => updateScheduleItem(idx, 'startTime', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <span className="text-gray-400">to</span>
                                            <input
                                                type="time"
                                                value={day.endTime}
                                                onChange={(e) => updateScheduleItem(idx, 'endTime', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Day off</span>
                                    )}
                                </div>
                            ))}

                            <Button
                                onClick={handleSubmitSchedule}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                disabled={isLoading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? 'Saving...' : 'Save Schedule'}
                            </Button>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && editingStaff && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-purple-800">
                                    <Scissors className="w-4 h-4 inline mr-1" />
                                    Select services that {editingStaff.name} can provide
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {services.map(service => (
                                    <label
                                        key={service.id}
                                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedServices.includes(service.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
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
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900 block">{service.name}</span>
                                            <span className="text-xs text-gray-500">{service.durationMinutes} min • ${service.price}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <Button
                                onClick={handleSubmitServices}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={isLoading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? 'Saving...' : 'Save Services'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer - Only show for Details tab */}
                {activeTab === 'details' && (
                    <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitDetails}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isLoading || !formData.name || !formData.email}
                        >
                            {isLoading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Add Team Member'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
