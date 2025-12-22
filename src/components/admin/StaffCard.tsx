import React from 'react';
import { Staff, Service } from '@/types';
import { Clock, Mail, Scissors, Edit2, Trash2, Calendar, Star, TrendingUp } from 'lucide-react';

interface StaffCardProps {
    staff: Staff;
    services: Service[];
    onEdit: (staff: Staff) => void;
    onSchedule: (staff: Staff) => void;
    onDelete: (staff: Staff) => void;
    appointmentCount?: number;
}

export default function StaffCard({ staff, services, onEdit, onSchedule, onDelete, appointmentCount = 0 }: StaffCardProps) {
    const hasAvatar = staff.avatar && staff.avatar.trim() !== '';
    const specialtyServices = services.filter(s => staff.specialties.includes(s.id));

    // Generate gradient based on name for consistency
    const getGradient = (name: string) => {
        const gradients = [
            'from-blue-500 to-purple-600',
            'from-green-500 to-teal-600',
            'from-orange-500 to-pink-600',
            'from-indigo-500 to-blue-600',
            'from-red-500 to-orange-600',
            'from-purple-500 to-pink-600',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            {/* Header with Avatar */}
            <div className={`relative h-32 bg-gradient-to-br ${getGradient(staff.name)}`}>
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />

                {/* Avatar */}
                <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                        {hasAvatar ? (
                            <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getGradient(staff.name)} flex items-center justify-center`}>
                                <span className="text-3xl font-bold text-white">
                                    {staff.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Badge */}
                {appointmentCount > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-bold text-gray-900">{appointmentCount} bookings</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pt-14 px-6 pb-6 space-y-4">
                {/* Name & Role */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {staff.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                        {staff.role || 'Team Member'}
                    </p>
                </div>

                {/* Email */}
                {staff.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{staff.email}</span>
                    </div>
                )}

                {/* Specialties */}
                {specialtyServices.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Scissors className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Specialties
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {specialtyServices.slice(0, 3).map(service => (
                                <span
                                    key={service.id}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                                >
                                    {service.name}
                                </span>
                            ))}
                            {specialtyServices.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    +{specialtyServices.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* No Specialties Message */}
                {specialtyServices.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                        <Scissors className="w-3.5 h-3.5" />
                        No services assigned yet
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => onEdit(staff)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => onSchedule(staff)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 rounded-lg font-medium text-sm hover:bg-green-100 transition-colors"
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </button>
                </div>

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(staff)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove from Team
                </button>
            </div>
        </div>
    );
}
