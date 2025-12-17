import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
    id: number;
    label: string;
    desc: string;
}

interface WizardStepIndicatorProps {
    currentStep: number;
    steps: Step[];
}

export default function WizardStepIndicator({ currentStep, steps }: WizardStepIndicatorProps) {
    return (
        <>
            {/* Progress Sidebar (Desktop) */}
            <div className="hidden lg:block w-72 shrink-0 sticky top-32">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                    <h3 className="font-bold text-gray-900 mb-6 px-2">Your Booking</h3>
                    <div className="space-y-0 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-100 -z-10"></div>

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4 py-3 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 transition-colors duration-300 ${idx < currentStep ? 'bg-primary-600 border-primary-100 text-white' :
                                        idx === currentStep ? 'bg-white border-primary-600 text-primary-600' :
                                            'bg-white border-gray-100 text-gray-300'
                                    }`}>
                                    {idx < currentStep ? <Check className="w-5 h-5" /> : <span className="font-bold text-sm">{idx + 1}</span>}
                                </div>
                                <div className="pt-2">
                                    <p className={`text-sm font-bold transition-colors ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                    <p className="text-xs text-gray-400 font-medium">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Progress (Horizontal) */}
            <div className="lg:hidden w-full overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex min-w-max px-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center mr-6 last:mr-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${idx <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {idx + 1}
                            </div>
                            <span className={`text-sm font-bold ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                            {idx < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 ml-6"></div>}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
