'use client';

import React, { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Calendar, Lock, Mail, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';


function LoginForm() {
    const [view, setView] = useState<'SELECTION' | 'LOGIN'>('SELECTION');
    const [loginRole, setLoginRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Show message if redirected
    const isRedirect = searchParams.get('login') === 'true';

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
            router.push('/admin');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'SELECTION') {
        return (
            <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center mb-10">
                        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-2xl">
                            <Calendar className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-gray-500 mb-10">
                        Select your portal to continue
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={() => {
                                setLoginRole('ADMIN');
                                setView('LOGIN');
                            }}
                            className="w-full h-16 text-lg font-bold bg-gray-900 hover:bg-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between px-6 group"
                        >
                            <span>Admin Login</span>
                            <Lock className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </Button>

                        <Button
                            onClick={() => {
                                setLoginRole('STAFF');
                                setView('LOGIN');
                            }}
                            className="w-full h-16 text-lg font-bold bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-900 rounded-2xl transition-all flex items-center justify-between px-6 group"
                        >
                            <span>Team Member Login</span>
                            <User className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </Button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest ">
                                <span className="bg-white px-4 text-gray-400 font-bold">New Here?</span>
                            </div>
                        </div>

                        <Link href="/signup" className="block w-full">
                            <Button
                                className="w-full h-16 text-lg font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg hover:shadow-xl shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Create Account</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 animate-in slide-in-from-right-8 duration-300">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Back Button */}
                <button
                    onClick={() => setView('SELECTION')}
                    className="mb-8 flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    ← Back to Selection
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {loginRole === 'ADMIN' ? 'Admin Access' : 'Team Portal'}
                    </h2>
                    <p className="mt-2 text-gray-500">
                        Enter your credentials to access the
                        {loginRole === 'ADMIN' ? ' management dashboard.' : ' staff schedule.'}
                    </p>
                </div>

                <div className="bg-white">
                    {isRedirect && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
                                <p className="text-sm text-yellow-700 mt-1">Please sign in to access the Dashboard.</p>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium bg-gray-50 focus:bg-white"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-bold text-gray-900">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-bold text-primary-600 hover:text-primary-500">
                                    Forgot?
                                </a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-4 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full flex justify-center py-4 text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-xl shadow-gray-900/10 transition-all active:scale-[0.98]"
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
