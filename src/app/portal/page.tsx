'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAppointmentsByEmail, cancelAppointment } from '@/services/dataService';
import { Appointment } from '@/types';
import { Calendar, Clock, MapPin, XCircle, Search, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function PortalContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-search if email is present in URL
    React.useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail && !hasSearched) {
            handleSearch(null, urlEmail);
        }
    }, [searchParams]);

    const handleSearch = async (e: React.FormEvent | null, specificEmail?: string) => {
        if (e) e.preventDefault();
        const emailToSearch = specificEmail || email;

        setIsLoading(true);
        try {
            const data = await getAppointmentsByEmail(emailToSearch);
            setAppointments(data);
            setHasSearched(true);
            if (specificEmail) setEmail(specificEmail);
        } catch (error) {
            console.error(error);
            alert("Failed to find bookings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (aptId: string) => {
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

        try {
            await cancelAppointment(aptId);
            // Refresh list
            const data = await getAppointmentsByEmail(email);
            setAppointments(data);
            alert('Booking cancelled.');
        } catch (error) {
            alert('Failed to cancel booking.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">My Bookings</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email to view your upcoming appointments.
                    </p>
                </div>

                {/* Email Search Form */}
                <form className="mt-8 space-y-6" onSubmit={(e) => handleSearch(e)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter your email address"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-primary-500 group-hover:text-primary-400" aria-hidden="true" />
                            </span>
                            Find Bookings
                        </Button>
                    </div>
                </form>

                {/* Results List */}
                {hasSearched && (
                    <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {appointments.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-200">
                                <p className="text-gray-500">No upcoming bookings found for {email}.</p>
                            </div>
                        ) : (
                            appointments.map((apt) => (
                                <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{apt.timeSlot}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-4 h-4" /> {new Date(apt.date).toDateString()}
                                            </p>
                                        </div>
                                        {apt.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Service</p>
                                            {/* In a real app we'd fetch the service name, for now MVP apt list might have missing joins */}
                                            <p className="text-sm font-medium text-gray-900">Service Appointment</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Provider</p>
                                            <p className="text-sm font-medium text-gray-900">Staff Member</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ClientPortalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PortalContent />
        </Suspense>
    );
}
