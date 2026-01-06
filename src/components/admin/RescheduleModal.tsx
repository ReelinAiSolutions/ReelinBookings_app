import React, { useState, useMemo } from 'react';
import { Appointment, Service, Organization, Staff, Availability } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2, ChevronRight, MessageSquare, Info } from 'lucide-react';
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
            clientName?: string;
            clientEmail?: string;
            clientPhone?: string;
        }
    ) => Promise<void>;
    onCancel: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    onArchive?: (id: string) => Promise<void>;
    services: Service[];
    staff: Staff[];
    slotInterval?: number;
    businessHours?: Organization['business_hours'];
    holidays?: string[];
    availability?: Availability[];
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
    staff,
    holidays = []
}: RescheduleModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [staffId, setStaffId] = useState('');
    const [notes, setNotes] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize state when opening
    React.useEffect(() => {
        if (appointment) {
            setDate(appointment.date);
            setTime(appointment.timeSlot);
            setStaffId(appointment.staffId);
            setNotes(appointment.notes || '');
            setClientName(appointment.clientName || '');
            setClientEmail(appointment.clientEmail || '');
            setClientPhone(appointment.clientPhone || '');
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (holidays.includes(date)) {
                throw new Error(`Business is CLOSED for holiday on ${date}.`);
            }
            await onReschedule(appointment.id, date, time, staffId, {
                notes,
                clientName,
                clientEmail,
                clientPhone
            });
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
            <div className="relative z-10 bg-[#F2F2F7] dark:bg-zinc-900 w-full md:max-w-2xl h-[95dvh] md:h-auto md:max-h-[85vh] md:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none shadow-2xl overflow-hidden pointer-events-auto flex flex-col animate-in slide-in-from-bottom duration-500 subpixel-antialiased border border-white/20 dark:border-white/10">

                {/* Header (Sticky) */}
                <div className="bg-[#F2F2F7]/95 dark:bg-zinc-900/95 backdrop-blur-xl shrink-0 sticky top-0 z-20 pt-4">
                    <div className="w-full flex justify-center mb-2">
                        <div className="w-12 h-1.5 bg-gray-300/50 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center px-6 h-14 pb-2">
                        <button onClick={onClose} className="text-[#7C3AED] dark:text-violet-400 text-[17px] font-medium hover:opacity-70 transition-opacity active:scale-95">Cancel</button>
                        <span className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight">
                            Manage Booking
                        </span>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="font-black text-[#7C3AED] dark:text-violet-400 text-[17px] hover:opacity-70 transition-opacity disabled:opacity-50 active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 pt-2">

                    {/* Client Header Card */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-white/5 p-6 mb-4 flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Client Name</p>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    className="w-full text-base font-black text-gray-900 dark:text-white tracking-tight bg-transparent outline-none border-b border-transparent focus:border-violet-500/30 transition-colors"
                                    placeholder="Client Name"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Email</p>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={e => setClientEmail(e.target.value)}
                                    className="w-full text-sm font-bold text-gray-500 dark:text-gray-400 bg-transparent outline-none border-b border-transparent focus:border-violet-500/30 transition-colors"
                                    placeholder="Email Address"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={e => setClientPhone(e.target.value)}
                                    className="w-full text-sm font-bold text-gray-400 bg-transparent outline-none border-b border-transparent focus:border-violet-500/30 transition-colors"
                                    placeholder="Phone Number"
                                />
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${appointment.status === 'CONFIRMED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                            {appointment.status}
                        </div>
                    </div>

                    {/* Service Info */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-white/5 p-4 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] dark:bg-violet-500/20 flex items-center justify-center text-[#7C3AED] dark:text-violet-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</p>
                            <p className="text-sm font-bold text-[#7C3AED] dark:text-violet-400">
                                {appointment.serviceName || services.find(s => s.id === appointment.serviceId)?.name || 'Unknown Service'}
                                {appointment.price && <span className="text-gray-400 ml-2 font-medium">(${appointment.price})</span>}
                            </p>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-white/5 overflow-hidden divide-y divide-gray-50 dark:divide-white/5 mb-4">
                        <div className="p-5 flex justify-between items-center group relative cursor-pointer active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                            <select
                                value={staffId}
                                onChange={e => setStaffId(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                            >
                                {staff.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">{s.name}</option>)}
                            </select>
                            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">STAFF MEMBER</span>
                            <div className="flex items-center gap-2 pointer-events-none">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{staff.find(s => s.id === staffId)?.name || 'Select'}</span>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>

                        <div className="p-5 flex justify-between items-center group relative cursor-pointer active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                            />
                            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">DATE</span>
                            <div className="flex items-center gap-2 pointer-events-none">
                                <span className="text-sm font-bold text-[#7C3AED] dark:text-violet-400">
                                    {date ? (() => {
                                        const [y, m, d] = date.split('-').map(Number);
                                        return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })() : 'Select'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>

                        <div className="p-5 flex justify-between items-center group relative cursor-pointer active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                            <select
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                            >
                                {(() => {
                                    if (!date) return <option disabled className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">Select date first</option>;
                                    try {
                                        const [y, m, d] = date.split('-').map(Number);
                                        const localDate = new Date(y, m - 1, d);
                                        const dayName = format(localDate, 'EEEE').toLowerCase();
                                        const hours = businessHours?.[dayName];
                                        const isHoliday = holidays.includes(date);

                                        if (isHoliday || !hours || !hours.isOpen) return <option disabled className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">{isHoliday ? 'Holiday Closure' : 'Closed'}</option>;

                                        const start = parseInt(hours.open.split(':')[0]) * 60 + parseInt(hours.open.split(':')[1]);
                                        const end = parseInt(hours.close.split(':')[0]) * 60 + parseInt(hours.close.split(':')[1]);
                                        const interval = slotInterval || 30;

                                        const options = [];
                                        for (let i = start; i < end; i += interval) {
                                            const h = Math.floor(i / 60);
                                            const m = i % 60;
                                            const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                            options.push(<option key={t} value={t} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">{getDisplayTime(t)}</option>);
                                        }
                                        return options;
                                    } catch (e) {
                                        return <option disabled className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">Error loading times</option>;
                                    }
                                })()}
                            </select>
                            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">TIME</span>
                            <div className="flex items-center gap-2 pointer-events-none">
                                <span className="text-sm font-bold text-[#7C3AED] dark:text-violet-400">{time ? getDisplayTime(time) : 'Select'}</span>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    </div>

                    {/* Notes & Intake Section */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-white/5 p-5 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-violet-500" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intake Form & Notes</p>
                        </div>

                        {notes.includes(':') ? (
                            <div className="space-y-3 mb-4">
                                {notes.split('\n\nAdditional Notes:\n')[0].split('\n').map((line, idx) => {
                                    const [label, ...val] = line.split(': ');
                                    if (val.length === 0) return <p key={idx} className="text-sm font-bold text-gray-900 dark:text-white">{line}</p>;
                                    return (
                                        <div key={idx} className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-violet-500 uppercase tracking-tight mb-0.5">{label}</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{val.join(': ')}</p>
                                        </div>
                                    );
                                })}
                                {notes.includes('Additional Notes:\n') && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-2">Additional Comments</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                                            {notes.split('Additional Notes:\n')[1]}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <textarea
                                placeholder="Add notes or special requests..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full h-24 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50/50 dark:bg-black/20 rounded-2xl p-4 outline-none resize-none border border-gray-100 dark:border-white/5"
                            ></textarea>
                        )}

                        {/* Admin Internal Notes (Optional placeholder for future) */}
                        <div className="mt-4 flex items-center gap-2 px-1">
                            <Info className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Staff Tip: Intake data is immutable.</span>
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-5 mb-4 text-center border border-white dark:border-white/5 shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Moving this appointment will free up the original slot.
                            <br />
                            Use "Block Time" if you want to keep both closed.
                        </p>
                    </div>

                    {/* Critical Actions */}
                    {appointment.status !== 'CANCELLED' && (
                        <div className="bg-white dark:bg-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-white/5 overflow-hidden">
                            <button
                                onClick={handleCancelApt}
                                className="w-full p-4 text-[17px] font-normal text-red-600 dark:text-red-400 active:bg-gray-50 dark:active:bg-white/10 transition-colors text-center"
                            >
                                {(appointment.clientName === 'Blocked Time' || appointment.status === 'BLOCKED') ? 'Unblock Time' : 'Cancel Booking'}
                            </button>
                        </div>
                    )}

                    {appointment.status === 'CANCELLED' && (
                        <div className="space-y-3">
                            <Button onClick={handleRestoreApt} disabled={isLoading} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uncancel Booking'}
                            </Button>
                            <button
                                onClick={handleArchiveApt}
                                className="w-full py-4 text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                Archive (Hide)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
