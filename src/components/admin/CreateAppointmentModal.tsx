import React, { useState, useEffect } from 'react';
import { Service, Staff, Availability } from '@/types';
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
    appointments: any[]; // Receiving existing appointments for conflict check
    businessHours?: any; // Organization['business_hours']
    availability?: Availability[]; // Added prop
    preselectedStaffId?: string; // Added prop
    slotInterval?: number; // Added prop
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
    appointments,
    availability = [],
    preselectedStaffId,
    slotInterval = 60,
    businessHours
}: CreateAppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('booking');

    const [date, setDate] = useState<string>(defaultDate ? (typeof defaultDate === 'string' ? defaultDate : defaultDate.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>(defaultTime || '');
    const [staffId, setStaffId] = useState<string>(preselectedStaffId || staff[0]?.id || '');
    const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form on open
            if (defaultDate) setDate(typeof defaultDate === 'string' ? defaultDate : defaultDate.toISOString().split('T')[0]);
            if (defaultTime) setTime(defaultTime);
            if (preselectedStaffId) setStaffId(preselectedStaffId);
            setError(null);
            setClientName('');
            setClientEmail('');
        }
    }, [isOpen, defaultDate, defaultTime, preselectedStaffId]);

    const generateTimeOptions = () => {
        if (!date) return <option disabled>Select a date first</option>;

        // 1. Get Day of Week
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        // 2. Get Hours
        const hours = businessHours?.[dayName];
        if (!hours || !hours.isOpen) {
            return <option disabled>Closed on this day</option>;
        }

        const toMinutes = (t: string) => {
            const [hh, mm] = t.split(':').map(Number);
            return hh * 60 + mm;
        };

        const startMinutes = toMinutes(hours.open);
        const endMinutes = toMinutes(hours.close);

        const options = [];
        let currentMinutes = startMinutes;

        while (currentMinutes < endMinutes) {
            const h = Math.floor(currentMinutes / 60);
            const m = currentMinutes % 60;
            const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            // Format 12-hour
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : (h === 0 || h === 12 ? 12 : h);
            const displayT = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;

            options.push(<option key={t} value={t}>{displayT}</option>);
            currentMinutes += (slotInterval || 60);
        }
        return options;
    };

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!serviceId || !staffId || !date || !time) {
            setError('Please fill in Date, Time, Staff, and Service.');
            return;
        }

        // --- CONFLICT & VALIDATION CHECK ---
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const checkService = services.find(s => s.id === serviceId);
        const checkDuration = checkService?.durationMinutes || 60;

        const newStart = parseTime(time);
        const newEnd = newStart + checkDuration;

        // 1. Off Duty Check
        if (availability && availability.length > 0) {
            // Parse date "YYYY-MM-DD" safely to get day of week
            const [y, m, d] = date.split('-').map(Number);
            const safeDate = new Date(y, m - 1, d);
            const dayIndex = safeDate.getDay(); // 0-6 (Sun-Sat)

            const rule = availability.find(r => r.staffId === staffId && r.dayOfWeek === dayIndex);

            if (rule && !rule.isWorking) {
                setError(`Staff member is OFF DUTY on this day.`);
                return;
            }
        }

        // 2. Business Hours Check (9 AM - 5 PM)
        const businessOpen = 9 * 60;
        const businessClose = 17 * 60;

        if (newStart < businessOpen || newEnd > businessClose) {
            setError(`Booking must be between 9:00 AM and 5:00 PM.`);
            return;
        }

        // 2. Overlap Check
        const relevantApts = appointments.filter(apt =>
            apt.date === date &&
            apt.staffId === staffId &&
            apt.status !== 'CANCELLED' &&
            apt.status !== 'ARCHIVED'
        );

        const conflict = relevantApts.find(apt => {
            const existingStart = parseTime(apt.timeSlot);
            const aptService = services.find(s => s.id === apt.serviceId);
            const existingDuration = aptService?.durationMinutes || 60;
            const existingEnd = existingStart + existingDuration;

            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (conflict) {
            const staffMember = staff.find(s => s.id === staffId);
            const conflictService = services.find(s => s.id === conflict.serviceId);
            setError(`Conflict: ${staffMember?.name} is busy at ${conflict.timeSlot} (${conflictService?.name || 'Service'}).`);
            return;
        }
        // -----------------------

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
                                {generateTimeOptions()}
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
                    {/* Error Message */}
                    {error && (
                        <div className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

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
