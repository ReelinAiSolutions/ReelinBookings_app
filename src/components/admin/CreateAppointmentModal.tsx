import React, { useState, useEffect } from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2, User, Mail, Scissors, Lock, Check } from 'lucide-react';

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

type Mode = 'booking' | 'blocking';

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
    const [mode, setMode] = useState<Mode>('booking');

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
            setMode('booking'); // Default to normal booking
        }
    }, [isOpen, defaultDate, defaultTime, preselectedStaffId, staff, services]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!serviceId || !staffId || !date || !time) {
            alert('Please fill in Date, Time, Staff, and Service.');
            return;
        }

        setIsLoading(true);
        try {
            const finalClientName = mode === 'blocking' ? 'Blocked Time' : (clientName || 'Walk-in Client');
            const finalEmail = mode === 'blocking' ? 'blocked@internal' : (clientEmail || `walkin-${Date.now()}@internal.system`);

            await onConfirm({
                serviceId,
                staffId,
                clientName: finalClientName,
                clientEmail: finalEmail,
                date,
                timeSlot: time
            });
            onClose();
        } catch (error) {
            alert('Failed to create: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header with Mode Toggle */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">
                            {mode === 'booking' ? 'New Booking' : 'Block Time'}
                        </h3>
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1 relative">
                        <button
                            onClick={() => setMode('booking')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${mode === 'booking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Calendar className="w-4 h-4" /> Booking
                        </button>
                        <button
                            onClick={() => setMode('blocking')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${mode === 'blocking' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Lock className="w-4 h-4" /> Block
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">

                    {/* Time & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                            <select
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all appearance-none"
                            >
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const h = i + 9;
                                    const t = `${h.toString().padStart(2, '0')}:00`;
                                    return <option key={t} value={t}>{t}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Staff Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Staff Member</label>
                        <div className="grid grid-cols-2 gap-2">
                            {staff.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStaffId(s.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                                        ${staffId === s.id
                                            ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-[1.02]'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${staffId === s.id ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                                    {s.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Section based on Mode */}
                    {mode === 'booking' ? (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            {/* Service Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Service</label>
                                <select
                                    value={serviceId}
                                    onChange={(e) => setServiceId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                >
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}m)</option>
                                    ))}
                                </select>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Client INFO</label>
                                <input
                                    type="text"
                                    placeholder="Client Name"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                />
                                <input
                                    type="email"
                                    placeholder="Client Email (Optional)"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center space-y-2 animate-in slide-in-from-left-4 duration-300">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto text-gray-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Blocking Time Slot</h4>
                                <p className="text-xs text-gray-500 mt-1">This will prevent any clients from booking this time slot.</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98] ${mode === 'blocking' ? 'bg-gray-900 hover:bg-black' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            mode === 'booking' ? 'Confirm Booking' : 'Confirm Block'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
