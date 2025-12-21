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
                    className="relative group bg-white border-2 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/10 transition-all duration-300 h-64"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                        <UserIcon className="w-8 h-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base md:text-lg">Any Professional</h3>
                    <p className="text-sm text-gray-500 mt-2">Maximum availability</p>
                </div>

                {staffMembers.map(staff => (
                    <div
                        key={staff.id}
                        onClick={() => onSelect(staff)}
                        className="group relative bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 h-64 justify-center overflow-hidden"
                    >
                        {/* Subtle background gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                        <div className="relative mb-3 md:mb-4">
                            {staff.avatar ? (
                                <img
                                    src={staff.avatar}
                                    alt={staff.name}
                                    className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-gray-50 group-hover:ring-primary-100 transition-all duration-300"
                                />
                            ) : (
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50 group-hover:ring-primary-100 transition-all duration-300">
                                    <span className="text-xl md:text-2xl font-bold text-gray-400">{staff.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">{staff.name}</h3>
                        <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-3">{staff.role}</p>

                        <div className="flex gap-0.5 mt-1 md:mt-auto">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-400 fill-current" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
