import React from 'react';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User as UserIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { formatTime12Hour } from '@/lib/utils';

interface BookingSummaryProps {
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: Date;
    selectedTime: string | null;
    onBack: () => void;
    onConfirm: (formData: any) => void;
    initialGuestData?: { name: string; email: string; phone: string } | null;
    isBooking?: boolean;
    orgAddress?: string;
    termsUrl?: string; // Added prop
    policyUrl?: string; // Added prop
}

export default function BookingSummary({
    selectedService,
    selectedStaff,
    selectedDate,
    selectedTime,
    onBack,
    onConfirm,
    isBooking,
    initialGuestData,
    orgAddress,
    termsUrl,
    policyUrl
}: BookingSummaryProps) {
    const [formData, setFormData] = React.useState({
        name: initialGuestData?.name || '',
        email: initialGuestData?.email || '',
        phone: initialGuestData?.phone || '',
        notes: ''
    });

    // If no terms exist, auto-agree (checkbox hidden)
    const hasTerms = !!(termsUrl || policyUrl);
    const [agreedToTerms, setAgreedToTerms] = React.useState(!hasTerms);

    const isAutoFilled = !!initialGuestData;

    const handleConfirm = () => {
        if (!formData.name || !formData.email) {
            alert('Please enter your name and email to continue.');
            return;
        }
        onConfirm(formData);
    };

    return (
        <div className="p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-10">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="p-3 -ml-3 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900 active:scale-95">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Review Booking</h2>
            </div>

            {isAutoFilled && (
                <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                            <UserIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <p className="text-sm text-primary-900 font-bold">Welcome back, {initialGuestData.name.split(' ')[0]}!</p>
                    </div>
                    <button
                        onClick={() => setFormData({ name: '', email: '', phone: '', notes: '' })}
                        className="text-xs text-primary-600 hover:text-primary-700 font-bold hover:underline px-2 py-1"
                    >
                        Not you?
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                    <div className="bg-gray-50 rounded-3xl p-5 md:p-8 border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Your Information</h3>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wide">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wide">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wide">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wide">Special Requests / Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition-all font-medium text-gray-900 shadow-sm placeholder:text-gray-300 min-h-[100px] resize-none"
                                    placeholder="Anything we should know? (Gate code, allergies, preferences...)"
                                />
                            </div>

                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 order-1 lg:order-2">
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden">


                        <h3 className="font-black text-gray-900 text-xl mb-4">Booking Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex gap-4 items-start">
                                {selectedService?.imageUrl ? (
                                    <img src={selectedService.imageUrl} alt={selectedService.name} className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shadow-sm" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 font-bold text-2xl">
                                        {selectedService?.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{selectedService?.name}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100">
                                        {selectedService?.durationMinutes} mins
                                    </span>
                                </div>
                            </div>

                            <div className="border-t-2 border-dashed border-gray-100"></div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="w-4 h-4 text-primary-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                                        <span className="text-sm font-bold text-gray-900">{format(selectedDate, 'MMM do')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-primary-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Time</span>
                                        <span className="text-sm font-bold text-gray-900">{formatTime12Hour(selectedTime)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4 text-primary-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Staff</span>
                                        <span className="text-sm font-bold text-gray-900">{selectedStaff?.name.split(' ')[0]}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-primary-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Location</span>
                                        <span className="text-sm font-bold text-gray-900 truncate max-w-[100px]">{orgAddress ? 'Studio' : 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-xl p-4 flex justify-between items-center mb-0 shadow-lg shadow-gray-200">
                            <span className="font-bold text-gray-400 text-sm">Total Price</span>
                            <span className="font-black text-2xl text-white tracking-tight">${selectedService?.price}</span>
                        </div>

                        {hasTerms && (
                            <div className="mt-6 mb-4 flex items-start gap-3 px-1">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="terms" className="text-xs text-gray-500 font-medium cursor-pointer select-none">
                                    I agree to the{' '}
                                    {termsUrl && (
                                        <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                            Terms of Service
                                        </a>
                                    )}
                                    {termsUrl && policyUrl && ' and '}
                                    {policyUrl && (
                                        <a href={policyUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                            Cancellation Policy
                                        </a>
                                    )}
                                    .
                                </label>
                            </div>
                        )}

                        <div className="hidden md:block mt-6">
                            <Button
                                onClick={handleConfirm}
                                disabled={!agreedToTerms || isBooking}
                                className={`w-full text-lg py-6 rounded-xl font-bold shadow-xl transition-all ${!agreedToTerms
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    : 'shadow-primary-900/20 hover:translate-y-[-2px]'}`}
                                isLoading={isBooking}
                            >
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer - Improved */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
                <Button
                    onClick={handleConfirm}
                    disabled={!agreedToTerms || isBooking}
                    className={`w-full text-lg py-6 rounded-2xl font-black shadow-2xl backdrop-blur-md border border-white/20 transition-all ${!agreedToTerms
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'shadow-primary-900/30'}`}
                    isLoading={isBooking}
                >
                    Confirm Booking
                </Button>
            </div>
        </div>
    );
}
