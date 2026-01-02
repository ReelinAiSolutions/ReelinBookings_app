import React, { useState, useMemo } from 'react';
import { Appointment, Service, Organization, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface RescheduleModalProps {
    isOpen: boolean;
    appointment: Appointment | null;
    onClose: () => void;
    onReschedule: (
        id: string,
        newDate: string,
        newTime: string,
        newStaffId: string,
        options: {
            notes?: string;
            durationMinutes?: number;
            bufferMinutes?: number;
        }
    ) => Promise<void>;
    onCancel: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    onArchive?: (id: string) => Promise<void>;
    services: Service[];
    staff: Staff[];
    slotInterval?: number;
    businessHours?: Organization['business_hours'];
}

export default function RescheduleModal({
    isOpen,
    appointment,
    onClose,
    onReschedule,
    onCancel,
    onRestore,
    onArchive,
    services,
    slotInterval = 15,
    businessHours,
    staff
}: RescheduleModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [staffId, setStaffId] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize state when opening
    React.useEffect(() => {
        if (appointment) {
            setDate(appointment.date);
            setTime(appointment.timeSlot);
            setStaffId(appointment.staffId);
            setNotes(appointment.notes || '');
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onReschedule(appointment.id, date, time, staffId, { notes });
            onClose();
        } catch (error) {
            alert('Failed to reschedule: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelApt = async () => {
        if (!confirm('Are you sure you want to cancel this booking? This action is irreversible.')) return;
        setIsLoading(true);
        try {
            await onCancel(appointment.id);
            onClose();
        } catch (error) {
            alert('Failed to cancel: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreApt = async () => {
        setIsLoading(true);
        try {
            if (onRestore) {
                await onRestore(appointment.id);
                onClose();
            }
        } catch (error) {
            alert('Failed to restore: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchiveApt = async () => {
        if (!confirm('This will remove the booking from the calendar view. Continue?')) return;
        setIsLoading(true);
        try {
            if (onArchive) {
                await onArchive(appointment.id);
                onClose();
            }
        } catch (error) {
            alert('Failed to archive: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get H:M from time string
    const getDisplayTime = (t: string) => {
        if (!t) return '--';
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 || h === 12 ? 12 : h);
        return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    };

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
                        <span className="font-black text-[17px] text-gray-900 tracking-tight">Manage Booking</span>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="font-black text-[#007AFF] text-[17px] hover:opacity-70 transition-opacity disabled:opacity-50 active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 pt-2">
                    <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0 text-left">
                        {/* LEFT COLUMN: Data & Selection */}
                        <div className="space-y-6">
                            {/* Client Info Group */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white overflow-hidden p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                            {(appointment.clientName === 'Blocked Time' || appointment.status === 'BLOCKED')
                                                ? `Blocked Time${appointment.durationMinutes ? ` (${appointment.durationMinutes}m)` : ''}`
                                                : appointment.clientName}
                                        </h3>
                                        {/** Only show email if not blocked time */}
                                        {appointment.clientName !== 'Blocked Time' && appointment.status !== 'BLOCKED' && (
                                            <p className="text-sm font-medium text-gray-500">{appointment.clientEmail}</p>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${appointment.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {appointment.status || 'CONFIRMED'}
                                    </span>
                                </div>
                                {/* Hide Service for Blocked Time */}
                                {appointment.clientName !== 'Blocked Time' && appointment.status !== 'BLOCKED' && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl w-fit">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {services.find(s => s.id === appointment.serviceId)?.name || 'Unknown Service'}
                                    </div>
                                )}
                            </div>

                            {/* Editor Group - Moved here for priority */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white divide-y divide-gray-50 overflow-hidden">

                                {/* Staff */}
                                <div className="p-5 flex justify-between items-center group active:bg-gray-50 cursor-pointer transition-colors relative">
                                    {/* Overlay Select */}
                                    <select
                                        value={staffId}
                                        onChange={(e) => setStaffId(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    >
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>

                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Staff Member</p>
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <div className="bg-[#007AFF]/10 px-4 py-1.5 rounded-xl">
                                            <span className="text-base font-black text-[#007AFF]">
                                                {staff.find(s => s.id === staffId)?.name || 'Select Staff'}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="p-5 flex justify-between items-center group active:bg-gray-50 cursor-pointer transition-colors relative">
                                    {/* Overlay Input */}
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        onClick={(e) => {
                                            try {
                                                // Force browser picker to open
                                                if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                    (e.currentTarget as any).showPicker();
                                                }
                                            } catch (err) {
                                                // Fallback
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer text-transparent"
                                    />

                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Date</p>
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <span className="text-sm font-bold text-primary-600">
                                            {date ? (() => {
                                                const [y, m, d] = date.split('-').map(Number);
                                                return format(new Date(y, m - 1, d), 'MMM d, yyyy');
                                            })() : 'Select Date'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="p-5 flex justify-between items-center group active:bg-gray-50 cursor-pointer transition-colors relative">
                                    {/* Overlay Select */}
                                    <select
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    >
                                        {(() => {
                                            if (!date) return <option disabled>Select date first</option>;
                                            // Simplified time generation for Edit Mode (Show all slots)
                                            // In real app, reuse the generator but here we just need options. 
                                            // We will just recreate the simple list for now or copy logic if needed.
                                            // For brevity, using the same logic as Create is best, but let's stick to the structure.

                                            // Re-using logic from CreateModal would be ideal, but for now let's use a simple generator or confirm we have business hours.
                                            // Assuming standard strict generation:
                                            const [y, m, d] = date.split('-').map(Number);
                                            const localDate = new Date(y, m - 1, d);
                                            const dayName = format(localDate, 'EEEE').toLowerCase();
                                            const hours = businessHours?.[dayName];

                                            if (!hours || !hours.isOpen) return <option disabled>Closed</option>;

                                            const start = parseInt(hours.open.split(':')[0]) * 60 + parseInt(hours.open.split(':')[1]);
                                            const end = parseInt(hours.close.split(':')[0]) * 60 + parseInt(hours.close.split(':')[1]);
                                            const interval = slotInterval || 30;

                                            const options = [];
                                            for (let i = start; i < end; i += interval) {
                                                const h = Math.floor(i / 60);
                                                const m = i % 60;
                                                const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                                options.push(<option key={t} value={t}>{getDisplayTime(t)}</option>);
                                            }
                                            return options;
                                        })()}
                                    </select>

                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Time</p>
                                    <div className="flex items-center gap-2 relative pointer-events-none">
                                        <span className="text-sm font-bold text-primary-600 truncate min-w-[60px] text-right">
                                            {time ? getDisplayTime(time) : 'Select Time'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Notes & Settings */}
                        <div className="space-y-6">
                            {/* Customer Notes (Editable) */}
                            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Customer Request / Notes</h3>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes or special requests..."
                                    className="w-full h-24 text-[15px] font-medium text-gray-700 leading-relaxed italic bg-gray-50/50 rounded-2xl p-4 outline-none resize-none border border-gray-100 focus:ring-1 focus:ring-primary-100 transition-all"
                                />
                            </div>

                            {/* Instructions */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Moving this appointment will free up the original slot. <br />
                                    Use "Block Time" if you want to keep both closed.
                                </p>
                            </div>

                            {/* Destructive Actions - Last Option */}
                            {appointment.status !== 'CANCELLED' && (
                                <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white overflow-hidden">
                                    <button
                                        onClick={handleCancelApt}
                                        className="w-full p-4 text-[17px] font-normal text-red-600 active:bg-gray-50 transition-colors text-center"
                                    >
                                        {(appointment.clientName === 'Blocked Time' || appointment.status === 'BLOCKED') ? 'Unblock Time' : 'Cancel Booking'}
                                    </button>
                                </div>
                            )}

                            {appointment.status === 'CANCELLED' && (
                                <div className="space-y-3">
                                    <Button onClick={handleRestoreApt} disabled={isLoading} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uncancel Booking'}
                                    </Button>
                                    <button
                                        onClick={handleArchiveApt}
                                        className="w-full py-4 text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-gray-600"
                                    >
                                        Archive (Hide)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
