'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Building2, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        slug: '',
        email: '',
        password: '',
        name: ''
    });

    const router = useRouter();

    // DEBUG CHECK
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check 1: Are they missing?
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const generateSlug = (name: string) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            businessName: name,
            slug: generateSlug(name)
        });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No user created");

            // 2. Create Organization
            // Note: RLS must allow 'authenticated' users to INSERT to organizations
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert([
                    {
                        name: formData.businessName,
                        slug: formData.slug
                    }
                ])
                .select()
                .single();

            if (orgError) throw orgError;

            // 3. Create Profile Linking User to Org
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        org_id: orgData.id,
                        role: 'owner'
                    }
                ]);

            if (profileError) throw profileError;

            // Success! Redirect to their dashboard
            router.push('/admin');

        } catch (error: any) {
            console.error(error);
            alert("Signup failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your booking platform
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Start your 14-day free trial. No credit card required.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleSignup}>

                        {/* Business Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Business Name</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3"
                                    placeholder="e.g. Acme Studio"
                                    value={formData.businessName}
                                    onChange={handleNameChange}
                                />
                            </div>
                            {formData.slug && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Your URL: <span className="font-mono bg-gray-100 px-1 rounded">app.com/{formData.slug}</span>
                                </p>
                            )}
                        </div>

                        {/* User Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Name</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full flex justify-center py-4 text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
                                isLoading={isLoading}
                            >
                                Launch My Platform <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
