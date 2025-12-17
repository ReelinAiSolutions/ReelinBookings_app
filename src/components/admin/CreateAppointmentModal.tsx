import React, { useState, useEffect } from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2, User, Mail, Scissors } from 'lucide-react';

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        serviceId: string;
        staffId: string;
        clientName: string;
        clientEmail: string;
        date: string;
        timeSlot: string;
    }) => Promise<void>;
    defaultDate: Date | null;
    defaultTime: string | null;
    services: Service[];
    staff: Staff[];
    preselectedStaffId?: string;
}

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onConfirm,
    defaultDate,
    defaultTime,
    services,
    staff,
    preselectedStaffId
}: CreateAppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [serviceId, setServiceId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    // Initialize/Reset
    useEffect(() => {
        if (isOpen && defaultDate && defaultTime) {
            setDate(defaultDate.toISOString().split('T')[0]);
            setTime(defaultTime);
            setStaffId(preselectedStaffId && preselectedStaffId !== 'ALL' ? preselectedStaffId : (staff[0]?.id || ''));
            setServiceId(services[0]?.id || '');
            setClientName('');
            setClientEmail('');
        }
    }, [isOpen, defaultDate, defaultTime, preselectedStaffId, staff, services]);

    if (!isOpen) return null;

    const handleWalkInFill = () => {
        setClientName('Walk-in Client');
        setClientEmail(`walkin-${Date.now()}@internal.system`); // Unique email to avoid unique constraint issues if any, or just purely internal
    };

    const handleSubmit = async () => {
        if (!serviceId || !staffId || !date || !time) {
            alert('Please fill in Date, Time, Staff, and Service.');
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm({
                serviceId,
                staffId,
                clientName: clientName || 'Walk-in Client',
                clientEmail: clientEmail || `walkin-${Date.now()}@internal.system`,
                date,
                timeSlot: time
            });
            onClose();
        } catch (error) {
            alert('Failed to create booking: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900">New Appointment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Time & Date Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <select
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => {
                                        const h = i + 9; // 9 AM to 8 PM
                                        const t = `${h.toString().padStart(2, '0')}:00`;
                                        return <option key={t} value={t}>{t}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Staff & Service Row */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                            <select
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                            <div className="relative">
                                <Scissors className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <select
                                    value={serviceId}
                                    onChange={(e) => setServiceId(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}m - ${s.price})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Client Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-900">Client Details</label>
                            <span className="text-xs text-gray-400 font-medium">(Optional - defaults to Walk-in)</span>
                        </div>

                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Client Name (Optional)"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Client Email (Optional)"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Appointment'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
