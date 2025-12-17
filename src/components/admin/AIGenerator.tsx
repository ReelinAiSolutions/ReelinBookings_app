import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { generateServiceDescription } from '@/services/geminiService';
import { Sparkles } from 'lucide-react';

export default function AIGenerator() {
    const [genServiceName, setGenServiceName] = useState('');
    const [genKeywords, setGenKeywords] = useState('');
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDescription = async () => {
        if (!genServiceName) return;
        setIsGenerating(true);
        const desc = await generateServiceDescription(genServiceName, genKeywords);
        setGeneratedDesc(desc);
        setIsGenerating(false);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">AI Description Generator</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-6">
                Struggling to describe a new service? Let Gemini write a professional description for you.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                        type="text"
                        value={genServiceName}
                        onChange={(e) => setGenServiceName(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Hot Stone Therapy"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Benefits / Keywords</label>
                    <input
                        type="text"
                        value={genKeywords}
                        onChange={(e) => setGenKeywords(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., relaxing, detox, premium oils"
                    />
                </div>

                <Button
                    onClick={handleGenerateDescription}
                    isLoading={isGenerating}
                    disabled={!genServiceName}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isGenerating ? 'Generating...' : 'Generate with Gemini'}
                </Button>

                {generatedDesc && (
                    <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-200 shadow-sm animate-in zoom-in duration-300">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Suggestion</h4>
                        <p className="text-gray-800 italic">"{generatedDesc}"</p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => navigator.clipboard.writeText(generatedDesc)}
                        >
                            Copy to Clipboard
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
