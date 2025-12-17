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
        <div className="p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Choose Professional</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Any Professional Option */}
                <div
                    onClick={onSelectAny}
                    className="relative group border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all h-64"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Any Available</h3>
                    <p className="text-sm text-gray-500 mt-1">Select for earliest availability</p>
                </div>

                {staffMembers.map(staff => (
                    <div
                        key={staff.id}
                        onClick={() => onSelect(staff)}
                        className="group border border-gray-100 rounded-3xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/5 transition-all bg-white h-64 justify-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-50 to-white -z-10"></div>
                        <div className="relative mb-4">
                            {staff.avatar ? (
                                <img
                                    src={staff.avatar}
                                    alt={staff.name}
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-2xl font-bold text-gray-400">{staff.name.charAt(0)}</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm">
                                <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{staff.name}</h3>
                        <p className="text-sm text-primary-600 font-medium bg-primary-50 px-3 py-1 rounded-full">{staff.role}</p>

                        <div className="flex gap-1 mt-4">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
