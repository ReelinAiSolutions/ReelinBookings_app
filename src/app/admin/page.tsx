'use client';

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import DashboardCharts from '@/components/admin/DashboardCharts';
import AppointmentList from '@/components/admin/AppointmentList';
import ServiceManager from '@/components/admin/ServiceManager';
import StaffManager from '@/components/admin/StaffManager';
import AIGenerator from '@/components/admin/AIGenerator';
import { getAppointments, getServices, getStaff, getCurrentUserOrganization, getOrganizationById } from '@/services/dataService';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const MOCK_STATS = [
    { name: 'Mon', bookings: 4, revenue: 240 },
    { name: 'Tue', bookings: 7, revenue: 525 },
    { name: 'Wed', bookings: 5, revenue: 410 },
    { name: 'Thu', bookings: 8, revenue: 650 },
    { name: 'Fri', bookings: 12, revenue: 980 },
    { name: 'Sat', bookings: 15, revenue: 1200 },
    { name: 'Sun', bookings: 9, revenue: 700 },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'services'>('overview');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, activeStaff: 0 });
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>(MOCK_STATS); // Fallback to mock for now until we write processor
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [orgSlug, setOrgSlug] = useState<string | null>(null);

    const loadDashboardData = async () => {
        const orgId = await getCurrentUserOrganization();
        if (!orgId) {
            // Not logged in or no org, redirect to login
            // In a real app we'd use a router push here, but doing it safely
            window.location.href = '/login?error=no_org';
            return;
        }
        setCurrentOrgId(orgId);

        // Parallel fetch with scoped Org ID
        const [fetchedApts, fetchedServices, fetchedStaff, fetchedOrg] = await Promise.all([
            getAppointments(orgId),
            getServices(orgId),
            getStaff(orgId),
            getOrganizationById(orgId)
        ]);

        setAppointments(fetchedApts);
        setServices(fetchedServices);
        setStaff(fetchedStaff);
        if (fetchedOrg) setOrgSlug(fetchedOrg.slug);

        // Calculate simple stats
        setStats({
            totalRevenue: fetchedApts.length * 50, // Mock revenue calc: $50 per booking avg
            totalBookings: fetchedApts.length,
            activeStaff: fetchedStaff.length
        });
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'services' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Services & AI
                    </button>
                    {orgSlug && (
                        <Link
                            href={`/${orgSlug}`}
                            target="_blank"
                            className="px-4 py-2 rounded-md text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                            View Live Page <ExternalLink className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>

            {
                activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <DashboardStats stats={stats} />
                        <DashboardCharts data={chartData} />
                        <AppointmentList appointments={appointments} />
                    </div>
                )
            }

            {
                activeTab === 'services' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {currentOrgId && (
                            <>
                                <ServiceManager
                                    services={services}
                                    orgId={currentOrgId}
                                    onRefresh={loadDashboardData}
                                />
                                {/* We can put StaffManager here too, or in its own tab. 
                                Let's put it next to services for now as they are related setup tasks. 
                            */}
                                <StaffManager
                                    staff={staff}
                                    services={services}
                                    orgId={currentOrgId}
                                    onRefresh={loadDashboardData}
                                />
                            </>
                        )}
                    </div>
                )
            }
        </div >
    );
}
