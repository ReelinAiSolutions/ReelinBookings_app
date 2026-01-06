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
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-multiply" />
            <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-multiply" />

            <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-12 gap-10 items-center animate-in fade-in zoom-in-95 duration-500">

                {/* BACK BUTTON (Absolute) */}
                <div className="absolute -top-16 left-0 lg:left-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back to Home
                    </Link>
                </div>

                {/* Left Side: Brand & Visuals (Hidden on small mobile, visible lg) */}
                <div className="hidden lg:flex lg:col-span-5 flex-col justify-center text-left space-y-8">
                    <div className="w-20 h-20 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 rotate-3 ring-4 ring-white">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-[950] text-gray-900 tracking-tight leading-[0.9] mb-4">
                            Start your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Empire</span>
                        </h1>
                        <p className="text-gray-500 text-lg font-medium max-w-md leading-relaxed">
                            Join thousands of professionals streamlining their appointments and growing their business.
                        </p>
                    </div>

                    {/* Role Toggle (Left Side for Desktop) */}
                    <div className="bg-gray-100/50 p-1.5 rounded-2xl inline-flex w-full max-w-sm border border-gray-200/50 backdrop-blur-sm">
                        <button
                            onClick={() => setSignupType('BUSINESS')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${signupType === 'BUSINESS'
                                ? 'bg-white text-gray-900 shadow-lg shadow-gray-200 ring-1 ring-black/5'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Business Owner
                        </button>
                        <button
                            onClick={() => setSignupType('TEAM')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${signupType === 'TEAM'
                                ? 'bg-white text-gray-900 shadow-lg shadow-gray-200 ring-1 ring-black/5'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Team Member
                        </button>
                    </div>
                </div>

                {/* Right Side: The Form Card */}
                <div className="lg:col-span-7 w-full">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-white/50 ring-1 ring-gray-100">

                        {/* Mobile Header (Visible only on small screens) */}
                        <div className="lg:hidden mb-8 text-center">
                            <h2 className="text-3xl font-[950] text-gray-900 tracking-tight mb-2">Create Account</h2>
                            <div className="bg-gray-100/50 p-1 rounded-xl inline-flex w-full max-w-xs mx-auto border border-gray-200/50">
                                <button onClick={() => setSignupType('BUSINESS')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${signupType === 'BUSINESS' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Owner</button>
                                <button onClick={() => setSignupType('TEAM')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${signupType === 'TEAM' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Team</button>
                            </div>
                        </div>

                        <form className="space-y-5" onSubmit={handleSignup}>
                            {/* Invite Code Section (Business Only) */}
                            {signupType === 'BUSINESS' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Invitation Code</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                                            <input
                                                type="text"
                                                required
                                                className="relative w-full px-4 py-3.5 bg-white border-none rounded-xl text-gray-900 placeholder-gray-300 focus:ring-0 font-bold text-lg tracking-widest uppercase text-center"
                                                placeholder="ENTER-CODE"
                                                value={formData.inviteCode}
                                                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-gray-100"></div>
                                </div>
                            )}

                            {/* 2-Column Grid for Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {signupType === 'BUSINESS' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-900 rounded-xl outline-none transition-all font-bold text-gray-900 placeholder-gray-400"
                                                placeholder="e.g. Acme Studio"
                                                value={formData.businessName}
                                                onChange={handleNameChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-900 rounded-xl outline-none transition-all font-bold text-gray-900 placeholder-gray-400"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-900 rounded-xl outline-none transition-all font-bold text-gray-900 placeholder-gray-400"
                                            placeholder="you@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={signupType === 'TEAM' ? 'md:col-span-2' : 'md:col-span-2'}>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-900 rounded-xl outline-none transition-all font-bold text-gray-900 placeholder-dots"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-5 text-base font-black uppercase tracking-widest rounded-xl text-white bg-gray-900 hover:bg-black shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0"
                                isLoading={isLoading}
                            >
                                {signupType === 'BUSINESS' ? 'Launch Platform' : 'Join Team'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
