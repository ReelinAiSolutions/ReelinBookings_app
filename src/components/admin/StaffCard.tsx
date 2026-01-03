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

    // Unified Bold Premium Gradients (matching CRM)
    const getGradientStyle = (name: string) => {
        const gradients = [
            'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo-Purple
            'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue-Cyan
            'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', // Violet-Fuchsia
            'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', // Rose-Pink
            'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', // Amber-Orange
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return { background: gradients[index] };
    };

    // Unified Purple Brand Gradient (matching Insight Banner)
    const avatarGradient = 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200';

    return (
        <div className="group relative bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:-translate-y-2">
            {/* Dark Premium Header */}
            <div className="h-16 sm:h-24 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

                {/* Stats Badge - Floats on top right */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {appointmentCount > 0 && (
                        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm flex items-center gap-1.5 transition-transform group-hover:scale-110">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                            <span className="text-[10px] font-black text-white tracking-widest uppercase">{appointmentCount} Bookings</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar - Floating Overlap */}
            <div className="absolute top-6 left-4 sm:top-10 sm:left-8 z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] sm:rounded-[2rem] blur-md transform group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden relative z-10 bg-white group-hover:scale-105 transition-transform duration-500">
                        {hasAvatar ? (
                            <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${avatarGradient} text-white`}>
                                <span className="text-3xl font-black drop-shadow-sm">{staff.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-6 px-4 pb-4 sm:pt-10 sm:px-8 sm:pb-8">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                        <h3 className="text-lg sm:text-2xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                            {staff.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gray-100 text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-gray-100">
                                {staff.role || 'Team Member'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-6 sm:mb-10">
                    {/* Email */}
                    {staff.email && (
                        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold text-gray-400 bg-gray-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl group-hover:bg-white group-hover:ring-1 group-hover:ring-gray-100 transition-all border border-transparent group-hover:border-gray-100 overflow-hidden">
                            <Mail className="w-4 h-4 text-gray-300" />
                            <span className="truncate">{staff.email}</span>
                        </div>
                    )}

                    {/* Specialties Pills */}
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">Top Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                            {specialtyServices.length > 0 ? (
                                <>
                                    {specialtyServices.slice(0, 3).map(service => (
                                        <span key={service.id} className="px-3 py-2 bg-indigo-50/50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-indigo-100/50 shadow-sm">
                                            {service.name}
                                        </span>
                                    ))}
                                    {specialtyServices.length > 3 && (
                                        <span className="px-3 py-2 bg-gray-50 text-gray-400 text-[10px] font-black rounded-xl border border-gray-100">
                                            +{specialtyServices.length - 3}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest pl-1">Generalist</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-4 sm:pt-6 border-t border-gray-50">
                    {onSchedule && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSchedule(staff); }}
                            className="flex-1 flex items-center justify-center gap-2 h-10 sm:h-14 bg-gray-900 text-white rounded-xl sm:rounded-[24px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                        >
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Schedule</span>
                            <span className="sm:hidden">Book</span>
                        </button>
                    )}

                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(staff); }}
                            className={`${onSchedule ? 'w-10 sm:w-14' : 'flex-1'} h-10 sm:h-14 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 rounded-xl sm:rounded-[24px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 shadow-sm`}
                            title="Edit Member"
                        >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {!onSchedule && <span className="hidden sm:inline">Edit Member</span>}
                            {!onSchedule && <span className="sm:hidden">Edit</span>}
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(staff); }}
                            className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-red-50 text-red-500 rounded-xl sm:rounded-[24px] hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-transparent hover:shadow-xl hover:shadow-red-200 shadow-sm"
                            title="Remove Member"
                        >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
