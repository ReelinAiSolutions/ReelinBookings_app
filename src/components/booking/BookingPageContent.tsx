'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { getOrganizationBySlug, getServices, getStaff, createAppointment, getTimeSlots } from '@/services/dataService';
import { Service, Staff, TimeSlot } from '@/types';
import { startOfToday, format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
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
    // Selection State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    // Initialize to null to match server rendering (hydration fix)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Map time slots to available staff IDs for "Any Professional" logic
    const [slotsStaffMap, setSlotsStaffMap] = useState<Record<string, string[]>>({});

    const [isBooking, setIsBooking] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);

    const searchParams = useSearchParams();
    const isEmbed = searchParams.get('mode') === 'embed';

    const [guestInfo, setGuestInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

    // Initialize Date on Client Only
    useEffect(() => {
        setSelectedDate(startOfToday());

        // Check for Smart Guest Info
        const savedGuest = localStorage.getItem('reelin_guest_info');
        if (savedGuest) {
            try {
                setGuestInfo(JSON.parse(savedGuest));
            } catch (e) {
                console.error("Failed to parse saved guest info");
            }
        }
    }, []);

    // Get theme from URL parameter (more reliable than postMessage)
    const theme = searchParams.get('theme') || 'light';
    const isDarkTheme = theme === 'dark';


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

        console.log("Filtering Staff:", {
            serviceId: selectedService.id,
            totalStaff: staffMembers.length,
            staffSpecialties: staffMembers.map(s => ({ name: s.name, specialties: s.specialties }))
        });

        const filtered = staffMembers.filter(staff =>
            staff.specialties?.some(sId => String(sId) === String(selectedService.id))
        );

        console.log("Filtered Result:", filtered.map(s => s.name));
        return filtered;
    }, [selectedService, staffMembers]);

    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Load Available Slots when Date/Staff changes
    useEffect(() => {
        const loadSlots = async () => {
            if (!selectedStaff || !selectedDate || !selectedService || !org) return;

            // Reset time if date changes
            setSelectedTime(null);
            setSlotsStaffMap({});
            setRealTimeSlots([]); // Clear stale slots immediately
            setIsLoadingSlots(true);

            try {
                // HANDLE "ANY PROFESSIONAL" SELECTION
                if (selectedStaff.id === 'any') {
                    // Fetch slots for ALL eligible staff in parallel
                    const allStaffSlots = await Promise.all(
                        availableStaff.map(async (staff) => {
                            try {
                                const slots = await getTimeSlots(
                                    staff.id,
                                    selectedDate,
                                    selectedService.durationMinutes,
                                    org.id
                                );
                                return { staffId: staff.id, slots };
                            } catch (e) {
                                return { staffId: staff.id, slots: [] };
                            }
                        })
                    );

                    // Aggregation Logic:
                    // 1. Collect all unique time strings that are available.
                    // 2. Map Time -> [Staff IDs]
                    const timeMap: Record<string, string[]> = {};
                    const uniqueTimeSlots: Set<string> = new Set();

                    allStaffSlots.forEach(({ staffId, slots }) => {
                        slots.forEach(slot => {
                            if (slot.available) {
                                uniqueTimeSlots.add(slot.time);
                                if (!timeMap[slot.time]) {
                                    timeMap[slot.time] = [];
                                }
                                timeMap[slot.time].push(staffId);
                            }
                        });
                    });

                    // Convert to TimeSlot array and sort
                    const aggregatedSlots: TimeSlot[] = Array.from(uniqueTimeSlots)
                        .sort()
                        .map(time => ({ time, available: true }));

                    setRealTimeSlots(aggregatedSlots);
                    setSlotsStaffMap(timeMap);

                } else {
                    // HANDLE SPECIFIC STAFF SELECTION
                    const slots = await getTimeSlots(
                        selectedStaff.id,
                        selectedDate,
                        selectedService.durationMinutes,
                        org.id
                    );
                    setRealTimeSlots(slots);
                }
            } catch (error) {
                console.error("Error fetching slots", error);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        loadSlots();
    }, [selectedDate, selectedStaff, selectedService, org, availableStaff]);

    const availableTimeSlots = useMemo(() => {
        return realTimeSlots;
    }, [realTimeSlots]);

    // Scroll to top on step change - focusing on content
    useEffect(() => {
        const element = document.getElementById('booking-scroll-anchor');
        if (element) {
            // Scroll to the anchor with a slight offset for better visual alignment
            const y = element.getBoundingClientRect().top + window.scrollY - 20;
            window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    const handleBook = async (formData: any) => {
        if (!selectedService || !selectedStaff || !selectedTime || !org || !selectedDate) return;

        setIsBooking(true);
        try {
            // FIX: Use format(date, 'yyyy-MM-dd') to strictly preserve the selected usage date
            const dateString = format(selectedDate, 'yyyy-MM-dd');

            // Determine final staff ID
            let finalStaffId = selectedStaff.id;
            let finalStaffName = selectedStaff.name;

            // If "Any" was selected, pick an available staff member for this slot
            if (selectedStaff.id === 'any') {
                const possibleStaffIds = slotsStaffMap[selectedTime] || [];
                if (possibleStaffIds.length === 0) {
                    throw new Error("No staff available for this time slot.");
                }
                // Naive assignment: Randomly pick one to distribute load (or pick first)
                const randomIndex = Math.floor(Math.random() * possibleStaffIds.length);
                finalStaffId = possibleStaffIds[randomIndex];

                // Find name for email/confirmation
                const allocatedStaff = staffMembers.find(s => s.id === finalStaffId);
                if (allocatedStaff) {
                    finalStaffName = allocatedStaff.name;
                }
            }

            await createAppointment({
                serviceId: selectedService.id,
                staffId: finalStaffId,
                clientId: 'c_temp_user',
                clientName: formData.name,
                clientEmail: formData.email,
                notes: formData.notes,
                date: dateString,
                timeSlot: selectedTime,
                status: 'CONFIRMED'
            } as any, org.id);

            // Save Smart Guest Info
            localStorage.setItem('reelin_guest_info', JSON.stringify({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            }));

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
                                <p>Your appointment for <strong>${selectedService.name}</strong> with <strong>${finalStaffName}</strong> is confirmed.</p>
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
                toast("Booking confirmed, but email failed to send. Please save your confirmation details.", "error"); // Using error style for visibility
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

    if (isLoadingOrg) {
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
                selectedDate={selectedDate!}
                selectedTime={selectedTime}
                onReset={resetBooking}
            />
        );
    }

    return (
        <div className={`min-h-screen w-full relative transition-colors duration-500 selection:bg-primary-500/30 ${isDarkTheme ? 'bg-black' : 'bg-gray-50/50'}`}>

            {/* Ambient Background Mesh Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
            </div>

            <div className="mx-auto py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
                {/* Hero Header - Now visible in Embed Mode to match user desire */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {org.logo_url && (
                        <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 group perspective-1000">
                            {/* Core Glow */}
                            <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>

                            {/* Secondary Ring Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>

                            <img
                                src={org.logo_url}
                                alt={org.name + ' Logo'}
                                className="relative h-full w-full object-contain drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                    )}
                    <h1 className={`text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-sm ${isDarkTheme ? 'text-white' : 'text-gray-900'
                        }`}>
                        {org.name}
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        Book your next premium experience.
                    </p>

                    <div id="booking-scroll-anchor" className="flex flex-col lg:flex-row gap-8 items-start scroll-mt-6">
                        {/* Desktop Sidebar - Hidden in Embed if desired, but usually needed for steps. Let's keep steps. */}
                        <div className="hidden lg:block w-72 flex-shrink-0 sticky top-8">
                            <WizardStepIndicator currentStep={currentStep} steps={STEPS} />
                        </div>

                        <div className="flex-1 w-full" style={{ '--primary-color': org.primary_color || '#4F46E5' } as React.CSSProperties}>
                            {/* Public Contact Info Bar - Hidden in Embed Mode */}
                            {!isEmbed && (org.phone || org.email || org.address || org.website) && (
                                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm font-medium text-gray-500 mb-8 border-b border-gray-100 pb-8">
                                    {org.phone && (
                                        <div className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                                            <Phone className="w-4 h-4 text-primary-500" />
                                            <span>{org.phone}</span>
                                        </div>
                                    )}
                                    {org.email && (
                                        <div className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                                            <Mail className="w-4 h-4 text-primary-500" />
                                            <span>{org.email}</span>
                                        </div>
                                    )}
                                    {org.address && (
                                        <div className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                                            <MapPin className="w-4 h-4 text-primary-500" />
                                            <span>{org.address}</span>
                                        </div>
                                    )}
                                    {org.website && (
                                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-600 hover:underline transition-colors">
                                            <Globe className="w-4 h-4 text-primary-500" />
                                            <span>Website</span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Mobile Header */}
                            <div className="lg:hidden mb-6">
                                <WizardStepIndicator currentStep={currentStep} steps={STEPS} />
                            </div>

                            {/* Main Content Area - Glassmorphism */}
                            <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-gray-900/5 border border-white/50 overflow-visible md:overflow-hidden min-h-[600px] flex flex-col relative transition-all duration-300 ring-1 ring-gray-900/5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="flex-1 flex flex-col p-1"
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
                                                onSelectDate={(date) => {
                                                    setSelectedDate(date);
                                                    setSelectedTime(null);
                                                }}
                                                selectedTime={selectedTime}
                                                onSelectTime={setSelectedTime}
                                                timeSlots={availableTimeSlots}
                                                onBack={() => setCurrentStep(BookingStep.STAFF)}
                                                onNext={() => setCurrentStep(BookingStep.SUMMARY)}
                                                isLoading={isLoadingSlots}
                                            />
                                        )}

                                        {currentStep === BookingStep.SUMMARY && selectedDate && (
                                            <BookingSummary
                                                selectedService={selectedService}
                                                selectedStaff={selectedStaff}
                                                selectedDate={selectedDate}
                                                selectedTime={selectedTime}
                                                onBack={() => setCurrentStep(BookingStep.DATE)}
                                                onConfirm={handleBook}
                                                isBooking={isBooking}
                                                initialGuestData={guestInfo}
                                                orgAddress={org.address}
                                                termsUrl={org.terms_url}
                                                policyUrl={org.policy_url}
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
