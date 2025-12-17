import React from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationViewProps {
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: Date;
    selectedTime: string | null;
    onReset: () => void;
}

import { addMinutes } from 'date-fns';

export default function ConfirmationView({
    selectedService,
    selectedStaff,
    selectedDate,
    selectedTime,
    onReset
}: ConfirmationViewProps) {

    // Generate Google Calendar Link
    const googleCalendarLink = React.useMemo(() => {
        if (!selectedService || !selectedDate || !selectedTime) return '#';

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes);

        const endDate = addMinutes(startDate, selectedService.durationMinutes);

        const formatGCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const start = formatGCalDate(startDate);
        const end = formatGCalDate(endDate);

        const details = `Appointment with ${selectedStaff?.name} for ${selectedService.name}`;

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedService.name)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
    }, [selectedService, selectedStaff, selectedDate, selectedTime]);

    return (
        <div className="min-h-[600px] flex items-center justify-center">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-12 text-center animate-in fade-in zoom-in duration-500 border border-gray-100">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Booking Confirmed!</h2>
                <p className="text-gray-500 mb-10 text-lg leading-relaxed">
                    Your appointment for <span className="font-bold text-gray-900">{selectedService?.name}</span> with <span className="font-bold text-gray-900">{selectedStaff?.name}</span> has been scheduled.
                </p>

                <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-800 font-medium">
                        <CalendarIcon className="w-5 h-5 text-primary-600" />
                        {format(selectedDate, 'MMMM do, yyyy')} at {selectedTime}
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        size="lg"
                        onClick={() => window.open(googleCalendarLink, '_blank')}
                        className="w-full gap-2"
                    >
                        <CalendarIcon className="w-4 h-4" /> Add to Google Calendar
                    </Button>

                    <button
                        onClick={onReset}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors py-2"
                    >
                        Book Another Appointment
                    </button>
                </div>
            </div>
        </div>
    );
}
