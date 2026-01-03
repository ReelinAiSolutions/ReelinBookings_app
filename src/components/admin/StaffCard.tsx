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

    // Bright Neon Brand Gradient (Purple-500 to Fuchsia-500)
    const avatarGradient = 'from-[#A855F7] to-[#d946ef]';

    return (
        <div className="group p-5 rounded-[24px] bg-white border border-gray-100 hover:border-purple-100 hover:shadow-xl hover:shadow-purple-100/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden">

            {/* Header: Avatar + Role */}
            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#7C3AED]/20 overflow-hidden relative group-hover:scale-105 transition-transform duration-500`}>
                    {hasAvatar ? (
                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="drop-shadow-sm">{staff.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <span className="px-3 py-1 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:bg-[#F3E8FF] group-hover:text-[#A855F7] transition-colors">
                    {staff.role || 'Member'}
                </span>
            </div>

            {/* Info Section */}
            <div className="mb-6 relative z-10">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#d946ef] transition-colors truncate leading-tight">
                    {staff.name}
                </h3>
                {staff.email ? (
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs font-bold text-gray-500 truncate">{staff.email}</p>
                    </div>
                ) : (
                    <div className="h-5 mt-1.5" /> /* Spacer */
                )}
            </div>

            {/* Specialties Section */}
            <div className="mb-6 flex-1 relative z-10">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3 pl-1">Top Specialties</p>
                <div className="flex flex-wrap gap-1.5">
                    {specialtyServices.length > 0 ? (
                        <>
                            {specialtyServices.slice(0, 3).map(service => (
                                <span key={service.id} className="px-2.5 py-1.5 bg-gray-50 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-gray-100 group-hover:border-[#A855F7]/20 group-hover:bg-[#F3E8FF] group-hover:text-[#A855F7] transition-colors whitespace-nowrap">
                                    {service.name}
                                </span>
                            ))}
                            {specialtyServices.length > 3 && (
                                <span className="px-2 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-bold rounded-lg border border-gray-100">
                                    +{specialtyServices.length - 3}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-300 pl-1 italic">Generalist</span>
                    )}
                </div>
            </div>

            {/* Stats / Metrics (Optional) */}
            {appointmentCount > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-6 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookings</span>
                        <span className="text-sm font-black text-gray-900">{appointmentCount}</span>
                    </div>
                </div>
            )}


            {/* Footer Actions */}
            <div className="pt-4 mt-auto border-t border-gray-50 flex items-center gap-2 relative z-10">
                {onSchedule && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSchedule(staff); }}
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d946ef] transition-all active:scale-95 shadow-lg shadow-gray-200 hover:shadow-[#d946ef]/50"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                    </button>
                )}

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(staff); }}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-400 rounded-xl hover:border-[#A855F7] hover:text-[#A855F7] hover:bg-[#F3E8FF] transition-all active:scale-95"
                            title="Edit Profile"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(staff); }}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-400 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                            title="Remove Member"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
