import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, Ban } from 'lucide-react';
import { Staff, Availability } from '@/types';
import { format, parseISO } from 'date-fns';

interface StaffScheduleViewerProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff;
    availability: Availability[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffScheduleViewer({ isOpen, onClose, staff, availability }: StaffScheduleViewerProps) {
    if (!isOpen) return null;

    // Helper to get rule for a day
    const getDayRule = (dayIndex: number) => {
        return availability.find(a => a.dayOfWeek === dayIndex);
    };

    // Helper to format time to 12h
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        // Handle "HH:mm:ss" or "HH:mm"
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return format(date, 'h:mm a');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-card rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    Weekly Schedule
                                </h2>
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 pl-1">
                                Viewing availablity for <span className="text-gray-900 dark:text-white font-bold">{staff.name}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Schedule List */}
                    <div className="p-6 space-y-3">
                        {DAYS.map((day, index) => {
                            const rule = getDayRule(index);
                            const isWorking = rule?.isWorking ?? false;

                            return (
                                <div
                                    key={day}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isWorking
                                        ? 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10'
                                        : 'bg-gray-50 dark:bg-white/5 border-transparent opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isWorking
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {day.substring(0, 3)}
                                        </div>
                                        <span className={`text-sm font-bold ${isWorking ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {day}
                                        </span>
                                    </div>

                                    {isWorking ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800/30">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>
                                                {formatTime(rule?.startTime || '')} - {formatTime(rule?.endTime || '')}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Ban className="w-3.5 h-3.5" />
                                            Off
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 pt-0">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
