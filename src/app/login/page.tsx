'use client';

import React, { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, AlertCircle, User, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FullPageLoader from '@/components/ui/FullPageLoader';


function LoginForm() {
    const [view, setView] = useState<'SELECTION' | 'LOGIN'>('SELECTION');
    const [loginRole, setLoginRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Show message if redirected
    const isRedirect = searchParams.get('login') === 'true';

    const supabase = createClient();

    // Hide loading screen after mount
    React.useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (isInitialLoad) {
        return <FullPageLoader />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            // Successful login
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'ADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/staff');
                }
            } else {
                router.push('/admin');
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'SELECTION') {
        return (
            <div className="min-h-screen bg-white relative overflow-hidden flex flex-col justify-center px-6 py-12 lg:px-8">
                {/* Background Ambient Glows */}
                <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-multiply" />
                <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-multiply" />

                <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-[480px] animate-in zoom-in-95 duration-500 fade-in">
                    {/* Back to Landing Page */}
                    {/* Back to Landing Page (Fixed on Mobile) */}
                    <div className="fixed top-6 left-6 z-50 lg:absolute lg:-top-24 lg:left-0 lg:z-auto">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors group bg-white/50 backdrop-blur-sm p-2 rounded-lg lg:bg-transparent lg:p-0">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Back <span className="hidden sm:inline">to Home</span>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center mb-12 text-center">
                        <div className="w-24 h-24 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-10 rotate-3 transition-transform hover:rotate-6 duration-300 ring-4 ring-white">
                            <Zap className="w-10 h-10 text-white fill-white" />
                        </div>

                        <h2 className="text-5xl font-[950] text-gray-900 tracking-tight mb-4 leading-[0.9]">
                            Welcome Back
                        </h2>
                        <p className="text-gray-500 text-lg font-medium max-w-sm">
                            Choose your portal to continue
                        </p>
                    </div>

                    <div className="space-y-5">
                        <button
                            onClick={() => {
                                setLoginRole('ADMIN');
                                setView('LOGIN');
                            }}
                            className="w-full relative group overflow-hidden bg-[#8B5CF6] hover:bg-[#7C3AED] text-white p-1 rounded-[2rem] shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="relative z-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] h-20 rounded-[1.8rem] flex items-center justify-between px-8 border border-white/10">
                                <div className="text-left">
                                    <div className="font-[950] text-lg tracking-tight">Admin Login</div>
                                    <div className="text-purple-100 text-xs font-bold uppercase tracking-wider opacity-80">Platform Control</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setLoginRole('STAFF');
                                setView('LOGIN');
                            }}
                            className="w-full relative group overflow-hidden bg-[#8B5CF6] hover:bg-[#7C3AED] text-white p-1 rounded-[2rem] shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="relative z-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] h-20 rounded-[1.8rem] flex items-center justify-between px-8 border border-white/10">
                                <div className="text-left">
                                    <div className="font-[950] text-lg tracking-tight">Team Member Login</div>
                                    <div className="text-purple-100 text-xs font-bold uppercase tracking-wider opacity-80">Schedule & Clients</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </button>

                        <div className="pt-10 text-center">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                Streamline your schedule. Grow your client base.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-multiply" />
            <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-multiply" />

            <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-500">
                {/* Back Button */}
                {/* Back Button (Fixed on Mobile) */}
                <button
                    onClick={() => setView('SELECTION')}
                    className="fixed top-6 left-6 z-50 lg:static lg:mb-8 lg:z-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors group bg-white/50 backdrop-blur-sm p-2 rounded-lg lg:bg-transparent lg:p-0"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Back
                </button>

                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-gray-200/50 border border-white/50 ring-1 ring-gray-100">
                    <div className="mb-10">
                        <h2 className="text-3xl font-[950] text-gray-900 tracking-tight leading-none mb-3">
                            {loginRole === 'ADMIN' ? 'Admin Access' : 'Team Portal'}
                        </h2>
                        <p className="text-base text-gray-500 font-medium">
                            Enter your credentials to access the
                            {loginRole === 'ADMIN' ? ' management dashboard.' : ' staff schedule.'}
                        </p>
                    </div>

                    {isRedirect && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-yellow-800">Authentication Required</h3>
                                <p className="text-sm text-yellow-700 mt-1 font-medium">Please sign in to access the Dashboard.</p>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all font-bold"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <a href="#" className="text-[11px] font-black text-purple-600 hover:text-purple-500 uppercase tracking-widest">
                                    Forgot?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all font-bold"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-4 flex gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm font-bold text-red-800">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-5 text-base font-black uppercase tracking-widest rounded-xl text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-[0.98]"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
