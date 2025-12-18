'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { getOrganizationBySlug, getServices, getStaff, createAppointment, getTimeSlots } from '@/services/dataService';
import { Service, Staff, TimeSlot } from '@/types';
import { startOfToday } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import ServiceSelection from '@/components/booking/ServiceSelection';
import StaffSelection from '@/components/booking/StaffSelection';
import DateSelection from '@/components/booking/DateSelection';
import BookingSummary from '@/components/booking/BookingSummary';
import ConfirmationView from '@/components/booking/ConfirmationView';

enum BookingStep {
    SERVICE = 0,
    STAFF = 1,
    DATE = 2,
    SUMMARY = 3,
    CONFIRMATION = 4
}

const STEPS = [
    { id: BookingStep.SERVICE, label: 'Service', desc: 'Choose a service' },
    { id: BookingStep.STAFF, label: 'Professional', desc: 'Select staff' },
    { id: BookingStep.DATE, label: 'Schedule', desc: 'Pick a date' },
    { id: BookingStep.SUMMARY, label: 'Confirm', desc: 'Review booking' }
];

export default function BookingPageContent({ slug }: { slug: string }) {
    const [org, setOrg] = useState<any>(null);
    const [isLoadingOrg, setIsLoadingOrg] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE);
    const [services, setServices] = useState<Service[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [realTimeSlots, setRealTimeSlots] = useState<TimeSlot[]>([]);

    // Selection State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    // Initialize to null to match server rendering (hydration fix)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [isBooking, setIsBooking] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);

    const searchParams = useSearchParams();
    const isEmbed = searchParams.get('mode') === 'embed';

    // Initialize Date on Client Only
    useEffect(() => {
        setSelectedDate(startOfToday());
    }, []);

    // Load Organization & Data
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingOrg(true);
            try {
                const orgData = await getOrganizationBySlug(slug);

                if (orgData) {
                    setOrg(orgData);
                    const [loadedServices, loadedStaff] = await Promise.all([
                        getServices(orgData.id),
                        getStaff(orgData.id)
                    ]);
                    setServices(loadedServices);
                    setStaffMembers(loadedStaff);
                } else {
                    setError("Organization not found.");
                }
            } catch (err) {
                console.error("Failed to load organization data", err);
                setError("Failed to load booking data.");
            } finally {
                setIsLoadingOrg(false);
            }
        };
        loadData();
    }, [slug]);

    // Filter staff based on selected service
    const availableStaff = useMemo(() => {
        if (!selectedService) return [];
        return staffMembers.filter(staff =>
            staff.specialties.includes(selectedService.id)
        );
    }, [selectedService, staffMembers]);

    // Load Available Slots when Date/Staff changes
    useEffect(() => {
        const loadSlots = async () => {
            if (!selectedStaff || !selectedDate) return;

            // Reset time if date changes
            setSelectedTime(null);

            const slots = await getTimeSlots(selectedStaff.id, selectedDate);
            setRealTimeSlots(slots);
        };
        loadSlots();
    }, [selectedDate, selectedStaff]);

    const availableTimeSlots = useMemo(() => {
        return realTimeSlots;
    }, [realTimeSlots]);

    const handleBook = async (formData: any) => {
        if (!selectedService || !selectedStaff || !selectedTime || !org || !selectedDate) return;

        setIsBooking(true);
        try {
            await createAppointment({
                serviceId: selectedService.id,
                staffId: selectedStaff.id,
                clientId: 'c_temp_user',
                clientName: formData.name,
                clientEmail: formData.email,
                date: selectedDate.toISOString().split('T')[0],
                timeSlot: selectedTime,
                status: 'CONFIRMED'
            } as any, org.id);

            // Send Confirmation Email
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formData.email, // Use real client email
                        ownerEmail: org.email || 'info@reelin.ca', // The Business Owner
                        subject: `Booking Confirmed: ${selectedService.name} at ${org.name}`,
                        html: `
                            <div style="font-family: sans-serif; color: #333;">
                                <h1>Booking Confirmed</h1>
                                <p>Hi ${formData.name.split(' ')[0]},</p>
                                <p>Your appointment for <strong>${selectedService.name}</strong> with <strong>${selectedStaff.name}</strong> is confirmed.</p>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Date:</strong> ${selectedDate.toDateString()}</p>
                                    <p style="margin: 5px 0;"><strong>Time:</strong> ${selectedTime}</p>
                                    <p style="margin: 5px 0;"><strong>Location:</strong> ${org.name}</p>
                                </div>
                                <div style="margin-top: 30px; text-align: center;">
                                    <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/portal?email=${encodeURIComponent(formData.email)}" 
                                       style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                       Manage Appointment
                                    </a>
                                </div>
                                <p style="margin-top: 20px; font-size: 12px; color: #888;">Need to cancel? Click the button above.</p>
                            </div>
                        `
                    })
                });
            } catch (emailError) {
                console.error("Failed to send email", emailError);
            }

            setBookingComplete(true);
        } catch (error) {
            console.error("Booking failed", error);
            toast("Failed to book appointment. Please try again.", "error");
        } finally {
            setIsBooking(false);
        }
    };

    const resetBooking = () => {
        setBookingComplete(false);
        setCurrentStep(BookingStep.SERVICE);
        setSelectedService(null);
        setSelectedStaff(null);
        // Reset date to client-side today
        setSelectedDate(startOfToday());
        setSelectedTime(null);
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setCurrentStep(BookingStep.STAFF);
    };

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    if (isLoadingOrg || !selectedDate) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Hero Skeleton */}
                <div className="flex flex-col items-center mb-12 space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <Skeleton className="h-6 w-48 rounded-lg" />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Skeleton */}
                    <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="flex-1 w-full bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!org) {
        return <div className="min-h-screen flex items-center justify-center">Business not found. Check the URL.</div>;
    }

    if (bookingComplete) {
        return (
            <ConfirmationView
                selectedService={selectedService}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onReset={resetBooking}
            />
        );
    }

    return (
        <div className={`mx-auto py-12 px-4 sm:px-6 lg:px-8 ${isEmbed ? 'max-w-full py-0 px-0' : 'max-w-6xl'}`}>
            {/* Hero Header - Hidden in Embed Mode */}
            {!isEmbed && (
                <div className="text-center mb-12">
                    {org.logo_url && (
                        <img
                            src={org.logo_url}
                            alt={org.name + ' Logo'}
                            className="h-24 mx-auto mb-6 object-contain"
                        />
                    )}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        {org.name}
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Book your next experience with us.
                    </p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Desktop Sidebar - Hidden in Embed if desired, but usually needed for steps. Let's keep steps. */}
                <div className="hidden lg:block w-64 flex-shrink-0">
                    <WizardStepIndicator currentStep={currentStep} steps={STEPS} />
                </div>

                <div className="flex-1 w-full" style={{ '--primary-color': org.primary_color || '#4F46E5' } as React.CSSProperties}>
                    {/* Public Contact Info Bar - Hidden in Embed Mode */}
                    {!isEmbed && (org.phone || org.email || org.address || org.website) && (
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
                            {org.phone && <span>{org.phone}</span>}
                            {org.email && <span>{org.email}</span>}
                            {org.address && <span>{org.address}</span>}
                            {org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">Website</a>}
                        </div>
                    )}

                    {/* Mobile Header */}
                    <div className="lg:hidden mb-6">
                        <WizardStepIndicator currentStep={currentStep} steps={STEPS} />
                    </div>

                    {/* Main Content Area */}
                    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex flex-col"
                            >
                                {currentStep === BookingStep.SERVICE && (
                                    <ServiceSelection
                                        services={services}
                                        onSelect={handleServiceSelect}
                                    />
                                )}

                                {currentStep === BookingStep.STAFF && (
                                    <StaffSelection
                                        staffMembers={availableStaff}
                                        onSelect={(staff) => { setSelectedStaff(staff); setCurrentStep(BookingStep.DATE); }}
                                        onSelectAny={() => { setSelectedStaff({ id: 'any', name: 'Any Professional', role: '', specialties: [], avatar: '' }); setCurrentStep(BookingStep.DATE); }}
                                        onBack={() => setCurrentStep(BookingStep.SERVICE)}
                                    />
                                )}

                                {currentStep === BookingStep.DATE && (
                                    <DateSelection
                                        selectedDate={selectedDate}
                                        onSelectDate={setSelectedDate}
                                        selectedTime={selectedTime}
                                        onSelectTime={setSelectedTime}
                                        timeSlots={availableTimeSlots}
                                        onBack={() => setCurrentStep(BookingStep.STAFF)}
                                        onNext={() => setCurrentStep(BookingStep.SUMMARY)}
                                    />
                                )}

                                {currentStep === BookingStep.SUMMARY && (
                                    <BookingSummary
                                        selectedService={selectedService}
                                        selectedStaff={selectedStaff}
                                        selectedDate={selectedDate}
                                        selectedTime={selectedTime}
                                        onBack={() => setCurrentStep(BookingStep.DATE)}
                                        onConfirm={handleBook}
                                        isBooking={isBooking}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
