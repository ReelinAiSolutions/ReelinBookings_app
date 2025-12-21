import React, { useState } from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { formatTime12Hour } from '@/lib/utils';

interface ConfirmationViewProps {
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: Date;
    selectedTime: string | null;
    onReset: () => void;
}

export default function ConfirmationView({
    selectedService,
    selectedStaff,
    selectedDate,
    selectedTime,
    onReset
}: ConfirmationViewProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Generate Calendar Links
    const links = React.useMemo(() => {
        if (!selectedService || !selectedDate || !selectedTime) return null;

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes);
        const endDate = addMinutes(startDate, selectedService.durationMinutes);

        const title = `${selectedService.name} with ${selectedStaff?.name}`;
        const description = `Appointment for ${selectedService.name} with ${selectedStaff?.name}.`;
        const location = "Studio"; // Or dynamic org address if available

        // Helpers
        const formatGCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        // 1. Google
        const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

        // 2. Outlook / Office 365
        const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

        // 3. Yahoo
        const st = format(startDate, 'yyyyMMdd\'T\'HHmmss');
        const et = format(endDate, 'yyyyMMdd\'T\'HHmmss');
        const yahoo = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(title)}&st=${st}&et=${et}&desc=${encodeURIComponent(description)}&in_loc=${encodeURIComponent(location)}`;

        // 4. ICS (Apple / Outlook Desktop)
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${formatGCalDate(startDate)}`,
            `DTEND:${formatGCalDate(endDate)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

        return { google, outlook, yahoo, icsUrl, icsFilename: 'appointment.ics' };
    }, [selectedService, selectedStaff, selectedDate, selectedTime]);

    const handleDownloadICS = () => {
        if (!links) return;
        const link = document.createElement('a');
        link.href = links.icsUrl;
        link.download = links.icsFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                        {format(selectedDate, 'MMMM do, yyyy')} at {formatTime12Hour(selectedTime)}
                    </div>
                </div>

                <div className="space-y-3 relative">
                    <div className="relative">
                        <Button
                            size="lg"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-full gap-2 relative z-10"
                        >
                            <CalendarIcon className="w-4 h-4" /> Add to Calendar
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </Button>

                        {isMenuOpen && links && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => window.open(links.google, '_blank')}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"
                                >
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Google Calendar
                                </button>
                                <button
                                    onClick={handleDownloadICS}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"
                                >
                                    <span className="w-2 h-2 rounded-full bg-gray-900"></span> Apple / Outlook (ICS)
                                </button>
                                <button
                                    onClick={() => window.open(links.outlook, '_blank')}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"
                                >
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Outlook.com
                                </button>
                                <button
                                    onClick={() => window.open(links.yahoo, '_blank')}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 transition-colors"
                                >
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Yahoo Calendar
                                </button>
                            </div>
                        )}

                        {/* Overlay to close menu when clicking outside */}
                        {isMenuOpen && (
                            <div className="fixed inset-0 z-0" onClick={() => setIsMenuOpen(false)}></div>
                        )}
                    </div>

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
