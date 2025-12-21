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
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="font-black text-gray-900 mb-8 text-xl tracking-tight">Your Journey</h3>
                    <div className="space-y-0 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-100 -z-10"></div>

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4 py-4 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-300 relative z-10 ${idx < currentStep ? 'bg-primary-600 border-primary-100 text-white shadow-md shadow-primary-600/20' :
                                    idx === currentStep ? 'bg-white border-primary-600 text-primary-600 shadow-lg scale-110' :
                                        'bg-white border-gray-100 text-gray-300'
                                    }`}>
                                    {idx < currentStep ? <Check className="w-5 h-5" /> : <span className="font-bold text-sm">{idx + 1}</span>}
                                </div>
                                <div className="pt-2">
                                    <p className={`text-sm font-bold transition-colors duration-300 ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Progress (Horizontal) */}
            <div className="lg:hidden w-full py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-50 px-4">
                <div className="flex justify-between items-center max-w-md mx-auto relative px-2">
                    {/* Connecting Background Line */}
                    <div className="absolute left-6 right-6 top-4.5 h-0.5 bg-gray-100 -z-10"></div>

                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center group relative">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 shrink-0 ${idx < currentStep ? 'bg-primary-600 border-primary-600 text-white shadow-md' :
                                idx === currentStep ? 'bg-white border-primary-600 text-primary-600 shadow-lg scale-110 ring-4 ring-primary-50' :
                                    'bg-white border-gray-100 text-gray-300'
                                }`}>
                                {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-colors duration-300 ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
