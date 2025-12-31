import React, { useState, useEffect } from 'react';
import { Service, Staff, Availability } from '@/types';
import { Loader2, ChevronRight, X, Calendar } from 'lucide-react';

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
    availability?: Availability[];
    preselectedStaffId?: string;
    slotInterval?: number;
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

    // Initial Synced State
    // Initial Synced State
    useEffect(() => {
        if (isOpen) {
            // Reset form on open
            if (defaultDate) setDate(typeof defaultDate === 'string' ? defaultDate : defaultDate.toISOString().split('T')[0]);
            if (defaultTime) setTime(defaultTime);

            // Ensure Staff is selected
            if (preselectedStaffId) {
                setStaffId(preselectedStaffId);
            } else if ((!staffId || !staff.find(s => s.id === staffId)) && staff.length > 0) {
                setStaffId(staff[0].id);
            }

            // Ensure Service is selected
            if ((!serviceId || !services.find(s => s.id === serviceId)) && services.length > 0) {
                setServiceId(services[0].id);
            }

            setError(null);
            setClientName('');
            setClientEmail('');
        }
    }, [isOpen, defaultDate, defaultTime, preselectedStaffId, services, staff]);

    // -- HELPER: Time Options --
    const generateTimeOptions = () => {
        if (!date) return [];

        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        const hours = businessHours?.[dayName];
        if (!hours || !hours.isOpen) return [];

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

            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : (h === 0 || h === 12 ? 12 : h);
            const displayT = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;

            options.push({ value: t, label: displayT, hour: h });
            currentMinutes += (slotInterval || 60);
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    // Helper to get H:M from time string
    const getDisplayTime = (t: string) => {
        if (!t) return 'Select Time';
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 || h === 12 ? 12 : h);
        return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // Helper for visual slider preview (Mock usage)
    const getSliderHour = (t: string) => {
        const [h] = t.split(':').map(Number);
        return h || 12;
    };

    // -- SUBMIT --
    const handleSubmit = async () => {
        if (!serviceId || !staffId || !date || !time) {
            setError('Please fill in Date, Time, Staff, and Service.');
            return;
        }

        const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const checkService = services.find(s => s.id === serviceId);
        const checkDuration = checkService?.durationMinutes || 60;
        const newStart = parseTime(time);
        const newEnd = newStart + checkDuration;

        if (availability && availability.length > 0) {
            const [y, m, d] = date.split('-').map(Number);
            const safeDate = new Date(y, m - 1, d);
            const dayIndex = safeDate.getDay();
            const rule = availability.find(r => r.staffId === staffId && r.dayOfWeek === dayIndex);
            if (rule && !rule.isWorking) { setError(`Staff member is OFF DUTY on this day.`); return; }
        }

        const relevantApts = appointments.filter(apt => apt.date === date && apt.staffId === staffId && apt.status !== 'CANCELLED' && apt.status !== 'ARCHIVED');
        const conflict = relevantApts.find(apt => {
            const existingStart = parseTime(apt.timeSlot);
            const aptService = services.find(s => s.id === apt.serviceId);
            const existingDuration = aptService?.durationMinutes || 60;
            const existingEnd = existingStart + existingDuration;
            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (conflict) {
            setError(`Conflict at ${conflict.timeSlot}.`);
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm({
                serviceId,
                staffId,
                clientName: mode === 'blocking' ? 'Blocked Time' : (clientName || 'Walk-in'),
                clientEmail: mode === 'blocking' ? 'blocked@internal' : (clientEmail || ''),
                date,
                timeSlot: time
            });
            onClose();
        } catch (error) {
            alert('Failed: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedStaff = staff.find(s => s.id === staffId);
    const selectedService = services.find(s => s.id === serviceId);
    const displayHour = getSliderHour(time);

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
                onClick={onClose}
            ></div>

            {/* Modal Sheet */}
            <div className="relative z-10 bg-[#F2F2F7] w-full md:max-w-4xl h-[100dvh] md:h-auto md:max-h-[85vh] md:rounded-[2.5rem] rounded-none shadow-2xl overflow-hidden pointer-events-auto flex flex-col animate-in slide-in-from-bottom duration-500 subpixel-antialiased border border-white/20">

                {/* Header (Sticky) */}
                <div className="bg-[#F2F2F7]/95 backdrop-blur-xl shrink-0 sticky top-0 z-20 pt-4">
                    <div className="w-full flex justify-center mb-2">
                        <div className="w-12 h-1.5 bg-gray-300/50 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center px-6 h-14 pb-2">
                        <button onClick={onClose} className="text-[#007AFF] text-[17px] font-medium hover:opacity-70 transition-opacity active:scale-95">Cancel</button>
                        <span className="font-black text-[17px] text-gray-900 tracking-tight">
                            {mode === 'booking' ? 'New Event' : 'Block Time'}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="font-black text-[#007AFF] text-[17px] hover:opacity-70 transition-opacity disabled:opacity-50 active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 pt-2">

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <div className="md:grid md:grid-cols-2 md:gap-8 space-y-4 md:space-y-0 text-left">
                        {/* LEFT COLUMN: Client & Config */}
                        <div className="space-y-4">
                            {/* Client Information Module */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white overflow-hidden">
                                {mode === 'booking' ? (
                                    <div className="divide-y divide-gray-50">
                                        <div className="px-5 py-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                Client Name
                                            </p>
                                            <input
                                                type="text"
                                                placeholder="E.g. John Doe"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                                className="w-full text-lg font-bold placeholder-gray-300 bg-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="px-5 py-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Contact Email</p>
                                            <input
                                                type="email"
                                                placeholder="jane@example.com"
                                                value={clientEmail}
                                                onChange={e => setClientEmail(e.target.value)}
                                                className="w-full text-base font-bold placeholder-gray-300 bg-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <X className="w-6 h-6 text-red-500" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">Blocking Off-Duty Time</p>
                                        <p className="text-xs text-gray-500 mt-1">Prevent any bookings during this slot</p>
                                    </div>
                                )}
                            </div>

                            {/* Professional Metadata Module */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white divide-y divide-gray-50 overflow-hidden">
                                {/* Service Overlay Row */}
                                <div className="p-5 flex justify-between items-center group active:bg-gray-50 cursor-pointer transition-colors relative">
                                    <select
                                        value={serviceId}
                                        onChange={e => setServiceId(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    >
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>

                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Service</p>
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <span className="text-sm font-bold text-gray-500 text-right truncate max-w-[150px]">
                                            {selectedService ? selectedService.name : 'Select Service'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>

                                {/* Staff Overlay Row */}
                                <div className="p-5 flex justify-between items-center group active:bg-gray-50 cursor-pointer transition-colors relative">
                                    <select
                                        value={staffId}
                                        onChange={e => setStaffId(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    >
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>

                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Staff Member</p>
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <span className="text-sm font-bold text-gray-500 text-right truncate max-w-[150px]">
                                            {selectedStaff ? selectedStaff.name : 'Select Staff'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>

                                <div
                                    className="p-5 flex justify-between items-center active:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setMode(prev => prev === 'booking' ? 'blocking' : 'booking')}
                                >
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Booking Mode</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${mode === 'booking' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {mode === 'booking' ? 'Appointment' : 'Block Time'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Schedule & Notes */}
                        <div className="space-y-4">
                            {/* Selection Group: Date & Time */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white p-5 space-y-4">
                                {/* Date Row - Modified to Overlay Pill */}
                                <div className="flex justify-between items-center group relative">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Date</span>
                                    {/* Interactive Pill */}
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl group-active:scale-95 transition-transform relative overflow-hidden">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                            onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                                        />
                                        <p className="text-sm font-black text-[#007AFF] pointer-events-none">
                                            {date ? (() => {
                                                const [y, m, d] = date.split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                            })() : 'Select Date'}
                                        </p>
                                    </div>
                                </div>

                                {/* Time Row - Modified to Overlay Pill */}
                                <div className="flex justify-between items-center group relative">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Starts</span>
                                    {/* Interactive Pill */}
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl group-active:scale-95 transition-transform relative overflow-hidden flex items-center gap-1.5">
                                        <select
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        >
                                            <option value="" disabled>
                                                {timeOptions.length === 0 ? (
                                                    // Check if it's likely closed
                                                    (() => {
                                                        if (!date || !businessHours) return 'No slots';
                                                        const [y, m, d] = date.split('-').map(Number);
                                                        const dayName = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                        const hours = businessHours[dayName];
                                                        if (!hours || !hours.isOpen) return 'Business Closed';
                                                        return 'No slots available';
                                                    })()
                                                ) : 'Select Time'}
                                            </option>
                                            {timeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <p className={`text-sm font-black pointer-events-none ${time ? 'text-[#007AFF]' : 'text-gray-400'}`}>
                                            {time ? getDisplayTime(time) : (
                                                timeOptions.length === 0
                                                    ? (
                                                        (() => {
                                                            if (!date || !businessHours) return 'No slots';
                                                            const [y, m, d] = date.split('-').map(Number);
                                                            const dayName = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                            const hours = businessHours[dayName];
                                                            if (!hours || !hours.isOpen) return 'Closed';
                                                            return 'No slots';
                                                        })()
                                                    )
                                                    : 'Select Time'
                                            )}
                                        </p>
                                        <ChevronRight className="w-3.5 h-3.5 text-[#007AFF]/50 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                {/* MINI TIMELINE VISUALIZER */}
                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Schedule Impact</p>
                                    <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-2 px-1">
                                        <span>{displayHour > 0 ? (displayHour - 1 > 12 ? displayHour - 1 - 12 : displayHour - 1) : 11} {displayHour - 1 >= 12 ? 'PM' : 'AM'}</span>
                                        <span className="text-[#007AFF] font-black">{displayHour > 12 ? displayHour - 12 : displayHour} {displayHour >= 12 ? 'PM' : 'AM'}</span>
                                        <span>{(displayHour + 1 > 12 ? displayHour + 1 - 12 : displayHour + 1)} {displayHour + 1 >= 12 ? 'PM' : 'AM'}</span>
                                    </div>
                                    <div className="h-14 bg-gray-50/50 rounded-2xl relative border border-gray-100 w-full overflow-hidden flex items-center justify-center">
                                        {selectedService ? (
                                            <div className="w-2/3 h-10 bg-blue-50 border-2 border-blue-200 rounded-xl relative flex items-center px-4 animate-in fade-in slide-in-from-left duration-300">
                                                <div className="w-2 h-2 rounded-full bg-[#007AFF] mr-3 shadow-[0_0_8px_rgba(0,122,255,0.5)]"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-blue-900 truncate uppercase tracking-tight">{selectedService.name}</p>
                                                    <p className="text-[9px] font-bold text-[#007AFF] opacity-70 uppercase">{selectedService.durationMinutes}m duration</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Select a Service</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes Area */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white p-5 pb-safe-bottom">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Internal Notes</p>
                                <textarea
                                    placeholder="Add specifics about this booking..."
                                    className="w-full h-24 text-sm font-bold text-gray-900 placeholder-gray-300 bg-gray-50/50 rounded-2xl p-4 outline-none resize-none border border-gray-100"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
