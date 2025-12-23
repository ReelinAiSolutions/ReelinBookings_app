import React from 'react';
import { Staff } from '@/types';
import { User as UserIcon, Star, ArrowLeft } from 'lucide-react';

interface StaffSelectionProps {
    staffMembers: Staff[];
    onSelect: (staff: Staff) => void;
    onSelectAny: () => void;
    onBack: () => void;
}

export default function StaffSelection({ staffMembers, onSelect, onSelectAny, onBack }: StaffSelectionProps) {
    return (
        <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Select Professional</h2>
                        <p className="text-gray-500 mt-1">Who would you like to see?</p>
                    </div>
                </div>
                <div className="hidden md:block text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Step 2 of 4</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Any Professional Option */}
                <div
                    onClick={onSelectAny}
                    className="relative group bg-white border border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[280px] hover:shadow-2xl hover:shadow-primary-600/20 hover:scale-[1.03] hover:border-primary-500 overflow-hidden ring-1 ring-transparent hover:ring-primary-400/50"
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>

                    <div className="relative z-10 w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary-100/50 transition-all duration-500 shadow-inner group-hover:shadow-primary-200/50">
                        <UserIcon className="w-10 h-10 text-gray-400 group-hover:text-primary-600 transition-colors duration-300" />
                    </div>
                    <h3 className="relative z-10 font-black text-gray-900 text-lg tracking-tight group-hover:text-primary-700 transition-colors">Any Professional</h3>
                    <p className="relative z-10 text-sm font-medium text-gray-500 mt-2 group-hover:text-gray-600">Maximum availability</p>
                </div>

                {staffMembers.map((staff, index) => (
                    <div
                        key={staff.id}
                        onClick={() => onSelect(staff)}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 flex flex-col items-center text-center cursor-pointer hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-600/20 hover:scale-[1.03] transition-all duration-300 min-h-[280px] justify-center overflow-hidden animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ring-1 ring-transparent hover:ring-primary-400/50"
                    >
                        {/* Premium Gradient Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 mb-5">
                            {staff.avatar ? (
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
                                    <img
                                        src={staff.avatar}
                                        alt={staff.name}
                                        className="relative w-24 h-24 rounded-full object-cover ring-4 ring-gray-50 group-hover:ring-white shadow-sm transition-all duration-500 group-hover:scale-110"
                                    />
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center ring-4 ring-gray-50 group-hover:ring-white transition-all duration-500 group-hover:scale-110 shadow-inner group-hover:shadow-lg">
                                    <span className="text-3xl font-black text-gray-300 group-hover:text-primary-400 transition-colors">{staff.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <h3 className="relative z-10 font-black text-gray-900 text-xl mb-1.5 tracking-tight group-hover:text-primary-700 transition-colors">{staff.name}</h3>
                        <p className="relative z-10 text-xs font-black text-primary-600 uppercase tracking-widest mb-4 bg-primary-50 px-3 py-1 rounded-full group-hover:bg-white/80">{staff.role}</p>

                        <div className="relative z-10 flex gap-1 mt-auto opacity-40 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current drop-shadow-sm" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
