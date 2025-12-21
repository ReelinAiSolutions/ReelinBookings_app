import React, { useState, useMemo } from 'react';
import { Appointment, Service, Organization } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface RescheduleModalProps {
    isOpen: boolean;
    appointment: Appointment | null;
    onClose: () => void;
    onReschedule: (id: string, newDate: string, newTime: string) => Promise<void>;
    onCancel: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    onArchive?: (id: string) => Promise<void>;
    services: Service[];
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
    businessHours
}: RescheduleModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize state when opening
    React.useEffect(() => {
        if (appointment) {
            setDate(appointment.date);
            setTime(appointment.timeSlot);
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onReschedule(appointment.id, date, time);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900">Manage Appointment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Client</div>
                        <div className="text-lg font-bold text-gray-900">{appointment.clientName}</div>
                        <div className="text-sm font-medium text-primary-600 mb-1">
                            {services.find(s => s.id === appointment.serviceId)?.name || 'Unknown Service'}
                        </div>
                        <div className="text-sm text-gray-600">{appointment.clientEmail}</div>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {appointment.status || 'CONFIRMED'}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <select
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="" disabled>Select Time</option>
                                    {(() => {
                                        // 1. Determine Day of Week from selected Date
                                        if (!date) return <option disabled>Select date first</option>;

                                        // Safe local parsing for Day Index
                                        const [y, m, d] = date.split('-').map(Number);
                                        const localDate = new Date(y, m - 1, d);
                                        const dayName = format(localDate, 'EEEE').toLowerCase();

                                        const hours = businessHours?.[dayName];
                                        if (!hours || !hours.isOpen) {
                                            return <option disabled>Closed on this day</option>;
                                        }

                                        // 2. Determine Start/End Minutes
                                        const toMinutes = (t: string) => {
                                            const [hh, mm] = t.split(':').map(Number);
                                            return hh * 60 + mm;
                                        };
                                        const fromTime = (mins: number) => {
                                            const hh = Math.floor(mins / 60);
                                            const mm = mins % 60;
                                            return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
                                        };

                                        const startMins = toMinutes(hours.open);
                                        // Round close time down to last valid slot? 
                                        // Usually "close" is when shop shuts. Last appointment logic is tricky.
                                        // We'll show slots up until (Close - Interval) or simple Close if 0 duration.
                                        // For rescheduling, let's show all starts < Close.
                                        const endMins = toMinutes(hours.close);
                                        const interval = slotInterval || 30;

                                        const options = [];
                                        for (let m = startMins; m < endMins; m += interval) {
                                            const tStr = fromTime(m);
                                            options.push(
                                                <option key={tStr} value={tStr}>
                                                    {tStr}
                                                </option>
                                            );
                                        }
                                        return options;
                                    })()}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg">
                        <strong>Note:</strong> Moving this appointment will free up the original slot. Use "Block Time" if you want to keep both closed.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                    {appointment.status === 'CANCELLED' ? (
                        <div className="flex justify-between w-full">
                            <button
                                onClick={handleArchiveApt}
                                className="text-gray-600 text-sm font-medium hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                                disabled={isLoading}
                            >
                                Confirm Cancel (Hide)
                            </button>
                            <Button onClick={handleRestoreApt} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uncancel Booking'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full items-center">
                            <button
                                onClick={handleCancelApt}
                                className="text-red-600 text-sm font-medium hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                disabled={isLoading}
                            >
                                Cancel Booking
                            </button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} disabled={isLoading}>Close</Button>
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Move'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
