import { Staff } from '@/types';
import { User as UserIcon, Star, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface StaffSelectionProps {
    staffMembers: Staff[];
    onSelect: (staff: Staff) => void;
    onSelectAny: () => void;
    onBack: () => void;
}

export default function StaffSelection({ staffMembers, onSelect, onSelectAny, onBack }: StaffSelectionProps) {
    return (
        <div className="px-6 md:pt-0 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900 active:scale-95">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Select Professional</h2>
                        <p className="text-[11px] text-gray-500 mt-1">Who would you like to see?</p>
                    </div>
                </div>
                <div className="hidden md:block text-[9px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 uppercase tracking-widest">Step 2 of 4</div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Any Professional Option */}
                <div
                    onClick={onSelectAny}
                    className="relative group bg-white border border-gray-100 rounded-[28px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/10 hover:scale-[1.02] hover:border-primary-500 overflow-hidden ring-1 ring-transparent hover:ring-primary-400/30 min-h-[140px]"
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>

                    <div className="relative z-10 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-primary-100/50 transition-all duration-500 shadow-inner">
                        <UserIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors duration-300" />
                    </div>
                    <h3 className="relative z-10 font-black text-gray-900 text-sm tracking-tight group-hover:text-primary-700 transition-colors leading-tight">Any Professional</h3>
                    <p className="relative z-10 text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-wider group-hover:text-gray-500 transition-colors">Maximum availability</p>
                </div>

                {staffMembers.map((staff, index) => (
                    <div
                        key={staff.id}
                        onClick={() => onSelect(staff)}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="group relative bg-white border border-gray-100 rounded-[28px] p-4 flex flex-col items-center text-center cursor-pointer hover:border-primary-500 hover:shadow-xl hover:shadow-primary-600/10 hover:scale-[1.02] transition-all duration-300 justify-center overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ring-1 ring-transparent hover:ring-primary-400/30 min-h-[140px]"
                    >
                        {/* Premium Gradient Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 mb-3">
                            {staff.avatar ? (
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full opacity-0 group-hover:opacity-10 blur transition-opacity duration-500"></div>
                                    <Image
                                        src={staff.avatar}
                                        alt={staff.name}
                                        width={48}
                                        height={48}
                                        className="relative w-12 h-12 rounded-full object-cover ring-2 ring-gray-50 group-hover:ring-white shadow-sm transition-all duration-500 group-hover:scale-105"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center ring-2 ring-gray-50 group-hover:ring-white transition-all duration-500 group-hover:scale-105 shadow-inner">
                                    <span className="text-xl font-black text-gray-300 group-hover:text-primary-400 transition-colors">{staff.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <h3 className="relative z-10 font-black text-gray-900 text-sm mb-1 tracking-tight group-hover:text-primary-700 transition-colors">{staff.name}</h3>
                        <p className="relative z-10 text-[8px] font-black text-primary-600 uppercase tracking-widest mb-2.5 bg-primary-50 px-2.5 py-0.5 rounded-full group-hover:bg-white/80 transition-colors">{staff.role}</p>

                        <div className="relative z-10 flex gap-0.5 mt-auto opacity-30 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-current" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
