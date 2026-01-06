import { Staff, Service } from '@/types';
import { Mail, Edit2, Trash2, MoreHorizontal, Calendar, CheckCircle2, Crown, Shield, User } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface StaffCardProps {
    staff: Staff;
    services: Service[];
    onEdit?: (staff: Staff) => void;
    onSchedule?: (staff: Staff) => void;
    onDelete?: (staff: Staff) => void;
    appointmentCount?: number;
    // Real-time Status Props
    status?: 'available' | 'limited' | 'busy' | 'leave' | 'error';
    statusDetails?: string;
}

export default function StaffCard({ staff, services, onEdit, onSchedule, onDelete, status = 'available', statusDetails = 'Checking availability...' }: StaffCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasAvatar = staff.avatar && staff.avatar.trim() !== '';

    // Safety check for specialties
    const staffSpecialties = Array.isArray(staff.specialties) ? staff.specialties : [];
    const specialtyServices = services.filter(s => staffSpecialties.includes(s.id));

    // Handle click outside for overflow menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Role Badge Style
    const getRoleBadge = () => {
        const role = staff.role?.toLowerCase() || 'staff';
        if (role.includes('owner')) {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-700/50">
                    <Crown className="w-3 h-3" strokeWidth={3} />
                    Owner
                </span>
            );
        } else if (role.includes('manager')) {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest border border-primary-200 dark:border-primary-700/50">
                    <Shield className="w-3 h-3" strokeWidth={3} />
                    Manager
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700">
                <User className="w-3 h-3" strokeWidth={3} />
                Staff
            </span>
        );
    };

    // Status Indicator Logic
    const getStatusIndicator = () => {
        switch (status) {
            case 'available':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/20" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{statusDetails || 'Available today'}</span>
                    </div>
                );
            case 'limited':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{statusDetails || 'Limited availability'}</span>
                    </div>
                );
            case 'busy':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{statusDetails || 'Fully Booked'}</span>
                    </div>
                );
            case 'leave':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{statusDetails || 'Off Today'}</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                        <span className="text-xs font-bold text-gray-400">Loading...</span>
                    </div>
                );
        }
    };

    return (
        <div className="group bg-white dark:bg-card rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5 p-5 flex flex-col h-full hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-primary-500/30 transition-all duration-300 relative overflow-visible">

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={`w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-primary-600 to-primary-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-primary-500/20 overflow-hidden`}>
                    {hasAvatar ? (
                        <Image src={staff.avatar!} alt={staff.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                    ) : (
                        <span>{staff.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div>{getRoleBadge()}</div>
            </div>

            {/* Info & Status */}
            <div className="mb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 leading-snug">{staff.name}</h3>
                {/* Dynamic Status */}
                {getStatusIndicator()}

                {staff.email && (
                    <div className="flex items-center gap-1.5 mt-2 opacity-60">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400">{staff.email}</span>
                    </div>
                )}
            </div>

            {/* Services */}
            <div className="mb-4 flex-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                    {specialtyServices.length > 0 ? (
                        <>
                            {specialtyServices.slice(0, 3).map(service => (
                                <span key={service.id} className="px-3 py-1.5 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-gray-100 dark:border-white/5 truncate max-w-[150px] shadow-sm">
                                    {service.name}
                                </span>
                            ))}
                            {specialtyServices.length > 3 && (
                                <span className="px-3 py-1.5 bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                                    +{specialtyServices.length - 3} more
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-xs font-medium text-gray-400 italic">Generalist (All Services)</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-2">
                {onSchedule && (
                    <button
                        onClick={() => onSchedule(staff)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-center"
                    >
                        View Schedule
                    </button>
                )}

                {onEdit && (
                    <button
                        onClick={() => onEdit(staff)}
                        className="w-full h-[52px] px-6 rounded-2xl border border-gray-100 dark:border-white/10 text-gray-900 dark:text-gray-100 font-bold hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
                    >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Edit</span>
                    </button>
                )}

                {(onDelete) && (
                    <div className="relative flex justify-start pt-1" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Overflow Menu */}
                        {showMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1a1b1e] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(staff); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-bold transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Member
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
