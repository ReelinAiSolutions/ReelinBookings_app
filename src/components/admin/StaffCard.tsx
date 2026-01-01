import React from 'react';
import { Staff, Service } from '@/types';
import { Mail, Scissors, Edit2, Trash2, Calendar, TrendingUp, MoreHorizontal, Clock } from 'lucide-react';

interface StaffCardProps {
    staff: Staff;
    services: Service[];
    onEdit?: (staff: Staff) => void;
    onSchedule?: (staff: Staff) => void;
    onDelete?: (staff: Staff) => void;
    appointmentCount?: number;
}

export default function StaffCard({ staff, services, onEdit, onSchedule, onDelete, appointmentCount = 0 }: StaffCardProps) {
    const hasAvatar = staff.avatar && staff.avatar.trim() !== '';
    const specialtyServices = services.filter(s => staff.specialties.includes(s.id));

    // Refined Apple-style gradients
    const getGradientStyle = (name: string) => {
        const gradients = [
            'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', // Soft Teal
            'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', // Soft Blue
            'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)', // Soft Orange/Purple
            'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', // Soft Purple/Blue
            'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', // Pink/Red
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return { background: gradients[index] };
    };

    return (
        <div className="group relative bg-white rounded-3xl border border-gray-100/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1">
            {/* Header Background */}
            <div className="h-28 relative overflow-hidden" style={getGradientStyle(staff.name)}>
                {/* Glass Texture Overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

                {/* Stats Badge - Floats on top right */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {appointmentCount > 0 && (
                        <div className="px-3 py-1.5 bg-white/30 backdrop-blur-md rounded-full border border-white/20 shadow-sm flex items-center gap-1.5 transition-transform group-hover:scale-105">
                            <TrendingUp className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={3} />
                            <span className="text-[11px] font-black text-white drop-shadow-sm tracking-wide">{appointmentCount} BOOKINGS</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar - Floating Overlap */}
            <div className="absolute top-14 left-6">
                <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white group-hover:scale-105 transition-transform duration-300 ease-out">
                    {hasAvatar ? (
                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                            <span className="text-2xl font-black">{staff.name.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="pt-10 px-6 pb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-[900] text-gray-900 leading-tight tracking-tight group-hover:text-[#007AFF] transition-colors">
                            {staff.name}
                        </h3>
                        <p className="text-sm font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
                            {staff.role || 'Team Member'}
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mb-6">
                    {/* Email */}
                    {staff.email && (
                        <div className="flex items-center gap-2.5 text-sm font-medium text-gray-500 bg-gray-50/50 p-2 rounded-lg group-hover:bg-gray-50 transition-colors">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{staff.email}</span>
                        </div>
                    )}

                    {/* Specialties Pills */}
                    <div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {specialtyServices.length > 0 ? (
                                <>
                                    {specialtyServices.slice(0, 3).map(service => (
                                        <span key={service.id} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-gray-200">
                                            {service.name}
                                        </span>
                                    ))}
                                    {specialtyServices.length > 3 && (
                                        <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-md border border-gray-100">
                                            +{specialtyServices.length - 3}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-xs font-medium text-gray-300 italic pl-1">No specialties assigned</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Bar - Pro Style */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    {onSchedule && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSchedule(staff); }}
                            className="flex items-center justify-center gap-2 h-10 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                        </button>
                    )}

                    {onEdit && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(staff); }}
                                className="flex-1 flex items-center justify-center gap-2 h-10 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(staff); }}
                                    className="w-10 h-10 flex items-center justify-center bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
