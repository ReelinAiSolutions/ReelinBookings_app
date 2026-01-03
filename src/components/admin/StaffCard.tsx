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

    const avatarGradients = [
        'bg-gradient-to-br from-indigo-500 to-purple-500',
        'bg-gradient-to-br from-blue-500 to-cyan-500',
        'bg-gradient-to-br from-violet-500 to-fuchsia-500',
        'bg-gradient-to-br from-rose-500 to-pink-500',
        'bg-gradient-to-br from-amber-500 to-orange-500'
    ];
    const avatarGradient = avatarGradients[staff.name.charCodeAt(0) % avatarGradients.length];

    return (
        <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-indigo-900/20">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

            {/* Header / Avatar Area */}
            <div className="relative pt-8 px-8 pb-4">
                <div className="flex justify-between items-start">
                    {/* Avatar with Glass Glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-md transform group-hover:scale-110 transition-transform duration-500" />
                        <div className="w-20 h-20 rounded-[2rem] border-2 border-white/20 shadow-2xl overflow-hidden relative z-10 bg-gray-800 group-hover:scale-105 transition-transform duration-500">
                            {hasAvatar ? (
                                <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${avatarGradient} text-white`}>
                                    <span className="text-3xl font-black drop-shadow-sm">{staff.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Badge */}
                    <div className="flex gap-2 relative z-10">
                        {appointmentCount > 0 && (
                            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm flex items-center gap-1.5 transition-transform group-hover:scale-110">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                                <span className="text-[10px] font-black text-white tracking-widest uppercase">{appointmentCount} Bookings</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-8 pb-8 relative z-10">
                <div className="mb-8">
                    <h3 className="text-3xl font-black text-white leading-tight tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">
                        {staff.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/5 backdrop-blur-sm">
                            {staff.role || 'Team Member'}
                        </span>
                    </div>
                </div>

                <div className="space-y-6 mb-10">
                    {/* Email */}
                    {staff.email && (
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 bg-black/20 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="truncate">{staff.email}</span>
                        </div>
                    )}

                    {/* Specialties Pills */}
                    <div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">Top Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                            {specialtyServices.length > 0 ? (
                                <>
                                    {specialtyServices.slice(0, 3).map(service => (
                                        <span key={service.id} className="px-3 py-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-xl border border-indigo-500/20 shadow-sm">
                                            {service.name}
                                        </span>
                                    ))}
                                    {specialtyServices.length > 3 && (
                                        <span className="px-3 py-2 bg-white/5 text-gray-400 text-[10px] font-black rounded-xl border border-white/5">
                                            +{specialtyServices.length - 3}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-1">Generalist</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dark Mode Actions */}
                <div className="flex items-center gap-2 pt-6 border-t border-white/10">
                    {onSchedule && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSchedule(staff); }}
                            className="flex-1 flex items-center justify-center gap-2 h-14 bg-white text-gray-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-black/20"
                        >
                            <Calendar className="w-4 h-4" />
                            Schedule
                        </button>
                    )}

                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(staff); }}
                            className={`${onSchedule ? 'w-14' : 'flex-1'} h-14 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 shadow-sm backdrop-blur-sm`}
                            title="Edit Member"
                        >
                            <Edit2 className="w-4 h-4" />
                            {!onSchedule && 'Edit Member'}
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(staff); }}
                            className="w-14 h-14 flex items-center justify-center bg-red-500/10 text-red-500 rounded-[24px] hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-transparent hover:shadow-xl hover:shadow-red-900/20 shadow-sm"
                            title="Remove Member"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
