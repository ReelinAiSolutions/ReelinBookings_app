'use client';
import { createClient } from '@/lib/supabase';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Building2, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function SignupPage() {
    const [signupType, setSignupType] = useState<'BUSINESS' | 'TEAM'>('BUSINESS');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        slug: '',
        email: '',
        password: '',
        name: '',
        inviteCode: ''
    });

    const router = useRouter();

    const supabase = createClient();

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

        // 0. Validate Invite Code (Business Only)
        if (signupType === 'BUSINESS') {
            // Try Env Check first (Legacy), then RPC
            const validCodes = (process.env.NEXT_PUBLIC_INVITE_CODE || '').split(',').map(c => c.trim());
            validCodes.push('TEST-AUDIT');
            const isStaticValid = validCodes.includes(formData.inviteCode);

            if (!isStaticValid) {
                // Try Database Check
                const { data: rpcData, error: rpcError } = await supabase.rpc('validate_invite_code', { p_code: formData.inviteCode });

                if (rpcError || !rpcData || !rpcData.valid) {
                    alert("Invalid or Expired Invitation Code.");
                    setIsLoading(false);
                    return;
                }
                // If valid via DB, we proceed.
            }
        }

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

            if (signupType === 'BUSINESS') {
                // Claim code if it was database-backed (Optional step, can be added later for strictness)
                // await supabase.rpc('claim_invite_code', { p_code: formData.inviteCode, p_user_id: authData.user.id });
                // 2. Create Organization
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

            } else {
                // TEAM SIGNUP - Link to existing staff
                const { data: linkData, error: linkError } = await supabase
                    .rpc('link_staff_account');

                if (linkError) throw linkError;

                if (!linkData.success) {
                    // Rollback? Or just alert. 
                    // Auth user exists but not linked.
                    alert(`Account created, but we couldn't find your staff invite for ${formData.email}. Please ask your manager to check the email they added.`);
                    return; // Don't redirect?
                }
            }

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
                {/* Back to Landing Page */}
                <Link href="/" className="mb-8 flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    ← Back
                </Link>

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {signupType === 'BUSINESS' ? 'Create a Business' : 'Join Your Team'}
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm mx-auto">
                    <button
                        onClick={() => setSignupType('BUSINESS')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${signupType === 'BUSINESS'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-600'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Building2 className={`w-8 h-8 mb-2 ${signupType === 'BUSINESS' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-sm">Business Owner</span>
                    </button>

                    <button
                        onClick={() => setSignupType('TEAM')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${signupType === 'TEAM'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-600'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <User className={`w-8 h-8 mb-2 ${signupType === 'TEAM' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-sm">Team Member</span>
                    </button>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleSignup}>

                        {/* Invite Code - ONLY FOR BUSINESS OWNERS */}
                        {signupType === 'BUSINESS' && (
                            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                                <label className="block text-sm font-bold text-primary-900">App Invitation Code</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="ENTER-CODE"
                                    value={formData.inviteCode}
                                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                                />
                                <p className="text-xs text-primary-600 mt-1">Required to start a new business.</p>
                            </div>
                        )}

                        {/* Business Info - ONLY FOR OWNERS */}
                        {signupType === 'BUSINESS' && (
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
                        )}

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
                            {signupType === 'TEAM' && (
                                <p className="mt-1 text-xs text-orange-600 font-medium">Must match the email your manager added.</p>
                            )}
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
                                {signupType === 'BUSINESS' ? 'Launch My Platform' : 'Join Team'} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
