import React from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User as UserIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface BookingSummaryProps {
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: Date;
    selectedTime: string | null;
    onBack: () => void;
    onConfirm: (formData: any) => void;
    isBooking: boolean;
}

export default function BookingSummary({
    selectedService,
    selectedStaff,
    selectedDate,
    selectedTime,
    onBack,
    onConfirm,
    isBooking
}: BookingSummaryProps) {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    const handleConfirm = () => {
        if (!formData.name || !formData.email) {
            alert('Please enter your name and email to continue.');
            return;
        }
        onConfirm(formData);
    };

    return (
        <div className="p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Review Booking</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Information</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Special Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium resize-none"
                                    placeholder="Any specific requests?"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg shadow-gray-100/50 sticky top-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-6">Booking Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex gap-4 items-start">
                                <img src={selectedService?.imageUrl} alt={selectedService?.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                                <div>
                                    <p className="font-bold text-gray-900 leading-tight">{selectedService?.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">{selectedService?.durationMinutes} mins</p>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-4"></div>

                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium">{format(selectedDate, 'MMMM do, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium">{selectedTime}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium">{selectedStaff?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium">123 Main St, New York</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center mb-6">
                            <span className="font-medium text-gray-600">Total Price</span>
                            <span className="font-extrabold text-2xl text-gray-900">${selectedService?.price}</span>
                        </div>

                        <div className="hidden md:block">
                            <Button
                                onClick={handleConfirm}
                                className="w-full text-lg py-4 shadow-xl shadow-primary-600/20"
                                isLoading={isBooking}
                            >
                                Confirm Booking
                            </Button>
                        </div>

                        {/* Mobile Sticky Footer */}
                        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                            <Button
                                onClick={handleConfirm}
                                className="w-full text-lg py-4 shadow-xl shadow-primary-600/20"
                                isLoading={isBooking}
                            >
                                Confirm Booking
                            </Button>
                        </div>
                        {/* Mobile Spacer */}
                        <div className="md:hidden h-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
